import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'
import Paper from '@mui/material/Paper'
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import api, { getErrorMessage } from '../../api'
import { formatMoney, formatDate, shortId } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import PageHeader from '../Common/PageHeader'
import StatusChip from '../Common/StatusChip'
import ConfirmDialog from '../Common/ConfirmDialog'

const TABS = ['All', 'Processing', 'Shipped', 'Delivered', 'Cancelled']

export default function OrdersList() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [totalAmount, setTotalAmount] = useState(0)
    const [loading, setLoading] = useState(true)
    const [tab, setTab] = useState('All')
    const [toDelete, setToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    // Bump "refresh" to load the list again (e.g. after deleting).
    const [refresh, setRefresh] = useState(0)
    const loadOrders = () => setRefresh((n) => n + 1)

    useEffect(() => {
        api.get('/admin/orders')
            .then(({ data }) => {
                setOrders(data.orders)
                setTotalAmount(data.totalAmount)
            })
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoading(false))
    }, [refresh])

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await api.delete(`/admin/order/${toDelete._id}`)
            toast.success('Order deleted')
            setToDelete(null)
            loadOrders()
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
        setDeleting(false)
    }

    const count = (status) => (status === 'All' ? orders.length : orders.filter((o) => o.orderStatus === status).length)
    const rows = tab === 'All' ? orders : orders.filter((o) => o.orderStatus === tab)

    const columns = [
        { field: '_id', headerName: 'Order', width: 120, valueFormatter: (value) => shortId(value) },
        { field: 'customer', headerName: 'Customer', flex: 1, minWidth: 160, valueGetter: (value, row) => (row.user ? row.user.name : 'Deleted user') },
        { field: 'createdAt', headerName: 'Date', width: 130, type: 'date', valueGetter: (value) => new Date(value), valueFormatter: (value) => formatDate(value) },
        { field: 'items', headerName: 'Items', width: 80, type: 'number', valueGetter: (value, row) => row.orderItems.reduce((s, i) => s + i.quantity, 0) },
        { field: 'totalPrice', headerName: 'Total', width: 110, type: 'number', valueFormatter: (value) => formatMoney(value) },
        { field: 'orderStatus', headerName: 'Status', width: 130, renderCell: ({ value }) => <StatusChip status={value} /> },
        {
            field: 'actions', headerName: 'Actions', width: 150, sortable: false, filterable: false,
            renderCell: ({ row }) => (
                <>
                    <Button size="small" onClick={() => navigate(`/admin/order/${row._id}`)}>Manage</Button>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setToDelete(row)}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
                </>
            )
        }
    ]

    return (
        <>
            <MetaData title="Orders" />
            <PageHeader title="Orders" subtitle={`${orders.length} orders · ${formatMoney(totalAmount)} in sales (excluding cancelled)`} />
            <Paper variant="outlined">
                <Tabs value={tab} onChange={(e, v) => setTab(v)} variant="scrollable" sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}>
                    {TABS.map((t) => <Tab key={t} value={t} label={`${t} (${count(t)})`} />)}
                </Tabs>
                <DataGrid
                    rows={rows}
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
            <ConfirmDialog
                open={Boolean(toDelete)}
                title="Delete order?"
                message={toDelete ? `Order ${shortId(toDelete._id)} will be removed permanently.` : ''}
                loading={deleting}
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </>
    )
}
