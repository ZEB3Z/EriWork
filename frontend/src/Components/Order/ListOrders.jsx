import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'
import Container from '@mui/material/Container'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import ReceiptLongOutlined from '@mui/icons-material/ReceiptLongOutlined'
import api, { getErrorMessage } from '../../api'
import MetaData from '../Layout/MetaData'
import PageHeader from '../Common/PageHeader'
import EmptyState from '../Common/EmptyState'
import StatusChip from '../Common/StatusChip'
import { formatMoney, formatDate, shortId } from '../../Utils/helpers'

export default function ListOrders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        api.get('/orders/me')
            .then(({ data }) => setOrders(data.orders))
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoading(false))
    }, [])

    const columns = [
        { field: '_id', headerName: 'Order', width: 130, valueFormatter: (value) => shortId(value) },
        { field: 'createdAt', headerName: 'Date', width: 140, type: 'date', valueGetter: (value) => new Date(value), valueFormatter: (value) => formatDate(value) },
        { field: 'items', headerName: 'Items', width: 90, type: 'number', valueGetter: (value, row) => row.orderItems.reduce((s, i) => s + i.quantity, 0) },
        { field: 'totalPrice', headerName: 'Total', width: 120, type: 'number', valueFormatter: (value) => formatMoney(value) },
        { field: 'orderStatus', headerName: 'Status', width: 140, renderCell: ({ value }) => <StatusChip status={value} /> },
        {
            field: 'actions', headerName: '', flex: 1, minWidth: 100, sortable: false, filterable: false, align: 'right',
            renderCell: ({ row }) => <Button component={Link} to={`/order/${row._id}`} size="small">View</Button>
        }
    ]

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <MetaData title="My orders" />
            <PageHeader title="My orders" subtitle="Track the status of your purchases." />
            {!loading && orders.length === 0 ? (
                <EmptyState icon={<ReceiptLongOutlined />} title="No orders yet" message="When you buy something, it will show up here."
                    action={<Button component={Link} to="/" variant="contained">Browse products</Button>} />
            ) : (
                <Paper variant="outlined">
                    <DataGrid
                        rows={orders}
                        columns={columns}
                        getRowId={(row) => row._id}
                        loading={loading}
                        autoHeight
                        disableRowSelectionOnClick
                        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                        pageSizeOptions={[10, 25]}
                        sx={{ border: 0 }}
                    />
                </Paper>
            )}
        </Container>
    )
}
