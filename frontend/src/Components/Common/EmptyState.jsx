import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

// Friendly message for empty lists, with an optional action button.
export default function EmptyState({ icon, title, message, action }) {
    return (
        <Box sx={{ textAlign: 'center', py: 8, px: 2 }}>
            {icon && <Box sx={{ color: 'text.secondary', mb: 1, '& svg': { fontSize: 56 } }}>{icon}</Box>}
            <Typography variant="h3" sx={{ mb: 1 }}>{title}</Typography>
            {message && <Typography color="text.secondary" sx={{ mb: 3 }}>{message}</Typography>}
            {action}
        </Box>
    )
}
