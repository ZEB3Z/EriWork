import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import ProgressBar from 'react-bootstrap/ProgressBar'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Skeleton from '@mui/material/Skeleton'
import PaymentsOutlined from '@mui/icons-material/PaymentsOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import api, { getErrorMessage } from '../../api'
import { formatMoney } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import PageHeader from '../Common/PageHeader'
import StatusChip from '../Common/StatusChip'
import SalesChart from './SalesChart'
import theme from '../../theme'

function StatCard({ icon, label, value, note, to }) {
    return (
        <Paper variant="outlined" component={to ? Link : 'div'} to={to}
            sx={{ p: 2.5, display: 'flex', gap: 2, alignItems: 'center', textDecoration: 'none', height: '100%', '&:hover': to ? { borderColor: 'primary.light' } : {} }}>
            <Box sx={{ bgcolor: 'rgba(15,118,110,0.1)', color: 'primary.main', borderRadius: 2, p: 1.2, display: 'flex' }}>{icon}</Box>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" color="text.secondary">{label}</Typography>
                <Typography sx={{ fontWeight: 800, fontSize: '1.4rem', color: 'secondary.main' }}>{value}</Typography>
                {note && <Typography variant="caption" color="text.secondary">{note}</Typography>}
            </Box>
        </Paper>
    )
}

// Same colours as StatusChip (MUI theme palette).
const STATUS_COLORS = {
    Processing: theme.palette.warning.main,
    Shipped: theme.palette.info.main,
    Delivered: theme.palette.success.main,
    Cancelled: theme.palette.error.main
}

// Share of orders in each status as one stacked bar (React-Bootstrap ProgressBar),
// with the counts as chips underneath.
function StatusBreakdown({ counts, total }) {
    const entries = Object.entries(counts)
    return (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.25 }}>Orders by status</Typography>
            {total > 0 && (
                <ProgressBar style={{ height: 12, borderRadius: 999, marginBottom: 12 }} aria-label="Orders by status">
                    {entries.filter(([, count]) => count > 0).map(([status, count]) => (
                        <ProgressBar key={status} now={(count / total) * 100} style={{ backgroundColor: STATUS_COLORS[status] }}
                            title={`${status}: ${count}`} aria-label={`${status}: ${count} of ${total}`} />
                    ))}
                </ProgressBar>
            )}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                {entries.map(([status, count]) => (
                    <Box key={status} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <StatusChip status={status} />
                        <Typography sx={{ fontWeight: 700 }}>{count}</Typography>
                    </Box>
                ))}
            </Box>
        </Paper>
    )
}

export default function Dashboard() {
    const [stats, setStats] = useState(null)

    useEffect(() => {
        api.get('/admin/stats')
            .then(({ data }) => setStats(data.stats))
            .catch((err) => toast.error(getErrorMessage(err)))
    }, [])

    return (
        <>
            <MetaData title="Admin dashboard" noIndex />
            <PageHeader title="Dashboard" subtitle="How the store is doing at a glance." />

            <Grid container spacing={2} sx={{ mb: 3 }}>
                {stats ? (
                    <>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard icon={<PaymentsOutlined />} label="Total sales" value={formatMoney(stats.totalSales)} note="All time, excluding cancelled" /></Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard icon={<ReceiptLongOutlined />} label="Orders" value={stats.orders} note={`${stats.statusCounts.Processing} waiting to ship`} to="/admin/orders" /></Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard icon={<Inventory2Outlined />} label="Products" value={stats.products} note={stats.outOfStock ? `${stats.outOfStock} out of stock` : 'All in stock'} to="/admin/products" /></Grid>
                        <Grid size={{ xs: 12, sm: 6, lg: 3 }}><StatCard icon={<PeopleOutlined />} label="Users" value={stats.users} to="/admin/users" /></Grid>
                    </>
                ) : [0, 1, 2, 3].map((i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6, lg: 3 }}><Skeleton variant="rounded" height={96} /></Grid>
                ))}
            </Grid>

            {stats && <StatusBreakdown counts={stats.statusCounts} total={stats.orders} />}

            <SalesChart />
        </>
    )
}
