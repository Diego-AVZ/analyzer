"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
exports.getConfig = getConfig;
exports.addTokenPair = addTokenPair;
exports.filterTokenPairs = filterTokenPairs;
exports.defaultConfig = {
    tokenPairs: [
        { longToken: 'ETHUSDT', shortToken: 'CAKEUSDT', description: '⚡ BUY - Win Rate 59%, Ganancia 45%' },
        { longToken: 'BTCUSDT', shortToken: 'PEPEUSDT', description: '⚡ BUY - Win Rate 55%, Ganancia 19%' },
        { longToken: 'ETHUSDT', shortToken: 'OPUSDT', description: '⚡ BUY - Win Rate 55%, Ganancia 79%' },
        { longToken: 'ETHUSDT', shortToken: 'GMXUSDT', description: '⚡ BUY - Win Rate 57.5%, Ganancia 68%' },
        { longToken: 'ETHUSDT', shortToken: 'DOTUSDT', description: '📊 HOLD - Win Rate 54.5%, Ganancia 77%' },
        { longToken: 'ETHUSDT', shortToken: 'ARBUSDT', description: '📊 HOLD - Win Rate 58%, Ganancia 34%' },
        { longToken: 'ETHUSDT', shortToken: 'LDOUSDT', description: '📊 HOLD - Win Rate 54.5%, Ganancia 43%' },
        { longToken: 'LINKUSDT', shortToken: 'GMXUSDT', description: '📊 HOLD - Win Rate 53.5%, Ganancia 47%' }
    ],
    binanceApi: {
        baseUrl: 'https://api.binance.com/api/v3/klines',
        interval: '1d',
        limit: 100
    },
    analysis: {
        minDaysForAnalysis: 30,
        correlationThreshold: -0.1
    }
};
function getConfig() {
    return exports.defaultConfig;
}
function addTokenPair(config, longToken, shortToken, description) {
    const newPair = {
        longToken: longToken.toUpperCase(),
        shortToken: shortToken.toUpperCase(),
        description: description || `LONG ${longToken} vs SHORT ${shortToken}`
    };
    return {
        ...config,
        tokenPairs: [...config.tokenPairs, newPair]
    };
}
function filterTokenPairs(config, filterFn) {
    return {
        ...config,
        tokenPairs: config.tokenPairs.filter(filterFn)
    };
}
