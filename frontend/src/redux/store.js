// Redux store — classic Redux 5 setup with redux-thunk for async actions.
// (legacy_createStore is Redux 5's name for the original createStore; it's the
// same function, just without the "use Redux Toolkit" deprecation notice.)
import { legacy_createStore as createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { thunk } from 'redux-thunk'
import authReducer from './reducers/authReducer'
import cartReducer from './reducers/cartReducer'
import productReducer from './reducers/productReducer'

const rootReducer = combineReducers({
    auth: authReducer,       // current user + session check
    cart: cartReducer,       // cart items + shipping address
    products: productReducer // home page list, filters and filter-panel data
})

// Use the Redux DevTools browser extension if it's installed.
const composeEnhancers = (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || compose

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(thunk)))

// Keep the cart and shipping address after a page refresh (same as before Redux).
let lastCart = store.getState().cart
store.subscribe(() => {
    const { cart } = store.getState()
    if (cart === lastCart) return
    if (cart.cartItems !== lastCart.cartItems) localStorage.setItem('cartItems', JSON.stringify(cart.cartItems))
    if (cart.shippingInfo !== lastCart.shippingInfo) localStorage.setItem('shippingInfo', JSON.stringify(cart.shippingInfo))
    lastCart = cart
})

export default store
