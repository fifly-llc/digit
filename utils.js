const sanitizeHtml = require("sanitize-html");

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const charactersLength = characters.length;

module.exports = {
    genRandom: (length) => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    stripHTML: (str) => {
        return sanitizeHtml(str, {
            allowedTags: [
                'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                'blockquote', 'p', 'a', 'ul', 'ol', 'nl', 'li', 'b', 'i', 'strong', 'em', 'strike',
            ],
            allowedAttributes: {}
        });
    },
    stripEmojis: (str) => {
        return str.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, '');
    }
};