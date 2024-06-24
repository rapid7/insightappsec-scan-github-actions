module.exports = {
    testEnvironment: 'node',
    testRegex: '/tests/.*\\.(test|spec)?\\.(js)$',
    moduleFileExtensions: ['js', 'json', 'node'],
    moduleNameMapper: {
        "^axios$": "axios/dist/node/axios.cjs"
    }
};