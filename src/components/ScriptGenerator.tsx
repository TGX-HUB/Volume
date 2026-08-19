import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Download, 
  FileCode, 
  Sliders, 
  Sparkles, 
  Terminal, 
  Zap, 
  Layers, 
  HelpCircle,
  ExternalLink 
} from 'lucide-react';
import { ScraperConfig } from '../types';
import { 
  generateRepeatedFetchScript, 
  generateDomObserverScript, 
  generateWebSocketStreamerScript, 
  generateSetupBatch, 
  generateRequirementsTxt 
} from '../utils/generators';

interface ScriptGeneratorProps {
  config: ScraperConfig;
  setConfig: React.Dispatch<React.SetStateAction<ScraperConfig>>;
}

export const ScriptGenerator: React.FC<ScriptGeneratorProps> = ({ config, setConfig }) => {
  const [selectedScript, setSelectedScript] = useState<'v1_fetch' | 'v2_dom' | 'v3_ws' | 'setup_bat' | 'requirements'>('v2_dom');
  const [copied, setCopied] = useState<boolean>(false);

  const getActiveCode = () => {
    switch (selectedScript) {
      case 'v1_fetch':
        return generateRepeatedFetchScript(config);
      case 'v2_dom':
        return generateDomObserverScript(config);
      case 'v3_ws':
        return generateWebSocketStreamerScript(config);
      case 'setup_bat':
        return generateSetupBatch();
      case 'requirements':
        return generateRequirementsTxt();
      default:
        return '';
    }
  };

  const getFilename = () => {
    switch (selectedScript) {
      case 'v1_fetch':
        return 'pump_volume_scraper.py';
      case 'v2_dom':
        return 'pump_dom_observer.py';
      case 'v3_ws':
        return 'pump_ws_streamer.py';
      case 'setup_bat':
        return 'setup_windows.bat';
      case 'requirements':
        return 'requirements.txt';
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getActiveCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const code = getActiveCode();
    const filename = getFilename();
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllZip = () => {
    // Download primary script
    handleDownload();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner introducing the Requested Version 2 */}
      <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-zinc-900 border border-emerald-500/30 rounded-xl p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                RECOMMENDED ARCHITECTURE
              </span>
              <h2 className="text-sm font-bold text-zinc-100">
                Single Persistent Page + DOM MutationObserver (v2)
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl leading-relaxed">
              Eliminates the network overhead of repeatedly calling <code className="text-emerald-400 bg-zinc-950 px-1 py-0.5 rounded font-mono">session.fetch()</code> every 10ms. Keeps a single live Pump.fun page open and evaluates DOM mutations directly in the browser's JavaScript V8 thread with zero roundtrip delay.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedScript('v2_dom')}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              View v2 DOM Observer
            </button>
          </div>
        </div>
      </div>

      {/* Script Options Selector & Configuration Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Settings Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Script Type Picker */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-emerald-400" />
              Select Implementation
            </h3>

            <div className="space-y-1.5">
              
              {/* Option 2: DOM Observer */}
              <button
                onClick={() => setSelectedScript('v2_dom')}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedScript === 'v2_dom'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">v2: DOM MutationObserver</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">Zero Fetch</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  Persistent page listening to DOM tree mutations via Playwright binding.
                </p>
              </button>

              {/* Option 1: Repeated Fetch */}
              <button
                onClick={() => setSelectedScript('v1_fetch')}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedScript === 'v1_fetch'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">v1: Scrapling DynamicSession</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">10ms Poller</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  Your baseline script with multi-regex search & Decimal parse money helpers.
                </p>
              </button>

              {/* Option 3: WebSocket */}
              <button
                onClick={() => setSelectedScript('v3_ws')}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedScript === 'v3_ws'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">v3: WebSocket RPC Stream</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">0ms Headless</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  Direct pump trade subscription without rendering any HTML DOM.
                </p>
              </button>

              {/* Windows Setup Batch */}
              <button
                onClick={() => setSelectedScript('setup_bat')}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedScript === 'setup_bat'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold font-mono">Windows setup_windows.bat</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">1-Click CMD</span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                  Automated venv, pip upgrade, scrapling install & chromium download script.
                </p>
              </button>

              {/* requirements.txt */}
              <button
                onClick={() => setSelectedScript('requirements')}
                className={`w-full text-left p-2.5 rounded-lg border transition-all ${
                  selectedScript === 'requirements'
                    ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                }`}
              >
                <span className="text-xs font-bold font-mono">requirements.txt</span>
              </button>
            </div>
          </div>

          {/* Script Parameter Customizer */}
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3.5">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-emerald-400" />
              Live Parameter Injection
            </h3>

            {/* Token Address */}
            <div className="space-y-1">
              <label htmlFor="script-token-input" className="text-xs text-zinc-400 font-mono">Token Address (Mint)</label>
              <input
                id="script-token-input"
                type="text"
                value={config.tokenAddress}
                onChange={(e) => setConfig((prev) => ({ ...prev, tokenAddress: e.target.value.trim() }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
                placeholder="Contract Address"
              />
            </div>

            {/* Polling Interval */}
            <div className="space-y-1">
              <label htmlFor="script-poll-input" className="text-xs text-zinc-400 font-mono">Poll Interval (ms)</label>
              <input
                id="script-poll-input"
                type="number"
                min="5"
                max="5000"
                value={config.pollIntervalMs}
                onChange={(e) => setConfig((prev) => ({ ...prev, pollIntervalMs: Number(e.target.value) }))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Headless Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400 font-mono">Headless Mode</span>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, headless: !prev.headless }))}
                className={`px-2.5 py-1 rounded text-xs font-mono border ${
                  config.headless
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {config.headless ? 'True (Background)' : 'False (Visible Window)'}
              </button>
            </div>

            {/* Print Every Check Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-zinc-400 font-mono">Print Every Check</span>
              <button
                onClick={() => setConfig((prev) => ({ ...prev, printEveryCheck: !prev.printEveryCheck }))}
                className={`px-2.5 py-1 rounded text-xs font-mono border ${
                  config.printEveryCheck
                    ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                    : 'bg-zinc-800 text-zinc-300 border-zinc-700'
                }`}
              >
                {config.printEveryCheck ? 'True (Verbose)' : 'False (On Change)'}
              </button>
            </div>

          </div>

        </div>

        {/* Right Code Display Area (8 cols) */}
        <div className="lg:col-span-8 bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden flex flex-col">
          
          {/* Code Viewer Header */}
          <div className="bg-zinc-900 px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <FileCode className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-mono font-bold text-zinc-200">
                {getFilename()}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                Python 3.10+
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-md text-xs font-mono bg-zinc-800 hover:bg-zinc-700 text-zinc-200 flex items-center gap-1.5 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied to Clipboard' : 'Copy Code'}
              </button>

              <button
                onClick={handleDownload}
                className="px-3 py-1.5 rounded-md text-xs font-mono bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Download {getFilename()}
              </button>
            </div>
          </div>

          {/* Code Display */}
          <div className="p-4 font-mono text-xs leading-relaxed overflow-x-auto max-h-[560px] min-h-[460px] bg-black/95 text-zinc-300">
            <pre className="text-zinc-200">
              <code>{getActiveCode()}</code>
            </pre>
          </div>

          {/* Code Footer Quick Execution Guide */}
          <div className="bg-zinc-900/90 px-4 py-3 border-t border-zinc-800 text-xs font-mono text-zinc-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Run:</span>
              <code className="text-emerald-400 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                python {getFilename()}
              </code>
            </div>
            <div className="text-[11px] text-zinc-500">
              Uses Scrapling DynamicSession / Chromium V8 Event Engine
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
