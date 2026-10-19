import { useState } from 'react'
import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Slider from '@mui/material/Slider'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import { formatMoney } from '../../Utils/helpers'

// Left-hand filter panel: category, price range and minimum rating.
// filters = { category, price: [min, max] | null, ratings }
export default function FilterPanel({ meta, filters, onChange, onClear }) {
    const bounds = [meta.minPrice, meta.maxPrice]
    // While dragging we show the slider's live value; the search runs when you let go.
    // Otherwise the slider simply shows the active filter (or the full range).
    const [dragging, setDragging] = useState(null)
    const price = dragging || filters.price || bounds

    const section = (title) => (
        <Typography variant="h6" sx={{ mb: 1 }}>{title}</Typography>
    )

    return (
        <Paper variant="outlined" sx={{ p: 2.5, position: { md: 'sticky' }, top: { md: 96 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h4">Filters</Typography>
                <Button size="small" onClick={onClear}>Clear all</Button>
            </Box>

            {section('Category')}
            <List dense disablePadding sx={{ mb: 2 }}>
                {['', ...meta.categories].map((c) => (
                    <ListItemButton
                        key={c || 'all'}
                        selected={filters.category === c}
                        onClick={() => onChange({ ...filters, category: c })}
                        sx={{ borderRadius: 1.5, py: 0.4 }}
                    >
                        <ListItemText primary={c || 'All categories'} slotProps={{ primary: { fontSize: 14, fontWeight: filters.category === c ? 700 : 400 } }} />
                    </ListItemButton>
                ))}
            </List>

            <Divider sx={{ mb: 2 }} />
            {section('Price')}
            <Box sx={{ px: 1 }}>
                <Slider
                    value={price}
                    min={bounds[0]}
                    max={bounds[1]}
                    onChange={(e, value) => setDragging(value)}
                    onChangeCommitted={(e, value) => {
                        setDragging(null)
                        onChange({ ...filters, price: value })
                    }}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(v) => formatMoney(v)}
                    getAriaLabel={() => 'Price range'}
                    disableSwap
                />
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="body2" color="text.secondary">{formatMoney(price[0])}</Typography>
                <Typography variant="body2" color="text.secondary">{formatMoney(price[1])}</Typography>
            </Box>

            <Divider sx={{ mb: 2 }} />
            {section('Customer rating')}
            <List dense disablePadding>
                {[4, 3, 2, 1, 0].map((r) => (
                    <ListItemButton key={r} selected={filters.ratings === r} onClick={() => onChange({ ...filters, ratings: r })} sx={{ borderRadius: 1.5, gap: 1 }}>
                        {r === 0 ? (
                            <ListItemText primary="Any rating" slotProps={{ primary: { fontSize: 14 } }} />
                        ) : (
                            <>
                                <Rating value={r} readOnly size="small" />
                                <Typography variant="body2">& up</Typography>
                            </>
                        )}
                    </ListItemButton>
                ))}
            </List>
        </Paper>
    )
}
