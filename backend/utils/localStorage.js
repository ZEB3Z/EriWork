const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Saves uploaded images to backend/uploads/<folder>/ (instead of a cloud service).
const UPLOADS_ROOT = path.join(__dirname, '..', 'uploads');

// Images that ship with the project (seed catalog + placeholders) are never deleted.
const isProtected = (publicId) =>
    !publicId || publicId.includes('/seed/') || publicId.endsWith('placeholder');

// dataUri looks like "data:image/png;base64,iVBORw0..."
function saveDataUri(dataUri, folder) {
    const match = /^data:image\/(png|jpe?g|webp);base64,(.+)$/.exec(dataUri || '');
    if (!match) {
        const err = new Error('Unsupported image. Please upload a PNG, JPG or WEBP file.');
        err.statusCode = 400;
        throw err;
    }
    const ext = match[1] === 'jpg' ? 'jpeg' : match[1];
    const folderPath = path.join(UPLOADS_ROOT, folder);
    fs.mkdirSync(folderPath, { recursive: true });

    const name = crypto.randomBytes(10).toString('hex');
    fs.writeFileSync(path.join(folderPath, `${name}.${ext}`), Buffer.from(match[2], 'base64'));

    return {
        public_id: `${folder}/${name}`,
        url: `/uploads/${folder}/${name}.${ext}`
    };
}

function destroy(publicId) {
    if (isProtected(publicId)) return;
    const folderPath = path.join(UPLOADS_ROOT, path.dirname(publicId));
    const baseName = path.basename(publicId);
    if (!fs.existsSync(folderPath)) return;
    for (const file of fs.readdirSync(folderPath)) {
        if (file.startsWith(baseName + '.')) fs.unlinkSync(path.join(folderPath, file));
    }
}

module.exports = { saveDataUri, destroy };
