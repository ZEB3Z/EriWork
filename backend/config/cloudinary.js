// Cloudinary image storage.
// Every product photo and avatar is uploaded here (never to the server's disk),
// because Render's filesystem is wiped on every deploy/restart.
const cloudinary = require('cloudinary').v2

// All EriWork uploads live under this folder in your Cloudinary media library.
const ROOT_FOLDER = 'eriwork'

let configured = false
const isCloudinaryConfigured = () =>
    Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)

// Configure lazily so dotenv has loaded before we read the keys.
function getCloudinary() {
    if (!isCloudinaryConfigured()) {
        const err = new Error('Image uploads are not configured on the server (CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET missing).')
        err.statusCode = 503
        throw err
    }
    if (!configured) {
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true
        })
        configured = true
    }
    return cloudinary
}

// Resize rules applied by Cloudinary as the file arrives.
const TRANSFORMS = {
    products: [{ width: 1200, height: 1200, crop: 'limit' }, { quality: 'auto' }],
    avatars: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }, { quality: 'auto' }]
}

// Upload an in-memory file (Multer memory storage gives us `file.buffer`).
// Resolves with { public_id, url } — the same shape the Mongoose models store.
function uploadBuffer(buffer, folder, options = {}) {
    const cld = getCloudinary()
    return new Promise((resolve, reject) => {
        const stream = cld.uploader.upload_stream(
            {
                folder: `${ROOT_FOLDER}/${folder}`,
                resource_type: 'image',
                transformation: TRANSFORMS[folder],
                ...options
            },
            (error, result) => {
                if (error) {
                    const err = new Error(`Image upload failed: ${error.message}`)
                    err.statusCode = error.http_code && error.http_code < 500 ? 400 : 502
                    return reject(err)
                }
                resolve({ public_id: result.public_id, url: result.secure_url })
            }
        )
        stream.end(buffer)
    })
}

// Upload several Multer files. If one fails, the ones that did upload are removed
// again so nothing is left orphaned in Cloudinary.
async function uploadFiles(files = [], folder) {
    const results = await Promise.allSettled(files.map((f) => uploadBuffer(f.buffer, folder)))
    const failed = results.find((r) => r.status === 'rejected')
    const uploaded = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
    if (failed) {
        await destroyImages(uploaded)
        throw failed.reason
    }
    return uploaded
}

// Upload a file from disk (used by the seed script for the demo catalog).
function uploadPath(filePath, publicId, folder = 'products/seed') {
    return getCloudinary().uploader
        .upload(filePath, {
            folder: `${ROOT_FOLDER}/${folder}`,
            public_id: publicId,
            overwrite: true,
            format: 'png', // the demo images are SVG; deliver them as PNG everywhere
            resource_type: 'image'
        })
        .then((r) => ({ public_id: r.public_id, url: r.secure_url }))
}

// Only delete assets this app created. Placeholders and external pictures
// (e.g. a Google/Facebook profile photo) have public_ids outside our folder.
const isOwnAsset = (publicId) => typeof publicId === 'string' && publicId.startsWith(`${ROOT_FOLDER}/`)

// Delete one image from Cloudinary. Never throws: a failed clean-up must not
// break the request that triggered it.
async function destroyImage(publicId) {
    if (!isOwnAsset(publicId) || !isCloudinaryConfigured()) return
    try {
        await getCloudinary().uploader.destroy(publicId, { resource_type: 'image', invalidate: true })
    } catch (err) {
        console.log(`Could not delete Cloudinary image ${publicId}:`, err.message)
    }
}

const destroyImages = (images = []) => Promise.all(images.map((img) => destroyImage(img && img.public_id)))

module.exports = {
    isCloudinaryConfigured,
    uploadBuffer,
    uploadFiles,
    uploadPath,
    destroyImage,
    destroyImages
}
