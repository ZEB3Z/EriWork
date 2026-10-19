import { Link } from 'react-router-dom'
import Card from '@mui/material/Card'
import CardActionArea from '@mui/material/CardActionArea'
import CardContent from '@mui/material/CardContent'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Chip from '@mui/material/Chip'
import { resolveImageUrl, formatMoney } from '../../Utils/helpers'

export default function ProductCard({ product }) {
    const image = product.images[0] ? resolveImageUrl(product.images[0].url) : ''
    const outOfStock = product.stock === 0

    return (
        <Card sx={{ height: '100%', transition: 'border-color .15s, box-shadow .15s', '&:hover': { borderColor: 'primary.light', boxShadow: '0 8px 24px rgba(15,27,45,0.08)' } }}>
            <CardActionArea component={Link} to={`/product/${product._id}`} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                <Box sx={{ position: 'relative', aspectRatio: '1 / 1', bgcolor: 'background.default' }}>
                    <Box component="img" src={image} alt={product.name} loading="lazy" sx={{ width: '100%', height: '100%', objectFit: 'cover', opacity: outOfStock ? 0.55 : 1 }} />
                    {outOfStock && <Chip label="Out of stock" size="small" sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'secondary.main', color: '#fff' }} />}
                </Box>
                <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, flexGrow: 1 }}>
                    <Typography variant="caption" color="primary" sx={{ fontWeight: 700 }}>{product.category}</Typography>
                    <Typography sx={{ fontWeight: 600, lineHeight: 1.35, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.7em' }}>
                        {product.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Rating value={product.ratings} precision={0.5} size="small" readOnly />
                        <Typography variant="caption" color="text.secondary">({product.numOfReviews})</Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '1.15rem', color: 'secondary.main', mt: 'auto' }}>
                        {formatMoney(product.price)}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    )
}
