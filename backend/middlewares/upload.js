// Multer handles multipart/form-data uploads. Files are kept in memory
// (never written to disk) and then streamed to Cloudinary by the controllers.
const multer = require('multer')

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const MAX_FILE_MB = 5

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 10 },
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) return cb(null, true)
        const err = new Error(`${file.originalname}: please upload a PNG, JPG or WEBP image`)
        err.statusCode = 400
        cb(err)
    }
})

module.exports = {
    uploadAvatar: upload.single('avatar'),           // register / edit profile
    uploadProductImages: upload.array('images', 10), // create / edit product
    MAX_FILE_MB
}
