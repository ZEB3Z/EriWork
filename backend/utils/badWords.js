const { Filter } = require('bad-words');

// Masks profanity in user-written text, e.g. "damn router" -> "**** router".
const filter = new Filter();

const cleanText = (text) => {
    if (!text) return text;
    try {
        return filter.clean(text);
    } catch (err) {
        return text; // never block a review because of the filter itself
    }
};

module.exports = { cleanText };
