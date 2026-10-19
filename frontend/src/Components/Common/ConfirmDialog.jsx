import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'

// "Are you sure?" dialog used before deleting things.
export default function ConfirmDialog({ open, title, message, confirmText = 'Delete', loading, onConfirm, onClose, children }) {
    return (
        <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>{title}</DialogTitle>
            <DialogContent>
                <DialogContentText>{message}</DialogContentText>
                {children}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onClose} disabled={loading} color="inherit">Cancel</Button>
                <Button onClick={onConfirm} disabled={loading} variant="contained" color="error">
                    {loading ? 'Working…' : confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    )
}
