import React, { useState, useEffect } from 'react';
import { Sparkles, Play, CheckCircle2, XCircle, Code, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { testExtractVolume } from '../utils/parser';
import { ParseResult } from '../types';

const SAMPLE_INPUTS = [
  { label: 'Standard USD Float', value: 'Volume: $12,453.21' },
  { label: 'Thousand Suffix (K)', value: 'Vol: $123.45K (24h Market Volume)' },
  { label: 'Million Suffix (M)', value: 'Total volume $1.85M traded' },
  { label: 'Billion Suffix (B)', value: 'Volume: $2.4B' },
  { label: 'Plain Number in DOM', value: '<div class="stat-card"><span>volume</span><p>450210.88</p></div>' },
  { label: 'Hyphenated Format', value: 'Volume - 84,102.50 USD' },
];

export const ParserPlayground: React.FC = () => {
  const [inputText, setInputText] = useState<string>('Volume: $12,453.21');
  const [result, setResult] = useState<ParseResult>(() => testExtractVolume('Volume: $12,453.21'));

  useEffect(() => {
    setResult(testExtractVolume(inputText));
  }, [inputText]);

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-zinc-100">
            Pump.fun DOM & Regex Extraction Sandbox
          </h2>
        </div>
        <p className="text-xs text-zinc-400 mt-1">
          Test and verify how the Python <code className="text-emerald-400 font-mono">parse_money()</code> and multi-pattern regular expressions handle varied DOM text representations, comma separators, and shorthand metric suffixes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Input Sandbox (6 cols) */}
        <div className="lg:col-span-6 bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="test-input-area" className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
              Test Input Snippet
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">
              Live DOM / Text input
            </span>
          </div>

          <textarea
            id="test-input-area"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            placeholder="Paste scraped DOM text or volume element here..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-emerald-500"
          />

          {/* Preset Buttons */}
          <div>
            <span className="text-[11px] text-zinc-400 font-mono block mb-2">Preset Test Cases:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_INPUTS.map((sample, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(sample.value)}
                  className="px-2.5 py-1 rounded text-xs font-mono bg-zinc-950 border border-zinc-800 text-zinc-300 hover:text-emerald-400 hover:border-emerald-500/40 transition-colors"
                >
                  {sample.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Parser Output Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-zinc-950 border border-zinc-800 rounded-xl p-5 space-y-4 flex flex-col justify-between">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <span className="text-xs font-bold text-zinc-300 font-mono uppercase tracking-wider">
                Extraction Results
              </span>
              <div className="flex items-center gap-1.5">
                {result.success ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Matched
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-rose-500/10 text-rose-400 border border-rose-500/30">
                    <XCircle className="h-3.5 w-3.5" /> No Match
                  </span>
                )}
                <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-0.5">
                  <Clock className="h-3 w-3" /> {result.executionTimeUs} μs
                </span>
              </div>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Formatted Volume</span>
                <span className="text-emerald-400 font-bold text-base mt-1 block">
                  {result.formattedOutput}
                </span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Numeric Value</span>
                <span className="text-zinc-200 font-bold text-base mt-1 block">
                  {result.parsedNumber !== null ? result.parsedNumber.toFixed(2) : 'None'}
                </span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Matched Pattern</span>
                <span className="text-zinc-300 mt-1 block truncate" title={result.matchedPattern || ''}>
                  {result.matchedPattern || 'None'}
                </span>
              </div>

              <div className="bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80">
                <span className="text-zinc-500 block text-[11px]">Multiplier Detected</span>
                <span className="text-zinc-300 mt-1 block">
                  x{result.multiplier.toLocaleString()} {result.multiplier === 1000 ? '(Kilo)' : result.multiplier === 1000000 ? '(Mega)' : result.multiplier === 1000000000 ? '(Giga)' : '(Unit)'}
                </span>
              </div>
            </div>

            {/* Regex Pattern Explainer */}
            <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-lg p-3 text-xs font-mono space-y-1.5">
              <div className="text-zinc-400 text-[11px] font-semibold">Active Python Regex Strategy:</div>
              <code className="text-emerald-300 block bg-zinc-950 p-2 rounded text-[11px] overflow-x-auto">
                r"volume\s*[:\-]??\s*\$?\s*([\d,]+(?:\.\d+)?[KMB]?)"
              </code>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 font-mono border-t border-zinc-800 pt-2 flex items-center justify-between">
            <span>Decimal Precision: Python <code className="text-zinc-400">decimal.Decimal</code></span>
            <span>Zero float rounding loss</span>
          </div>

        </div>

      </div>

    </div>
  );
};
