import React from 'react';
import { 
  Zap, 
  Clock, 
  Cpu, 
  Layers, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  Server, 
  Globe, 
  Network,
  Activity
} from 'lucide-react';

export const ArchitectureGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      
      {/* Top Banner explaining the 10ms Reality Check */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-400" />
          <h2 className="text-sm font-bold text-zinc-100">
            Why a 10ms Check Schedule != 10ms Data Freshness
          </h2>
        </div>
        <p className="text-xs text-zinc-300 leading-relaxed max-w-4xl">
          As noted in your analysis, setting your Python loop to <code className="text-emerald-400 font-mono">POLL_INTERVAL_SECONDS = 0.010</code> instructs your local process to evaluate the page every 10 milliseconds. However, webpage volume changes are governed by the server's update cadence and the browser's render pipeline.
        </p>
      </div>

      {/* Latency Pipeline Visualizer */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-emerald-400" />
          The High-Frequency Scraping Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 font-mono text-xs">
          
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 space-y-1.5">
            <div className="text-[11px] text-zinc-500 font-semibold">1. Solana Blockchain</div>
            <div className="text-zinc-200 font-bold">~400ms Slot Time</div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Trades confirm in blocks. New volume values only exist once slots finalize on-chain.
            </p>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 space-y-1.5">
            <div className="text-[11px] text-zinc-500 font-semibold">2. Pump.fun Backend & CDN</div>
            <div className="text-zinc-200 font-bold">50ms - 250ms</div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Pump servers aggregate swap volumes and push delta packages to frontend clients.
            </p>
          </div>

          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-3 space-y-1.5">
            <div className="text-[11px] text-zinc-500 font-semibold">3. DOM Render & Paint</div>
            <div className="text-zinc-200 font-bold">16ms (60 FPS V8)</div>
            <p className="text-[11px] text-zinc-400 font-sans">
              Chromium parses React virtual DOM mutations and updates inner text nodes.
            </p>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-3 space-y-1.5">
            <div className="text-[11px] text-emerald-400 font-semibold">4. Your Scraper</div>
            <div className="text-emerald-300 font-bold">10ms Check Schedule</div>
            <p className="text-[11px] text-zinc-300 font-sans">
              Catches every single DOM paint the exact moment it hits the browser tree.
            </p>
          </div>

        </div>
      </div>

      {/* Comparison of the 3 Architectural Approaches */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* v1: Repeated Fetch */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-zinc-200">v1: Repeated Fetch</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">Baseline</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Calls <code className="text-zinc-300 font-mono text-[11px]">session.fetch()</code> on an open DynamicSession repeatedly.
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-400 pt-1">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Simple Scrapling wrapper implementation</span>
              </li>
              <li className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Re-executes navigation/parsing loop</span>
              </li>
              <li className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Page re-render latency (~100-300ms)</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-zinc-500">
            Efficiency: <span className="text-zinc-300">Moderate</span>
          </div>
        </div>

        {/* v2: Persistent DOM Observer (Requested Solution!) */}
        <div className="bg-emerald-950/20 border border-emerald-500/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-emerald-400">v2: DOM MutationObserver</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Optimal Scraping</span>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Loads the token page once. Injects a browser <code className="text-emerald-300 font-mono text-[11px]">MutationObserver</code> that triggers Python callbacks instantly on text changes.
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-300 pt-1">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Zero network refetch overhead</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Immediate sub-millisecond reaction</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Low CPU utilization in background</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-emerald-500/20 text-[11px] font-mono text-emerald-400">
            Efficiency: <span className="font-bold">High (Zero Refetches)</span>
          </div>
        </div>

        {/* v3: Direct WebSocket Stream */}
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-mono text-purple-400">v3: WebSocket RPC Feed</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">Sub-ms Trade Feed</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Direct WebSocket connection to Pump trade event feeds, bypassing headless browser rendering completely.
            </p>
            <ul className="space-y-1.5 text-xs text-zinc-400 pt-1">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>No Chromium/browser memory footprint</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0 mt-0.5" />
                <span>Individual buy/sell transaction streaming</span>
              </li>
              <li className="flex items-start gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5 text-zinc-500 shrink-0 mt-0.5" />
                <span>Requires active WebSocket server connection</span>
              </li>
            </ul>
          </div>
          <div className="pt-2 border-t border-zinc-800/80 text-[11px] font-mono text-purple-400">
            Efficiency: <span className="font-bold">Maximum Throughput</span>
          </div>
        </div>

      </div>

      {/* Code Migration Recommendation Box */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-3">
        <h4 className="text-xs font-bold text-zinc-200 font-mono flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-400" />
          Recommended Next Step for High-Frequency Tracking
        </h4>
        <p className="text-xs text-zinc-400 leading-relaxed">
          If your priority is tracking token volume at the absolute highest frequency with minimal resource consumption, migrate from <strong className="text-zinc-200">repeated polling</strong> to the <strong className="text-emerald-400">single persistent page + DOM MutationObserver (Version 2)</strong>. You can copy or download the complete ready-to-run script directly from the <span className="text-zinc-200 font-semibold">Script Generator</span> tab.
        </p>
      </div>

    </div>
  );
};
