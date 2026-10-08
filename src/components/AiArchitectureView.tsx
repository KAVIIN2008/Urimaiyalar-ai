import React, { useState } from 'react';
import {
  Brain,
  Layers,
  ShieldCheck,
  Database,
  ArrowDown,
  Workflow,
  Server,
  Zap,
} from 'lucide-react';
import { LanguageCode } from '../types';

export const AiArchitectureView: React.FC<{ language: LanguageCode }> = ({ language }) => {
  const [selectedLayer, setSelectedLayer] = useState<string>('gateway');

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-[#070b14] text-slate-900 dark:text-slate-100 transition-colors">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400">
                  <Brain className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    Urimaiyalar OS — AI Architecture & Transparency
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    High-reliability, provider-independent multi-agent architecture with zero arbitrary SQL.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Active Gateway: Groq LPU
              </span>
            </div>
          </div>
        </div>

        {/* Visual Architecture Map */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Workflow className="h-5 w-5 text-blue-500" />
                System Execution Topology
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Click any layer to inspect its implementation, security guards, and guarantees.
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-400">10-Layer Production Design</span>
          </div>

          {/* Interactive Topology Graph */}
          <div className="flex flex-col items-center gap-4 py-4">
            {/* 1. User Layer */}
            <div className="w-full max-w-lg rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-center dark:border-blue-900/40 dark:bg-blue-950/20">
              <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                User Input Layer
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                Microphone Voice (Tamil, Tanglish, Hindi) & Natural Language Text
              </p>
            </div>

            <ArrowDown className="h-5 w-5 text-slate-400 animate-bounce" />

            {/* 2. Gateway Layer */}
            <div
              onClick={() => setSelectedLayer('gateway')}
              className={`w-full max-w-lg cursor-pointer rounded-xl border p-4 transition-all ${
                selectedLayer === 'gateway'
                  ? 'border-indigo-500 bg-indigo-50/50 shadow-md ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Server className="h-5 w-5 text-indigo-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Centralized LLM Gateway</h3>
                    <p className="text-xs text-slate-500">Provider-Independent Abstraction with Circuit Breakers</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-indigo-600 dark:text-indigo-400 font-bold">Layer 1-2</span>
              </div>
            </div>

            <ArrowDown className="h-5 w-5 text-slate-400" />

            {/* 3. Intent Engine */}
            <div
              onClick={() => setSelectedLayer('intent')}
              className={`w-full max-w-lg cursor-pointer rounded-xl border p-4 transition-all ${
                selectedLayer === 'intent'
                  ? 'border-blue-500 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Strict Intent Engine & Model Router
                    </h3>
                    <p className="text-xs text-slate-500">
                      GREETING (Fast) vs. BUSINESS_ACTION (Structured) vs. RAG (Knowledge)
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">Layer 3</span>
              </div>
            </div>

            <ArrowDown className="h-5 w-5 text-slate-400" />

            {/* 4. Multi-Agent DAG */}
            <div
              onClick={() => setSelectedLayer('agents')}
              className={`w-full max-w-xl cursor-pointer rounded-xl border p-4 transition-all ${
                selectedLayer === 'agents'
                  ? 'border-purple-500 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20 dark:border-purple-400 dark:bg-purple-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <Layers className="h-5 w-5 text-purple-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Master Multi-Agent Orchestrator
                  </h3>
                </div>
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">Layer 4</span>
              </div>
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <div className="rounded bg-slate-100 p-1.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Sales Agent
                </div>
                <div className="rounded bg-slate-100 p-1.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Finance Agent
                </div>
                <div className="rounded bg-slate-100 p-1.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Inventory Agent
                </div>
                <div className="rounded bg-slate-100 p-1.5 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  RAG Agent
                </div>
              </div>
            </div>

            <ArrowDown className="h-5 w-5 text-slate-400" />

            {/* 5. Tool Registry (Zero SQL) */}
            <div
              onClick={() => setSelectedLayer('tools')}
              className={`w-full max-w-lg cursor-pointer rounded-xl border p-4 transition-all ${
                selectedLayer === 'tools'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20 dark:border-emerald-400 dark:bg-emerald-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Zap className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Approved Tool Registry (17 Methods)
                    </h3>
                    <p className="text-xs text-slate-500">Zero Arbitrary SQL • Parameter Schema Validation</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-bold">Layer 5</span>
              </div>
            </div>

            <ArrowDown className="h-5 w-5 text-slate-400" />

            {/* 6. Database Grounding */}
            <div
              onClick={() => setSelectedLayer('database')}
              className={`w-full max-w-lg cursor-pointer rounded-xl border p-4 transition-all ${
                selectedLayer === 'database'
                  ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20 dark:border-amber-400 dark:bg-amber-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Database className="h-5 w-5 text-amber-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Real Database & ACID Grounding
                    </h3>
                    <p className="text-xs text-slate-500">Prisma Transactions • Sole Source of Truth</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">Layer 6</span>
              </div>
            </div>

            <ArrowDown className="h-5 w-5 text-slate-400" />

            {/* 7. Guardian Validator */}
            <div
              onClick={() => setSelectedLayer('validator')}
              className={`w-full max-w-lg cursor-pointer rounded-xl border p-4 transition-all ${
                selectedLayer === 'validator'
                  ? 'border-cyan-500 bg-cyan-50/50 shadow-md ring-2 ring-cyan-500/20 dark:border-cyan-400 dark:bg-cyan-950/30'
                  : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="h-5 w-5 text-cyan-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Guardian Validator Engine
                    </h3>
                    <p className="text-xs text-slate-500">
                      Arithmetic Proof (Rev - Exp = Profit) • Citation Verification
                    </p>
                  </div>
                </div>
                <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">Layer 7</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
