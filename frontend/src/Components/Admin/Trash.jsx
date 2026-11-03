import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Avatar from '@mui/material/Avatar'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import RestoreFromTrashOutlined from '@mui/icons-material/RestoreFromTrashOutlined'
import DeleteForeverOutlined from '@mui/icons-material/DeleteForeverOutlined'
import api, { getErrorMessage } from '../../api'
import { resolveImageUrl, formatMoney, formatDate, shortId, avatarSrc } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import PageHeader from '../Common/PageHeader'
import StatusChip from '../Common/StatusChip'
import { confirmDelete } from '../../Utils/alerts'

const EMPTY = { products: [], users: [], orders: [], reviews: [], counts: { products: 0, users: 0, orders: 0, reviews: 0 } }
const TABS = [
    { key: 'products', label: 'Products', singular: 'product' },
    { key: 'users', label: 'Users', singular: 'user' },
    { key: 'orders', label: 'Orders', singular: 'order' },
    { key: 'reviews', label: 'Reviews', singular: 'review' }
]

// Admin → Trash: everything an admin deleted. Restore brings it back; "Delete forever" removes it for good.
export default function Trash() {
    const [trash, setTrash] = useState(EMPTY)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('products')

    // Bump "refresh" to load the list again (e.g. after restoring).
    const [refresh, setRefresh] = useState(0)
    const loadTrash = () => setRefresh((n) => n + 1)

    useEffect(() => {
        api.get('/admin/trash')
            .then(({ data }) => setTrash(data))
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoading(false))
    }, [refresh])

    const restore = async (row, label) => {
        try {
            await api.put(`/admin/trash/${tab}/${row._id}/restore`)
            toast.success(`${label} restored`)
            loadTrash()
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    const deleteForever = async (row, label, text) => {
        const deleted = await confirmDelete({
            title: 'Delete forever?',
            text: `${text} This cannot be undone.`,
            confirmText: 'Delete forever',
            action: () => api.delete(`/admin/trash/${tab}/${row._id}`)
        })
        if (deleted) {
            toast.success(`${label} was deleted forever`)
            loadTrash()
        }
    }

    const deletedOn = { field: 'deletedAt', headerName: 'Deleted', width: 130, type: 'date', valueGetter: (value) => new Date(value), valueFormatter: (value) => formatDate(value) }

    // Restore + Delete forever buttons, shared by every table.
    // A review can't come back while its product is still in the Trash, so its button is disabled until then.
    const actions = (label, describe, blocked = () => '') => ({
        field: 'actions', headerName: 'Actions', width: 120, sortable: false, filterable: false,
        renderCell: ({ row }) => (
            <>
                <Tooltip title={blocked(row) || 'Restore'}>
                    <span><IconButton size="small" color="primary" disabled={Boolean(blocked(row))} onClick={() => restore(row, label)}><RestoreFromTrashOutlined fontSize="small" /></IconButton></span>
                </Tooltip>
                <Tooltip title="Delete forever"><IconButton size="small" color="error" onClick={() => deleteForever(row, label, describe(row))}><DeleteForeverOutlined fontSize="small" /></IconButton></Tooltip>
            </>
        )
    })

    const columnsByTab = {
        products: [
            {
                field: 'image', headerName: '', width: 64, sortable: false, filterable: false,
                renderCell: ({ row }) => (
                    <Box component="img" src={resolveImageUrl(row.images[0] && row.images[0].url)} alt=""
                        sx={{ width: 40, height: 40, borderRadius: 1.5, objectFit: 'cover', border: 1, borderColor: 'divider', verticalAlign: 'middle' }} />
                )
            },
            { field: 'name', headerName: 'Product', flex: 1, minWidth: 220 },
            { field: 'category', headerName: 'Category', width: 150 },
            { field: 'price', headerName: 'Price', width: 110, type: 'number', valueFormatter: (value) => formatMoney(value) },
            { field: 'stock', headerName: 'Stock', width: 90, type: 'number' },
            deletedOn,
            actions('Product', (r) => `"${r.name}" and its photos will be removed permanently.`)
        ],
        users: [
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
            deletedOn,
            actions('User', (r) => `${r.name} (${r.email}) will be removed permanently.`)
        ],
        orders: [
            { field: '_id', headerName: 'Order', width: 120, valueFormatter: (value) => shortId(value) },
            { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 160, valueGetter: (value, row) => (row.user ? row.user.name : 'Deleted user') },
            { field: 'createdAt', headerName: 'Placed', width: 130, type: 'date', valueGetter: (value) => new Date(value), valueFormatter: (value) => formatDate(value) },
            { field: 'totalPrice', headerName: 'Total', width: 110, type: 'number', valueFormatter: (value) => formatMoney(value) },
            { field: 'orderStatus', headerName: 'Status', width: 130, renderCell: ({ value }) => <StatusChip status={value} /> },
            deletedOn,
            actions('Order', (r) => `Order ${shortId(r._id)} will be removed permanently.`)
        ],
        reviews: [
            { field: 'productName', headerName: 'Product', flex: 1, minWidth: 200 },
            { field: 'name', headerName: 'Reviewer', width: 150 },
            { field: 'rating', headerName: 'Rating', width: 140, type: 'number', renderCell: ({ value }) => <Rating value={value} size="small" readOnly sx={{ verticalAlign: 'middle' }} /> },
            { field: 'comment', headerName: 'Comment', flex: 1.5, minWidth: 240 },
            deletedOn,
            actions('Review', (r) => `${r.name}'s review of "${r.productName}" will be removed permanently.`,
                (r) => (r.productDeleted ? 'Restore the product first' : ''))
        ]
    }

    const current = TABS.find((t) => t.key === tab)
    const total = Object.values(trash.counts).reduce((s, n) => s + n, 0)

    return (
        <>
            <MetaData title="Trash" noIndex />
            <PageHeader
                title="Trash"
                subtitle={`${total} deleted item${total === 1 ? '' : 's'} · restore them or delete them forever`}
                actions={<Button variant="outlined" onClick={loadTrash}>Refresh</Button>}
            />
            <Paper variant="outlined">
                <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}>
                    {TABS.map((t) => <Tab key={t.key} value={t.key} label={`${t.label} (${trash.counts[t.key]})`} />)}
                </Tabs>
                <DataGrid
                    rows={trash[tab]}
                    columns={columnsByTab[tab]}
                    getRowId={(row) => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                    showToolbar
                    autoHeight
                    rowHeight={tab === 'products' ? 60 : undefined}
                    getRowHeight={tab === 'reviews' ? () => 'auto' : undefined}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 25, 50]}
                    sx={{ border: 0, ...(tab === 'reviews' && { '& .MuiDataGrid-cell': { py: 1.5 } }) }}
                    localeText={{ noRowsLabel: `No deleted ${current.singular}s` }}
                />
            </Paper>
        </>
    )
}
