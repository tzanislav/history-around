const fs = require('fs');
const path = require('path');

function copyDirectory(src, dest) {
    // Create destination directory if it doesn't exist
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true });
    }

    // Get all files and directories in source
    const items = fs.readdirSync(src);

    for (const item of items) {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);

        const stat = fs.statSync(srcPath);

        if (stat.isDirectory()) {
            copyDirectory(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

// Copy React build to public folder
const distPath = path.join(__dirname, '../Front-End/history-around-web/dist');
const publicPath = path.join(__dirname, 'public');

console.log('📋 Copying React build files...');
console.log(`From: ${distPath}`);
console.log(`To: ${publicPath}`);

try {
    if (fs.existsSync(distPath)) {
        copyDirectory(distPath, publicPath);
        console.log('✅ React build copied successfully!');
    } else {
        console.log('❌ React build not found. Please run "npm run build" in the Front-End folder first.');
        process.exit(1);
    }
} catch (error) {
    console.error('❌ Error copying files:', error.message);
    process.exit(1);
}