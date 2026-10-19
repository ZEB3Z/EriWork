import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'
import { formatMoney, TAX_RATE } from '../../Utils/helpers'

// Subtotal / shipping / tax / grand total.
export default function PriceSummary({ prices }) {
    const row = (label, value) => (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5 }}>
            <Typography color="text.secondary">{label}</Typography>
            <Typography>{value}</Typography>
        </Box>
    )
    return (
        <Box>
            {row('Subtotal', formatMoney(prices.itemsPrice))}
            {row('Shipping', prices.shippingPrice ? formatMoney(prices.shippingPrice) : 'Free')}
            {row(`Tax (${Math.round(TAX_RATE * 100)}%)`, formatMoney(prices.taxPrice))}
            <Divider sx={{ my: 1 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontWeight: 800 }}>Grand total</Typography>
                <Typography sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.15rem' }}>{formatMoney(prices.totalPrice)}</Typography>
            </Box>
        </Box>
    )
}
