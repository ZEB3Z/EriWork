import { Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { countries } from 'countries-list'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import MetaData from '../Layout/MetaData'
import CheckoutSteps from './CheckoutSteps'
import FormField from '../Common/FormField'
import { shippingSchema } from '../../Utils/validation'

const COUNTRY_NAMES = Object.values(countries).map((c) => c.name).sort()

export default function Shipping({ cartItems, shippingInfo, saveShippingInfo }) {
    const navigate = useNavigate()
    const { control, handleSubmit } = useForm({
        resolver: yupResolver(shippingSchema),
        defaultValues: { address: '', city: '', postalCode: '', phoneNo: '', country: 'Philippines', ...shippingInfo }
    })

    if (cartItems.length === 0) return <Navigate to="/cart" replace />

    const onSubmit = (values) => {
        saveShippingInfo(values)
        navigate('/confirm')
    }

    return (
        <Container maxWidth="sm" sx={{ py: 4 }}>
            <MetaData title="Shipping" />
            <CheckoutSteps activeStep={0} />
            <Paper variant="outlined" component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ p: { xs: 2.5, sm: 4 } }}>
                <Typography variant="h2" sx={{ mb: 3 }}>Where should we ship it?</Typography>
                <Grid container spacing={2}>
                    <Grid size={12}><FormField name="address" control={control} label="Street address" autoComplete="street-address" /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><FormField name="city" control={control} label="City" autoComplete="address-level2" /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><FormField name="postalCode" control={control} label="Postal code" autoComplete="postal-code" /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}><FormField name="phoneNo" control={control} label="Phone number" autoComplete="tel" /></Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <FormField name="country" control={control} label="Country" select>
                            {COUNTRY_NAMES.map((name) => <MenuItem key={name} value={name}>{name}</MenuItem>)}
                        </FormField>
                    </Grid>
                </Grid>
                <Button type="submit" variant="contained" size="large" fullWidth sx={{ mt: 3 }}>Continue</Button>
            </Paper>
        </Container>
    )
}
