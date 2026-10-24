import * as T from '../actionTypes'

export const addItemToCart = (product, quantity) => ({ type: T.CART_ADD_ITEM, payload: { product, quantity } })
export const updateQuantity = (id, quantity) => ({ type: T.CART_UPDATE_QUANTITY, payload: { id, quantity } })
export const removeItem = (id) => ({ type: T.CART_REMOVE_ITEM, payload: id })
export const clearCart = () => ({ type: T.CART_CLEAR })
export const saveShippingInfo = (info) => ({ type: T.CART_SAVE_SHIPPING, payload: info })
