import { useState, useMemo } from 'react'
import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import LinearProgress from '@mui/material/LinearProgress'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import TextField from '@mui/material/TextField'
import MenuItem from '@mui/material/MenuItem'
import Avatar from '@mui/material/Avatar'
import ButtonBase from '@mui/material/ButtonBase'
import ReviewForm from './ReviewForm'
import { formatDate } from '../../Utils/helpers'

// Reviews block on the product page: summary, filters, list and the write/edit form.
export default function ReviewSection({ product, onReviewSaved }) {
    const [stars, setStars] = useState('all') // 'all' or 1..5
    const [sort, setSort] = useState('newest')

    const counts = [5, 4, 3, 2, 1].map((n) => ({ n, count: product.reviews.filter((r) => r.rating === n).length }))

    const visible = useMemo(() => {
        const list = stars === 'all' ? [...product.reviews] : product.reviews.filter((r) => r.rating === stars)
        if (sort === 'highest') list.sort((a, b) => b.rating - a.rating)
        else if (sort === 'lowest') list.sort((a, b) => a.rating - b.rating)
        else list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        return list
    }, [product.reviews, stars, sort])

    return (
        <Box component="section" sx={{ mt: 6 }}>
            <Typography variant="h2" sx={{ mb: 2 }}>Customer reviews</Typography>
            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper variant="outlined" sx={{ p: 2.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                            <Typography sx={{ fontSize: '2.5rem', fontWeight: 800, color: 'secondary.main' }}>
                                {product.ratings.toFixed(1)}
                            </Typography>
                            <Typography color="text.secondary">out of 5</Typography>
                        </Box>
                        <Rating value={product.ratings} precision={0.1} readOnly />
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {product.numOfReviews} review{product.numOfReviews === 1 ? '' : 's'}
                        </Typography>

                        {counts.map(({ n, count }) => (
                            <ButtonBase
                                key={n}
                                onClick={() => setStars(stars === n ? 'all' : n)}
                                aria-label={`Show ${n}-star reviews`}
                                sx={{ display: 'flex', width: '100%', alignItems: 'center', gap: 1.5, py: 0.5, px: 0.5, borderRadius: 1, bgcolor: stars === n ? 'action.selected' : 'transparent' }}
                            >
                                <Typography variant="body2" sx={{ width: 44, textAlign: 'left' }}>{n} star</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={product.numOfReviews ? (count / product.numOfReviews) * 100 : 0}
                                    sx={{ flex: 1, height: 8, borderRadius: 4 }}
                                />
                                <Typography variant="body2" color="text.secondary" sx={{ width: 20, textAlign: 'right' }}>{count}</Typography>
                            </ButtonBase>
                        ))}
                    </Paper>

                    <Box sx={{ mt: 2 }}>
                        <ReviewForm productId={product._id} onSaved={onReviewSaved} />
                    </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 8 }}>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'space-between', mb: 2 }}>
                        <ToggleButtonGroup
                            size="small"
                            exclusive
                            value={stars}
                            onChange={(e, v) => v !== null && setStars(v)}
                            aria-label="Filter reviews by rating"
                        >
                            <ToggleButton value="all">All</ToggleButton>
                            {[5, 4, 3, 2, 1].map((n) => <ToggleButton key={n} value={n}>{n}★</ToggleButton>)}
                        </ToggleButtonGroup>
                        <TextField select size="small" label="Sort by" value={sort} onChange={(e) => setSort(e.target.value)} sx={{ minWidth: 160 }}>
                            <MenuItem value="newest">Newest</MenuItem>
                            <MenuItem value="highest">Highest rating</MenuItem>
                            <MenuItem value="lowest">Lowest rating</MenuItem>
                        </TextField>
                    </Box>

                    {visible.length === 0 ? (
                        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
                            <Typography color="text.secondary">
                                {product.reviews.length === 0 ? 'No reviews yet.' : 'No reviews with this rating.'}
                            </Typography>
                        </Paper>
                    ) : (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                            {visible.map((r) => (
                                <Paper key={r._id} variant="outlined" sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 15 }}>{r.name[0]}</Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography sx={{ fontWeight: 600 }}>{r.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{formatDate(r.createdAt)}</Typography>
                                        </Box>
                                        <Rating value={r.rating} readOnly size="small" />
                                    </Box>
                                    <Typography sx={{ whiteSpace: 'pre-line' }}>{r.comment}</Typography>
                                </Paper>
                            ))}
                        </Box>
                    )}
                </Grid>
            </Grid>
        </Box>
    )
}
