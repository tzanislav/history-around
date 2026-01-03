const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const filePath = path.join(__dirname, 'Back-End/public/Build/Web.data.br');

const readStream = fs.createReadStream(filePath);
const brotli = zlib.createBrotliDecompress();

readStream.pipe(brotli).on('data', () => {}).on('end', () => {
    console.log('Brotli file is valid');
}).on('error', (err) => {
    console.error('Brotli error:', err);
});
