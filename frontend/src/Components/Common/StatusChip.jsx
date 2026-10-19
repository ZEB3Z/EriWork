import Chip from '@mui/material/Chip'

const COLORS = { Processing: 'warning', Shipped: 'info', Delivered: 'success', Cancelled: 'error' }

// Coloured chip for an order status.
export default function StatusChip({ status, size = 'small' }) {
    return <Chip label={status} color={COLORS[status] || 'default'} size={size} variant="outlined" />
}
