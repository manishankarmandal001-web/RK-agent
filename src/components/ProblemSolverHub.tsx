import React, { useState } from 'react';
import { ProblemSolveResult } from '../types/agent';
import { solveProblemWithAi, requestAgentTts } from '../services/agentApi';
import {
  Brain,
  Sparkles,
  Code,
  Calculator,
  Compass,
  Cpu,
  CheckCircle,
  Copy,
  Volume2,
  Send,
  HelpCircle,
} from 'lucide-react';

interface ProblemSolverHubProps {
  onSpeakSolution?: (text: string) => void;
  onAgentActionLog?: (log: string) => void;
}

export const ProblemSolverHub: React.FC<ProblemSolverHubProps> = ({
  onSpeakSolution,
  onAgentActionLog,
}) => {
  const [problemQuery, setProblemQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('algorithm_math');
  const [isSolving, setIsSolving] = useState(false);
  const [activeResult, setActiveResult] = useState<ProblemSolveResult | null>(null);
  const [copied, setCopied] = useState(false);

  const samplePresets = [
    {
      titleBn: 'অ্যালগরিদম ও ডেটা স্ট্রাকচার (বাংলায় সমাধান)',
      titleEn: 'Dynamic Programming: 0/1 Knapsack & Optimization',
      prompt: '0/1 Knapsack Problem এর অপটিমাল সমাধান এবং এর Time & Space Complexity বাংলায় ধাপে ধাপে কোড সহ বুঝিয়ে সমাধান করো।',
      domain: 'Computer Science',
    },
    {
      titleBn: 'উচ্চতর গণিত ও ক্যালকুলাস',
      titleEn: 'Advanced Calculus: Differential Equations',
      prompt: 'Solve the second-order linear differential equation y" + 4y\' + 13y = 3e^(-2x) with initial conditions y(0)=1, y\'(0)=-1.',
      domain: 'Mathematics',
    },
    {
      titleBn: 'বিজনেস ও স্টার্টআপ গ্রোথ স্ট্র্যাটেজি',
      titleEn: 'Enterprise System Architecture & Scalability',
      prompt: 'Design a resilient distributed microservices architecture for handling 50,000 real-time WhatsApp & Email messages per second with fault tolerance and low latency.',
      domain: 'System Architecture',
    },
    {
      titleBn: 'কোডিং ডিবাগিং ও রিফ্যাক্টরিং',
      titleEn: 'React + Node Concurrency & Memory Leak Debugging',
      prompt: 'Provide an advanced analysis of how to debug and prevent memory leaks in a real-time Web Audio API and Canvas application running at 60 FPS.',
      domain: 'Full-Stack Engineering',
    },
  ];

  const handleSolve = async (overridePrompt?: string) => {
    const textToSolve = overridePrompt || problemQuery;
    if (!textToSolve.trim()) return;

    setIsSolving(true);
    try {
      const res = await solveProblemWithAi({
        problem: textToSolve,
        domain: selectedDomain,
      });

      const formattedResult: ProblemSolveResult = {
        id: 'sol_' + Date.now(),
        query: textToSolve,
        title: res.title || 'Advanced Analytical Solution',
        difficulty: res.difficulty || 'Advanced Level',
        language: res.language || 'Multilingual',
        steps: res.steps || [],
        finalAnswer: res.finalAnswer || '',
        recommendations: res.recommendations || [],
        timestamp: new Date().toLocaleTimeString(),
      };

      setActiveResult(formattedResult);
      onAgentActionLog?.(`Solved problem: "${formattedResult.title}"`);
    } catch (err) {
      console.error('Problem solving failed:', err);
    } finally {
      setIsSolving(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Advanced Reasoning & Problem Solver</h3>
            <p className="text-xs text-slate-400 font-mono">
              STEM · Complex Coding · Advanced Mathematics · Business Strategy · Deep Logic
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
            <Cpu className="w-3.5 h-3.5" />
            Gemini 3.8 Flash Reasoning Engine
          </span>
        </div>
      </div>

      {/* Preset Problem Templates */}
      <div>
        <p className="text-xs font-mono text-slate-400 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          Try Advanced Challenge Presets:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {samplePresets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setProblemQuery(preset.prompt);
                handleSolve(preset.prompt);
              }}
              className="p-3 text-left rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 transition-all cursor-pointer group"
            >
              <span className="block text-[11px] font-mono text-cyan-400 group-hover:text-cyan-300">
                {preset.domain}
              </span>
              <h5 className="text-xs font-medium text-slate-200 mt-1 line-clamp-1">{preset.titleEn}</h5>
              <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.titleBn}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <label className="font-mono">Pose your advanced question or problem in any language:</label>
          <div className="flex items-center gap-2">
            <span>Domain:</span>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200"
            >
              <option value="algorithm_math">Coding & Computer Science</option>
              <option value="mathematics">Higher Mathematics & Calculus</option>
              <option value="system_architecture">Architecture & Cloud</option>
              <option value="business_strategy">Business & Finance Strategy</option>
              <option value="science_logic">Scientific & Logical Reasoning</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <textarea
            rows={3}
            value={problemQuery}
            onChange={(e) => setProblemQuery(e.target.value)}
            placeholder="Write your complex question in Bengali, English, or Hindi (e.g. '0/1 Knapsack অ্যালগরিদম ব্যাখ্যা ও পাইথন কোড দাও' অথবা 'Explain quantum computing superdense coding mathematically')..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
          />

          <button
            onClick={() => handleSolve()}
            disabled={!problemQuery.trim() || isSolving}
            className="px-6 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold flex flex-col items-center justify-center gap-1 shadow-lg transition-all cursor-pointer"
          >
            <Send className="w-5 h-5" />
            <span className="text-xs">{isSolving ? 'Solving...' : 'Solve'}</span>
          </button>
        </div>
      </div>

      {/* Solution Display */}
      {isSolving ? (
        <div className="p-12 rounded-xl bg-slate-950/40 border border-slate-800/80 flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
          <h4 className="text-sm font-semibold text-white">Synthesizing Deep Multi-Step Solution...</h4>
          <p className="text-xs text-slate-400">
            Applying algorithmic reasoning, mathematical verification, and language synthesis
          </p>
        </div>
      ) : activeResult ? (
        <div className="p-6 rounded-xl bg-slate-950/80 border border-cyan-500/30 shadow-2xl flex flex-col gap-5">
          {/* Solution Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {activeResult.difficulty}
                </span>
                <span className="text-xs text-slate-400 font-mono">· {activeResult.timestamp}</span>
              </div>
              <h4 className="text-lg font-bold text-white">{activeResult.title}</h4>
            </div>

            <div className="flex items-center gap-2">
              {onSpeakSolution && (
                <button
                  onClick={() => onSpeakSolution(activeResult.finalAnswer)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Speak Solution using Human Voice"
                >
                  <Volume2 className="w-3.5 h-3.5" /> Speak
                </button>
              )}

              <button
                onClick={() =>
                  handleCopy(
                    `${activeResult.title}\n\n` +
                      activeResult.steps.map((s) => `${s.stepNumber}. ${s.title}: ${s.explanation}`).join('\n\n') +
                      `\n\nFinal Answer:\n${activeResult.finalAnswer}`
                  )
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Breakdown Steps */}
          <div className="space-y-4">
            <h5 className="text-xs font-mono uppercase text-slate-400 tracking-wider">
              Step-by-Step Analytical Breakdown:
            </h5>
            {activeResult.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-bold flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </span>
                  <h6 className="text-sm font-semibold text-slate-100">{step.title}</h6>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap pl-8">
                  {step.explanation}
                </p>

                {step.codeOrFormula && (
                  <div className="mt-2 ml-8 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono text-cyan-300 overflow-x-auto whitespace-pre">
                    {step.codeOrFormula}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Final Definitive Answer */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-950/60 to-cyan-950/60 border border-emerald-500/40">
            <div className="flex items-center gap-2 text-emerald-400 font-mono font-semibold text-xs mb-1.5">
              <CheckCircle className="w-4 h-4" />
              <span>Final Verified Conclusion & Solution</span>
            </div>
            <p className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">
              {activeResult.finalAnswer}
            </p>
          </div>

          {/* Strategic Recommendations */}
          {activeResult.recommendations && activeResult.recommendations.length > 0 && (
            <div className="pt-2 border-t border-slate-800/80">
              <h6 className="text-xs font-mono text-slate-400 mb-2">Key Insights & Recommendations:</h6>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-300">
                {activeResult.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
