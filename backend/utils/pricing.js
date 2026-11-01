// One place for order pricing rules. The frontend shows the same formula,
// but the backend recalculates so totals can't be tampered with.
// All amounts are in Philippine pesos (PHP). The original catalogue was priced
// in USD, converted at USD_TO_PHP = 60 (1 USD = 60 PHP).
const USD_TO_PHP = 60;
const TAX_RATE = 0.12;                           // 12% VAT
const SHIPPING_FEE = 10 * USD_TO_PHP;            // ₱600 flat fee
const FREE_SHIPPING_THRESHOLD = 100 * USD_TO_PHP; // free shipping on orders above ₱6,000

const round2 = (n) => Math.round(n * 100) / 100;

function calculatePrices(items) {
    const itemsPrice = round2(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
    const shippingPrice = itemsPrice > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
    const taxPrice = round2(itemsPrice * TAX_RATE);
    const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);
    return { itemsPrice, shippingPrice, taxPrice, totalPrice };
}

// "₱5,399.40" — used by emails. The PDF prints the peso sign with its own embedded font.
const formatMoney = (n) =>
    '₱' + Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

module.exports = { calculatePrices, formatMoney, USD_TO_PHP, TAX_RATE, SHIPPING_FEE, FREE_SHIPPING_THRESHOLD };
