#!/usr/bin/env node
/**
 * scripts/optimize-images.mjs
 *
 * One-shot image optimization pass for public/assets.
 *
 * Run from the PROJECT ROOT:
 *   node scripts/optimize-images.mjs
 *
 * What it does:
 *   1. Copies every original it is about to touch into ./originals-backup/
 *      (outside public/, so Next.js never serves it).
 *   2. Downscales + re-encodes each image to the largest size it is
 *      actually rendered at, so output is visually identical in the UI.
 *   3. Prints a before/after byte report.
 *
 * Safety net: for PNGs it encodes BOTH a palette (quantized) and a
 * non-palette (lossless) variant and keeps the palette one only when it is
 * meaningfully smaller. Palette quantization can band gradients, so a
 * marginal size win is not worth the visual risk.
 *
 * The originals-backup/ directory is TEMPORARY. Delete it once the pages
 * have been visually verified. Do not commit it.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// --- sharp, resolved relative to the project root's node_modules ---------
const sharpEntry = pathToFileURL(
  path.resolve(process.cwd(), 'node_modules/sharp/lib/index.js')
).href;
const sharp = (await import(sharpEntry)).default;

// --- paths (all cwd-relative, never absolute) ----------------------------
const ASSETS = path.join('public', 'assets');
const BACKUP = 'originals-backup';

// Palette output must beat lossless by at least this much to be used.
const PALETTE_MIN_GAIN = 0.15; // 15%

const PNG_OPTS_PALETTE = { compressionLevel: 9, palette: true, quality: 90 };
const PNG_OPTS_LOSSLESS = { compressionLevel: 9, palette: false };

/** @type {{file: string, width: number, mode: 'webp'|'png', out?: string}[]} */
const JOBS = [
  // Full-bleed CTA background. 6336px wide for a banner that never renders
  // above ~2560 CSS px on a 5K display -> downscale + webp.
  {
    file: 'cta-cityscape-light.png',
    out: 'cta-cityscape-light.webp',
    width: 2560,
    mode: 'webp',
  },

  // "How it works" step screenshots: 2400px source, rendered ~600px @2x.
  ...[1, 2, 3, 4, 5].map((n) => ({
    file: `how-it-works-step-${n}.png`,
    width: 1200,
    mode: 'png',
  })),

  // Marketing screenshots: 1920px source, rendered ~700px @2x.
  ...[
    'marketplace-preview-v4.png',
    'what-we-do-buy-side.png',
    'what-we-do-marketplace.png',
    'what-we-do-sell-side.png',
  ].map((file) => ({ file, width: 1400, mode: 'png' })),

  // Tiny inline icons rendered at 24px. 256px is still >4x the render size.
  ...['people_fixed.png', 'process_fixed.png', 'worldwide_fixed.png'].map(
    (file) => ({ file, width: 256, mode: 'png' })
  ),
];

const WEBP_QUALITY = 78;

// --- helpers -------------------------------------------------------------

const fmt = (bytes) => {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
};

const pct = (before, after) =>
  `${(((before - after) / before) * 100).toFixed(1)}%`;

async function sizeOf(p) {
  return (await fs.stat(p)).size;
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

// --- main ----------------------------------------------------------------

console.log('');
console.log('  Image optimization pass — public/assets');
console.log('  ' + '-'.repeat(70));

await fs.mkdir(BACKUP, { recursive: true });
console.log(`  Backups  -> ./${BACKUP}/`);
console.log(
  '  REMINDER: ./originals-backup/ is TEMPORARY. Delete it after visual'
);
console.log('            verification. Do not commit it.');
console.log('');

const results = [];

for (const job of JOBS) {
  const src = path.join(ASSETS, job.file);

  if (!(await exists(src))) {
    console.log(`  SKIP  ${job.file} — not found`);
    results.push({ file: job.file, status: 'missing' });
    continue;
  }

  const before = await sizeOf(src);

  // 1. Back up the original before touching anything.
  const backupPath = path.join(BACKUP, job.file);
  if (!(await exists(backupPath))) {
    await fs.copyFile(src, backupPath);
  }

  // Always read from the pristine backup so re-runs never compound losses.
  const input = await fs.readFile(backupPath);
  const meta = await sharp(input).metadata();

  let outPath;
  let outBuf;
  let note = '';

  if (job.mode === 'webp') {
    outPath = path.join(ASSETS, job.out);
    outBuf = await sharp(input)
      .resize({ width: job.width, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
    await fs.writeFile(outPath, outBuf);
    note = `webp q${WEBP_QUALITY} (source png kept)`;
  } else {
    outPath = src;

    const base = () =>
      sharp(input).resize({ width: job.width, withoutEnlargement: true });

    const [palette, lossless] = await Promise.all([
      base().png(PNG_OPTS_PALETTE).toBuffer(),
      base().png(PNG_OPTS_LOSSLESS).toBuffer(),
    ]);

    // Prefer palette only when the win is real; otherwise stay lossless.
    const paletteGain = (lossless.length - palette.length) / lossless.length;
    if (paletteGain >= PALETTE_MIN_GAIN) {
      outBuf = palette;
      note = `png palette (${(paletteGain * 100).toFixed(0)}% under lossless)`;
    } else {
      outBuf = lossless;
      note = `png lossless (palette only ${(paletteGain * 100).toFixed(
        0
      )}% smaller — not worth banding risk)`;
    }

    // Never write a file bigger than what was already there.
    if (outBuf.length >= before) {
      note = `LEFT AS-IS — re-encode (${fmt(outBuf.length)}) not smaller`;
      results.push({
        file: job.file,
        before,
        after: before,
        width: meta.width,
        height: meta.height,
        note,
      });
      console.log(`  ~  ${job.file.padEnd(30)} ${fmt(before)}  ${note}`);
      continue;
    }

    await fs.writeFile(outPath, outBuf);
  }

  const outMeta = await sharp(outBuf).metadata();
  const after = outBuf.length;

  results.push({
    file: path.basename(outPath),
    before,
    after,
    width: outMeta.width,
    height: outMeta.height,
    srcDims: `${meta.width}x${meta.height}`,
    note,
  });

  console.log(
    `  OK ${path.basename(outPath).padEnd(30)} ` +
      `${fmt(before).padStart(9)} -> ${fmt(after).padStart(9)}  ` +
      `(-${pct(before, after).padStart(5)})  ` +
      `${meta.width}x${meta.height} -> ${outMeta.width}x${outMeta.height}`
  );
  if (note) console.log(`     ${' '.repeat(30)} ${note}`);
}

// --- summary -------------------------------------------------------------

const totalBefore = results.reduce((a, r) => a + (r.before ?? 0), 0);
const totalAfter = results.reduce((a, r) => a + (r.after ?? 0), 0);

console.log('');
console.log('  ' + '-'.repeat(70));
console.log(
  `  TOTAL  ${fmt(totalBefore)} -> ${fmt(totalAfter)}  ` +
    `(saved ${fmt(totalBefore - totalAfter)}, ${pct(totalBefore, totalAfter)})`
);
console.log('');
console.log(
  '  Originals are in ./originals-backup/ — TEMPORARY, delete after review.'
);
console.log('');
