import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Avatar from '@mui/material/Avatar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import api from '../../api'
import { getUser, updateStoredUser, formatDate, avatarSrc } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'

export default function Profile() {
    const [user, setUser] = useState(getUser())

    // Refresh from the server so the page is never out of date.
    useEffect(() => {
        api.get('/me').then(({ data }) => {
            setUser(data.user)
            updateStoredUser(data.user)
        }).catch(() => {})
    }, [])

    return (
        <Container maxWidth="sm" sx={{ py: 5 }}>
            <MetaData title="My profile" />
            <Paper variant="outlined" sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
                <Avatar src={avatarSrc(user)} alt={user.name}
                    sx={{ width: 112, height: 112, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: 40 }}>
                    {user.name[0]}
                </Avatar>
                <Typography variant="h2">{user.name}</Typography>
                <Typography color="text.secondary">{user.email}</Typography>
                <Chip label={user.role === 'admin' ? 'Administrator' : 'Customer'} color={user.role === 'admin' ? 'primary' : 'default'} size="small" sx={{ mt: 1.5 }} />
                {user.createdAt && <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>Member since {formatDate(user.createdAt)}</Typography>}
                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button component={Link} to="/me/update" variant="contained">Edit profile</Button>
                    <Button component={Link} to="/password/update" variant="outlined">Change password</Button>
                    <Button component={Link} to="/orders/me" variant="outlined">My orders</Button>
                </Box>
            </Paper>
        </Container>
    )
}
