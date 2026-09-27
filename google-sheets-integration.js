/**
 * Google Apps Script Webhook for Barangay Ibayo-Tipas Portal
 * 
 * INSTRUCTIONS TO CONNECT TO GOOGLE SHEETS:
 * 1. Open Google Sheets (https://sheets.new)
 * 2. Rename sheet tabs:
 *    - Rename the first tab to "Applications"
 *    - Add a second tab and name it "Reklamo"
 * 3. In the "Applications" tab, add these headers in Row 1:
 *    [Timestamp, TrackingCode, FullName, DocumentType, PhoneNumber, Address, Purpose, Status, PickupDate]
 * 4. In the "Reklamo" tab, add these headers in Row 1:
 *    [Timestamp, TicketID, FullName, PhoneNumber, ComplaintType, Location, Details, Status]
 * 5. In Google Sheets menu, click: Extensions -> Apps Script
 * 6. Replace all code in the editor with this script
 * 7. Click "Deploy" -> "New deployment"
 *    - Select type: "Web app"
 *    - Description: "Barangay Ibayo-Tipas Portal API"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (allows anonymous public submission from your website)
 * 8. Click "Deploy", copy the "Web App URL" (ends in /exec)
 * 9. Paste that URL into `app.js` inside the `GOOGLE_SHEETS_WEBHOOK_URL` variable!
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var sheetDoc = SpreadsheetApp.getActiveSpreadsheet();
    var data = JSON.parse(e.postData.contents);
    var timestamp = new Date();

    if (data.action === "new_document_request") {
      var appSheet = sheetDoc.getSheetByName("Applications") || sheetDoc.getSheets()[0];
      appSheet.appendRow([
        timestamp,
        data.trackingCode,
        data.fullName,
        data.documentType,
        data.phoneNumber,
        data.address,
        data.purpose,
        data.status || "Pending Verification",
        data.pickupDate
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        message: "Application saved to Google Sheets",
        trackingCode: data.trackingCode
      })).setMimeType(ContentService.MimeType.JSON);

    } else if (data.action === "new_reklamo") {
      var reklamoSheet = sheetDoc.getSheetByName("Reklamo") || sheetDoc.getSheets()[0];
      reklamoSheet.appendRow([
        timestamp,
        data.ticketId,
        data.fullName || "Anonymous",
        data.phoneNumber,
        data.complaintType,
        data.location,
        data.details,
        data.status || "Under Review"
      ]);

      return ContentService.createTextOutput(JSON.stringify({
        result: "success",
        message: "Reklamo saved to Google Sheets",
        ticketId: data.ticketId
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: "Unknown action"
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      result: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "active",
    service: "Barangay Ibayo-Tipas Webhook API",
    time: new Date()
  })).setMimeType(ContentService.MimeType.JSON);
}
