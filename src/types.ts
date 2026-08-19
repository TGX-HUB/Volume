export interface TelemetryTick {
  id: string;
  timestamp: string; // ISO with microseconds
  volume: number;
  delta: number;
  percentChange: number;
  rawString?: string;
  isChanged: boolean;
  latencyMs: number;
  cycleCount: number;
  priceUsd?: number;
  marketCap?: number;
  tradeType?: 'BUY' | 'SELL' | 'NO_CHANGE';
}

export interface RealTokenData {
  name: string;
  symbol: string;
  address: string;
  priceUsd: number;
  volume24h: number;
  volume5m: number;
  volume1h: number;
  marketCap: number;
  pairAddress?: string;
  lastUpdated: string;
}

export interface ScraperConfig {
  tokenAddress: string;
  pollIntervalMs: number; // e.g. 10
  headless: boolean;
  printEveryCheck: boolean;
  architecture: 'repeated_fetch' | 'dom_observer' | 'websocket_rpc';
  minDeltaAlert: number;
  autoReconnect: boolean;
  dataSource: 'live_chain' | 'simulated_hf';
}

export interface PresetToken {
  name: string;
  symbol: string;
  address: string;
  initialVolume: number;
  volatility: 'low' | 'medium' | 'high' | 'hyper';
  description: string;
}

export interface ParseResult {
  rawInput: string;
  matchedPattern: string | null;
  extractedValue: string | null;
  parsedNumber: number | null;
  multiplier: number;
  formattedOutput: string;
  success: boolean;
  executionTimeUs: number;
}
