import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import LockOutlined from '@mui/icons-material/LockOutlined'
import api, { getErrorMessage } from '../../api'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import FormField from '../Common/FormField'
import { paymentSchema } from '../../Utils/validation'
import { calculatePrices, formatMoney } from '../../Utils/helpers'

// Demo payment: the card format is checked, but nothing is charged.
export default function Payment({ cartItems, shippingInfo, clearCart }) {
    const [placedOrderId, setPlacedOrderId] = useState(null)
    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(paymentSchema),
        defaultValues: { cardName: '', cardNumber: '', expiry: '', cvc: '' }
    })

    // Order placed: go to the success page. This check comes first because the
    // cart is now empty, and an empty cart would otherwise send us to /cart.
    if (placedOrderId) return <Navigate to="/success" replace state={{ orderId: placedOrderId }} />
    if (cartItems.length === 0) return <Navigate to="/cart" replace />
    if (!shippingInfo.address) return <Navigate to="/shipping" replace />

    const { totalPrice } = calculatePrices(cartItems)

    const onSubmit = async () => {
        try {
            const { data } = await api.post('/order/new', {
                orderItems: cartItems.map((i) => ({ product: i.product, quantity: i.quantity })),
                shippingInfo
            })
            setPlacedOrderId(data.order._id)
            clearCart()
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not place your order'))
        }
    }

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <MetaData title="Payment" />
            <CheckoutSteps activeStep={2} />
            <Paper variant="outlined" component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Typography variant="h2" sx={{ mb: 1 }}>Payment</Typography>
                <Alert severity="info" sx={{ mb: 3 }}>
                    Demo checkout — no real card is charged. Try 4242 4242 4242 4242, 12/30, 123.
                </Alert>
                <Grid container spacing={2}>
                    <Grid size={12}><FormField name="cardName" control={control} label="Name on card" autoComplete="cc-name" /></Grid>
                    <Grid size={12}><FormField name="cardNumber" control={control} label="Card number" placeholder="4242 4242 4242 4242" autoComplete="cc-number" /></Grid>
                    <Grid size={6}><FormField name="expiry" control={control} label="Expiry (MM/YY)" placeholder="12/30" autoComplete="cc-exp" /></Grid>
                    <Grid size={6}><FormField name="cvc" control={control} label="CVC" placeholder="123" autoComplete="cc-csc" /></Grid>
                </Grid>
                <Button type="submit" variant="contained" size="large" fullWidth startIcon={<LockOutlined />} disabled={isSubmitting} sx={{ mt: 3 }}>
                    {isSubmitting ? 'Placing order…' : `Pay ${formatMoney(totalPrice)}`}
                </Button>
            </Paper>
        </Container>
    )
}
