/************************************************************
 * ADVISORY SYNC -> VERCEL API
 * Add this as a separate file in the existing Apps Script project.
 *
 * Script Properties required:
 *   ADVISORY_API_URL = https://<your-domain>/api/advisories/sync
 *   ADVISORY_API_KEY = <random long secret>
 ************************************************************/

const ADVISORY_SYNC_CONFIG = {
  SHEET_NAME: 'Revised  Unified Quality Check',
  HEADER_ROW: 1,
  FIRST_DATA_ROW: 2,
  MAX_BATCH_SIZE: 100,
  REQUIRED_HEADERS: ['Entry Date', 'Advisor'],
  META_HEADERS: ['_SYNC_ID', '_SYNC_HASH', '_SYNCED_AT', '_SYNC_STATUS'],
};

function SYNC_ADVISORIES() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(1000)) return;

  try {
    const props = PropertiesService.getScriptProperties();
    const apiUrl = String(props.getProperty('ADVISORY_API_URL') || '').trim();
    const apiKey = String(props.getProperty('ADVISORY_API_KEY') || '').trim();
    if (!apiUrl || !apiKey) throw new Error('Set ADVISORY_API_URL and ADVISORY_API_KEY in Script Properties.');

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(ADVISORY_SYNC_CONFIG.SHEET_NAME);
    if (!sheet) throw new Error('Sheet not found: ' + ADVISORY_SYNC_CONFIG.SHEET_NAME);

    ensureSyncColumns_(sheet);

    const lastColumn = sheet.getLastColumn();
    const lastRow = sheet.getLastRow();
    if (lastRow < ADVISORY_SYNC_CONFIG.FIRST_DATA_ROW) return;

    const headers = sheet.getRange(ADVISORY_SYNC_CONFIG.HEADER_ROW, 1, 1, lastColumn).getDisplayValues()[0];
    const headerIndex = buildHeaderIndex_(headers);
    validateRequiredHeaders_(headerIndex);

    const rowCount = lastRow - ADVISORY_SYNC_CONFIG.FIRST_DATA_ROW + 1;
    const range = sheet.getRange(ADVISORY_SYNC_CONFIG.FIRST_DATA_ROW, 1, rowCount, lastColumn);
    const rawValues = range.getValues();
    const displayValues = range.getDisplayValues();

    const pending = [];

    for (let i = 0; i < rowCount; i++) {
      const sheetRow = ADVISORY_SYNC_CONFIG.FIRST_DATA_ROW + i;
      const displayRow = displayValues[i];
      const rawRow = rawValues[i];

      if (!isActualAdvisoryRow_(displayRow, headerIndex)) continue;

      let syncId = String(displayRow[headerIndex['_SYNC_ID']] || '').trim();
      if (!syncId) {
        syncId = Utilities.getUuid();
        sheet.getRange(sheetRow, headerIndex['_SYNC_ID'] + 1).setValue(syncId);
        displayRow[headerIndex['_SYNC_ID']] = syncId;
      }

      const data = buildBusinessPayload_(headers, rawRow, displayRow);
      const hash = computeRowHash_(data);
      const previousHash = String(displayRow[headerIndex['_SYNC_HASH']] || '').trim();

      if (hash === previousHash) continue;

      pending.push({
        sheetRow: sheetRow,
        hash: hash,
        sourceId: syncId,
        sheetName: sheet.getName(),
        rowNumber: sheetRow,
        data: data,
      });
    }

    for (let start = 0; start < pending.length; start += ADVISORY_SYNC_CONFIG.MAX_BATCH_SIZE) {
      const batch = pending.slice(start, start + ADVISORY_SYNC_CONFIG.MAX_BATCH_SIZE);
      sendAdvisoryBatch_(sheet, headerIndex, batch, apiUrl, apiKey);
    }
  } finally {
    lock.releaseLock();
  }
}

