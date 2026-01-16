

import { getConfig, addTokenPair, filterTokenPairs } from './config';
import { BinanceCorrelationAnalyzer } from './index';


export async function ejemploBasico(): Promise<void> {
  
  const analyzer = new BinanceCorrelationAnalyzer();
  await analyzer.run();
}


export async function ejemploDeFi(): Promise<void> {
  
  // Crear configuración personalizada para DeFi
  let config = getConfig();
  
  // Añadir pares DeFi específicos
  config = addTokenPair(config, 'UNIUSDT', 'SUSHIUSDT', 'Uniswap vs SushiSwap');
  config = addTokenPair(config, 'AAVEUSDT', 'COMPUSDT', 'Aave vs Compound');
  config = addTokenPair(config, 'CRVUSDT', 'BALUSDT', 'Curve vs Balancer');
  config = addTokenPair(config, 'YFIUSDT', 'SUSHIUSDT', 'Yearn vs SushiSwap');
  
  // Filtrar solo pares DeFi
  config = filterTokenPairs(config, pair => 
    pair.longToken.includes('UNI') || pair.longToken.includes('SUSHI') || 
    pair.longToken.includes('AAVE') || pair.longToken.includes('COMP') ||
    pair.longToken.includes('CRV') || pair.longToken.includes('BAL') ||
    pair.longToken.includes('YFI') ||
    pair.shortToken.includes('UNI') || pair.shortToken.includes('SUSHI') || 
    pair.shortToken.includes('AAVE') || pair.shortToken.includes('COMP') ||
    pair.shortToken.includes('CRV') || pair.shortToken.includes('BAL') ||
    pair.shortToken.includes('YFI')
  );
  
  // Crear analizador con configuración personalizada
  const analyzer = new BinanceCorrelationAnalyzer();
  // Nota: En una implementación real, necesitarías pasar la configuración al constructor
  await analyzer.run();
}


export async function ejemploLayer1(): Promise<void> {
  
  let config = getConfig();
  
  // Añadir pares de Layer 1
  config = addTokenPair(config, 'SOLUSDT', 'AVAXUSDT', 'Solana vs Avalanche');
  config = addTokenPair(config, 'DOTUSDT', 'ADAUSDT', 'Polkadot vs Cardano');
  config = addTokenPair(config, 'MATICUSDT', 'FTMUSDT', 'Polygon vs Fantom');
  config = addTokenPair(config, 'NEARUSDT', 'ALGOUSDT', 'NEAR vs Algorand');
  
  // Filtrar solo Layer 1
  config = filterTokenPairs(config, pair => 
    pair.longToken.includes('SOL') || pair.longToken.includes('AVAX') || 
    pair.longToken.includes('DOT') || pair.longToken.includes('ADA') ||
    pair.longToken.includes('MATIC') || pair.longToken.includes('FTM') ||
    pair.longToken.includes('NEAR') || pair.longToken.includes('ALGO') ||
    pair.shortToken.includes('SOL') || pair.shortToken.includes('AVAX') || 
    pair.shortToken.includes('DOT') || pair.shortToken.includes('ADA') ||
    pair.shortToken.includes('MATIC') || pair.shortToken.includes('FTM') ||
    pair.shortToken.includes('NEAR') || pair.shortToken.includes('ALGO')
  );
  
  const analyzer = new BinanceCorrelationAnalyzer();
  await analyzer.run();
}


export async function ejemploGamingNFT(): Promise<void> {
  
  let config = getConfig();
  
  // Añadir pares Gaming/NFT
  config = addTokenPair(config, 'AXSUSDT', 'SANDUSDT', 'Axie Infinity vs The Sandbox');
  config = addTokenPair(config, 'MANAUSDT', 'ENJUSDT', 'Decentraland vs Enjin');
  config = addTokenPair(config, 'GALAUSDT', 'ILVUSDT', 'Gala vs Illuvium');
  config = addTokenPair(config, 'SANDUSDT', 'MANAUSDT', 'The Sandbox vs Decentraland');
  
  // Filtrar solo Gaming/NFT
  config = filterTokenPairs(config, pair => 
    pair.longToken.includes('AXS') || pair.longToken.includes('SAND') || 
    pair.longToken.includes('MANA') || pair.longToken.includes('ENJ') ||
    pair.longToken.includes('GALA') || pair.longToken.includes('ILV') ||
    pair.shortToken.includes('AXS') || pair.shortToken.includes('SAND') || 
    pair.shortToken.includes('MANA') || pair.shortToken.includes('ENJ') ||
    pair.shortToken.includes('GALA') || pair.shortToken.includes('ILV')
  );
  
  const analyzer = new BinanceCorrelationAnalyzer();
  await analyzer.run();
}


export async function ejemploStorage(): Promise<void> {
  
  let config = getConfig();
  
  // Añadir pares de almacenamiento
  config = addTokenPair(config, 'FILUSDT', 'ARUSDT', 'Filecoin vs Arweave');
  config = addTokenPair(config, 'SCUSDT', 'STORJUSDT', 'Siacoin vs Storj');
  config = addTokenPair(config, 'FILUSDT', 'SCUSDT', 'Filecoin vs Siacoin');
  
  // Filtrar solo almacenamiento
  config = filterTokenPairs(config, pair => 
    pair.longToken.includes('FIL') || pair.longToken.includes('AR') || 
    pair.longToken.includes('SC') || pair.longToken.includes('STORJ') ||
    pair.shortToken.includes('FIL') || pair.shortToken.includes('AR') || 
    pair.shortToken.includes('SC') || pair.shortToken.includes('STORJ')
  );
  
  const analyzer = new BinanceCorrelationAnalyzer();
  await analyzer.run();
}


export async function ejecutarTodosLosEjemplos(): Promise<void> {
  
  try {
    await ejemploBasico();
    
    await ejemploDeFi();
    
    await ejemploLayer1();
    
    await ejemploGamingNFT();
    
    await ejemploStorage();
    
  } catch (error) {
  }
}

// Ejecutar ejemplos si es el archivo principal
if (require.main === module) {
  ejecutarTodosLosEjemplos();
}
