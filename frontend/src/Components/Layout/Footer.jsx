import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'

export default function Footer() {
    return (
        <Box component="footer" sx={{ bgcolor: 'secondary.main', color: '#b9c4d4', py: 3, mt: 'auto' }}>
            <Container maxWidth="lg" sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>EriWork — networking gear for home and office</Typography>
                <Typography variant="body2">© {new Date().getFullYear()} · ITCP318 academic project · demo payments only</Typography>
            </Container>
        </Box>
    )
}
