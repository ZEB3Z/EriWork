import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'
import Paper from '@mui/material/Paper'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import api, { getErrorMessage } from '../../api'
import { formatDate, avatarSrc } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import PageHeader from '../Common/PageHeader'
import { confirmDelete } from '../../Utils/alerts'

export default function UsersList() {
    const navigate = useNavigate()
    const me = useSelector((state) => state.auth.user)
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)

    // Bump "refresh" to load the list again (e.g. after deleting).
    const [refresh, setRefresh] = useState(0)
    const loadUsers = () => setRefresh((n) => n + 1)

    useEffect(() => {
        api.get('/admin/users')
            .then(({ data }) => {
                setUsers(data.users)
            })
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoading(false))
    }, [refresh])

    const askDelete = async (user) => {
        const deleted = await confirmDelete({
            title: 'Delete user?',
            text: `${user.name} (${user.email}) will lose access permanently.`,
            action: () => api.delete(`/admin/user/${user._id}`)
        })
        if (deleted) {
            toast.success(`${user.name} was deleted`)
            loadUsers()
        }
    }

    const columns = [
        {
            field: 'name', headerName: 'Name', flex: 1, minWidth: 200,
            renderCell: ({ row }) => (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, height: '100%' }}>
                    <Avatar src={avatarSrc(row)} sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: 14 }}>{row.name[0]}</Avatar>
                    {row.name}
                </Box>
            )
        },
        { field: 'email', headerName: 'Email', flex: 1, minWidth: 220 },
        { field: 'role', headerName: 'Role', width: 120, renderCell: ({ value }) => <Chip label={value === 'admin' ? 'Admin' : 'Customer'} size="small" color={value === 'admin' ? 'primary' : 'default'} variant="outlined" /> },
        { field: 'createdAt', headerName: 'Joined', width: 130, type: 'date', valueGetter: (value) => new Date(value), valueFormatter: (value) => formatDate(value) },
        {
            field: 'actions', headerName: 'Actions', width: 110, sortable: false, filterable: false,
            renderCell: ({ row }) => {
                const isMe = row._id === me._id
                return (
                    <>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/admin/user/${row._id}`)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                        <Tooltip title={isMe ? "You can't delete yourself" : 'Delete'}>
                            <span><IconButton size="small" color="error" disabled={isMe} onClick={() => askDelete(row)}><DeleteOutlined fontSize="small" /></IconButton></span>
                        </Tooltip>
                    </>
                )
            }
        }
    ]

    return (
        <>
            <MetaData title="Users" noIndex />
            <PageHeader title="Users" subtitle={`${users.length} registered accounts`} />
            <Paper variant="outlined">
                <DataGrid
                    rows={users}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                    showToolbar
                    autoHeight
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 25, 50]}
                    sx={{ border: 0 }}
                />
            </Paper>
        </>
    )
}
