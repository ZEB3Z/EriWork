import { Controller } from 'react-hook-form'
import TextField from '@mui/material/TextField'

// A MUI TextField connected to React Hook Form. Shows the Yup error message under the field.
// Usage: <FormField name="email" control={control} label="Email" />
export default function FormField({ name, control, helperText, ...props }) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field: { ref, value, ...field }, fieldState: { error } }) => (
                <TextField
                    {...field}
                    {...props}
                    value={value ?? ''}
                    inputRef={ref}
                    error={Boolean(error)}
                    helperText={error ? error.message : helperText}
                    fullWidth
                />
            )}
        />
    )
}
