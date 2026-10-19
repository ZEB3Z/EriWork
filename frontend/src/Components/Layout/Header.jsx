import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'react-toastify'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Container from '@mui/material/Container'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Badge from '@mui/material/Badge'
import Avatar from '@mui/material/Avatar'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import InputBase from '@mui/material/InputBase'
import Typography from '@mui/material/Typography'
import WifiRounded from '@mui/icons-material/WifiRounded'
import SearchRounded from '@mui/icons-material/SearchRounded'
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined'
import DashboardOutlined from '@mui/icons-material/DashboardOutlined'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import PersonOutlined from '@mui/icons-material/PersonOutlined'
import LogoutRounded from '@mui/icons-material/LogoutRounded'
import { getUser, logout, AUTH_EVENT, avatarSrc } from '../../Utils/helpers'

// Search field. It is re-created on every page change (key={pathname}),
// so it always starts with the keyword from the URL, if any.
function SearchBox({ pathname }) {
    const navigate = useNavigate()
    const match = pathname.match(/^\/search\/(.+)/)
    const [keyword, setKeyword] = useState(match ? decodeURIComponent(match[1]) : '')

    const handleSearch = (e) => {
        e.preventDefault()
        navigate(keyword.trim() ? `/search/${encodeURIComponent(keyword.trim())}` : '/')
    }

    return (
        <Paper
            component="form"
            onSubmit={handleSearch}
            sx={{ display: 'flex', alignItems: 'center', flex: '1 1 260px', maxWidth: 520, order: { xs: 3, sm: 0 }, px: 1.5, borderRadius: 2 }}
        >
            <InputBase
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search routers, mesh, cables…"
                inputProps={{ 'aria-label': 'Search products' }}
                sx={{ flex: 1, py: 0.6 }}
            />
            <IconButton type="submit" size="small" aria-label="Search"><SearchRounded /></IconButton>
        </Paper>
    )
}

export default function Header({ cartCount }) {
    const [user, setUser] = useState(getUser())
    const [menuAnchor, setMenuAnchor] = useState(null)
    const navigate = useNavigate()
    const location = useLocation()

    // Re-read the logged-in user whenever someone logs in or out.
    useEffect(() => {
        const sync = () => setUser(getUser())
        window.addEventListener(AUTH_EVENT, sync)
        return () => window.removeEventListener(AUTH_EVENT, sync)
    }, [])

    const handleLogout = () => {
        setMenuAnchor(null)
        logout(() => {
            toast.success('You are logged out')
            navigate('/')
        })
    }

    const go = (path) => {
        setMenuAnchor(null)
        navigate(path)
    }

    return (
        <AppBar position="sticky" color="secondary" elevation={0}>
            <Container maxWidth="lg">
                <Toolbar disableGutters sx={{ gap: 2, flexWrap: 'wrap', py: 1 }}>
                    <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#fff', textDecoration: 'none' }}>
                        <Box sx={{ bgcolor: 'primary.main', borderRadius: 2, p: 0.6, display: 'flex' }}>
                            <WifiRounded fontSize="small" />
                        </Box>
                        <Typography sx={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>EriWork</Typography>
                    </Box>

                    <SearchBox key={location.pathname} pathname={location.pathname} />

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                        <Button component={Link} to="/" color="inherit">Shop</Button>
                        <IconButton component={Link} to="/cart" color="inherit" aria-label="Cart">
                            <Badge badgeContent={cartCount} color="primary" showZero={false}>
                                <ShoppingCartOutlined />
                            </Badge>
                        </IconButton>

                        {user ? (
                            <>
                                <Button
                                    color="inherit"
                                    onClick={(e) => setMenuAnchor(e.currentTarget)}
                                    startIcon={<Avatar src={avatarSrc(user)} alt={user.name} sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 14 }}>{user.name[0]}</Avatar>}
                                    sx={{ maxWidth: 200 }}
                                >
                                    <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: { xs: 'none', md: 'inline' } }}>
                                        {user.name}
                                    </Box>
                                </Button>
                                <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} transformOrigin={{ vertical: 'top', horizontal: 'right' }}>
                                    {user.role === 'admin' && (
                                        <MenuItem onClick={() => go('/admin')}>
                                            <ListItemIcon><DashboardOutlined fontSize="small" /></ListItemIcon>Admin dashboard
                                        </MenuItem>
                                    )}
                                    <MenuItem onClick={() => go('/orders/me')}>
                                        <ListItemIcon><ReceiptLongOutlined fontSize="small" /></ListItemIcon>My orders
                                    </MenuItem>
                                    <MenuItem onClick={() => go('/me')}>
                                        <ListItemIcon><PersonOutlined fontSize="small" /></ListItemIcon>Profile
                                    </MenuItem>
                                    <Divider />
                                    <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
                                        <ListItemIcon><LogoutRounded fontSize="small" color="error" /></ListItemIcon>Log out
                                    </MenuItem>
                                </Menu>
                            </>
                        ) : (
                            <Button component={Link} to="/login" variant="contained" color="primary">Log in</Button>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    )
}
