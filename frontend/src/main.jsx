import { createRoot } from 'react-dom/client'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import theme from './theme'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
    </ThemeProvider>
)
