import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import MailOutlined from '@mui/icons-material/MailOutlined'
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded'
import api, { getErrorMessage } from '../../api'
import { formatDate, shortId } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import StatusChip from '../Common/StatusChip'
import OrderItems from '../Order/OrderItems'
import PriceSummary from '../Order/PriceSummary'

// Which statuses an order can move to next.
const NEXT_STATUSES = {
    Processing: ['Shipped', 'Delivered', 'Cancelled'],
    Shipped: ['Delivered', 'Cancelled'],
    Delivered: [],
    Cancelled: []
}

export default function ProcessOrder() {
    const { id } = useParams()
    const [order, setOrder] = useState(null)
    const [status, setStatus] = useState('')
    const [saving, setSaving] = useState(false)

    // Bump "refresh" to reload the order after updating its status.
    const [refresh, setRefresh] = useState(0)

    useEffect(() => {
        api.get(`/order/${id}`)
            .then(({ data }) => {
                setOrder(data.order)
                setStatus(NEXT_STATUSES[data.order.orderStatus][0] || '')
            })
            .catch((err) => toast.error(getErrorMessage(err)))
    }, [id, refresh])

    const updateStatus = async () => {
        setSaving(true)
        try {
            const { data } = await api.put(`/admin/order/${id}`, { status })
            if (data.emailed) toast.success(data.message)
            else toast.warn(data.message)
            setRefresh((n) => n + 1)
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
        setSaving(false)
    }

    if (!order) return <Loader />
    const options = NEXT_STATUSES[order.orderStatus]
    const s = order.shippingInfo

    return (
        <>
            <MetaData title={`Order ${shortId(order._id)}`} />
            <Button component={Link} to="/admin/orders" startIcon={<ArrowBackRounded />} sx={{ mb: 2 }}>All orders</Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', mb: 0.5 }}>
                <Typography variant="h2" component="h1">Order {shortId(order._id)}</Typography>
                <StatusChip status={order.orderStatus} size="medium" />
            </Box>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
                Placed {formatDate(order.createdAt)}{order.deliveredAt ? ` · Delivered ${formatDate(order.deliveredAt)}` : ''}
            </Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, lg: 8 }}>
                    <Paper variant="outlined" sx={{ px: 2.5, pt: 2, mb: 3 }}>
                        <Typography variant="h3">Items</Typography>
                        <OrderItems items={order.orderItems} />
                    </Paper>
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                                <Typography variant="h3" sx={{ mb: 1 }}>Customer</Typography>
                                <Typography sx={{ fontWeight: 600 }}>{order.user ? order.user.name : 'Deleted user'}</Typography>
                                <Typography color="text.secondary">{order.user ? order.user.email : ''}</Typography>
                            </Paper>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <Paper variant="outlined" sx={{ p: 2.5, height: '100%' }}>
                                <Typography variant="h3" sx={{ mb: 1 }}>Ship to</Typography>
                                <Typography color="text.secondary">{s.address}, {s.city} {s.postalCode}</Typography>
                                <Typography color="text.secondary">{s.country} · {s.phoneNo}</Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Grid>

                <Grid size={{ xs: 12, lg: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
                        <Typography variant="h3" sx={{ mb: 2 }}>Update status</Typography>
                        {options.length === 0 ? (
                            <Alert severity="info">This order is {order.orderStatus.toLowerCase()} and can't be changed.</Alert>
                        ) : (
                            <>
                                <TextField select label="New status" value={status} onChange={(e) => setStatus(e.target.value)} fullWidth>
                                    {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                                </TextField>
                                {status === 'Cancelled' && (
                                    <Alert severity="warning" sx={{ mt: 2 }}>Cancelling returns the items to stock.</Alert>
                                )}
                                <Button variant="contained" fullWidth size="large" startIcon={<MailOutlined />} disabled={saving || !status} onClick={updateStatus} sx={{ mt: 2 }}>
                                    {saving ? 'Updating…' : 'Update & email customer'}
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                                    The customer gets an email with the order details and a PDF receipt.
                                </Typography>
                            </>
                        )}
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Typography variant="h3" sx={{ mb: 2 }}>Payment</Typography>
                        <PriceSummary prices={order} />
                        <Typography variant="body2" color="success.main" sx={{ mt: 1.5, fontWeight: 600 }}>Paid {formatDate(order.paidAt)}</Typography>
                    </Paper>
                </Grid>
            </Grid>
        </>
    )
}
