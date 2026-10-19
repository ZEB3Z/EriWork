import * as yup from 'yup'

// All form validation rules in one place (used with React Hook Form).

export const CATEGORIES = [
    'Routers', 'Mesh WiFi', 'Range Extenders', 'Access Points', 'Switches',
    'Network Adapters', 'Powerline', 'Cables', 'Accessories'
]

const email = yup.string().trim().required('Email is required').email('Enter a valid email address')
const newPassword = yup.string().required('Password is required').min(6, 'Password must be at least 6 characters')
const confirmPassword = yup.string()
    .required('Please confirm your password')
    .oneOf([yup.ref('password')], 'Passwords do not match')

export const loginSchema = yup.object({
    email,
    password: yup.string().required('Password is required')
})

export const registerSchema = yup.object({
    name: yup.string().trim().required('Name is required').max(30, 'Name cannot exceed 30 characters'),
    email,
    password: newPassword,
    confirmPassword
})

export const profileSchema = yup.object({
    name: yup.string().trim().required('Name is required').max(30, 'Name cannot exceed 30 characters'),
    email
})

export const changePasswordSchema = yup.object({
    oldPassword: yup.string().required('Enter your current password'),
    password: newPassword,
    confirmPassword
})

export const forgotPasswordSchema = yup.object({ email })

export const resetPasswordSchema = yup.object({ password: newPassword, confirmPassword })

export const productSchema = yup.object({
    name: yup.string().trim().required('Product name is required').max(100, 'Name cannot exceed 100 characters'),
    price: yup.number().typeError('Price must be a number').required('Price is required')
        .positive('Price must be greater than 0').max(100000, 'Price looks too high'),
    description: yup.string().trim().required('Description is required').min(10, 'Description should be at least 10 characters'),
    category: yup.string().required('Choose a category').oneOf(CATEGORIES, 'Choose a category'),
    seller: yup.string().trim().required('Seller is required'),
    stock: yup.number().typeError('Stock must be a number').required('Stock is required')
        .integer('Stock must be a whole number').min(0, 'Stock cannot be negative')
})

export const userSchema = yup.object({
    name: yup.string().trim().required('Name is required').max(30, 'Name cannot exceed 30 characters'),
    email,
    role: yup.string().oneOf(['user', 'admin'], 'Choose a role').required('Choose a role')
})

export const shippingSchema = yup.object({
    address: yup.string().trim().required('Address is required'),
    city: yup.string().trim().required('City is required'),
    postalCode: yup.string().trim().required('Postal code is required')
        .matches(/^[A-Za-z0-9 -]{3,10}$/, 'Enter a valid postal code'),
    phoneNo: yup.string().trim().required('Phone number is required')
        .matches(/^\+?[0-9 -]{7,15}$/, 'Enter a valid phone number'),
    country: yup.string().required('Country is required')
})

// Demo card form — the format is checked, but nothing is charged.
export const paymentSchema = yup.object({
    cardName: yup.string().trim().required('Name on card is required'),
    cardNumber: yup.string().required('Card number is required')
        .test('digits', 'Card number must be 16 digits', (v) => (v || '').replace(/\s/g, '').length === 16
            && /^\d+$/.test((v || '').replace(/\s/g, ''))),
    expiry: yup.string().required('Expiry is required')
        .matches(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Use MM/YY'),
    cvc: yup.string().required('CVC is required').matches(/^\d{3,4}$/, '3 or 4 digits')
})

export const reviewSchema = yup.object({
    rating: yup.number().typeError('Choose a star rating').required('Choose a star rating')
        .min(1, 'Choose a star rating').max(5),
    comment: yup.string().trim().required('Write a short comment')
        .min(5, 'Comment should be at least 5 characters').max(500, 'Keep it under 500 characters')
})
