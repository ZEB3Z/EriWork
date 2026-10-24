import * as T from '../actionTypes'

export const EMPTY_FILTERS = { category: '', price: null, ratings: 0 }

// The home page list works like this:
//   requested = the page we asked for, for one search+filter combination ("key")
//   list      = what has actually been loaded so far
// A response is only accepted if it still matches `requested`, so a slow answer
// for old filters can never overwrite the results for the new ones.
const initialState = {
    meta: null,                // { categories, minPrice, maxPrice } for the filter panel
    filters: EMPTY_FILTERS,
    requested: { key: null, page: 0 },
    list: { key: null, page: 0, products: [], total: 0, hasMore: false }
}

const isCurrent = (state, action) =>
    action.payload.key === state.requested.key && action.payload.page === state.requested.page

export default function productReducer(state = initialState, action) {
    switch (action.type) {
        case T.PRODUCTS_META_SUCCESS:
            return { ...state, meta: action.payload }
        case T.PRODUCTS_SET_FILTERS:
            return { ...state, filters: action.payload }
        case T.PRODUCTS_REQUEST:
            return { ...state, requested: { key: action.payload.key, page: action.payload.page } }
        case T.PRODUCTS_SUCCESS: {
            if (!isCurrent(state, action)) return state
            const { key, page, products, total, hasMore } = action.payload
            return {
                ...state,
                list: {
                    key,
                    page,
                    products: page === 1 ? products : [...state.list.products, ...products],
                    total,
                    hasMore
                }
            }
        }
        case T.PRODUCTS_FAIL:
            if (!isCurrent(state, action)) return state
            return { ...state, list: { ...state.list, key: action.payload.key, page: action.payload.page, hasMore: false } }
        default:
            return state
    }
}
