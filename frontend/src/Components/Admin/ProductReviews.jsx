import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { DataGrid } from '@mui/x-data-grid'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import api, { getErrorMessage } from '../../api'
import { formatDate } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import PageHeader from '../Common/PageHeader'
import ConfirmDialog from '../Common/ConfirmDialog'

export default function ProductReviews() {
    const [reviews, setReviews] = useState([])
    const [loading, setLoading] = useState(true)
    const [product, setProduct] = useState('all')
    const [stars, setStars] = useState('all')
    const [search, setSearch] = useState('')
    const [toDelete, setToDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    // Bump "refresh" to load the list again (e.g. after deleting).
    const [refresh, setRefresh] = useState(0)
    const loadReviews = () => setRefresh((n) => n + 1)

    useEffect(() => {
        api.get('/admin/reviews')
            .then(({ data }) => {
                setReviews(data.reviews)
            })
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoading(false))
    }, [refresh])

    const productNames = useMemo(() => [...new Set(reviews.map((r) => r.productName))].sort(), [reviews])

    // Review filters: product, star rating and text search.
    const rows = reviews.filter((r) =>
        (product === 'all' || r.productName === product) &&
        (stars === 'all' || r.rating === stars) &&
        (!search || `${r.name} ${r.comment}`.toLowerCase().includes(search.toLowerCase()))
    )

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            await api.delete('/admin/reviews', { params: { productId: toDelete.productId, id: toDelete._id } })
            toast.success('Review deleted')
            setToDelete(null)
            loadReviews()
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
        setDeleting(false)
    }

    const columns = [
        { field: 'productName', headerName: 'Product', flex: 1, minWidth: 200 },
        { field: 'name', headerName: 'Reviewer', width: 150 },
        { field: 'rating', headerName: 'Rating', width: 140, type: 'number', renderCell: ({ value }) => <Rating value={value} size="small" readOnly sx={{ verticalAlign: 'middle' }} /> },
        { field: 'comment', headerName: 'Comment', flex: 1.5, minWidth: 240 },
        { field: 'createdAt', headerName: 'Date', width: 120, type: 'date', valueGetter: (value) => new Date(value), valueFormatter: (value) => formatDate(value) },
        {
            field: 'actions', headerName: '', width: 70, sortable: false, filterable: false,
            renderCell: ({ row }) => <Tooltip title="Delete review"><IconButton size="small" color="error" onClick={() => setToDelete(row)}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
        }
    ]

    const filtered = product !== 'all' || stars !== 'all' || search

    return (
        <>
            <MetaData title="Reviews" />
            <PageHeader title="Reviews" subtitle={`${reviews.length} reviews across all products`} />
            <Paper variant="outlined" sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center' }}>
                <TextField select label="Product" value={product} onChange={(e) => setProduct(e.target.value)} sx={{ minWidth: 240 }}>
                    <MenuItem value="all">All products</MenuItem>
                    {productNames.map((n) => <MenuItem key={n} value={n}>{n}</MenuItem>)}
                </TextField>
                <ToggleButtonGroup size="small" exclusive value={stars} onChange={(e, v) => v !== null && setStars(v)} aria-label="Filter by rating">
                    <ToggleButton value="all">All</ToggleButton>
                    {[5, 4, 3, 2, 1].map((n) => <ToggleButton key={n} value={n}>{n}★</ToggleButton>)}
                </ToggleButtonGroup>
                <TextField label="Search reviewer or comment" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ flex: 1, minWidth: 200 }} />
                {filtered && <Button onClick={() => { setProduct('all'); setStars('all'); setSearch('') }}>Clear</Button>}
            </Paper>
            <Paper variant="outlined">
                <DataGrid
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    disableRowSelectionOnClick
                    autoHeight
                    getRowHeight={() => 'auto'}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 25, 50]}
                    sx={{ border: 0, '& .MuiDataGrid-cell': { py: 1.5 } }}
                    localeText={{ noRowsLabel: filtered ? 'No reviews match these filters' : 'No reviews yet' }}
                />
            </Paper>
            <Box sx={{ height: 8 }} />
            <ConfirmDialog
                open={Boolean(toDelete)}
                title="Delete review?"
                message={toDelete ? `Remove ${toDelete.name}'s ${toDelete.rating}-star review of "${toDelete.productName}"? The product rating will be recalculated.` : ''}
                loading={deleting}
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            />
        </>
    )
}
