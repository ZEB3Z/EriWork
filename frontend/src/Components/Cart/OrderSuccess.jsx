import { Link, useLocation } from 'react-router-dom'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded'
import MetaData from '../Layout/MetaData'
import { shortId } from '../../Utils/helpers'

export default function OrderSuccess() {
    const orderId = useLocation().state?.orderId

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <MetaData title="Order placed" />
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
                <CheckCircleRounded color="success" sx={{ fontSize: 72 }} />
                <Typography variant="h1" sx={{ mt: 1 }}>Thank you for your order!</Typography>
                <Typography color="text.secondary" sx={{ mt: 1.5 }}>
                    {orderId ? `Order ${shortId(orderId)} is being processed. ` : ''}
                    A confirmation with your PDF receipt is on its way to your email.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', mt: 4, flexWrap: 'wrap' }}>
                    {orderId && <Button component={Link} to={`/order/${orderId}`} variant="contained">View order</Button>}
                    <Button component={Link} to="/" variant="outlined">Keep shopping</Button>
                </Box>
            </Paper>
        </Container>
    )
}
