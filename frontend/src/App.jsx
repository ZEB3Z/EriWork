import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'

import Header from './Components/Layout/Header'
import Footer from './Components/Layout/Footer'
import ProtectedRoute from './Components/Route/ProtectedRoute'

import Home from './Components/Home'
import ProductDetails from './Components/Product/ProductDetails'
import Cart from './Components/Cart/Cart'
import Shipping from './Components/Cart/Shipping'
import ConfirmOrder from './Components/Cart/ConfirmOrder'
import Payment from './Components/Cart/Payment'
import OrderSuccess from './Components/Cart/OrderSuccess'
import ListOrders from './Components/Order/ListOrders'
import OrderDetails from './Components/Order/OrderDetails'

import Login from './Components/User/Login'
import Register from './Components/User/Register'
import Profile from './Components/User/Profile'
import UpdateProfile from './Components/User/UpdateProfile'
import UpdatePassword from './Components/User/UpdatePassword'
import ForgotPassword from './Components/User/ForgotPassword'
import NewPassword from './Components/User/NewPassword'

import AdminLayout from './Components/Admin/AdminLayout'
import Dashboard from './Components/Admin/Dashboard'
import ProductsList from './Components/Admin/ProductsList'
import ProductForm from './Components/Admin/ProductForm'
import OrdersList from './Components/Admin/OrdersList'
import ProcessOrder from './Components/Admin/ProcessOrder'
import UsersList from './Components/Admin/UsersList'
import UpdateUser from './Components/Admin/UpdateUser'
import ProductReviews from './Components/Admin/ProductReviews'

const loadSaved = (key, fallback) => {
    try {
        const saved = localStorage.getItem(key)
        return saved ? JSON.parse(saved) : fallback
    } catch {
        return fallback
    }
}

export default function App() {
    const [cartItems, setCartItems] = useState(() => loadSaved('cartItems', []))
    const [shippingInfo, setShippingInfo] = useState(() => loadSaved('shippingInfo', {}))

    // Keep the cart and shipping address after a page refresh.
    useEffect(() => { localStorage.setItem('cartItems', JSON.stringify(cartItems)) }, [cartItems])
    useEffect(() => { localStorage.setItem('shippingInfo', JSON.stringify(shippingInfo)) }, [shippingInfo])

    // Add a product, or increase its quantity if it's already in the cart (never above stock).
    const addItemToCart = (product, quantity) => {
        setCartItems((items) => {
            const existing = items.find((i) => i.product === product._id)
            if (existing) {
                return items.map((i) => i.product === product._id
                    ? { ...i, quantity: Math.min(i.quantity + quantity, product.stock), stock: product.stock, price: product.price }
                    : i)
            }
            return [...items, {
                product: product._id,
                name: product.name,
                price: product.price,
                image: product.images[0] ? product.images[0].url : '',
                stock: product.stock,
                quantity: Math.min(quantity, product.stock)
            }]
        })
    }
    const updateQuantity = (id, quantity) =>
        setCartItems((items) => items.map((i) => (i.product === id ? { ...i, quantity } : i)))
    const removeItem = (id) => setCartItems((items) => items.filter((i) => i.product !== id))
    const clearCart = () => setCartItems([])

    const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0)
    const signedIn = (page) => <ProtectedRoute>{page}</ProtectedRoute>

    return (
        <BrowserRouter>
            <Header cartCount={cartCount} />
            <main style={{ flex: 1 }}>
                <Routes>
                    {/* Shop */}
                    <Route path="/" element={<Home />} />
                    <Route path="/search/:keyword" element={<Home />} />
                    <Route path="/product/:id" element={<ProductDetails addItemToCart={addItemToCart} />} />
                    <Route path="/cart" element={<Cart cartItems={cartItems} updateQuantity={updateQuantity} removeItem={removeItem} />} />

                    {/* Checkout */}
                    <Route path="/shipping" element={signedIn(<Shipping cartItems={cartItems} shippingInfo={shippingInfo} saveShippingInfo={setShippingInfo} />)} />
                    <Route path="/confirm" element={signedIn(<ConfirmOrder cartItems={cartItems} shippingInfo={shippingInfo} />)} />
                    <Route path="/payment" element={signedIn(<Payment cartItems={cartItems} shippingInfo={shippingInfo} clearCart={clearCart} />)} />
                    <Route path="/success" element={signedIn(<OrderSuccess />)} />
                    <Route path="/orders/me" element={signedIn(<ListOrders />)} />
                    <Route path="/order/:id" element={signedIn(<OrderDetails />)} />

                    {/* Account */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/password/forgot" element={<ForgotPassword />} />
                    <Route path="/password/reset/:token" element={<NewPassword />} />
                    <Route path="/me" element={signedIn(<Profile />)} />
                    <Route path="/me/update" element={signedIn(<UpdateProfile />)} />
                    <Route path="/password/update" element={signedIn(<UpdatePassword />)} />

                    {/* Admin */}
                    <Route path="/admin" element={<ProtectedRoute isAdmin><AdminLayout /></ProtectedRoute>}>
                        <Route index element={<Dashboard />} />
                        <Route path="products" element={<ProductsList />} />
                        <Route path="product/new" element={<ProductForm />} />
                        <Route path="product/:id" element={<ProductForm />} />
                        <Route path="orders" element={<OrdersList />} />
                        <Route path="order/:id" element={<ProcessOrder />} />
                        <Route path="users" element={<UsersList />} />
                        <Route path="user/:id" element={<UpdateUser />} />
                        <Route path="reviews" element={<ProductReviews />} />
                    </Route>
                    <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <Footer />
            <ToastContainer position="bottom-right" autoClose={3500} theme="colored" />
        </BrowserRouter>
    )
}
