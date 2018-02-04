const repl = require('repl');
const babel = require('babel-core');

function preprocess(input) {
    const awaitMatcher = /^(?:\s*(?:(?:let|var|const)\s)?\s*([^=]+)=\s*|^\s*)(await\s[\s\S]*)/;
    const asyncWrapper = (code, binder) => {
        let assign = binder ? `global.${binder} = ` : '';
        return `(function(){ async function _wrap() { return ${assign}${code} } return _wrap();})()`;
    };

    // match & transform
    const match = input.match(awaitMatcher);
    if (match) {
        input = `${asyncWrapper(match[2], match[1])}`;
    }
    return input;
}

function myEval(cmd, context, filename, callback) {
    const code = babel.transform(
        preprocess(
            cmd
        )
        ,
        // {
        //     presets: ['es2015', 'stage-0'],
        //     plugins: [
        //         ['transform-flow-strip-types'],
        //     ],
        // }
        {
            "presets": [
                ["env", {
                    "targets": {
                        "node": 6.10
                    }
                }]
            ],
            "plugins": ["transform-object-rest-spread",
                ["transform-runtime", {
                    "polyfill": false,
                    "regenerator": true
                }],
                ["transform-builtin-extend", {
                    "globals": ["Error"]
                }]
            ]
        }
    ).code;
    _eval(code, context, filename, callback);
}


const replInstance = repl.start({ prompt: '> ' });
const _eval = replInstance.eval;
replInstance.eval = myEval;
