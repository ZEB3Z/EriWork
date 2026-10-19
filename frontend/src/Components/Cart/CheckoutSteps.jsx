import Stepper from '@mui/material/Stepper'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'

// activeStep: 0 = Shipping, 1 = Confirm order, 2 = Payment
export default function CheckoutSteps({ activeStep }) {
    return (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
            {['Shipping', 'Confirm order', 'Payment'].map((label) => (
                <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
        </Stepper>
    )
}
