module.exports = {
    genRandom: (length) => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
    },
    stripHTML: (str) => {
        return str.replace(/<[^>]*>/g, '');
    },
    stripEmojis: (str) => {
        return str.replace(/([\uD800-\uDBFF][\uDC00-\uDFFF])/g, '');
    }
};