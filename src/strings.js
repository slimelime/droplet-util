const _ = require('lodash');

function escapeStringForRegex(str) {
    const matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
    if (typeof str !== 'string') {
        throw new TypeError(`Expected a string, received ${typeof str}`);
    }

    return str.replace(matchOperatorsRe, '\\$&');
}

function tokenize(regex, str, tokenNames = []) {
    regex = regex instanceof RegExp ? regex : new RegExp(regex);
    const parts = regex.exec(str);
    if (!parts) return {};
    return parts.slice(1).reduce((acc, captureGroup, index) => {
        acc[tokenNames[index] || `$${index + 1}`] = captureGroup;
        return acc;
    }, {});
}

function lazyTemplateTag(strings, ...keys) {
    return (...values) => {
        const dict = values[values.length - 1] || {};
        const result = [strings[0]];
        keys.forEach((key, i) => {
            const value = Number.isInteger(key) ? values[key] : dict[key];
            result.push(value, strings[i + 1]);
        });
        return result.join('');
    };
}

function lazyTemplate(template) {
    const regex = /\${['"]?(.*?)['"]?}/g;
    let matches;
    const mapping = {};
    // exec returns a single match, to get all matches you have to loop
    while ((matches = regex.exec(template)) !== null) {
        mapping[matches[1]] = matches[0];
    }
    if (_.isEmpty(mapping)) throw new Error(`Template has no parameters matching ${regex.source}`);
    return (parameters) => {
        for (const key in parameters) {
            if (mapping[key]) {
                const keyRegex = new RegExp(escapeStringForRegex(mapping[key]), 'g');
                template = template.replace(keyRegex, parameters[key]);
            }
        }
        return template;
    };
}

module.exports = {
    escapeStringForRegex,
    tokenize,
    lazyTemplateTag,
    lazyTemplate
};

/**
 * how to identify the firehose payload without extension -> test with regex if no extension is there
 * should we include the name parts inside event.arguments, yes
 */
