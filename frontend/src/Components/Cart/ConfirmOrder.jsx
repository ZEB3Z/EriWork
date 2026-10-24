import { Navigate, useNavigate, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import OrderItems from '../Order/OrderItems'
import PriceSummary from '../Order/PriceSummary'
import { calculatePrices } from '../../Utils/helpers'

export default function ConfirmOrder() {
    const navigate = useNavigate()
    const { cartItems, shippingInfo } = useSelector((state) => state.cart)
    const user = useSelector((state) => state.auth.user)

    if (cartItems.length === 0) return <Navigate to="/cart" replace />
    if (!shippingInfo.address) return <Navigate to="/shipping" replace />

    const prices = calculatePrices(cartItems)

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <MetaData title="Confirm order" noIndex />
            <CheckoutSteps activeStep={1} />
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, mb: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                            <Typography variant="h3">Shipping to</Typography>
                            <Button component={Link} to="/shipping" size="small">Edit</Button>
                        </Box>
                        <Typography sx={{ fontWeight: 600 }}>{user.name}</Typography>
                        <Typography color="text.secondary">{shippingInfo.address}, {shippingInfo.city} {shippingInfo.postalCode}, {shippingInfo.country}</Typography>
                        <Typography color="text.secondary">{shippingInfo.phoneNo}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ px: 2.5, pt: 2 }}>
                        <Typography variant="h3">Items</Typography>
                        <OrderItems items={cartItems} />
                    </Paper>
                </Grid>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Typography variant="h3" sx={{ mb: 2 }}>Order summary</Typography>
                        <PriceSummary prices={prices} />
                        <Button variant="contained" size="large" fullWidth sx={{ mt: 2 }} onClick={() => navigate('/payment')}>
                            Continue to payment
                        </Button>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
}
