import React from 'react';
import { Terminal, Activity, Zap, Code2, Cpu, Sparkles } from 'lucide-react';
import { ScraperConfig, PresetToken } from '../types';
import { PRESET_TOKENS } from '../utils/presets';

interface HeaderProps {
  config: ScraperConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScraperConfig>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  activeTab: 'monitor' | 'generator' | 'parser' | 'guide';
  setActiveTab: (tab: 'monitor' | 'generator' | 'parser' | 'guide') => void;
  currentVolume: number;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  setConfig,
  isRunning,
  setIsRunning,
  activeTab,
  setActiveTab,
  currentVolume,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Status */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                  Pump.fun Scrapling Monitor
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
                  <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {isRunning ? `${config.pollIntervalMs}ms Polling` : 'Idle'}
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                High-Frequency Token Volume Telemetry & Scrapling Script Engine
              </p>
            </div>
          </div>

          {/* Quick Token & Control Selector */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-300">
              <span className="text-zinc-500 font-mono">Token:</span>
              <select
                id="token-preset-select"
                aria-label="Select target token preset"
                value={config.tokenAddress}
                onChange={(e) => setConfig((prev) => ({ ...prev, tokenAddress: e.target.value }))}
                className="bg-transparent border-none text-zinc-200 text-xs font-mono focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[200px] truncate"
              >
                {PRESET_TOKENS.map((token) => (
                  <option key={token.address} value={token.address} className="bg-zinc-900 text-zinc-200">
                    {token.symbol} - {token.name}
                  </option>
                ))}
                {!PRESET_TOKENS.some((t) => t.address === config.tokenAddress) && (
                  <option value={config.tokenAddress} className="bg-zinc-900 text-zinc-200">
                    Custom ({config.tokenAddress.slice(0, 8)}...)
                  </option>
                )}
              </select>
            </div>

            <button
              id="header-toggle-run-btn"
              onClick={() => setIsRunning(!isRunning)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                isRunning
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                  : 'bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 shadow-sm shadow-emerald-500/20'
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              {isRunning ? 'Pause Loop' : 'Start Monitor'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 mt-3.5 border-t border-zinc-900 pt-2 overflow-x-auto">
          <button
            id="tab-monitor-btn"
            onClick={() => setActiveTab('monitor')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'monitor'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            Live Telemetry Terminal
          </button>

          <button
            id="tab-generator-btn"
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'generator'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            Script Generator (v1 / v2 / v3)
          </button>

          <button
            id="tab-parser-btn"
            onClick={() => setActiveTab('parser')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'parser'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            DOM & Regex Sandbox
          </button>

          <button
            id="tab-guide-btn"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${
              activeTab === 'guide'
                ? 'bg-zinc-800 text-emerald-400 font-semibold shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            10ms Polling vs DOM Observer Architecture
          </button>
        </div>
      </div>
    </header>
  );
};
