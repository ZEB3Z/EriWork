import { Link } from 'react-router-dom'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { resolveImageUrl, formatMoney } from '../../Utils/helpers'

// Read-only list of order lines: photo, name, quantity × price, subtotal.
export default function OrderItems({ items }) {
    return (
        <Box>
            {items.map((item, i) => (
                <Box key={item.product}>
                    {i > 0 && <Divider />}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5 }}>
                        <Box component="img" src={resolveImageUrl(item.image)} alt={item.name}
                            sx={{ width: 56, height: 56, borderRadius: 1.5, objectFit: 'cover', border: 1, borderColor: 'divider' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography component={Link} to={`/product/${item.product}`} sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                {item.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">{item.quantity} × {formatMoney(item.price)}</Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 700 }}>{formatMoney(item.quantity * item.price)}</Typography>
                    </Box>
                </Box>
            ))}
        </Box>
    )
}
