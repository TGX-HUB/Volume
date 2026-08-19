import { RealTokenData } from '../types';

export async function fetchLiveSolanaTokenData(tokenAddress: string): Promise<RealTokenData | null> {
  try {
    const cleanAddress = tokenAddress.trim();
    if (!cleanAddress || cleanAddress.length < 30) return null;

    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${cleanAddress}`);
    if (!response.ok) return null;

    const data = await response.json();
    if (!data.pairs || data.pairs.length === 0) return null;

    // Pick the most liquid / highest volume pair for this token
    const sortedPairs = [...data.pairs].sort((a, b) => {
      const volA = a.volume?.h24 || 0;
      const volB = b.volume?.h24 || 0;
      return volB - volA;
    });

    const primaryPair = sortedPairs[0];

    const volume24h = primaryPair.volume?.h24 || 0;
    const volume5m = primaryPair.volume?.m5 || 0;
    const volume1h = primaryPair.volume?.h1 || 0;
    const priceUsd = parseFloat(primaryPair.priceUsd || '0');
    const marketCap = primaryPair.marketCap || primaryPair.fdv || 0;

    return {
      name: primaryPair.baseToken?.name || 'Solana Token',
      symbol: primaryPair.baseToken?.symbol || 'SOL',
      address: cleanAddress,
      priceUsd,
      volume24h,
      volume5m,
      volume1h,
      marketCap,
      pairAddress: primaryPair.pairAddress,
      lastUpdated: new Date().toISOString(),
    };
  } catch (err) {
    console.warn('Could not fetch on-chain live data for token:', err);
    return null;
  }
}
