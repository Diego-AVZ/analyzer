"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchFundingFees = fetchFundingFees;
exports.normalizeTokenForFundingLookup = normalizeTokenForFundingLookup;
exports.getFundingFeesForStrategy = getFundingFeesForStrategy;
const FUNDING_FEES_API_URL = 'https://api-sendra-gmx.vercel.app/api/funding-fees';
/**
 * Extrae el símbolo del token del campo market.
 * Ej: "BTC/USD [BTC-USDC]" -> "BTC"
 */
function getTokenFromMarket(market) {
    const match = market.match(/^([^/]+)\/USD/);
    return match ? match[1].trim() : '';
}
/**
 * Comprueba si el colateral del market contiene USDC (parte entre []).
 * Ej: "BTC/USD [BTC-USDC]" -> true, "BTC/USD [BTC-BTC]" -> false
 */
function hasUsdcCollateral(market) {
    const bracketMatch = market.match(/\[([^\]]+)\]/);
    if (!bracketMatch)
        return false;
    return bracketMatch[1].toUpperCase().includes('USDC');
}
/**
 * Obtiene los funding fees del API, filtra solo mercados con colateral USDC
 * y devuelve un mapa por token para lookup rápido.
 */
async function fetchFundingFees() {
    const res = await fetch(FUNDING_FEES_API_URL);
    if (!res.ok) {
        throw new Error(`Funding fees API error: ${res.status} ${res.statusText}`);
    }
    const json = (await res.json());
    if (!json.success || !Array.isArray(json.data)) {
        throw new Error('Invalid funding fees API response');
    }
    const map = new Map();
    for (const item of json.data) {
        if (!hasUsdcCollateral(item.market))
            continue;
        const token = getTokenFromMarket(item.market);
        if (!token)
            continue;
        // Si ya existe el token, mantener el primero (prioridad a USDC; ya filtramos por USDC)
        if (!map.has(token)) {
            map.set(token, { long: item.long, short: item.short });
        }
    }
    return map;
}
/**
 * Normaliza el símbolo de Binance (ej. ETHUSDT, BTCUSDT) al símbolo base para buscar en el mapa de funding.
 * Algunos mercados en el API usan WETH en el par; se intenta "ETH" y "WETH".
 */
function normalizeTokenForFundingLookup(symbol) {
    const base = symbol.replace(/USDT$/i, '').trim();
    if (!base)
        return [symbol];
    // El API puede usar WETH para ETH, kPEPE para PEPE, etc.
    const aliases = [base];
    if (base === 'ETH')
        aliases.push('WETH');
    if (base === 'PEPE')
        aliases.push('kPEPE');
    if (base === 'SHIB')
        aliases.push('kSHIB');
    if (base === 'BONK')
        aliases.push('kBONK');
    if (base === 'FLOKI')
        aliases.push('kFLOKI');
    return aliases;
}
/**
 * Obtiene funding long y short para un par longToken/shortToken desde el mapa.
 * longToken -> campo "long" del market = fundingFeeLong
 * shortToken -> campo "short" del market = fundingFeeShort
 */
function getFundingFeesForStrategy(fundingMap, longToken, shortToken) {
    const longCandidates = normalizeTokenForFundingLookup(longToken);
    const shortCandidates = normalizeTokenForFundingLookup(shortToken);
    let fundingFeeLong;
    let fundingFeeShort;
    for (const key of longCandidates) {
        const entry = fundingMap.get(key);
        if (entry) {
            fundingFeeLong = entry.long;
            break;
        }
    }
    for (const key of shortCandidates) {
        const entry = fundingMap.get(key);
        if (entry) {
            fundingFeeShort = entry.short;
            break;
        }
    }
    return { fundingFeeLong, fundingFeeShort };
}
