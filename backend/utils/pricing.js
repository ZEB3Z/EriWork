// One place for order pricing rules. The frontend shows the same formula,
// but the backend recalculates so totals can't be tampered with.
const TAX_RATE = 0.12;               // 12% VAT
const SHIPPING_FEE = 10;             // flat fee
const FREE_SHIPPING_THRESHOLD = 100; // free shipping on orders above this

const round2 = (n) => Math.round(n * 100) / 100;

function calculatePrices(items) {
    const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const shippingPrice = itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const taxPrice = round2(itemsPrice * TAX_RATE);
    const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
    return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}

const formatMoney = (n) =>
    '$' + Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

module.exports = { calculatePrices, formatMoney, TAX_RATE, SHIPPING_FEE, FREE_SHIPPING_THRESHOLD };
