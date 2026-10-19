import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Paper from '@mui/material/Paper'
import Stack from '@mui/material/Stack'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import Box from '@mui/material/Box'
import api, { getErrorMessage } from '../../api'
import { getUser } from '../../Utils/helpers'
import { userSchema } from '../../Utils/validation'
import MetaData from '../Layout/MetaData'
import Loader from '../Layout/Loader'
import PageHeader from '../Common/PageHeader'
import FormField from '../Common/FormField'

export default function UpdateUser() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isMe = getUser()._id === id
    const [loading, setLoading] = useState(true)

    const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(userSchema),
        defaultValues: { name: '', email: '', role: 'user' }
    })

    useEffect(() => {
        api.get(`/admin/user/${id}`)
            .then(({ data }) => reset({ name: data.user.name, email: data.user.email, role: data.user.role }))
            .catch((err) => { toast.error(getErrorMessage(err)); navigate('/admin/users') })
            .finally(() => setLoading(false))
    }, [id, reset, navigate])

    const onSubmit = async (values) => {
        try {
            await api.put(`/admin/user/${id}`, values)
            toast.success('User updated')
            navigate('/admin/users')
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    if (loading) return <Loader />

    return (
        <>
            <MetaData title="Edit user" />
            <PageHeader title="Edit user" />
            <Paper variant="outlined" sx={{ p: 3, maxWidth: 520 }}>
                <Stack component="form" spacing={2} onSubmit={handleSubmit(onSubmit)} noValidate>
                    <FormField name="name" control={control} label="Name" />
                    <FormField name="email" control={control} label="Email" type="email" />
                    <FormField name="role" control={control} label="Role" select disabled={isMe}
                        helperText={isMe ? "You can't change your own role" : 'Admins can manage the store'}>
                        <MenuItem value="user">Customer</MenuItem>
                        <MenuItem value="admin">Admin</MenuItem>
                    </FormField>
                    <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
                        <Button component={Link} to="/admin/users" color="inherit">Cancel</Button>
                        <Button type="submit" variant="contained" disabled={isSubmitting}>{isSubmitting ? 'Saving…' : 'Save changes'}</Button>
                    </Box>
                </Stack>
            </Paper>
        </>
    )
}
