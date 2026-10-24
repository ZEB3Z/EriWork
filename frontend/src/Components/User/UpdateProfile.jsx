import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Button from '@mui/material/Button'
import Stack from '@mui/material/Stack'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import { getErrorMessage } from '../../api'
import { checkImageFile, avatarSrc, toUpload, releaseUpload } from '../../Utils/helpers'
import { updateProfile } from '../../redux/actions/authActions'
import { profileSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'
import MetaData from '../Layout/MetaData'
import AuthCard from './AuthCard'

export default function UpdateProfile() {
    const navigate = useNavigate()
    const dispatch = useDispatch()
    const user = useSelector((state) => state.auth.user)
    const [avatar, setAvatar] = useState(null) // { file, preview } for a newly picked photo

    // Free the preview URL when it's replaced or the page closes.
    useEffect(() => () => releaseUpload(avatar), [avatar])

    const { control, handleSubmit, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(profileSchema),
        defaultValues: { name: user.name, email: user.email }
    })

    const pickAvatar = (e) => {
        const file = e.target.files[0]
        e.target.value = ''
        if (!file) return
        const problem = checkImageFile(file)
        if (problem) return toast.error(problem)
        setAvatar(toUpload(file))
    }

    const onSubmit = async (values) => {
        try {
            // multipart/form-data: a new photo goes to Multer on the API, then to Cloudinary.
            const form = new FormData()
            form.append('name', values.name)
            form.append('email', values.email)
            if (avatar) form.append('avatar', avatar.file)
            await dispatch(updateProfile(form))
            toast.success('Profile updated')
            navigate('/me')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    return (
        <AuthCard title="Edit profile">
            <MetaData title="Edit profile" noIndex />
            <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={avatar ? avatar.preview : avatarSrc(user)} sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}>{user.name[0]}</Avatar>
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
