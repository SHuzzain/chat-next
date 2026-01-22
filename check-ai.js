const { streamText } = require('ai');
console.log(typeof streamText);
// We can't easily check return type without running it, but we can check exports
const ai = require('ai');
console.log(Object.keys(ai));
