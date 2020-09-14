//monkey patched cheerio as the original one will encode unicode
//https://github.com/cheeriojs/cheerio/issues/866#issuecomment-482730997

const cheerio = require('cheerio');
const load = cheerio.load;

function decode(string) {
    return string.replace(/&#x([0-9a-f]{1,6});/ig, (entity, code) => {
        code = parseInt(code, 16);

        // Don't unescape ASCII characters, assuming they're encoded for a good reason
        if (code < 0x80) return entity;

        return String.fromCodePoint(code);
    });
}

function wrapHtml(fn) {
    return function() {
        const result = fn.apply(this, arguments);
        return typeof result === 'string' ? decode(result) : result;
    };
}

cheerio.load = function() {
    const instance = load.apply(this, arguments);

    instance.html = wrapHtml(instance.html);
    instance.prototype.html = wrapHtml(instance.prototype.html);

    return instance;
};

module.exports = cheerio;
