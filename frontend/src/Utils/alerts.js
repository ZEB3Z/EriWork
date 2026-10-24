import Swal from 'sweetalert2'
import theme from '../theme'
import { getErrorMessage } from '../api'

// Escape text before putting it into SweetAlert2's html option.
export const escapeHtml = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// "Are you sure?" dialog used before deleting things.
// `action` runs inside the dialog (with a spinner on the button). If it fails,
// the error is shown in the dialog so the admin can retry or cancel.
// Resolves to true if the action succeeded, false if cancelled.
export async function confirmDelete({ title, text, html, confirmText = 'Delete', action }) {
    const result = await Swal.fire({
        title,
        text,
        html,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: confirmText,
        cancelButtonText: 'Cancel',
        confirmButtonColor: theme.palette.error.main,
        cancelButtonColor: theme.palette.text.secondary,
        reverseButtons: true,
        focusCancel: true,
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async () => {
            try {
                await action()
                return true
            } catch (err) {
                Swal.showValidationMessage(getErrorMessage(err))
                return false
            }
        }
    })
    return Boolean(result.isConfirmed)
}
