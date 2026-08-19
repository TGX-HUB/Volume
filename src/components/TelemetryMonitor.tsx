import React, { useRef, useEffect, useState } from 'react';
import { 
  Terminal, 
  Play, 
  Pause, 
  RotateCcw, 
  Copy, 
  Download, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Sliders, 
  Check, 
  ShieldCheck,
  ExternalLink,
  Flame,
  Globe,
  Coins,
  RefreshCw,
  Activity,
  Zap
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { TelemetryTick, ScraperConfig, RealTokenData } from '../types';

interface TelemetryMonitorProps {
  ticks: TelemetryTick[];
  config: ScraperConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScraperConfig>>;
  isRunning: boolean;
  setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
  onClear: () => void;
  currentVolume: number;
  totalCycles: number;
  realTokenData: RealTokenData | null;
  isLoadingRealData: boolean;
  onRefreshRealData: () => void;
  onManualVolumeSet?: (vol: number) => void;
  onTriggerTestTrade?: () => void;
}

export const TelemetryMonitor: React.FC<TelemetryMonitorProps> = ({
  ticks,
  config,
  setConfig,
  isRunning,
  setIsRunning,
  onClear,
  currentVolume,
  totalCycles,
  realTokenData,
  isLoadingRealData,
  onRefreshRealData,
  onManualVolumeSet,
  onTriggerTestTrade,
}) => {
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeChart, setActiveChart] = useState<'volume' | 'delta'>('volume');
  const [customVolInput, setCustomVolInput] = useState<string>('');
  const [showCalibrate, setShowCalibrate] = useState<boolean>(false);
  const [currentClock, setCurrentClock] = useState<string>('');

  // Live microsecond clock
  useEffect(() => {
    const timer = setInterval(() => {
      const d = new Date();
      setCurrentClock(d.toISOString().replace('Z', '+00:00'));
    }, 50);
    return () => clearInterval(timer);
  }, []);

  // Fix: Container-ONLY scroll. Never call scrollIntoView to prevent page jumps!
  useEffect(() => {
    if (autoScroll && terminalContainerRef.current) {
      terminalContainerRef.current.scrollTop = terminalContainerRef.current.scrollHeight;
    }
  }, [ticks, autoScroll]);

  const lastTick = ticks[ticks.length - 1];
  const lastDelta = lastTick ? lastTick.delta : 0;
  const changedTicks = ticks.filter((t) => t.isChanged);
  
  // Calculate average delta and velocity (USD/sec)
  const recentTicks = ticks.slice(-20);
  const totalRecentDelta = recentTicks.reduce((acc, curr) => acc + curr.delta, 0);
  const volumeVelocity = (totalRecentDelta / Math.max(1, recentTicks.length * (config.pollIntervalMs / 1000)));

  // Copy terminal output
  const handleCopyLogs = () => {
    const textToCopy = ticks
      .filter((t) => !config.printEveryCheck ? t.isChanged : true)
      .map((t) => {
        let line = `[${t.timestamp}] Volume: $${t.volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        if (t.delta > 0) {
          const typeTag = t.tradeType ? ` [${t.tradeType}]` : '';
          line += `\n             Change: +${t.delta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+${t.percentChange.toFixed(2)}%)${typeTag}`;
        }
        return line;
      })
      .join('\n');

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = 'Timestamp,Volume_USD,Delta_USD,Percent_Change,Is_Changed,Trade_Type,Latency_MS\n';
    const rows = ticks
      .map((t) => `"${t.timestamp}",${t.volume.toFixed(2)},${t.delta.toFixed(2)},${t.percentChange.toFixed(4)},${t.isChanged},"${t.tradeType || 'N/A'}",${t.latencyMs.toFixed(2)}`)
      .join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pump_volume_telemetry_${config.tokenAddress.slice(0, 8)}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const chartData = ticks.slice(-40).map((t, idx) => ({
    time: t.timestamp.split('T')[1]?.slice(0, 12) || `${idx}`,
    volume: t.volume,
    delta: t.delta,
    isBuy: t.tradeType === 'BUY',
  }));

  return (
    <div className="space-y-6">
      
      {/* Real On-Chain Token Snapshot Header */}
      {realTokenData && (
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-zinc-900 border border-emerald-500/30 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
              {realTokenData.symbol.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-100">{realTokenData.name} ({realTokenData.symbol})</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  <Globe className="h-3 w-3" /> Live On-Chain Solana
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-zinc-400 mt-1">
                <span>Price: <strong className="text-zinc-200">${realTokenData.priceUsd > 0 ? realTokenData.priceUsd.toFixed(realTokenData.priceUsd < 0.01 ? 6 : 4) : 'N/A'}</strong></span>
                <span>•</span>
                <span>24h Volume: <strong className="text-emerald-400">${realTokenData.volume24h.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                <span>•</span>
                <span>Market Cap: <strong className="text-zinc-200">${realTokenData.marketCap.toLocaleString('en-US', { maximumFractionDigits: 0 })}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefreshRealData}
              disabled={isLoadingRealData}
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Sync latest live on-chain volume from Solana"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingRealData ? 'animate-spin text-emerald-400' : ''}`} />
              {isLoadingRealData ? 'Fetching On-Chain...' : 'Refresh On-Chain'}
            </button>

            <a
              href={`https://pump.fun/coin/${config.tokenAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg text-xs font-mono bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/40 flex items-center gap-1.5"
            >
              Pump.fun <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* Metric 1: Live Cumulative Volume */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>CUMULATIVE VOLUME</span>
            <Flame className="h-3.5 w-3.5 text-amber-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">
              ${currentVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-1 text-xs font-mono mt-0.5">
              {lastDelta > 0 ? (
                <span className="text-emerald-400 flex items-center gap-0.5 font-medium">
                  <TrendingUp className="h-3 w-3" />
                  +{lastDelta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  {lastTick?.tradeType && <span className="text-[10px] bg-emerald-500/20 px-1 py-0.2 rounded text-emerald-300 ml-1">{lastTick.tradeType}</span>}
                </span>
              ) : (
                <span className="text-zinc-500 font-medium flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${isRunning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
                  {isRunning ? 'Actively checking for changes' : 'Monitoring paused'}
                </span>
              )}
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between border-t border-zinc-800/60 pt-2">
            <span>Volume Flow</span>
            <span className="text-emerald-400 font-medium">Monotonically Increasing</span>
          </div>
        </div>

        {/* Metric 2: Polling Cadence */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>CHECK CADENCE</span>
            <Clock className="h-3.5 w-3.5 text-blue-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">
              {config.pollIntervalMs} <span className="text-sm font-normal text-zinc-400">ms</span>
            </div>
            <div className="text-xs text-blue-400 font-mono mt-0.5 flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
              {(1000 / config.pollIntervalMs).toFixed(0)} checks/sec ({isRunning ? 'RUNNING' : 'PAUSED'})
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between border-t border-zinc-800/60 pt-2">
            <span>Total Checks Executed</span>
            <span className="text-zinc-200 font-bold">{totalCycles.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 3: Volume Velocity */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>VOLUME VELOCITY</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold font-mono text-zinc-100 tracking-tight">
              ${volumeVelocity.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="text-xs font-normal text-zinc-400">/s</span>
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-0.5">
              {changedTicks.length} captured volume increments
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between border-t border-zinc-800/60 pt-2">
            <span>Mutation Activity</span>
            <span className="text-zinc-300">
              {totalCycles > 0 ? ((changedTicks.length / totalCycles) * 100).toFixed(1) : 0}% of cycles
            </span>
          </div>
        </div>

        {/* Metric 4: Token Contract */}
        <div className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>TARGET TOKEN</span>
            <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <div className="my-2">
            <div className="text-sm font-bold font-mono text-zinc-200 truncate" title={config.tokenAddress}>
              {config.tokenAddress.slice(0, 10)}...{config.tokenAddress.slice(-6)}
            </div>
            <div className="text-xs text-zinc-400 font-mono mt-1 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span>Pump.fun Solana SPL</span>
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 font-mono flex items-center justify-between border-t border-zinc-800/60 pt-2">
            <span>Engine</span>
            <span className="text-zinc-300">Scrapling DynamicSession</span>
          </div>
        </div>

      </div>

      {/* Interactive Controls & Polling Frequency Slider */}
      <div className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-4 space-y-3">
        
        {/* Volume Calibration Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-400">Volume Anchor:</span>
            <span className="text-emerald-400 font-bold font-mono">
              ${currentVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-zinc-600">|</span>
            <span className="text-zinc-400">Status:</span>
            <span className="text-zinc-200">
              {realTokenData ? 'Synced to On-Chain Solana RPC' : 'Anchored'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onTriggerTestTrade && (
              <button
                onClick={onTriggerTestTrade}
                className="text-[11px] font-mono px-2.5 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 flex items-center gap-1 transition-colors"
                title="Simulate a real buy trade on Pump.fun to test scraper reaction"
              >
                <Zap className="h-3 w-3 text-purple-400" />
                Simulate Trade Inflow
              </button>
            )}

            {!showCalibrate ? (
              <button
                onClick={() => {
                  setCustomVolInput(currentVolume.toFixed(2));
                  setShowCalibrate(true);
                }}
                className="text-[11px] font-mono px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                Calibrate Volume Value
              </button>
            ) : (
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-mono text-zinc-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={customVolInput}
                  onChange={(e) => setCustomVolInput(e.target.value)}
                  placeholder="12453.21"
                  className="w-28 px-2 py-1 text-xs font-mono bg-zinc-950 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => {
                    const num = parseFloat(customVolInput);
                    if (!isNaN(num) && onManualVolumeSet) {
                      onManualVolumeSet(num);
                    }
                    setShowCalibrate(false);
                  }}
                  className="px-2 py-1 text-xs font-mono bg-emerald-500 text-zinc-950 font-bold rounded hover:bg-emerald-400"
                >
                  Set
                </button>
                <button
                  onClick={() => setShowCalibrate(false)}
                  className="px-2 py-1 text-xs font-mono text-zinc-400 hover:text-zinc-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Polling Interval Slider */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                <Sliders className="h-3.5 w-3.5 text-emerald-400" />
                Checking Schedule: <span className="text-emerald-400 font-bold">{config.pollIntervalMs} ms</span> ({ (1000 / config.pollIntervalMs).toFixed(0) } checks/sec)
              </span>
              <span className="text-zinc-500">Fastest: 10ms (100 Hz)</span>
            </div>
            
            <div className="flex items-center gap-3">
              <input
                id="poll-interval-slider"
                type="range"
                min="10"
                max="500"
                step="10"
                value={config.pollIntervalMs}
                onChange={(e) => setConfig((prev) => ({ ...prev, pollIntervalMs: Number(e.target.value) }))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
              />
              <div className="flex gap-1">
                {[10, 50, 100, 250].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setConfig((prev) => ({ ...prev, pollIntervalMs: preset }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      config.pollIntervalMs === preset
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {preset}ms
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 border-zinc-800 pt-3 lg:pt-0">
            <button
              onClick={() => setIsRunning(!isRunning)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                isRunning
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-zinc-950 font-semibold hover:bg-emerald-400 shadow-md shadow-emerald-500/30'
              }`}
            >
              {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {isRunning ? 'Pause Loop' : 'Start Monitoring'}
            </button>

            <button
              onClick={onClear}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 hover:bg-zinc-700 flex items-center gap-1.5"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Clear Terminal
            </button>

            <div className="h-5 w-px bg-zinc-800 hidden sm:block" />

            {/* Filter Toggle */}
            <button
              onClick={() => setConfig((prev) => ({ ...prev, printEveryCheck: !prev.printEveryCheck }))}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 border ${
                config.printEveryCheck
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
              title={config.printEveryCheck ? 'Logging all checks' : 'Logging only volume shifts'}
            >
              <Filter className="h-3 w-3" />
              {config.printEveryCheck ? 'All Checks' : 'Changes Only'}
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white flex items-center gap-1.5"
              title="Export captured ticks to CSV"
            >
              <Download className="h-3 w-3" />
              CSV
            </button>
          </div>

        </div>
      </div>

      {/* Live Chart & Terminal Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Visual Telemetry Chart (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-zinc-200">Cumulative Trajectory</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Last 40 Ticks</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveChart('volume')}
                className={`px-2 py-0.5 text-[11px] font-mono rounded ${activeChart === 'volume' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Volume ($)
              </button>
              <button
                onClick={() => setActiveChart('delta')}
                className={`px-2 py-0.5 text-[11px] font-mono rounded ${activeChart === 'delta' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-zinc-500 hover:text-zinc-300'}`}
              >
                Trade Inflow (+$)
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeChart === 'volume' ? (
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                    formatter={(val: number) => [`$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Total Volume']}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#volGrad)" isAnimationActive={false} />
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <XAxis dataKey="time" hide />
                  <YAxis 
                    orientation="right"
                    tick={{ fontSize: 10, fill: '#71717a' }}
                    tickFormatter={(v) => `+$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                    formatter={(val: number) => [`+$${val.toFixed(2)}`, 'Volume Added']}
                  />
                  <Bar dataKey="delta" isAnimationActive={false}>
                    {chartData.map((entry, index) => (
                      <Cell key={`bar-${index}`} fill={entry.delta > 0 ? (entry.isBuy ? '#10b981' : '#f59e0b') : '#3f3f46'} />
                    ))}
                  </Bar>
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          <div className="bg-zinc-950/60 rounded-lg p-2.5 border border-zinc-800/80 text-[11px] font-mono text-zinc-400 flex items-center justify-between">
            <span>Latency Schedule</span>
            <span className="text-zinc-200">{(config.pollIntervalMs).toFixed(1)}ms / check cycle</span>
          </div>
        </div>

        {/* Right Column: Live Terminal Telemetry Output (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          
          {/* Terminal Window Header */}
          <div className="bg-zinc-900 px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
              </div>
              <span className="text-xs font-mono text-zinc-400 ml-2 flex items-center gap-1.5">
                <Terminal className="h-3 w-3 text-emerald-400" />
                pump_volume_scraper.py (Live Terminal)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-[11px] text-zinc-400 font-mono cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="rounded bg-zinc-800 border-zinc-700 text-emerald-400 focus:ring-0 h-3 w-3"
                />
                Auto-scroll Terminal
              </label>

              <button
                onClick={handleCopyLogs}
                className="px-2 py-1 rounded text-xs text-zinc-300 hover:text-white bg-zinc-800 hover:bg-zinc-700 font-mono flex items-center gap-1"
                title="Copy terminal logs"
              >
                {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Terminal Body - Container scrolling ONLY without window jumping */}
          <div 
            ref={terminalContainerRef}
            className="p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-[380px] min-h-[380px] bg-black/90 text-zinc-300 space-y-1 select-text scroll-smooth"
          >
            
            {/* Header info banner */}
            <div className="text-zinc-500 select-none pb-2 border-b border-zinc-900">
              <div>======================================================================</div>
              <div className="text-emerald-400 font-semibold">PUMP.FUN VOLUME SCRAPER (SCRAFLING DYNAMICSESSION)</div>
              <div>======================================================================</div>
              <div>Token : {config.tokenAddress}</div>
              <div>URL   : https://pump.fun/coin/{config.tokenAddress}</div>
              <div>Poll  : {config.pollIntervalMs} ms ({config.printEveryCheck ? 'Print Every Check' : 'Print On Change Only'})</div>
              <div>Mode  : {config.headless ? 'Headless Chromium' : 'Visible Window'}</div>
              <div className="text-zinc-500 mt-1">Starting persistent Scrapling browser...</div>
              <div className="text-zinc-500">Loading Pump.fun token page... Page loaded.</div>
              <div>======================================================================</div>
              <div className="text-emerald-500 font-medium">MONITORING (Press CTRL+C to stop in Python CLI)</div>
              <div>======================================================================</div>
            </div>

            {/* Live Ticks Stream */}
            {ticks
              .filter((t) => !config.printEveryCheck ? t.isChanged : true)
              .map((t) => (
                <div key={t.id} className="py-0.5">
                  <div className="flex items-start gap-1">
                    <span className="text-zinc-500 select-none">[{t.timestamp}]</span>
                    <span className="text-zinc-100 font-medium">
                      Volume: ${t.volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                  {t.isChanged && t.delta > 0 && (
                    <div className="ml-6 pl-4 border-l border-zinc-800 text-[11px]">
                      <span className="text-emerald-400">
                        Change: +{t.delta.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (+{t.percentChange.toFixed(2)}%)
                      </span>
                      {t.tradeType && (
                        <span className="text-zinc-400 ml-2">[{t.tradeType}]</span>
                      )}
                    </div>
                  )}
                </div>
              ))}

            {/* Live Poller Status Footer inside terminal */}
            {isRunning && (
              <div className="pt-2 text-[11px] text-emerald-400/90 flex items-center gap-2 select-none border-t border-zinc-900 mt-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                <span>
                  [{currentClock || 'LIVE'}] Polling #{totalCycles} ({config.pollIntervalMs}ms) | Volume: ${currentVolume.toLocaleString('en-US', { minimumFractionDigits: 2 })} | Scrapling loop active
                </span>
              </div>
            )}

            {!isRunning && (
              <div className="text-amber-400/80 italic py-4 text-center select-none">
                Monitoring paused. Click "Start Monitoring" above to resume high-frequency checks.
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
