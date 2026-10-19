import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import { toast } from 'react-toastify'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Rating from '@mui/material/Rating'
import Button from '@mui/material/Button'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import api, { getErrorMessage } from '../../api'
import { getUser } from '../../Utils/helpers'
import { reviewSchema } from '../../Utils/validation'
import FormField from '../Common/FormField'

// Lets a customer who bought the product write a review, or edit the one they wrote.
export default function ReviewForm({ productId, onSaved }) {
    const user = getUser()
    const [status, setStatus] = useState({ loading: Boolean(user), canReview: false, existing: null })

    const { control, handleSubmit, reset, formState: { isSubmitting } } = useForm({
        resolver: yupResolver(reviewSchema),
        defaultValues: { rating: 0, comment: '' }
    })

    useEffect(() => {
        if (!user) return
        api.get(`/review/eligibility/${productId}`)
            .then(({ data }) => {
                setStatus({ loading: false, canReview: data.canReview, existing: data.review })
                if (data.review) reset({ rating: data.review.rating, comment: data.review.comment })
            })
            .catch(() => setStatus({ loading: false, canReview: false, existing: null }))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId])

    const onSubmit = async (values) => {
        try {
            const { data } = await api.put('/review', { productId, ...values })
            toast.success(data.message)
            setStatus((s) => ({ ...s, existing: { ...values } }))
            onSaved()
        } catch (err) {
            toast.error(getErrorMessage(err))
        }
    }

    if (!user) {
        return <Alert severity="info"><Link to="/login">Log in</Link> to review products you've bought.</Alert>
    }
    if (status.loading) return null
    if (!status.canReview) {
        return <Alert severity="info">Only customers who bought this product can review it.</Alert>
    }

    return (
        <Paper variant="outlined" component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ p: 2.5 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>{status.existing ? 'Edit your review' : 'Write a review'}</Typography>
            <Controller
                name="rating"
                control={control}
                render={({ field, fieldState: { error } }) => (
                    <Box sx={{ mb: 2 }}>
                        <Rating
                            size="large"
                            value={Number(field.value) || 0}
                            onChange={(e, v) => field.onChange(v || 0)}
                            aria-label="Your rating"
                        />
                        {error && <Typography variant="caption" color="error" sx={{ display: 'block' }}>{error.message}</Typography>}
                    </Box>
                )}
            />
            <FormField name="comment" control={control} label="Your review" multiline minRows={3} placeholder="What did you like or dislike?" />
            <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 2 }}>
                {isSubmitting ? 'Saving…' : status.existing ? 'Update review' : 'Post review'}
            </Button>
        </Paper>
    )
}
