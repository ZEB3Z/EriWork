import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import api, { getErrorMessage } from '../../api'
import { productSchema, CATEGORIES } from '../../Utils/validation'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import PageHeader from '../Common/PageHeader'
import FormField from '../Common/FormField'
import ImageUploader from '../Common/ImageUploader'

const EMPTY = { name: '', price: '', description: '', category: '', seller: 'EriWork', stock: '' }

// Create a product (/admin/product/new) or edit one (/admin/product/:id).
export default function ProductForm() {
    const { id } = useParams()
    const isEdit = Boolean(id)
    const navigate = useNavigate()

    const [loading, setLoading] = useState(isEdit)
    const [existingImages, setExistingImages] = useState([]) // already on the server
    const [newImages, setNewImages] = useState([])           // base64, not uploaded yet
    const [imageError, setImageError] = useState('')

    const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(productSchema),
        defaultValues: EMPTY
    })

    useEffect(() => {
        if (!isEdit) return
        api.get(`/product/${id}`)
            .then(({ data }) => {
                const p = data.product
                reset({ name: p.name, price: p.price, description: p.description, category: p.category, seller: p.seller, stock: p.stock })
                setExistingImages(p.images)
            })
            .catch((err) => {
                toast.error(getErrorMessage(err))
                navigate('/admin/products')
            })
            .finally(() => setLoading(false))
    }, [id, isEdit, reset, navigate])

    // The photo error disappears as soon as there is at least one photo.
    const photoCount = existingImages.length + newImages.length
    const showImageError = photoCount === 0 ? imageError : ''

    const onSubmit = async (values) => {
        if (photoCount === 0) {
            setImageError('Add at least one photo')
            return
        }
        try {
            const payload = { ...values, images: newImages, keepImages: existingImages.map((img) => img.public_id) }
            if (isEdit) {
                await api.put(`/admin/product/${id}`, payload)
                toast.success('Product updated')
            } else {
                await api.post('/admin/product/new', payload)
                toast.success('Product created')
            }
            navigate('/admin/products')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    // Show the photo error together with the field errors.
    const onInvalid = () => {
        if (photoCount === 0) setImageError('Add at least one photo')
    }

    if (loading) return <Loader />

    return (
        <>
            <MetaData title={isEdit ? 'Edit product' : 'New product'} />
            <PageHeader title={isEdit ? 'Edit product' : 'New product'} subtitle={isEdit ? 'Update details and photos.' : 'Add an item to the catalog.'} />

            <Box component="form" onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, lg: 7 }}>
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="h3" sx={{ mb: 2 }}>Details</Typography>
                            <Grid container spacing={2}>
                                <Grid size={12}><FormField name="name" control={control} label="Product name" /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormField name="category" control={control} label="Category" select>
                                        {CATEGORIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                                    </FormField>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}><FormField name="seller" control={control} label="Seller" /></Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormField name="price" control={control} label="Price (USD)" type="number" slotProps={{ htmlInput: { min: 0, step: '0.01' } }} />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <FormField name="stock" control={control} label="Stock" type="number" slotProps={{ htmlInput: { min: 0, step: 1 } }} />
                                </Grid>
                                <Grid size={12}><FormField name="description" control={control} label="Description" multiline minRows={5} /></Grid>
                            </Grid>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, lg: 5 }}>
                        <Paper variant="outlined" sx={{ p: 3 }}>
                            <Typography variant="h3" sx={{ mb: 0.5 }}>Photos</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>The first photo is shown in the shop.</Typography>
                            <ImageUploader
                                existing={existingImages}
                                onExistingChange={setExistingImages}
                                added={newImages}
                                onAddedChange={setNewImages}
                                error={showImageError}
                            />
                        </Paper>
                    </Grid>
                </Grid>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', mt: 3 }}>
                    <Button component={Link} to="/admin/products" color="inherit">Cancel</Button>
                    <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                        {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
                    </Button>
                </Box>
            </Box>
        </>
    )
}
