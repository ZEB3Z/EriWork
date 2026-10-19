import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Page title with an optional subtitle and buttons on the right.
export default function PageHeader({ title, subtitle, actions }) {
    return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3 }}>
            <Box>
                <Typography variant="h2" component="h1">{title}</Typography>
                {subtitle && <Typography color="text.secondary" sx={{ mt: 0.5 }}>{subtitle}</Typography>}
            </Box>
            {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
        </Box>
    )
}
