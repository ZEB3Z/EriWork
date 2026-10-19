import { Link, Outlet, useLocation } from 'react-router-dom'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import Inventory2Outlined from '@mui/icons-material/Inventory2Outlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import PeopleOutlined from '@mui/icons-material/PeopleOutlined'
import RateReviewOutlined from '@mui/icons-material/RateReviewOutlined'

const LINKS = [
    { to: '/admin', label: 'Dashboard', icon: <DashboardOutlined />, exact: true },
    { to: '/admin/products', label: 'Products', icon: <Inventory2Outlined />, match: '/admin/product' },
    { to: '/admin/orders', label: 'Orders', icon: <ReceiptLongOutlined />, match: '/admin/order' },
    { to: '/admin/users', label: 'Users', icon: <PeopleOutlined />, match: '/admin/user' },
    { to: '/admin/reviews', label: 'Reviews', icon: <RateReviewOutlined />, match: '/admin/reviews' }
]

// Sidebar + page area for every admin page.
export default function AdminLayout() {
    const { pathname } = useLocation()
    const isActive = (l) => (l.exact ? pathname === l.to : pathname.startsWith(l.match))

    return (
        <Container maxWidth="xl" sx={{ py: 4 }}>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3, lg: 2 }}>
                    <Paper variant="outlined" sx={{ p: 1, position: { md: 'sticky' }, top: { md: 96 } }}>
                        <Typography variant="caption" color="text.secondary" sx={{ px: 1.5, py: 1, display: 'block', fontWeight: 700 }}>Admin</Typography>
                        <List disablePadding sx={{ display: { xs: 'flex', md: 'block' }, overflowX: 'auto' }}>
                            {LINKS.map((l) => (
                                <ListItemButton key={l.to} component={Link} to={l.to} selected={isActive(l)}
                                    sx={{ borderRadius: 2, mb: { md: 0.5 }, flex: { xs: '0 0 auto', md: 'unset' }, '&.Mui-selected': { bgcolor: 'primary.main', color: '#fff', '& svg': { color: '#fff' } }, '&.Mui-selected:hover': { bgcolor: 'primary.dark' } }}>
                                    <ListItemIcon sx={{ minWidth: 36 }}>{l.icon}</ListItemIcon>
                                    <ListItemText primary={l.label} slotProps={{ primary: { fontWeight: 600, fontSize: 14 } }} />
                                </ListItemButton>
                            ))}
                        </List>
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 9, lg: 10 }}>
                    <Outlet />
                </Grid>
            </Grid>
        </Container>
    )
}
