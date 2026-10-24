import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
// Bootstrap CSS first, so MUI's styles (injected later) and index.css win any overlap.
import 'bootstrap/dist/css/bootstrap.min.css'
import 'react-toastify/dist/ReactToastify.css'
import './index.css'
import theme from './theme'
import store from './redux/store'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
    <Provider store={store}>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <App />
        </ThemeProvider>
    </Provider>
)
