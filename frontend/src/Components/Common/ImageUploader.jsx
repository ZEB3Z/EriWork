import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import AddPhotoAlternateOutlined from '@mui/icons-material/AddPhotoAlternateOutlined'
import CloseRounded from '@mui/icons-material/CloseRounded'
import { resolveImageUrl, checkImageFile, toUpload, releaseUpload, MAX_IMAGE_MB } from '../../Utils/helpers'

// Multi-photo picker with previews.
// existing: photos already saved on Cloudinary  [{ public_id, url }]
// added:    new photos picked in the browser    [{ file, preview }]
//           (the Files are uploaded as multipart/form-data when the form is saved)
export default function ImageUploader({ existing = [], onExistingChange, added, onAddedChange, error }) {
    const [fileError, setFileError] = useState('')

    const handleFiles = (e) => {
        const files = Array.from(e.target.files || [])
        e.target.value = '' // allow picking the same file again
        setFileError(files.map(checkImageFile).filter(Boolean).join(' · '))
        const valid = files.filter((f) => !checkImageFile(f))
        onAddedChange([...added, ...valid.map(toUpload)])
    }

    const removeAdded = (index) => {
        releaseUpload(added[index])
        onAddedChange(added.filter((_, i) => i !== index))
    }

    const tile = (src, onRemove, key, label) => (
        <Box key={key} sx={{ position: 'relative', width: 104, height: 104, borderRadius: 2, overflow: 'hidden', border: 1, borderColor: 'divider', bgcolor: 'background.default' }}>
            <Box component="img" src={src} alt={label} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <IconButton
                size="small"
                aria-label={`Remove ${label}`}
                onClick={onRemove}
                sx={{ position: 'absolute', top: 4, right: 4, bgcolor: 'rgba(15,27,45,0.75)', color: '#fff', '&:hover': { bgcolor: 'rgba(15,27,45,0.9)' } }}
            >
                <CloseRounded fontSize="small" />
            </IconButton>
        </Box>
    )

    return (
        <Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1.5 }}>
                {existing.map((img, i) =>
                    tile(resolveImageUrl(img.url), () => onExistingChange(existing.filter((x) => x.public_id !== img.public_id)), img.public_id, `photo ${i + 1}`))}
                {added.map((upload, i) =>
                    tile(upload.preview, () => removeAdded(i), upload.preview, `new photo ${i + 1}`))}
                <Button
                    component="label"
                    variant="outlined"
                    sx={{ width: 104, height: 104, flexDirection: 'column', gap: 0.5, borderStyle: 'dashed', borderColor: error ? 'error.main' : 'divider', color: 'text.secondary' }}
                >
                    <AddPhotoAlternateOutlined />
                    <Typography variant="caption">Add photos</Typography>
                    <input hidden type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleFiles} />
                </Button>
            </Box>
            <Typography variant="caption" color={error || fileError ? 'error' : 'text.secondary'}>
                {error || fileError || `PNG, JPG or WEBP, up to ${MAX_IMAGE_MB} MB each. You can add several.`}
            </Typography>
        </Box>
    )
}
