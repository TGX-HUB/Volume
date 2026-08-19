import { ParseResult } from '../types';

export function cleanText(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/\s+/g, ' ').trim();
}

export function parseMoney(value: string | null | undefined): { number: number | null; multiplier: number; rawCleaned: string } {
  if (!value) return { number: null, multiplier: 1, rawCleaned: '' };

  let text = cleanText(value);
  if (!text) return { number: null, multiplier: 1, rawCleaned: '' };

  text = text.replace(/\$/g, '').replace(/,/g, '').trim();

  let multiplier = 1;
  const lastChar = text.slice(-1).toUpperCase();

  if (lastChar === 'K') {
    multiplier = 1_000;
    text = text.slice(0, -1).trim();
  } else if (lastChar === 'M') {
    multiplier = 1_000_000;
    text = text.slice(0, -1).trim();
  } else if (lastChar === 'B') {
    multiplier = 1_000_000_000;
    text = text.slice(0, -1).trim();
  }

  const parsed = parseFloat(text);
  if (isNaN(parsed) || !isFinite(parsed)) {
    return { number: null, multiplier, rawCleaned: text };
  }

  return {
    number: parsed * multiplier,
    multiplier,
    rawCleaned: text,
  };
}

export function testExtractVolume(inputText: string): ParseResult {
  const start = performance.now();
  const cleaned = cleanText(inputText);

  const patterns = [
    { name: 'Standard "Volume: $..."', regex: /volume\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d+)?[KMB]?)/i },
    { name: 'Short "Vol $..."', regex: /vol\.?\s*[:\-]?\s*\$?\s*([\d,]+(?:\.\d+)?[KMB]?)/i },
    { name: 'DOM Fallback "$..." near volume', regex: /\$?\s*([\d,]+(?:\.\d+)?[KMB]?)/i },
  ];

  let matchedPattern: string | null = null;
  let extractedValue: string | null = null;
  let parsedNumber: number | null = null;
  let multiplier = 1;

  for (const { name, regex } of patterns) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      const parse = parseMoney(match[1]);
      if (parse.number !== null) {
        matchedPattern = name;
        extractedValue = match[1];
        parsedNumber = parse.number;
        multiplier = parse.multiplier;
        break;
      }
    }
  }

  const durationUs = Math.round((performance.now() - start) * 1000);

  return {
    rawInput: inputText,
    matchedPattern,
    extractedValue,
    parsedNumber,
    multiplier,
    formattedOutput: parsedNumber !== null ? `$${parsedNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'UNKNOWN',
    success: parsedNumber !== null,
    executionTimeUs: durationUs,
  };
}

export function formatUtcMicroseconds(date: Date = new Date()): string {
  const iso = date.toISOString();
  // Generate random 3-digit microsecond suffix to simulate high-res clock
  const micros = Math.floor(Math.random() * 900 + 100);
  return iso.replace('Z', `${micros}+00:00`);
}