function ensureSyncColumns_(sheet) {
  const currentLastColumn = Math.max(sheet.getLastColumn(), 1);
  const headers = sheet.getRange(1, 1, 1, currentLastColumn).getDisplayValues()[0];
  const existing = buildHeaderIndex_(headers);
  const missing = ADVISORY_SYNC_CONFIG.META_HEADERS.filter(function (header) {
    return existing[header] === undefined;
  });

  if (!missing.length) return;
  const startColumn = sheet.getLastColumn() + 1;
  sheet.getRange(1, startColumn, 1, missing.length).setValues([missing]);
  sheet.hideColumns(startColumn, missing.length);
}

function buildHeaderIndex_(headers) {
  const index = {};
  headers.forEach(function (header, i) {
    const key = String(header || '').trim();
    if (key) index[key] = i;
  });
  return index;
}

function validateRequiredHeaders_(headerIndex) {
  ADVISORY_SYNC_CONFIG.REQUIRED_HEADERS.forEach(function (header) {
    if (headerIndex[header] === undefined) throw new Error('Required header missing: ' + header);
  });
  ADVISORY_SYNC_CONFIG.META_HEADERS.forEach(function (header) {
    if (headerIndex[header] === undefined) throw new Error('Sync header missing after setup: ' + header);
  });
}

function isActualAdvisoryRow_(displayRow, headerIndex) {
  return ADVISORY_SYNC_CONFIG.REQUIRED_HEADERS.every(function (header) {
    return String(displayRow[headerIndex[header]] || '').trim() !== '';
  });
}

function buildBusinessPayload_(headers, rawRow, displayRow) {
  const payload = {};

  for (let c = 0; c < headers.length; c++) {
    const header = String(headers[c] || '').trim();
    if (!header || ADVISORY_SYNC_CONFIG.META_HEADERS.indexOf(header) >= 0) continue;

    const value = rawRow[c];
    if (value instanceof Date) {
      payload[header] = Utilities.formatDate(value, Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ssXXX");
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      payload[header] = value;
    } else {
      payload[header] = displayRow[c] === '' ? null : displayRow[c];
    }
  }

  return payload;
}

function computeRowHash_(data) {
  const text = JSON.stringify(data);
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(function (b) {
    const value = b < 0 ? b + 256 : b;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function sendAdvisoryBatch_(sheet, headerIndex, batch, apiUrl, apiKey) {
  const payload = {
    records: batch.map(function (item) {
      return {
        sourceId: item.sourceId,
        sheetName: item.sheetName,
        rowNumber: item.rowNumber,
        data: item.data,
      };
    }),
  };

  const response = UrlFetchApp.fetch(apiUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = response.getResponseCode();
  const body = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error('Advisory API HTTP ' + code + ': ' + body.slice(0, 500));
  }

  const parsed = JSON.parse(body || '{}');
  const statusById = {};
  (parsed.records || []).forEach(function (record) {
    statusById[String(record.source_id || '')] = String(record.status || '');
  });

  const syncedAt = new Date();
  batch.forEach(function (item) {
    sheet.getRange(item.sheetRow, headerIndex['_SYNC_HASH'] + 1).setValue(item.hash);
    sheet.getRange(item.sheetRow, headerIndex['_SYNCED_AT'] + 1).setValue(syncedAt);
    sheet.getRange(item.sheetRow, headerIndex['_SYNC_STATUS'] + 1)
      .setValue((statusById[item.sourceId] || 'SYNCED').toUpperCase());
  });
}

function INSTALL_ADVISORY_SYNC_TRIGGER() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === 'SYNC_ADVISORIES') ScriptApp.deleteTrigger(trigger);
  });

  ScriptApp.newTrigger('SYNC_ADVISORIES')
    .timeBased()
    .everyMinutes(1)
    .create();
}

function TEST_ADVISORY_SYNC() {
  SYNC_ADVISORIES();
  Logger.log('Advisory sync completed.');
}
