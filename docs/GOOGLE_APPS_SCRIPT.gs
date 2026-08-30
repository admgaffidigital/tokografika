function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    
    // 1. PEMBERSIHAN DATA (Mencegah error jika terkirim format 'data:image/...;base64,')
    var base64Data = params.data;
    if (base64Data.indexOf('base64,') > -1) {
      base64Data = base64Data.split('base64,')[1];
    }
    
    var data = Utilities.base64Decode(base64Data);
    var mimeType = params.mimeType || 'image/jpeg';
    var fileName = params.name || ('upload_' + Date.now() + '.jpg');
    var blob = Utilities.newBlob(data, mimeType, fileName);
    
    // ID FOLDER GOOGLE DRIVE ANDA
    var folderId = "1Zv_6uiAfTdqP5_-ZNSaiSsFtLBvMVARa";
    var folder = DriveApp.getFolderById(folderId);
    
    var file = folder.createFile(blob);
    
    // Wajib: Jadikan file Public agar bisa dilihat langsung di web
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    var fileId = file.getId();
    
    // 2. FORMAT URL TERBAIK (Bebas limit Google Drive & render instan)
    var directUrl = "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800";
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      url: directUrl,
      fileId: fileId
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler untuk CORS preflight request
function doOptions(e) {
  return ContentService.createTextOutput("")
    .setMimeType(ContentService.MimeType.TEXT);
}
