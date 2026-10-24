import { Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Alert from '@mui/material/Alert'
import AddRounded from '@mui/icons-material/AddRounded'
import RemoveRounded from '@mui/icons-material/RemoveRounded'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import ShoppingCartOutlined from '@mui/icons-material/ShoppingCartOutlined'
import MetaData from '../Layout/MetaData'
import EmptyState from '../Common/EmptyState'
import PriceSummary from '../Order/PriceSummary'
import { resolveImageUrl, formatMoney, calculatePrices, FREE_SHIPPING_THRESHOLD } from '../../Utils/helpers'
import { updateQuantity as updateQuantityAction, removeItem as removeItemAction } from '../../redux/actions/cartActions'

export default function Cart() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const cartItems = useSelector((state) => state.cart.cartItems)
    const user = useSelector((state) => state.auth.user)
    const updateQuantity = (id, quantity) => dispatch(updateQuantityAction(id, quantity))
    const removeItem = (id) => dispatch(removeItemAction(id))
    const prices = calculatePrices(cartItems)
    const units = cartItems.reduce((sum, i) => sum + i.quantity, 0)

    const checkout = () => navigate(user ? '/shipping' : '/login?redirect=shipping')

    if (cartItems.length === 0) {
        return (
            <Container maxWidth="md">
                <MetaData title="Your cart" noIndex />
                <EmptyState icon={<ShoppingCartOutlined />} title="Your cart is empty"
                    message="Find routers, mesh WiFi and more in the shop."
                    action={<Button component={Link} to="/" variant="contained">Start shopping</Button>} />
            </Container>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <MetaData title="Your cart" noIndex />
            <Typography variant="h1" sx={{ mb: 3 }}>Your cart <Typography component="span" color="text.secondary" sx={{ fontSize: '1rem', fontWeight: 500 }}>({units} item{units === 1 ? '' : 's'})</Typography></Typography>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper variant="outlined" sx={{ px: 2.5 }}>
                        {cartItems.map((item, i) => (
                            <Box key={item.product}>
                                {i > 0 && <Divider />}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                                    <Box component="img" src={resolveImageUrl(item.image)} alt={item.name}
                                        sx={{ width: 84, height: 84, borderRadius: 2, objectFit: 'cover', border: 1, borderColor: 'divider' }} />
                                    <Box sx={{ flex: 1, minWidth: 160 }}>
                                        <Typography component={Link} to={`/product/${item.product}`} sx={{ fontWeight: 600, color: 'text.primary', textDecoration: 'none', '&:hover': { color: 'primary.main' } }}>
                                            {item.name}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">{formatMoney(item.price)} each</Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', border: 1, borderColor: 'divider', borderRadius: 2 }}>
                                        <IconButton size="small" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => updateQuantity(item.product, item.quantity - 1)}><RemoveRounded fontSize="small" /></IconButton>
                                        <Typography sx={{ width: 32, textAlign: 'center', fontWeight: 700 }}>{item.quantity}</Typography>
                                        <IconButton size="small" aria-label="Increase quantity" disabled={item.quantity >= item.stock} onClick={() => updateQuantity(item.product, item.quantity + 1)}><AddRounded fontSize="small" /></IconButton>
                                    </Box>
                                    <Typography sx={{ fontWeight: 700, width: 96, textAlign: 'right' }}>{formatMoney(item.price * item.quantity)}</Typography>
                                    <IconButton aria-label={`Remove ${item.name}`} onClick={() => removeItem(item.product)} sx={{ color: 'error.main' }}><DeleteOutlined /></IconButton>
                                </Box>
                            </Box>
                        ))}
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2.5, position: { md: 'sticky' }, top: { md: 96 } }}>
                        <Typography variant="h3" sx={{ mb: 2 }}>Order summary</Typography>
                        <PriceSummary prices={prices} />
                        {prices.shippingPrice > 0 && (
                            <Alert severity="info" sx={{ mt: 2 }}>
                                Add {formatMoney(FREE_SHIPPING_THRESHOLD - prices.itemsPrice + 0.01)} more for free shipping.
                            </Alert>
                        )}
                        <Button variant="contained" size="large" fullWidth onClick={checkout} sx={{ mt: 2 }}>Check out</Button>
                        <Button component={Link} to="/" fullWidth sx={{ mt: 1 }}>Continue shopping</Button>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    )
}
