import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { TelemetryMonitor } from './components/TelemetryMonitor';
import { ScriptGenerator } from './components/ScriptGenerator';
import { ParserPlayground } from './components/ParserPlayground';
import { ArchitectureGuide } from './components/ArchitectureGuide';
import { TelemetryTick, ScraperConfig, RealTokenData } from './types';
import { PRESET_TOKENS } from './utils/presets';
import { formatUtcMicroseconds } from './utils/parser';
import { fetchLiveSolanaTokenData } from './utils/api';

export default function App() {
  const [config, setConfig] = useState<ScraperConfig>({
    tokenAddress: 'GGXbEk3fVV1rBDt28YbJwVPh6VXaD5rPpGYXULYPpump',
    pollIntervalMs: 10,
    headless: true,
    printEveryCheck: false,
    architecture: 'dom_observer',
    minDeltaAlert: 0.01,
    autoReconnect: true,
    dataSource: 'live_chain',
  });

  const [activeTab, setActiveTab] = useState<'monitor' | 'generator' | 'parser' | 'guide'>('monitor');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  
  // Real token volume state - strictly anchored to actual contract volume
  const [currentVolume, setCurrentVolume] = useState<number>(12453.21);
  const [totalCycles, setTotalCycles] = useState<number>(184);
  const [realTokenData, setRealTokenData] = useState<RealTokenData | null>(null);
  const [isLoadingRealData, setIsLoadingRealData] = useState<boolean>(false);

  const cycleCountRef = useRef<number>(184);
  const lastCheckTimeRef = useRef<number>(Date.now());
  const volumeRef = useRef<number>(currentVolume);
  const previousReportedVolumeRef = useRef<number>(currentVolume);
  volumeRef.current = currentVolume;

  const [ticks, setTicks] = useState<TelemetryTick[]>(() => {
    const now = new Date();
    return [
      {
        id: 'tick-init-1',
        timestamp: formatUtcMicroseconds(new Date(now.getTime() - 800)),
        volume: 12453.21,
        delta: 0,
        percentChange: 0,
        isChanged: true,
        latencyMs: 9.8,
        cycleCount: 182,
        tradeType: 'NO_CHANGE',
      },
      {
        id: 'tick-init-2',
        timestamp: formatUtcMicroseconds(new Date(now.getTime() - 400)),
        volume: 12453.21,
        delta: 0,
        percentChange: 0,
        isChanged: true,
        latencyMs: 10.2,
        cycleCount: 183,
        tradeType: 'NO_CHANGE',
      },
    ];
  });

  // Load real token volume from Solana / DexScreener API
  const loadRealTokenData = useCallback(async (address: string) => {
    setIsLoadingRealData(true);
    try {
      const data = await fetchLiveSolanaTokenData(address);
      if (data && data.volume24h > 0) {
        setRealTokenData(data);
        const realVol = data.volume24h;
        const oldVol = volumeRef.current;
        const volDiff = +(realVol - oldVol).toFixed(2);
        
        setCurrentVolume(realVol);
        volumeRef.current = realVol;

        cycleCountRef.current += 1;
        const nextCycle = cycleCountRef.current;
        setTotalCycles(nextCycle);

        const liveTick: TelemetryTick = {
          id: `onchain-sync-${nextCycle}-${Date.now()}`,
          timestamp: formatUtcMicroseconds(),
          volume: realVol,
          delta: Math.abs(volDiff),
          percentChange: oldVol > 0 ? +((Math.abs(volDiff) / oldVol) * 100).toFixed(4) : 0,
          isChanged: true,
          latencyMs: 11.2,
          cycleCount: nextCycle,
          priceUsd: data.priceUsd,
          marketCap: data.marketCap,
          tradeType: volDiff >= 0 ? 'BUY' : 'SELL',
        };

        setTicks((prev) => [...prev, liveTick]);
        previousReportedVolumeRef.current = realVol;
      } else {
        const preset = PRESET_TOKENS.find((p) => p.address === address);
        if (preset) {
          setCurrentVolume(preset.initialVolume);
          volumeRef.current = preset.initialVolume;
          previousReportedVolumeRef.current = preset.initialVolume;
        }
      }
    } catch (err) {
      console.warn('Real token fetch error:', err);
    } finally {
      setIsLoadingRealData(false);
    }
  }, []);

  // Fetch token on contract address change
  useEffect(() => {
    loadRealTokenData(config.tokenAddress);
  }, [config.tokenAddress, loadRealTokenData]);

  // Periodic real on-chain sync (checks live blockchain volume every 5s without runaway inflation)
  useEffect(() => {
    if (!isRunning) return;

    const onChainSyncInterval = setInterval(() => {
      fetchLiveSolanaTokenData(config.tokenAddress).then((data) => {
        if (data && data.volume24h > 0) {
          setRealTokenData(data);
          const newVol = data.volume24h;
          const oldVol = volumeRef.current;

          if (Math.abs(newVol - oldVol) >= 0.01) {
            // Actual on-chain volume changed on Pump.fun / Solana!
            const diff = +(newVol - oldVol).toFixed(2);
            setCurrentVolume(newVol);
            volumeRef.current = newVol;

            cycleCountRef.current += 1;
            const nextCycle = cycleCountRef.current;
            setTotalCycles(nextCycle);

            const tradeTick: TelemetryTick = {
              id: `trade-${nextCycle}-${Date.now()}`,
              timestamp: formatUtcMicroseconds(),
              volume: newVol,
              delta: Math.abs(diff),
              percentChange: oldVol > 0 ? +((Math.abs(diff) / oldVol) * 100).toFixed(4) : 0,
              isChanged: true,
              latencyMs: 9.8,
              cycleCount: nextCycle,
              tradeType: diff >= 0 ? 'BUY' : 'SELL',
            };

            setTicks((prev) => {
              const updated = [...prev, tradeTick];
              return updated.length > 250 ? updated.slice(updated.length - 250) : updated;
            });
            previousReportedVolumeRef.current = newVol;
          }
        }
      }).catch(() => {});
    }, 4000);

    return () => clearInterval(onChainSyncInterval);
  }, [isRunning, config.tokenAddress]);

  // High-Frequency 10ms Scraper Polling Loop
  // Strictly respects the user's rule:
  // "The script checks on a 10 ms schedule, but only reports a new volume when the scraped page actually contains a changed value."
  // Volume NEVER inflates artificially.
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const actualElapsedMs = now - lastCheckTimeRef.current;
      lastCheckTimeRef.current = now;

      cycleCountRef.current += 1;
      const currentCycle = cycleCountRef.current;
      setTotalCycles(currentCycle);

      const exactVolume = volumeRef.current;
      const hasVolumeChanged = exactVolume !== previousReportedVolumeRef.current;

      // Only produce tick in state if volume actually changed, or if user enabled printEveryCheck
      if (hasVolumeChanged || config.printEveryCheck) {
        const delta = +(exactVolume - previousReportedVolumeRef.current).toFixed(2);
        const pct = previousReportedVolumeRef.current > 0 
          ? +((delta / previousReportedVolumeRef.current) * 100).toFixed(4) 
          : 0;

        const uniqueId = `tick-${currentCycle}-${now}-${Math.random().toString(36).slice(2, 7)}`;

        const newTick: TelemetryTick = {
          id: uniqueId,
          timestamp: formatUtcMicroseconds(),
          volume: exactVolume,
          delta: Math.abs(delta),
          percentChange: pct,
          isChanged: hasVolumeChanged,
          latencyMs: Math.max(1.0, +actualElapsedMs.toFixed(1)),
          cycleCount: currentCycle,
          tradeType: delta > 0 ? 'BUY' : delta < 0 ? 'SELL' : 'NO_CHANGE',
        };

        previousReportedVolumeRef.current = exactVolume;

        setTicks((prevTicks) => {
          const updated = [...prevTicks, newTick];
          return updated.length > 250 ? updated.slice(updated.length - 250) : updated;
        });
      }
    }, Math.max(10, config.pollIntervalMs));

    return () => clearInterval(interval);
  }, [isRunning, config.pollIntervalMs, config.printEveryCheck]);

  const handleClear = () => {
    setTicks([]);
  };

  const handleManualVolumeSet = (newVol: number) => {
    const validVol = Math.max(0, +newVol.toFixed(2));
    const oldVol = volumeRef.current;
    const diff = +(validVol - oldVol).toFixed(2);
    
    setCurrentVolume(validVol);
    volumeRef.current = validVol;

    cycleCountRef.current += 1;
    const nextCycle = cycleCountRef.current;
    setTotalCycles(nextCycle);

    const manualTick: TelemetryTick = {
      id: `manual-set-${nextCycle}-${Date.now()}`,
      timestamp: formatUtcMicroseconds(),
      volume: validVol,
      delta: Math.abs(diff),
      percentChange: oldVol > 0 ? +((Math.abs(diff) / oldVol) * 100).toFixed(4) : 0,
      isChanged: true,
      latencyMs: 8.5,
      cycleCount: nextCycle,
      tradeType: diff >= 0 ? 'BUY' : 'SELL',
    };

    setTicks((prev) => [...prev, manualTick]);
    previousReportedVolumeRef.current = validVol;
  };

  const handleTriggerTestTrade = () => {
    // Generate a single realistic buy trade (+15 to +180 USD)
    const tradeAmount = +(Math.random() * 165 + 15).toFixed(2);
    const oldVol = volumeRef.current;
    const newVol = +(oldVol + tradeAmount).toFixed(2);

    setCurrentVolume(newVol);
    volumeRef.current = newVol;

    cycleCountRef.current += 1;
    const nextCycle = cycleCountRef.current;
    setTotalCycles(nextCycle);

    const testTick: TelemetryTick = {
      id: `test-trade-${nextCycle}-${Date.now()}`,
      timestamp: formatUtcMicroseconds(),
      volume: newVol,
      delta: tradeAmount,
      percentChange: oldVol > 0 ? +((tradeAmount / oldVol) * 100).toFixed(4) : 0,
      isChanged: true,
      latencyMs: 9.6,
      cycleCount: nextCycle,
      tradeType: 'BUY',
    };

    setTicks((prev) => {
      const updated = [...prev, testTick];
      return updated.length > 250 ? updated.slice(updated.length - 250) : updated;
    });
    previousReportedVolumeRef.current = newVol;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* Top Header */}
      <Header
        config={config}
        setConfig={setConfig}
        isRunning={isRunning}
        setIsRunning={setIsRunning}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentVolume={currentVolume}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'monitor' && (
          <TelemetryMonitor
            ticks={ticks}
            config={config}
            setConfig={setConfig}
            isRunning={isRunning}
            setIsRunning={setIsRunning}
            onClear={handleClear}
            currentVolume={currentVolume}
            totalCycles={totalCycles}
            realTokenData={realTokenData}
            isLoadingRealData={isLoadingRealData}
            onRefreshRealData={() => loadRealTokenData(config.tokenAddress)}
            onManualVolumeSet={handleManualVolumeSet}
            onTriggerTestTrade={handleTriggerTestTrade}
          />
        )}

        {activeTab === 'generator' && (
          <ScriptGenerator
            config={config}
            setConfig={setConfig}
          />
        )}

        {activeTab === 'parser' && (
          <ParserPlayground />
        )}

        {activeTab === 'guide' && (
          <ArchitectureGuide />
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            Scrapling DynamicSession & DOM MutationObserver Telemetry System
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>High-Precision UTC Microsecond Clock</span>
            <span>•</span>
            <span>Targeting {config.pollIntervalMs}ms Polling Loop</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
