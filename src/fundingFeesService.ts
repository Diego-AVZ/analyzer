const FUNDING_FEES_API_URL = 'https://api-sendra-gmx.vercel.app/api/funding-fees';

export interface FundingFeeMarket {
  market: string;
  marketAddress: string;
  long: string;
  short: string;
  longRaw?: string;
  shortRaw?: string;
}

export interface FundingFeesApiResponse {
  success: boolean;
  data: FundingFeeMarket[];
  timestamp?: string;
}

/**
 * Extrae el símbolo del token del campo market.
 * Ej: "BTC/USD [BTC-USDC]" -> "BTC"
 */
function getTokenFromMarket(market: string): string {
  const match = market.match(/^([^/]+)\/USD/);
  return match ? match[1].trim() : '';
}

/**
 * Comprueba si el colateral del market contiene USDC (parte entre []).
 * Ej: "BTC/USD [BTC-USDC]" -> true, "BTC/USD [BTC-BTC]" -> false
 */
function hasUsdcCollateral(market: string): boolean {
  const bracketMatch = market.match(/\[([^\]]+)\]/);
  if (!bracketMatch) return false;
  return bracketMatch[1].toUpperCase().includes('USDC');
}

/**
 * Mapa: símbolo del token (ej. BTC, ETH) -> { long, short } del market con colateral USDC.
 */
export type FundingFeesMap = Map<string, { long: string; short: string }>;

/**
 * Obtiene los funding fees del API, filtra solo mercados con colateral USDC
 * y devuelve un mapa por token para lookup rápido.
 */
export async function fetchFundingFees(): Promise<FundingFeesMap> {
  const res = await fetch(FUNDING_FEES_API_URL);
  if (!res.ok) {
    throw new Error(`Funding fees API error: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as FundingFeesApiResponse;
  if (!json.success || !Array.isArray(json.data)) {
    throw new Error('Invalid funding fees API response');
  }

  const map: FundingFeesMap = new Map();

  for (const item of json.data) {
    if (!hasUsdcCollateral(item.market)) continue;
    const token = getTokenFromMarket(item.market);
    if (!token) continue;
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
export function normalizeTokenForFundingLookup(symbol: string): string[] {
  const base = symbol.replace(/USDT$/i, '').trim();
  if (!base) return [symbol];
  // El API puede usar WETH para ETH, kPEPE para PEPE, etc.
  const aliases: string[] = [base];
  if (base === 'ETH') aliases.push('WETH');
  if (base === 'PEPE') aliases.push('kPEPE');
  if (base === 'SHIB') aliases.push('kSHIB');
  if (base === 'BONK') aliases.push('kBONK');
  if (base === 'FLOKI') aliases.push('kFLOKI');
  return aliases;
}

/**
 * Obtiene funding long y short para un par longToken/shortToken desde el mapa.
 * longToken -> campo "long" del market = fundingFeeLong
 * shortToken -> campo "short" del market = fundingFeeShort
 */
export function getFundingFeesForStrategy(
  fundingMap: FundingFeesMap,
  longToken: string,
  shortToken: string
): { fundingFeeLong: string | undefined; fundingFeeShort: string | undefined } {
  const longCandidates = normalizeTokenForFundingLookup(longToken);
  const shortCandidates = normalizeTokenForFundingLookup(shortToken);

  let fundingFeeLong: string | undefined;
  let fundingFeeShort: string | undefined;

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
