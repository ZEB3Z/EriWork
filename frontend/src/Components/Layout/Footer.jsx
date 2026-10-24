import { Link } from 'react-router-dom'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import Divider from '@mui/material/Divider'

const COLUMNS = [
    { title: 'Shop', links: [{ to: '/', label: 'All products' }, { to: '/cart', label: 'Cart' }] },
    { title: 'Account', links: [{ to: '/orders/me', label: 'My orders' }, { to: '/me', label: 'Profile' }, { to: '/login', label: 'Log in' }] }
]

const linkSx = { color: '#b9c4d4', textDecoration: 'none', fontSize: 14, '&:hover': { color: '#fff' } }

// Footer: MUI for colours/typography, React-Bootstrap's Row/Col grid for the
// responsive columns (stacked on phones, side by side from tablet up).
export default function Footer() {
    return (
        <Box component="footer" sx={{ bgcolor: 'secondary.main', color: '#b9c4d4', pt: 4, pb: 3, mt: 'auto' }}>
            <Container maxWidth="lg">
                <Row className="g-4">
                    <Col xs={12} md={6}>
                        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem' }}>EriWork</Typography>
                        <Typography variant="body2" sx={{ mt: 0.75, maxWidth: 360 }}>
                            Routers, mesh WiFi, switches and cables for home and office.
                        </Typography>
                    </Col>
                    {COLUMNS.map((col) => (
                        <Col key={col.title} xs={6} md={3}>
                            <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700, mb: 1 }}>{col.title}</Typography>
                            <Box component="nav" aria-label={col.title} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                {col.links.map((l) => <Box key={l.to} component={Link} to={l.to} sx={linkSx}>{l.label}</Box>)}
                            </Box>
                        </Col>
                    ))}
                </Row>
                <Divider sx={{ borderColor: 'rgba(255,255,255,0.12)', my: 3 }} />
                <Typography variant="body2">© {new Date().getFullYear()} EriWork · ITCP318 academic project · demo payments only</Typography>
            </Container>
        </Box>
    )
}
