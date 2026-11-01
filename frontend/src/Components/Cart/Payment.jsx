import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import LockOutlined from '@mui/icons-material/LockOutlined'
import api, { getErrorMessage } from '../../api'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import FormField from '../Common/FormField'
import OtpPanel from '../Common/OtpPanel'
import { sendActionOtp } from '../../Utils/otp'
import { paymentSchema } from '../../Utils/validation'
import { calculatePrices, formatMoney } from '../../Utils/helpers'
import { clearCart } from '../../redux/actions/cartActions'

// Demo payment: the card format is checked, but nothing is charged.
// Before the order is placed, a 6-digit code emailed to the customer must be entered.
export default function Payment() {
    const dispatch = useDispatch()
    const { cartItems, shippingInfo } = useSelector((state) => state.cart)
    const [placedOrderId, setPlacedOrderId] = useState(null)
    const [otpEmail, setOtpEmail] = useState('') // set while the code dialog is open
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

    // Step 1: the card looks valid -> email a code and open the dialog.
    const onSubmit = async () => {
        try {
            const data = await sendActionOtp('checkout')
            setOtpEmail(data.email)
            toast.info('Check your email for the 6-digit code')
        } catch (err) {
            toast.error(getErrorMessage(err, 'Could not send the verification code'))
        }
    }

    // Step 2: the right code places the order. Errors show under the code field.
    const placeOrder = async (otp) => {
        const { data } = await api.post('/order/new', {
            orderItems: cartItems.map((i) => ({ product: i.product, quantity: i.quantity })),
            shippingInfo,
            otp
        })
        setOtpEmail('')
        setPlacedOrderId(data.order._id)
        dispatch(clearCart())
    }

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <MetaData title="Payment" noIndex />
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
                    {isSubmitting ? 'Sending code…' : `Pay ${formatMoney(totalPrice)}`}
                </Button>
            </Paper>

            <Dialog open={Boolean(otpEmail)} onClose={() => setOtpEmail('')} fullWidth maxWidth="xs">
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm your payment of {formatMoney(totalPrice)}</DialogTitle>
                <DialogContent>
                    <OtpPanel
                        email={otpEmail}
                        confirmLabel={`Confirm and pay ${formatMoney(totalPrice)}`}
                        busyLabel="Placing order…"
                        onConfirm={placeOrder}
                        onResend={() => sendActionOtp('checkout')}
                        onBack={() => setOtpEmail('')}
                        backLabel="Cancel"
                    />
                </DialogContent>
            </Dialog>
        </Container>
    )
}
