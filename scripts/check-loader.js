const http = require('http');

http.get('http://localhost:3000/', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    console.log('HTTP Status:', res.statusCode);
    console.log('Has #global-loader:', html.includes('global-loader'));
    console.log('Has #product-container:', html.includes('product-container'));
    console.log('Has #view-catalog:', html.includes('view-catalog'));
    console.log('Has loadAppData call:', html.includes('loadAppData'));
    console.log('Has hLoad:', html.includes('hLoad'));
    
    // Find global-loader element and get its full tag
    const idx = html.indexOf('global-loader');
    if (idx > -1) {
      const start = html.lastIndexOf('<', idx);
      const end = html.indexOf('>', idx) + 1;
      console.log('\nLoader element tag:');
      console.log(html.substring(start, end));
    }

    // Check if hidden class is there by default
    const context = html.substring(Math.max(0, idx - 100), idx + 300);
    console.log('\nLoader context (200 chars after):');
    console.log(context);
  });
}).on('error', e => console.error('Error:', e.message));
