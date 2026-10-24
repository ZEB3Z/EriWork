// Every Redux action type in one place.

// Auth
export const AUTH_LOAD_REQUEST = 'AUTH_LOAD_REQUEST'
export const AUTH_LOAD_SUCCESS = 'AUTH_LOAD_SUCCESS'
export const AUTH_LOAD_FAIL = 'AUTH_LOAD_FAIL'
export const AUTH_LOGIN_SUCCESS = 'AUTH_LOGIN_SUCCESS'
export const AUTH_UPDATE_USER = 'AUTH_UPDATE_USER'
export const AUTH_LOGOUT = 'AUTH_LOGOUT'

// Cart + shipping address
export const CART_ADD_ITEM = 'CART_ADD_ITEM'
export const CART_UPDATE_QUANTITY = 'CART_UPDATE_QUANTITY'
export const CART_REMOVE_ITEM = 'CART_REMOVE_ITEM'
export const CART_CLEAR = 'CART_CLEAR'
export const CART_SAVE_SHIPPING = 'CART_SAVE_SHIPPING'

// Product list (home page) + filters
export const PRODUCTS_META_SUCCESS = 'PRODUCTS_META_SUCCESS'
export const PRODUCTS_SET_FILTERS = 'PRODUCTS_SET_FILTERS'
export const PRODUCTS_REQUEST = 'PRODUCTS_REQUEST'
export const PRODUCTS_SUCCESS = 'PRODUCTS_SUCCESS'
export const PRODUCTS_FAIL = 'PRODUCTS_FAIL'
