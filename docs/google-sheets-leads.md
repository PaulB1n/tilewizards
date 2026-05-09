# Google Sheets Lead Capture Setup

The contact forms can send leads to a Google Apps Script Web App through:

- `window.GAS_WEBHOOK_URL`
- `window.LEADS_WEBHOOK_URL` legacy alias

The frontend submits `POST application/x-www-form-urlencoded` with:

- `name`
- `phone`
- `project_type`
- `project_details`
- `source_page`
- `company` honeypot field
- `privacy_consent`

## 1. Create the Sheet

1. Create a Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Replace the Apps Script code with:

```javascript
const SHEET_NAME = "Leads";

const HEADERS = [
  "Date",
  "Name",
  "Phone",
  "Project Type",
  "Details",
  "Source Page",
  "Privacy Consent",
  "Status",
  "Notes"
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  const locked = lock.tryLock(5000);

  try {
    if (!locked) return jsonResponse_({ ok: false, error: "lock_timeout" });

    const p = e && e.parameter ? e.parameter : {};

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
      p.source_page || "",
      p.privacy_consent || "",
      "New",
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
  const ss = SpreadsheetApp.getActiveSpreadsheet();
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

## 2. Deploy as Web App

1. In Apps Script, choose `Deploy -> New deployment`.
2. Type: `Web app`.
3. Execute as: `Me`.
4. Who has access: `Anyone`.
5. Copy the `/exec` URL.

## 3. Connect the Website

For local development, set:

```javascript
// assets/js/config.public.js
window.GAS_WEBHOOK_URL = "https://script.google.com/macros/s/XXXX/exec";
window.LEADS_WEBHOOK_URL = window.GAS_WEBHOOK_URL;
```

For production, add a repository secret:

- `GAS_WEBHOOK_URL`

Then rerun the GitHub Pages deploy workflow.

## Notes

- The current frontend expects a JSON response with `{ "ok": true }` on success.
- The `company` field is a honeypot. If it is filled, the Apps Script should skip the submission.
- The frontend rate-limits repeated submissions in localStorage.
