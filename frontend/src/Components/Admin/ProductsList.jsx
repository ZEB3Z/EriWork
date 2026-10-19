import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { DataGrid, useGridApiRef } from '@mui/x-data-grid'
import Paper from '@mui/material/Paper'
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Chip from '@mui/material/Chip'
import Box from '@mui/material/Box'
import Rating from '@mui/material/Rating'
import AddRounded from '@mui/icons-material/AddRounded'
import EditOutlined from '@mui/icons-material/EditOutlined'
import DeleteOutlined from '@mui/icons-material/DeleteOutlined'
import api, { getErrorMessage } from '../../api'
import { resolveImageUrl, formatMoney } from '../../Utils/helpers'
import MetaData from '../Layout/MetaData'
import PageHeader from '../Common/PageHeader'
import ConfirmDialog from '../Common/ConfirmDialog'

const EMPTY_SELECTION = { type: 'include', ids: new Set() }

export default function ProductsList() {
    const navigate = useNavigate()
    const apiRef = useGridApiRef()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selection, setSelection] = useState(EMPTY_SELECTION)
    const [toDelete, setToDelete] = useState(null) // { ids: [...], label }
    const [deleting, setDeleting] = useState(false)

    // Bump "refresh" to load the list again (e.g. after deleting).
    const [refresh, setRefresh] = useState(0)
    const loadProducts = () => setRefresh((n) => n + 1)

    useEffect(() => {
        api.get('/admin/products')
            .then(({ data }) => {
                setProducts(data.products)
            })
            .catch((err) => toast.error(getErrorMessage(err)))
            .finally(() => setLoading(false))
    }, [refresh])

    // How many rows are ticked. Note: the header checkbox ticks every row that matches
    // the table's search/filter — including rows on other pages — so the delete dialog
    // lists the products by name before anything is removed.
    const selectedCount = selection.type === 'include' ? selection.ids.size : products.length - selection.ids.size

    const askBulkDelete = () => {
        // Ask the grid itself, so "select all" with a search filter only deletes the matching rows.
        const rows = Array.from(apiRef.current.getSelectedRows().values())
        if (rows.length) {
            setToDelete({
                ids: rows.map((r) => r._id),
                names: rows.map((r) => r.name),
                label: `${rows.length} product${rows.length === 1 ? '' : 's'}`
            })
        }
    }

    const confirmDelete = async () => {
        setDeleting(true)
        try {
            if (toDelete.ids.length === 1) {
                await api.delete(`/admin/product/${toDelete.ids[0]}`)
            } else {
                await api.post('/admin/products/bulk-delete', { ids: toDelete.ids })
            }
            toast.success(`Deleted ${toDelete.label}`)
            setSelection(EMPTY_SELECTION)
            setToDelete(null)
            loadProducts()
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
        setDeleting(false)
    }

    const columns = [
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
        {
            field: 'stock', headerName: 'Stock', width: 120, type: 'number',
            renderCell: ({ value }) => value === 0
                ? <Chip label="Out of stock" color="error" size="small" variant="outlined" />
                : value
        },
        { field: 'ratings', headerName: 'Rating', width: 140, type: 'number', renderCell: ({ value }) => <Rating value={value} precision={0.5} size="small" readOnly sx={{ verticalAlign: 'middle' }} /> },
        { field: 'images', headerName: 'Photos', width: 90, type: 'number', valueGetter: (value) => value.length },
        {
            field: 'actions', headerName: 'Actions', width: 110, sortable: false, filterable: false,
            renderCell: ({ row }) => (
                <>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => navigate(`/admin/product/${row._id}`)}><EditOutlined fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => setToDelete({ ids: [row._id], names: [row.name], label: '1 product' })}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
                </>
            )
        }
    ]

    return (
        <>
            <MetaData title="Products" />
            <PageHeader
                title="Products"
                subtitle={`${products.length} products in the catalog`}
                actions={
                    <>
                        <Button color="error" variant="outlined" startIcon={<DeleteOutlined />} disabled={selectedCount === 0} onClick={askBulkDelete}>
                            Delete selected{selectedCount ? ` (${selectedCount})` : ''}
                        </Button>
                        <Button component={Link} to="/admin/product/new" variant="contained" startIcon={<AddRounded />}>New product</Button>
                    </>
                }
            />
            <Paper variant="outlined">
                <DataGrid
                    apiRef={apiRef}
                    rows={products}
                    columns={columns}
                    getRowId={(row) => row._id}
                    loading={loading}
                    checkboxSelection
                    disableRowSelectionOnClick
                    rowSelectionModel={selection}
                    onRowSelectionModelChange={setSelection}
                    showToolbar
                    autoHeight
                    rowHeight={60}
                    initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                    pageSizeOptions={[10, 25, 50]}
                    sx={{ border: 0 }}
                />
            </Paper>

            <ConfirmDialog
                open={Boolean(toDelete)}
                title="Delete products?"
                message={toDelete ? `This permanently deletes ${toDelete.label} and their photos:` : ''}
                confirmText={toDelete ? `Delete ${toDelete.label}` : 'Delete'}
                loading={deleting}
                onConfirm={confirmDelete}
                onClose={() => setToDelete(null)}
            >
                {toDelete && (
                    <Box component="ul" sx={{ mt: 1.5, mb: 0, pl: 2.5, color: 'text.primary' }}>
                        {toDelete.names.slice(0, 5).map((n) => <li key={n}>{n}</li>)}
                        {toDelete.names.length > 5 && <li>and {toDelete.names.length - 5} more</li>}
                    </Box>
                )}
            </ConfirmDialog>
        </>
    )
}
