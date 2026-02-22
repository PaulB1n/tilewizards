# Google Sheets Leads Setup

This project sends contact form leads to a Google Apps Script Web App URL stored in:

- `window.LEADS_WEBHOOK_URL` (runtime config)
- GitHub secret: `GOOGLE_SHEETS_WEBHOOK_URL` (for production deploy)

## 1. Create a Google Sheet

1. Create a new Google Sheet.
2. Open `Extensions -> Apps Script`.
3. Replace default code with:

```javascript
const SHEET_NAME = "Leads";

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.tryLock(5000);

  try {
    const sheet = getTargetSheet_();
    const p = e && e.parameter ? e.parameter : {};

    const now = new Date();
    const row = [
      now.toISOString(),
      p.name || "",
      p.phone || "",
      p.project_type || "",
      p.project_details || "",
      p.source_page || "",
      p.submitted_at || "",
      p.website || "",
      Session.getActiveUser().getEmail() || ""
    ];

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function getTargetSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      "received_at",
      "name",
      "phone",
      "project_type",
      "project_details",
      "source_page",
      "submitted_at",
      "website",
      "script_user"
    ]);
  }

  return sheet;
}
```

## 2. Deploy as Web App

1. Click `Deploy -> New deployment`.
2. Type: `Web app`.
3. `Execute as`: `Me`.
4. `Who has access`: `Anyone`.
5. Deploy and copy the `/exec` URL.

## 3. Configure this repository

For production (GitHub Pages):

1. Add secret `GOOGLE_SHEETS_WEBHOOK_URL` in repository settings.
2. Re-run deployment workflow.

For local testing:

1. Put the same URL into `assets/js/config.public.js`:

```javascript
window.LEADS_WEBHOOK_URL = "https://script.google.com/macros/s/XXXX/exec";
```

## Notes

- The frontend uses `POST` with `application/x-www-form-urlencoded`.
- Requests are sent in `no-cors` mode (normal for Apps Script webhooks from static sites).
- Add your own anti-spam logic in Apps Script if needed (IP quotas, token checks, etc.).
