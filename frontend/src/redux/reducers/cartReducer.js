import * as T from '../actionTypes'

// Restore the cart and shipping address after a page refresh.
const loadSaved = (key, fallback) => {
    try {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved) : fallback
    } catch {
        return fallback
    }
}

const initialState = {
    cartItems: loadSaved('cartItems', []),
    shippingInfo: loadSaved('shippingInfo', {})
}

export default function cartReducer(state = initialState, action) {
    switch (action.type) {
        // Add a product, or increase its quantity if it's already in the cart (never above stock).
        case T.CART_ADD_ITEM: {
            const { product, quantity } = action.payload
            const existing = state.cartItems.find((i) => i.product === product._id)
            if (existing) {
                return {
                    ...state,
                    cartItems: state.cartItems.map((i) => i.product === product._id
                        ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock), stock: product.stock, price: product.price }
                        : i)
                }
            }
            return {
                ...state,
                cartItems: [...state.cartItems, {
                    product: product._id,
                    name: product.name,
                    price: product.price,
                    image: product.images[0] ? product.images[0].url : '',
                    stock: product.stock,
                    quantity: Math.min(quantity, product.stock)
                }]
            }
        }
        case T.CART_UPDATE_QUANTITY:
            return {
                ...state,
                cartItems: state.cartItems.map((i) => (i.product === action.payload.id ? { ...i, quantity: action.payload.quantity } : i))
            }
        case T.CART_REMOVE_ITEM:
            return { ...state, cartItems: state.cartItems.filter((i) => i.product !== action.payload) }
        case T.CART_CLEAR:
            return { ...state, cartItems: [] }
        case T.CART_SAVE_SHIPPING:
            return { ...state, shippingInfo: action.payload }
        default:
            return state
    }
}
