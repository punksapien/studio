# Nobridge — Team Onboarding & Cross-OS Setup

Welcome! This guide gets you (and your AI assistant) from zero to a running local
Nobridge instance on **macOS or Windows**, and explains how we keep both OSes in
perfect sync.

- **Repo:** https://github.com/VAV-TECH-2/Nobridge (private — ask for collaborator access)
- **Default branch:** `master`
- **Product:** Business-for-sale marketplace for Asia. Next.js 15 + Supabase + Tailwind/ShadCN. Live at https://nobridge.vercel.app
- **AI context:** `CLAUDE.md` in the repo root is the canonical guide for AI assistants (Claude Code reads it automatically). Point Cursor/other agents at it too.

---

## 1. Prerequisites

| Tool | macOS | Windows |
|---|---|---|
| Node 20 (pinned in `.nvmrc`) | `nvm install 20 && nvm use` | [nvm-windows](https://github.com/coreybutler/nvm-windows): `nvm install 20 && nvm use 20`, or install Node 20 LTS directly |
| Git | `brew install git` | [Git for Windows](https://git-scm.com/download/win) — **includes Git Bash, which you need** |
| Docker | Docker Desktop for Mac | Docker Desktop for Windows (WSL2 backend recommended) |
| Supabase CLI | `brew install supabase/tap/supabase` | `scoop install supabase` — or use `npx supabase` everywhere |

## 2. Clone & install

```bash
git clone https://github.com/VAV-TECH-2/Nobridge.git
cd Nobridge
npm install
```

> `.npmrc` already sets `legacy-peer-deps`, so `npm install` works the same on every OS.

## 3. Environment variables

Copy the template and fill it in (values in the team vault / ask a teammate):

```bash
# macOS / Linux / Git Bash
cp .env.example .env.local          # or: ./setup-env.sh (generates secrets for you)

# Windows PowerShell
Copy-Item .env.example .env.local
```

For **local dev**, `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `SERVICE_ROLE_KEY` are
printed by `supabase start` (step 4). Never commit `.env.local` — only
`.env.example` (no real values) lives in git.

## 4. Start the backend + app

```bash
# 1. Make sure Docker Desktop is RUNNING first (common Windows gotcha)
supabase start        # boots local Postgres/Auth/Storage, prints keys
supabase db reset     # applies all migrations + seed

# 2. Run the app
npm run dev           # → http://localhost:9002 (custom port, not 3000)
```

- Local emails (OTP codes, magic links): **http://localhost:54324** (Inbucket)
- Supabase Studio (local DB UI): **http://localhost:54323**

## 5. Verify your setup

```bash
npm run typecheck   # must pass
npm run build       # must pass — Vercel builds on Linux, this catches OS-specific mistakes
```

---

## How macOS ↔ Windows sync stays flawless

These are enforced by files in the repo — don't work around them:

1. **Line endings** — `.gitattributes` forces **LF in git** for all text files; git
   converts your working tree per-OS automatically. If you ever see a diff where
   *every* line of a file changed, that's a line-ending accident: don't commit it,
   run `git add --renormalize .` and check `git status`.
   Don't set `core.autocrlf` yourself; the repo config wins.
2. **Editor formatting** — `.editorconfig` pins UTF-8 + LF + 2-space indent.
   VS Code/Cursor: install the "EditorConfig for VS Code" extension. JetBrains: built in.
3. **Node version** — `.nvmrc` pins Node 20 so `npm install` produces the same
   `node_modules` and lockfile behavior everywhere.
4. **OS junk files** — `.gitignore` covers `.DS_Store` (macOS) and `Thumbs.db`/
   `desktop.ini` (Windows). If you see one in `git status`, something's wrong.
5. **Paths** — always forward slashes in imports/configs; never absolute paths in
   committed code. Import casing must exactly match filenames (Linux CI is
   case-sensitive even though your Mac/PC isn't).
6. **Shell scripts** — `*.sh` files are bash. Windows users: run them from
   **Git Bash** (right-click → "Git Bash Here"), not PowerShell or cmd.
7. **Workflow** — `git pull --rebase` before starting work; `npm run typecheck`
   before pushing; migrations only via `supabase migration new <name>` (see
   `CLAUDE.md` for the full migration discipline — it matters, we've been burned).

## Windows-specific tips

- Long paths: if `npm install` fails with path-length errors, run once:
  `git config --global core.longpaths true` and enable Windows long paths
  (`gpedit` or registry `LongPathsEnabled=1`).
- Use Git Bash or WSL2 for anything script-related; PowerShell is fine for
  `npm`/`git`/`supabase` basics.
- Docker Desktop must be running before any `supabase` command that touches the
  local stack.

## macOS-specific tips

- Everything works out of the box with Homebrew installs.
- If ports 54321–54324 are taken, `supabase stop --no-backup` from an old project
  frees them.

---

## Where to go next

- `CLAUDE.md` — dev guide + migration discipline (required reading, also for your AI)
- `README.md` — product overview and feature history
- `docs/` and `cursor-docs/` — architecture, auth system, API routes
- `WORKFLOW_ANALYSIS.md` — data seeding pipeline (use the Python pipeline, not the JS seeder)
- `left_off_at_night.txt` — most recent known open UI bug

**Questions:** vilca@understoryagency.com
