# Google Sheets CRM Setup

This project already sends website leads to Google Apps Script via:

- `window.GAS_WEBHOOK_URL` (runtime config)
- frontend payload in `assets/js/main.js` (`name`, `phone`, `project_type`, `project_details`, `source_page`, `company`)

This script configures a CRM sheet with statuses, colors, and analytics.

## 1. Create/Open Google Sheet

1. Create a Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Replace code with the script below.
```javascript
const SHEET_ID = "1MjFUACV9M9A19uXfI4Mh5gng18PceOaXR5rs4ioLwk8";
const SHEET_NAME = "Leads_CRM";

const HEADERS = [
  "Дата",
  "Ім'я",
  "Телефон",
  "Тип проєкту",
  "Деталі",
  "Джерело",
  "Статус",
  "Відповідальний",
  "Коментар"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(5000);

  try {
    if (!locked) return jsonResponse_({ ok: false, error: "lock_timeout" });

    const p = (e && e.parameter) ? e.parameter : {};

    if ((p.company || "").trim() !== "") {
      return jsonResponse_({ ok: true, skipped: "honeypot" });
    }

    const sheet = getTargetSheet_();
    sheet.appendRow([
      new Date().toISOString(),
      p.name || "",
      p.phone || "",
      p.project_type || "",
      p.project_details || "",
      p.source_page || p.website || "",
      "Новий",
      "",
      ""
    ]);

    return jsonResponse_({ ok: true });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    if (locked) lock.releaseLock();
  }
}

function getTargetSheet_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(HEADERS);

  return sheet;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

```

## 2. Run one-time setup

1. In Apps Script run `setupCRM` once.
2. Run `installTriggers` once and confirm permissions.

What this gives automatically:
- `CRM` columns A:I in required order.
- `G` status dropdown: `Новий`, `В роботі`, `Очікує відповідь`, `Закрито`, `Відмова`, `Оплачено`.
- full-row status colors.
- `Аналітика` sheet with totals, payment conversion, manager/source stats.
- formula protection on `Аналітика`.

## 3. Deploy as Web App

1. `Deploy -> New deployment`.
2. Type: `Web app`.
3. `Execute as`: `Me`.
4. `Who has access`: `Anyone`.
5. Copy `/exec` URL.

## 4. Connect this repository

For local:

```javascript
// assets/js/config.public.js
window.GAS_WEBHOOK_URL = "https://script.google.com/macros/s/XXXX/exec";
```

For production (GitHub Pages):

1. Add repo secret `GAS_WEBHOOK_URL` (or keep `GOOGLE_SHEETS_WEBHOOK_URL` as legacy fallback).
2. Re-run deploy workflow.

## 5. Notes for your current frontend

- Verified with current code in `assets/js/main.js`: request format is `POST application/x-www-form-urlencoded`, response is parsed as JSON.
- `doPost` works with current payload keys without frontend changes.
- If you also use Google Form linked to this spreadsheet, `onFormSubmitInstalled` will create leads in the same `CRM` format.
- For 2-3 users use **Filter views** on `CRM` by column `H` (`Відповідальний`), not shared filter state.
