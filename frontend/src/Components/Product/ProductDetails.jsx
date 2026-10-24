import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Divider from '@mui/material/Divider'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import AddRounded from '@mui/icons-material/AddRounded'
import RemoveRounded from '@mui/icons-material/RemoveRounded'
import AddShoppingCartRounded from '@mui/icons-material/AddShoppingCartRounded'
import LocalShippingOutlined from '@mui/icons-material/LocalShippingOutlined'
import api, { getErrorMessage } from '../../api'
import { resolveImageUrl, formatMoney, FREE_SHIPPING_THRESHOLD } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import EmptyState from '../Common/EmptyState'
import ReviewSection from '../Review/ReviewSection'
import { addItemToCart } from '../../redux/actions/cartActions'

// A fresh ProductDetails is mounted for every product id, so no state carries over.
export default function ProductPage() {
    const { id } = useParams()
    return <ProductDetails key={id} id={id} />
}

function ProductDetails({ id }) {
    const dispatch = useDispatch()
    const [product, setProduct] = useState(null)
    const [error, setError] = useState('')
    const [activeImage, setActiveImage] = useState(0)
    const [quantity, setQuantity] = useState(1)

    // Bump "refresh" to reload the product (e.g. after posting a review).
    const [refresh, setRefresh] = useState(0)

    useEffect(() => {
        api.get(`/product/${id}`)
            .then(({ data }) => setProduct(data.product))
            .catch((err) => setError(getErrorMessage(err)))
    }, [id, refresh])

    if (error) return <><MetaData title="Product not found" noIndex /><EmptyState title="Product not found" message={error} action={<Button component={Link} to="/" variant="contained">Back to shop</Button>} /></>
    if (!product) return <Loader />

    const inStock = product.stock > 0
    const image = product.images[activeImage] || product.images[0]

    const handleAdd = () => {
        dispatch(addItemToCart(product, quantity))
        toast.success(`Added ${quantity} × ${product.name} to cart`)
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <MetaData
                title={product.name}
                description={`${product.name} — ${product.category} from EriWork. ${product.description}`}
                image={image ? resolveImageUrl(image.url) : undefined}
            />
            <Breadcrumbs sx={{ mb: 3 }}>
                <Box component={Link} to="/" sx={{ color: 'text.secondary', textDecoration: 'none' }}>Shop</Box>
                <Typography color="text.secondary">{product.category}</Typography>
            </Breadcrumbs>

            <Grid container spacing={5}>
                {/* Photo gallery */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ borderRadius: 3, overflow: 'hidden', border: 1, borderColor: 'divider', bgcolor: 'background.paper', aspectRatio: '1 / 1' }}>
                        {image && <Box component="img" src={resolveImageUrl(image.url)} alt={product.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                    </Box>
                    {product.images.length > 1 && (
                        <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap' }}>
                            {product.images.map((img, i) => (
                                <Box
                                    key={img.public_id}
                                    component="button"
                                    type="button"
                                    onClick={() => setActiveImage(i)}
                                    aria-label={`Show photo ${i + 1}`}
                                    sx={{ p: 0, width: 76, height: 76, borderRadius: 2, overflow: 'hidden', cursor: 'pointer', bgcolor: 'transparent',
                                        border: 2, borderColor: i === activeImage ? 'primary.main' : 'divider' }}
                                >
                                    <Box component="img" src={resolveImageUrl(img.url)} alt="" sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </Box>
                            ))}
                        </Box>
                    )}
                </Grid>

                {/* Info + buy box */}
                <Grid size={{ xs: 12, md: 6 }}>
                    <Chip label={product.category} color="primary" variant="outlined" size="small" sx={{ mb: 1.5 }} />
                    <Typography variant="h1" sx={{ fontSize: { xs: '1.6rem', md: '2rem' } }}>{product.name}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                        <Rating value={product.ratings} precision={0.5} readOnly />
                        <Typography variant="body2" color="text.secondary">
                            {product.ratings.toFixed(1)} · {product.numOfReviews} review{product.numOfReviews === 1 ? '' : 's'}
                        </Typography>
                    </Box>

                    <Typography sx={{ fontSize: '2rem', fontWeight: 800, color: 'secondary.main', my: 2 }}>
                        {formatMoney(product.price)}
                    </Typography>

                    <Chip
                        label={inStock ? `In stock · ${product.stock} available` : 'Out of stock'}
                        color={inStock ? 'success' : 'error'}
                        variant="outlined"
                        size="small"
                    />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 3, flexWrap: 'wrap' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                            <IconButton aria-label="Decrease quantity" disabled={!inStock || quantity <= 1} onClick={() => setQuantity(quantity - 1)}><RemoveRounded /></IconButton>
                            <Typography sx={{ width: 36, textAlign: 'center', fontWeight: 700 }}>{quantity}</Typography>
                            <IconButton aria-label="Increase quantity" disabled={!inStock || quantity >= product.stock} onClick={() => setQuantity(quantity + 1)}><AddRounded /></IconButton>
                        </Box>
                        <Button size="large" variant="contained" startIcon={<AddShoppingCartRounded />} disabled={!inStock} onClick={handleAdd} sx={{ flex: 1, minWidth: 200, py: 1.2 }}>
                            Add to cart
                        </Button>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: 'text.secondary' }}>
                        <LocalShippingOutlined fontSize="small" />
                        <Typography variant="body2">Free shipping on orders over {formatMoney(FREE_SHIPPING_THRESHOLD)}</Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h4" sx={{ mb: 1 }}>About this product</Typography>
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7, whiteSpace: 'pre-line' }}>{product.description}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Sold by <b>{product.seller}</b></Typography>
                </Grid>
            </Grid>

            <ReviewSection product={product} onReviewSaved={() => setRefresh((n) => n + 1)} />
        </Container>
    )
}
