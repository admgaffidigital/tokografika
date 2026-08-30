function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var data = Utilities.base64Decode(params.data);
    var blob = Utilities.newBlob(data, params.mimeType, params.name);
    
    // ID FOLDER SPESIFIK GOOGLE DRIVE ANDA
    var folderId = "1Zv_6uiAfTdqP5_-ZNSaiSsFtLBvMVARa";
    var folder = DriveApp.getFolderById(folderId);
    
    var file = folder.createFile(blob);
    
    // Wajib: Jadikan file Public agar bisa dilihat di web
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileId = file.getId();
    var directUrl = "https://drive.google.com/uc?export=view&id=" + fileId;
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      url: directUrl
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler untuk CORS preflight request (Mencegah error koneksi di browser)
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
