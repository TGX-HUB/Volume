import { PresetToken } from '../types';

export const PRESET_TOKENS: PresetToken[] = [
  {
    name: 'User Target Token',
    symbol: 'USER',
    address: 'GGXbEk3fVV1rBDt28YbJwVPh6VXaD5rPpGYXULYPpump',
    initialVolume: 12453.21,
    volatility: 'high',
    description: 'Target token from your Scrapling configuration',
  },
  {
    name: 'Fartcoin Pump',
    symbol: 'FART',
    address: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump',
    initialVolume: 842190.50,
    volatility: 'hyper',
    description: 'High-frequency volume testing contract',
  },
  {
    name: 'Peanut the Squirrel',
    symbol: 'PNUT',
    address: '2qEHjDLDLbuBgRYvsxhc5RefwhHyJCPSpU65upBv1pump',
    initialVolume: 1450230.10,
    volatility: 'medium',
    description: 'Standard benchmark liquidity contract',
  },
  {
    name: 'GOAT Terminal',
    symbol: 'GOAT',
    address: 'CzLSujWBLFsSjncfkh59rUFqvqdEs4SQNiZrNvbpump',
    initialVolume: 3290150.00,
    volatility: 'high',
    description: 'High throughput Solana trading token',
  },
];
