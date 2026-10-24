import { useState, useEffect, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams, useNavigate } from 'react-router-dom'
import Container from '@mui/material/Container'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import Skeleton from '@mui/material/Skeleton'
import CircularProgress from '@mui/material/CircularProgress'
import SearchOffRounded from '@mui/icons-material/SearchOffRounded'
import TuneRounded from '@mui/icons-material/TuneRounded'
import MetaData from './Layout/MetaData'
import ProductCard from './Product/ProductCard'
import FilterPanel from './Product/FilterPanel'
import EmptyState from './Common/EmptyState'
import { fetchProducts, fetchProductsMeta, setFilters as setFiltersAction } from '../redux/actions/productActions'
import { EMPTY_FILTERS } from '../redux/reducers/productReducer'

export default function Home() {
    const { keyword = '' } = useParams()
    const navigate = useNavigate()
    const dispatch = useDispatch()

    // Product list, filters and filter-panel data live in Redux (src/redux).
    const { meta, filters, requested, list } = useSelector((state) => state.products)
    const setFilters = (next) => dispatch(setFiltersAction(next))
    const [showFilters, setShowFilters] = useState(false) // phones only; always shown on desktop
    // The search + filters as one string. A new string means "start over at page 1".
    const queryKey = JSON.stringify({
        keyword,
        category: filters.category,
        minPrice: filters.price ? filters.price[0] : undefined,
        maxPrice: filters.price ? filters.price[1] : undefined,
        ratings: filters.ratings || undefined
    })

    // "requested" = the page we want; "list" = what has been loaded so far (both in Redux).
    const sentinelRef = useRef(null) // invisible box at the end of the grid

    // Still loading if the search/filters changed but page 1 hasn't been asked for yet,
    // or if the requested page hasn't arrived.
    const loading = requested.key !== queryKey || list.key !== requested.key || list.page !== requested.page

    // Price bounds + categories for the filter panel (loaded once).
    useEffect(() => { dispatch(fetchProductsMeta()) }, [dispatch])

    // New search/filters (or arriving on the page): load page 1. A late answer for
    // old filters is ignored by the reducer.
    useEffect(() => { dispatch(fetchProducts(queryKey, 1)) }, [dispatch, queryKey])

    // Infinite scroll: when the sentinel comes near the screen, request the next page.
    // The observer is re-created after every load, so it also fires when the
    // first page is too short to fill the screen.
    useEffect(() => {
        const el = sentinelRef.current
        if (!el || loading || !list.hasMore) return
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) dispatch(fetchProducts(list.key, list.page + 1))
        }, { rootMargin: '300px' })
        observer.observe(el)
        return () => observer.disconnect()
    }, [dispatch, loading, list.hasMore, list.key, list.page])

    // Only show products that belong to the current filters.
    const products = list.key === queryKey ? list.products : []
    const total = list.key === queryKey ? list.total : 0
    const hasMore = list.key === queryKey ? list.hasMore : true

    const filtersActive = filters.category || filters.price || filters.ratings || keyword
    const clearAll = () => {
        setFilters(EMPTY_FILTERS)
        if (keyword) navigate('/')
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <MetaData
                title={keyword ? `Search: ${keyword}` : 'Shop networking gear'}
                description="Shop WiFi 6 routers, mesh WiFi systems, range extenders, access points, switches, adapters and Ethernet cables at EriWork."
            />

            <Box sx={{ mb: 3 }}>
                <Typography variant="h1">{keyword ? `Results for “${keyword}”` : 'Networking gear'}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                    Routers, mesh WiFi, switches and cables for home and office.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 3 }}>
                    <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<TuneRounded />}
                        onClick={() => setShowFilters(!showFilters)}
                        sx={{ display: { xs: 'flex', md: 'none' }, mb: showFilters ? 2 : 0 }}
                    >
                        {showFilters ? 'Hide filters' : 'Filters'}
                    </Button>
                    <Box sx={{ display: { xs: showFilters ? 'block' : 'none', md: 'block' } }}>
                        {meta
                            ? <FilterPanel meta={meta} filters={filters} onChange={setFilters} onClear={clearAll} />
                            : <Skeleton variant="rounded" height={420} />}
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 9 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 2, minHeight: 32 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
                            {loading && products.length === 0 ? 'Loading…' : `${total} product${total === 1 ? '' : 's'}`}
                        </Typography>
                        {keyword && <Chip size="small" label={`Search: ${keyword}`} onDelete={() => navigate('/')} />}
                        {filters.category && <Chip size="small" label={filters.category} onDelete={() => setFilters({ ...filters, category: '' })} />}
                        {filters.price && <Chip size="small" label={`$${filters.price[0]} – $${filters.price[1]}`} onDelete={() => setFilters({ ...filters, price: null })} />}
                        {filters.ratings > 0 && <Chip size="small" label={`${filters.ratings}★ & up`} onDelete={() => setFilters({ ...filters, ratings: 0 })} />}
                    </Box>

                    {!loading && products.length === 0 ? (
                        <EmptyState
                            icon={<SearchOffRounded />}
                            title="No products match"
                            message="Try a different search or loosen the filters."
                            action={filtersActive && <Button variant="contained" onClick={clearAll}>Clear filters</Button>}
                        />
                    ) : (
                        <Grid container spacing={2}>
                            {products.map((p) => (
                                <Grid key={p._id} size={{ xs: 6, sm: 4, lg: 3 }}>
                                    <ProductCard product={p} />
                                </Grid>
                            ))}
                            {loading && products.length === 0 && Array.from({ length: 8 }).map((_, i) => (
                                <Grid key={`s${i}`} size={{ xs: 6, sm: 4, lg: 3 }}>
                                    <Skeleton variant="rounded" sx={{ aspectRatio: '3 / 4.3', height: 'auto' }} />
                                </Grid>
                            ))}
                        </Grid>
                    )}

                    <Box ref={sentinelRef} sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                        {loading && products.length > 0 && <CircularProgress size={28} />}
                        {!hasMore && products.length > 0 && (
                            <Typography variant="body2" color="text.secondary">You've seen all {total} products</Typography>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}
