import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import api, { getErrorMessage } from '../../api'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import EmptyState from '../Common/EmptyState'
import StatusChip from '../Common/StatusChip'
import OrderItems from './OrderItems'
import PriceSummary from './PriceSummary'
import { formatDate, shortId } from '../../Utils/helpers'

export default function OrderDetails() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [error, setError] = useState('')

    useEffect(() => {
        api.get(`/order/${id}`)
            .then(({ data }) => setOrder(data.order))
            .catch((err) => setError(getErrorMessage(err)))
    }, [id])

    if (error) return <EmptyState title="Order not found" message={error} action={<Button component={Link} to="/orders/me" variant="contained">My orders</Button>} />
    if (!order) return <Loader />

    const s = order.shippingInfo
    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <MetaData title={`Order ${shortId(order._id)}`} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 3 }}>
                <Typography variant="h1">Order {shortId(order._id)}</Typography>
                <StatusChip status={order.orderStatus} size="medium" />
            </Box>
            <Typography color="text.secondary" sx={{ mt: -2, mb: 3 }}>
                Placed {formatDate(order.createdAt)}{order.deliveredAt ? ` · Delivered ${formatDate(order.deliveredAt)}` : ''}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper variant="outlined" sx={{ px: 2.5, pt: 2 }}>
                        <Typography variant="h3">Items</Typography>
                        <OrderItems items={order.orderItems} />
                    </Paper>
                    {order.orderStatus === 'Delivered' && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
                            Happy with your gear? Open a product to leave a review.
                        </Typography>
                    )}
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
                        <Typography variant="h3" sx={{ mb: 2 }}>Payment</Typography>
                        <PriceSummary prices={order} />
                        <Typography variant="body2" color="success.main" sx={{ mt: 1.5, fontWeight: 600 }}>Paid {formatDate(order.paidAt)}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Typography variant="h3" sx={{ mb: 1 }}>Shipping</Typography>
                        <Typography sx={{ fontWeight: 600 }}>{order.user.name}</Typography>
                        <Typography color="text.secondary">{s.address}, {s.city} {s.postalCode}</Typography>
                        <Typography color="text.secondary">{s.country}</Typography>
                        <Typography color="text.secondary">{s.phoneNo}</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
}
