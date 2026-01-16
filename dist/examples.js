"use strict";
/**
 * Ejemplos de uso del analizador de correlaciones
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ejemploBasico = ejemploBasico;
exports.ejemploDeFi = ejemploDeFi;
exports.ejemploLayer1 = ejemploLayer1;
exports.ejemploGamingNFT = ejemploGamingNFT;
exports.ejemploStorage = ejemploStorage;
exports.ejecutarTodosLosEjemplos = ejecutarTodosLosEjemplos;
const config_1 = require("./config");
const index_1 = require("./index");
/**
 * Ejemplo 1: Análisis básico con configuración por defecto
 */
async function ejemploBasico() {
    console.log('🚀 Ejemplo 1: Análisis básico con configuración por defecto');
    const analyzer = new index_1.BinanceCorrelationAnalyzer();
    await analyzer.run();
}
/**
 * Ejemplo 2: Análisis de pares específicos de DeFi
 */
async function ejemploDeFi() {
    console.log('🚀 Ejemplo 2: Análisis de tokens DeFi');
    // Crear configuración personalizada para DeFi
    let config = (0, config_1.getConfig)();
    // Añadir pares DeFi específicos
    config = (0, config_1.addTokenPair)(config, 'UNIUSDT', 'SUSHIUSDT', 'Uniswap vs SushiSwap');
    config = (0, config_1.addTokenPair)(config, 'AAVEUSDT', 'COMPUSDT', 'Aave vs Compound');
    config = (0, config_1.addTokenPair)(config, 'CRVUSDT', 'BALUSDT', 'Curve vs Balancer');
    config = (0, config_1.addTokenPair)(config, 'YFIUSDT', 'SUSHIUSDT', 'Yearn vs SushiSwap');
    // Filtrar solo pares DeFi
    config = (0, config_1.filterTokenPairs)(config, pair => pair.longToken.includes('UNI') || pair.longToken.includes('SUSHI') ||
        pair.longToken.includes('AAVE') || pair.longToken.includes('COMP') ||
        pair.longToken.includes('CRV') || pair.longToken.includes('BAL') ||
        pair.longToken.includes('YFI') ||
        pair.shortToken.includes('UNI') || pair.shortToken.includes('SUSHI') ||
        pair.shortToken.includes('AAVE') || pair.shortToken.includes('COMP') ||
        pair.shortToken.includes('CRV') || pair.shortToken.includes('BAL') ||
        pair.shortToken.includes('YFI'));
    // Crear analizador con configuración personalizada
    const analyzer = new index_1.BinanceCorrelationAnalyzer();
    // Nota: En una implementación real, necesitarías pasar la configuración al constructor
    await analyzer.run();
}
/**
 * Ejemplo 3: Análisis de tokens de Layer 1
 */
async function ejemploLayer1() {
    console.log('🚀 Ejemplo 3: Análisis de tokens Layer 1');
    let config = (0, config_1.getConfig)();
    // Añadir pares de Layer 1
    config = (0, config_1.addTokenPair)(config, 'SOLUSDT', 'AVAXUSDT', 'Solana vs Avalanche');
    config = (0, config_1.addTokenPair)(config, 'DOTUSDT', 'ADAUSDT', 'Polkadot vs Cardano');
    config = (0, config_1.addTokenPair)(config, 'MATICUSDT', 'FTMUSDT', 'Polygon vs Fantom');
    config = (0, config_1.addTokenPair)(config, 'NEARUSDT', 'ALGOUSDT', 'NEAR vs Algorand');
    // Filtrar solo Layer 1
    config = (0, config_1.filterTokenPairs)(config, pair => pair.longToken.includes('SOL') || pair.longToken.includes('AVAX') ||
        pair.longToken.includes('DOT') || pair.longToken.includes('ADA') ||
        pair.longToken.includes('MATIC') || pair.longToken.includes('FTM') ||
        pair.longToken.includes('NEAR') || pair.longToken.includes('ALGO') ||
        pair.shortToken.includes('SOL') || pair.shortToken.includes('AVAX') ||
        pair.shortToken.includes('DOT') || pair.shortToken.includes('ADA') ||
        pair.shortToken.includes('MATIC') || pair.shortToken.includes('FTM') ||
        pair.shortToken.includes('NEAR') || pair.shortToken.includes('ALGO'));
    const analyzer = new index_1.BinanceCorrelationAnalyzer();
    await analyzer.run();
}
/**
 * Ejemplo 4: Análisis de tokens de gaming/NFT
 */
