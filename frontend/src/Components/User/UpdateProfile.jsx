import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import api, { getErrorMessage } from '../../api'
import { getUser, updateStoredUser, readFileAsDataUrl, checkImageFile, avatarSrc } from '../../Utils/helpers'
import { profileSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'

export default function UpdateProfile() {
    const navigate = useNavigate()
    const user = getUser()
    const [avatar, setAvatar] = useState('') // new photo as data URI, if chosen

    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(profileSchema),
        defaultValues: { name: user.name, email: user.email }
    })

    const pickAvatar = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        const problem = checkImageFile(file)
        if (problem) return toast.error(problem)
        setAvatar(await readFileAsDataUrl(file))
    }

    const onSubmit = async (values) => {
        try {
            const { data } = await api.put('/me/update', { ...values, avatar })
            updateStoredUser(data.user)
            toast.success('Profile updated')
            navigate('/me')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Edit profile">
            <MetaData title="Edit profile" />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={avatar || avatarSrc(user)} sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>{user.name[0]}</Avatar>
                    <Button component="label" variant="outlined" size="small">
                        Change photo
                        <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAvatar} />
                    </Button>
                </Box>
                <FormField name="name" control={control} label="Full name" autoComplete="name" />
                <FormField name="email" control={control} label="Email" type="email" autoComplete="email" />
                <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save changes'}
                </Button>
                <Button onClick={() => navigate('/me')} color="inherit">Cancel</Button>
            </Stack>
        </AuthCard>
    )
}
