import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import WifiRounded from '@mui/icons-material/WifiRounded'

// Centered card used by login, register and password pages.
export default function AuthCard({ title, subtitle, children }) {
    return (
        <Container maxWidth="xs" sx={{ py: { xs: 4, sm: 8 } }}>
            <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 } }}>
                <Box sx={{ display: 'inline-flex', bgcolor: 'primary.main', color: '#fff', borderRadius: 2, p: 1, mb: 2 }}>
                    <WifiRounded />
                </Box>
                <Typography variant="h2" component="h1">{title}</Typography>
                {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
                <Box sx={{ mt: 3 }}>{children}</Box>
            </Paper>
        </Container>
    )
}
