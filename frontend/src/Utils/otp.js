import api from '../api'

export const OTP_LENGTH = 6

// Ask the API to email a code to the logged-in user (purpose: 'checkout' | 'password').
export const sendActionOtp = async (purpose) => {
    const { data } = await api.post('/otp/send', { purpose })
    return data
}
