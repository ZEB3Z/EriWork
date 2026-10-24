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
import { confirmDelete, escapeHtml } from '../../Utils/alerts'

const EMPTY_SELECTION = { type: 'include', ids: new Set() }

export default function ProductsList() {
    const navigate = useNavigate()
    const apiRef = useGridApiRef()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [selection, setSelection] = useState(EMPTY_SELECTION)

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

    // SweetAlert2 confirmation that lists the products by name before anything is removed.
    const askDelete = async (rows) => {
        const ids = rows.map((r) => r._id)
        const label = `${rows.length} product${rows.length === 1 ? '' : 's'}`
        const names = rows.slice(0, 5).map((r) => `<li>${escapeHtml(r.name)}</li>`).join('')
        const more = rows.length > 5 ? `<li>and ${rows.length - 5} more</li>` : ''
        const deleted = await confirmDelete({
            title: rows.length === 1 ? 'Delete product?' : 'Delete products?',
            html: `This permanently deletes ${label} and ${rows.length === 1 ? 'its' : 'their'} photos:<ul>${names}${more}</ul>`,
            confirmText: `Delete ${label}`,
            action: () => ids.length === 1
                ? api.delete(`/admin/product/${ids[0]}`)
                : api.post('/admin/products/bulk-delete', { ids })
        })
        if (deleted) {
            toast.success(`Deleted ${label}`)
            setSelection(EMPTY_SELECTION)
            loadProducts()
        }
    }

    const askBulkDelete = () => {
        // Ask the grid itself, so "select all" with a search filter only deletes the matching rows.
        const rows = Array.from(apiRef.current.getSelectedRows().values())
        if (rows.length) askDelete(rows)
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
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => askDelete([row])}><DeleteOutlined fontSize="small" /></IconButton></Tooltip>
                </>
            )
        }
    ]

    return (
        <>
            <MetaData title="Products" noIndex />
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

        </>
    )
}
