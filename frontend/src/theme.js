import { createTheme } from '@mui/material/styles'

// EriWork brand: deep navy + teal. All colours meet WCAG AA contrast for text.
const theme = createTheme({
    palette: {
        primary: { main: '#0f766e', dark: '#115e59', light: '#14b8a6', contrastText: '#ffffff' },
        secondary: { main: '#0f1b2d', contrastText: '#ffffff' },
        background: { default: '#f5f7fb', paper: '#ffffff' },
        text: { primary: '#1f2a37', secondary: '#5b6b7f' },
        divider: '#e3e8f0',
        success: { main: '#15803d' },
        warning: { main: '#b45309' },
        error: { main: '#dc2626' },
        info: { main: '#1d4ed8' }
    },
    shape: { borderRadius: 10 },
    typography: {
        fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
        h1: { fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em' },
        h2: { fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.01em' },
        h3: { fontSize: '1.3rem', fontWeight: 700 },
        h4: { fontSize: '1.15rem', fontWeight: 700 },
        h5: { fontSize: '1rem', fontWeight: 700 },
        h6: { fontSize: '0.95rem', fontWeight: 700 },
        button: { textTransform: 'none', fontWeight: 600 }
    },
    components: {
        MuiButton: {
            defaultProps: { disableElevation: true },
            styleOverrides: { root: { borderRadius: 8, paddingInline: 18 } }
        },
        MuiPaper: {
            defaultProps: { elevation: 0 },
            styleOverrides: { root: { backgroundImage: 'none' }, outlined: { borderColor: '#e3e8f0' } }
        },
        MuiCard: {
            defaultProps: { variant: 'outlined' },
            styleOverrides: { root: { borderColor: '#e3e8f0', borderRadius: 12 } }
        },
        MuiTextField: { defaultProps: { size: 'small' } },
        MuiChip: { styleOverrides: { root: { fontWeight: 600 } } }
    }
})

export default theme
