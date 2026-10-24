import { toast } from 'react-toastify'
import * as T from '../actionTypes'
import api, { getErrorMessage } from '../../api'

export const PAGE_SIZE = 8

// Price bounds + categories for the filter panel (loaded once).
export const fetchProductsMeta = () => async (dispatch, getState) => {
    if (getState().products.meta) return
    try {
        const { data } = await api.get('/products/meta')
        dispatch({ type: T.PRODUCTS_META_SUCCESS, payload: data })
    } catch (err) {
        toast.error(getErrorMessage(err))
    }
}

export const setFilters = (filters) => ({ type: T.PRODUCTS_SET_FILTERS, payload: filters })

// key = JSON string of { keyword, category, minPrice, maxPrice, ratings }.
// Page 1 starts a fresh list; later pages are appended (infinite scroll).
export const fetchProducts = (key, page) => async (dispatch, getState) => {
    dispatch({ type: T.PRODUCTS_REQUEST, payload: { key, page } })
    const stillWanted = () => {
        const { requested } = getState().products
        return requested.key === key && requested.page === page
    }
    try {
        const { data } = await api.get('/products', { params: { ...JSON.parse(key), page, limit: PAGE_SIZE } })
        dispatch({ type: T.PRODUCTS_SUCCESS, payload: { key, page, products: data.products, total: data.total, hasMore: data.hasMore } })
    } catch (err) {
        if (stillWanted()) toast.error(getErrorMessage(err)) // ignore errors for filters the user already left
        dispatch({ type: T.PRODUCTS_FAIL, payload: { key, page } })
    }
}