async function ejemploGamingNFT() {
    console.log('🚀 Ejemplo 4: Análisis de tokens Gaming/NFT');
    let config = (0, config_1.getConfig)();
    // Añadir pares Gaming/NFT
    config = (0, config_1.addTokenPair)(config, 'AXSUSDT', 'SANDUSDT', 'Axie Infinity vs The Sandbox');
    config = (0, config_1.addTokenPair)(config, 'MANAUSDT', 'ENJUSDT', 'Decentraland vs Enjin');
    config = (0, config_1.addTokenPair)(config, 'GALAUSDT', 'ILVUSDT', 'Gala vs Illuvium');
    config = (0, config_1.addTokenPair)(config, 'SANDUSDT', 'MANAUSDT', 'The Sandbox vs Decentraland');
    // Filtrar solo Gaming/NFT
    config = (0, config_1.filterTokenPairs)(config, pair => pair.longToken.includes('AXS') || pair.longToken.includes('SAND') ||
        pair.longToken.includes('MANA') || pair.longToken.includes('ENJ') ||
        pair.longToken.includes('GALA') || pair.longToken.includes('ILV') ||
        pair.shortToken.includes('AXS') || pair.shortToken.includes('SAND') ||
        pair.shortToken.includes('MANA') || pair.shortToken.includes('ENJ') ||
        pair.shortToken.includes('GALA') || pair.shortToken.includes('ILV'));
    const analyzer = new index_1.BinanceCorrelationAnalyzer();
    await analyzer.run();
}
/**
 * Ejemplo 5: Análisis de tokens de almacenamiento descentralizado
 */
async function ejemploStorage() {
    console.log('🚀 Ejemplo 5: Análisis de tokens de almacenamiento');
    let config = (0, config_1.getConfig)();
    // Añadir pares de almacenamiento
    config = (0, config_1.addTokenPair)(config, 'FILUSDT', 'ARUSDT', 'Filecoin vs Arweave');
    config = (0, config_1.addTokenPair)(config, 'SCUSDT', 'STORJUSDT', 'Siacoin vs Storj');
    config = (0, config_1.addTokenPair)(config, 'FILUSDT', 'SCUSDT', 'Filecoin vs Siacoin');
    // Filtrar solo almacenamiento
    config = (0, config_1.filterTokenPairs)(config, pair => pair.longToken.includes('FIL') || pair.longToken.includes('AR') ||
        pair.longToken.includes('SC') || pair.longToken.includes('STORJ') ||
        pair.shortToken.includes('FIL') || pair.shortToken.includes('AR') ||
        pair.shortToken.includes('SC') || pair.shortToken.includes('STORJ'));
    const analyzer = new index_1.BinanceCorrelationAnalyzer();
    await analyzer.run();
}
/**
 * Función para ejecutar todos los ejemplos
 */
async function ejecutarTodosLosEjemplos() {
    console.log('🎯 Ejecutando todos los ejemplos de análisis...\n');
    try {
        await ejemploBasico();
        console.log('\n' + '='.repeat(80) + '\n');
        await ejemploDeFi();
        console.log('\n' + '='.repeat(80) + '\n');
        await ejemploLayer1();
        console.log('\n' + '='.repeat(80) + '\n');
        await ejemploGamingNFT();
        console.log('\n' + '='.repeat(80) + '\n');
        await ejemploStorage();
        console.log('\n✅ Todos los ejemplos completados exitosamente!');
    }
    catch (error) {
        console.error('❌ Error ejecutando ejemplos:', error);
    }
}
// Ejecutar ejemplos si es el archivo principal
if (require.main === module) {
    ejecutarTodosLosEjemplos();
}
