const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const FREE_GIFTS_DIR = path.resolve(__dirname, '../assets/free-gifts');

function getAllImageFiles(dir, fileList = []) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            getAllImageFiles(fullPath, fileList);
        } else if (/\.(png|jpe?g)$/i.test(entry.name)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

async function compressImage(filePath) {
    const originalBuffer = fs.readFileSync(filePath);
    const originalSize = originalBuffer.length;
    const ext = path.extname(filePath).toLowerCase();
    const dir = path.dirname(filePath);
    const baseName = path.basename(filePath, ext);

    const isTrackThumb = dir.endsWith('win-anyway') && /^\d{2}-/.test(baseName);
    const maxDim = isTrackThumb ? 800 : 1024;

    const base = sharp(originalBuffer).resize(maxDim, maxDim, {
        fit: 'inside',
        withoutEnlargement: true
    });

    // 1. Generate WebP version
    const webpBuffer = await base.clone().webp({ quality: 82, effort: 4 }).toBuffer();
    const webpPath = path.join(dir, `${baseName}.webp`);
    fs.writeFileSync(webpPath, webpBuffer);

    // 2. Generate optimized in-place replacement (PNG or JPG)
    let optimizedBuffer;
    if (ext === '.png') {
        optimizedBuffer = await base.clone().png({
            quality: 80,
            palette: true,
            compressionLevel: 9
        }).toBuffer();
    } else {
        optimizedBuffer = await base.clone().jpeg({
            quality: 82,
            mozjpeg: true
        }).toBuffer();
    }

    // Overwrite the original file with the compressed version
    fs.writeFileSync(filePath, optimizedBuffer);

    // Also generate JPEG fallback if file was originally PNG (useful for OpenGraph / social crawlers)
    const jpgPath = path.join(dir, `${baseName}.jpg`);
    if (!fs.existsSync(jpgPath)) {
        const jpgBuffer = await base.clone().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
        fs.writeFileSync(jpgPath, jpgBuffer);
    }

    const newSize = optimizedBuffer.length;
    const webpSize = webpBuffer.length;
    const savings = (((originalSize - newSize) / originalSize) * 100).toFixed(1);

    return {
        relative: path.relative(path.resolve(__dirname, '..'), filePath).replace(/\\/g, '/'),
        originalKB: (originalSize / 1024).toFixed(1),
        newKB: (newSize / 1024).toFixed(1),
        webpKB: (webpSize / 1024).toFixed(1),
        savingsPercent: savings,
        originalBytes: originalSize,
        newBytes: newSize
    };
}

async function run() {
    console.log('==================================================');
    console.log('Compressing Free Gifts Images in:', FREE_GIFTS_DIR);
    console.log('==================================================\n');

    const files = getAllImageFiles(FREE_GIFTS_DIR);
    console.log(`Found ${files.length} images to compress.\n`);

    let totalOriginal = 0;
    let totalNew = 0;

    for (const file of files) {
        try {
            const res = await compressImage(file);
            totalOriginal += res.originalBytes;
            totalNew += res.newBytes;
            console.log(`✓ ${res.relative}`);
            console.log(`  Original: ${res.originalKB} KB -> In-place: ${res.newKB} KB (${res.savingsPercent}% saved) | WebP: ${res.webpKB} KB`);
        } catch (err) {
            console.error(`✗ Failed to compress ${file}:`, err.message);
        }
    }

    const totalSavedMB = ((totalOriginal - totalNew) / (1024 * 1024)).toFixed(2);
    const totalOriginalMB = (totalOriginal / (1024 * 1024)).toFixed(2);
    const totalNewMB = (totalNew / (1024 * 1024)).toFixed(2);
    const totalPercent = (((totalOriginal - totalNew) / totalOriginal) * 100).toFixed(1);

    console.log('\n==================================================');
    console.log(`Total original size: ${totalOriginalMB} MB`);
    console.log(`Total optimized size: ${totalNewMB} MB`);
    console.log(`Bandwidth saved: ${totalSavedMB} MB (${totalPercent}% reduction!)`);
    console.log('==================================================');
}

run();
