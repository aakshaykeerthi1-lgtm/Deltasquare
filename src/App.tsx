
import React, { useState, useEffect, useCallback } from 'react';
import { Subject, DoubtResult, HistoryItem } from './types';
import { solveDoubt, generateDiagram, getQuickDiagramPrompt } from './services/geminiService';
import { 
  Atom, 
  Beaker, 
  Dna, 
  PlusCircle, 
  History as HistoryIcon, 
  Loader2, 
  Image as ImageIcon,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  HelpCircle,
  Menu,
  X,
  Zap,
  Copy,
  Printer,
  Share2,
  Check
} from 'lucide-react';

const Logo = ({ className = "w-10 h-10" }: { className?: string }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 20H70V35M70 55V80H20V20Z" stroke="#f59e0b" strokeWidth="4" className="drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
    <path d="M45 45L65 15L85 45H45Z" stroke="#0ea5e9" strokeWidth="4" className="drop-shadow-[0_0_8px_rgba(14,165,233,0.8)]" />
    <path d="M55 40L65 25L75 40H55Z" stroke="#0ea5e9" strokeWidth="2" fill="#0ea5e9" fillOpacity="0.2" />
    <text x="82" y="32" fill="#f59e0b" fontSize="16" fontWeight="bold" className="drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]">2</text>
  </svg>
);

const App: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState<Subject>(Subject.PHYSICS);
  const [question, setQuestion] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [result, setResult] = useState<DoubtResult | null>(null);
  const [diagramUrl, setDiagramUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hasKey, setHasKey] = useState<boolean>(true);

  useEffect(() => {
    const checkKey = async () => {
      if ((window as any).aistudio) {
        const selected = await (window as any).aistudio.hasSelectedApiKey();
        setHasKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleOpenKey = async () => {
    if ((window as any).aistudio) {
      await (window as any).aistudio.openSelectKey();
      setHasKey(true);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('deltasquare_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('deltasquare_history', JSON.stringify(history));
  }, [history]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Image((reader.result as string).split(',')[1]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async () => {
    if (!question.trim() && !base64Image) return;

    setIsSolving(true);
    setResult(null);
    setDiagramUrl(null);

    try {
      // Start diagram generation immediately in the background
      getQuickDiagramPrompt(question, selectedSubject, base64Image || undefined).then(async (prompt) => {
        const imgUrl = await generateDiagram(prompt);
        setDiagramUrl(imgUrl);
      }).catch(err => console.error("Quick diagram failed:", err));

      const solution = await solveDoubt(question, selectedSubject, base64Image || undefined);
      setResult(solution);
      setIsSolving(false); // Show the text solution immediately
      
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        question: question || "Visual Query",
        subject: selectedSubject,
        result: solution,
        timestamp: Date.now()
      };
      setHistory(prev => [newItem, ...prev].slice(0, 10));
    } catch (error: any) {
      console.error("Error solving doubt:", error);
      const message = error.message?.includes("GEMINI_API_KEY") 
        ? "API Key Missing: Please add GEMINI_API_KEY to Vercel environment variables."
        : "Something went wrong. Please check your connection and try again.";
      alert(message);
    } finally {
      setIsSolving(false);
    }
  };

  const clearCurrent = () => {
    setResult(null);
    setQuestion('');
    setDiagramUrl(null);
    setBase64Image(null);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setResult(item.result);
    setQuestion(item.question);
    setSelectedSubject(item.subject);
    setIsSidebarOpen(false);
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `Doubt: ${question}\n\nExplanation:\n${result.explanation}\n\nSteps:\n${result.stepByStep.join('\n')}\n\nStudy Tips:\n${result.tips.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareSolution = () => {
    if (navigator.share) {
      navigator.share({
        title: 'DeltaSquare Doubt Solution',
        text: `Check out this ${selectedSubject} solution from DeltaSquare: ${question}`,
        url: window.location.href,
      }).catch(console.error);
    }
  };

  const SubjectIcon = ({ subject, className }: { subject: Subject; className?: string }) => {
    switch (subject) {
      case Subject.PHYSICS: return <Atom className={className} />;
      case Subject.CHEMISTRY: return <Beaker className={className} />;
      case Subject.BIOLOGY: return <Dna className={className} />;
      case Subject.MATHEMATICS: return <PlusCircle className={className} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row font-sans text-slate-200 bg-[#030712] circuit-bg">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-[#0b1120] border-b border-slate-800 text-white sticky top-0 z-50 shadow-lg no-print">
        <div className="flex items-center gap-2">
          <Logo className="w-8 h-8" />
          <h1 className="text-xl font-bold tracking-tight text-slate-100">DELTA<span className="text-[#f59e0b]">SQUARE</span></h1>
        </div>
        <div className="flex items-center gap-2">
          {!hasKey && (
            <button 
              onClick={handleOpenKey}
              className="p-2 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 rounded-full"
              title="Connect API Key"
            >
              <Zap className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
            {isSidebarOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-[#0b1120] border-r border-slate-800 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 no-print
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="hidden md:flex items-center gap-3 p-6 bg-[#0f172a] border-b border-slate-800">
            <Logo className="w-10 h-10" />
            <div>
              <h1 className="text-lg font-bold leading-tight text-white">DELTA<span className="text-[#f59e0b]">SQUARE</span></h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-widest uppercase">12th Science Expert</p>
            </div>
          </div>

          {!hasKey && (
            <div className="p-4 bg-[#f59e0b]/5 border-b border-[#f59e0b]/10">
              <button 
                onClick={handleOpenKey}
                className="w-full flex items-center justify-center gap-2 py-2 bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#f59e0b]/20 transition-all"
              >
                <Zap className="w-3 h-3" /> Connect API Key
              </button>
            </div>
          )}

          <div className="p-4">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Select Subject</h2>
            <div className="space-y-1">
              {Object.values(Subject).map((sub) => (
                <button
                  key={sub}
                  onClick={() => setSelectedSubject(sub)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    selectedSubject === sub 
                      ? 'bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/30 neon-blue' 
                      : 'text-slate-400 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <SubjectIcon subject={sub} className={`w-5 h-5 ${selectedSubject === sub ? 'text-[#0ea5e9]' : 'text-slate-500'}`} />
                  <span className="font-medium">{sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <h2 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1 mb-4">
              <HistoryIcon className="w-3 h-3" /> Recent Queries
            </h2>
            {history.length === 0 ? (
              <p className="text-xs text-slate-600 italic px-2">History is empty</p>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => loadHistoryItem(item)}
                    className="w-full text-left p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:border-[#f59e0b]/50 transition-all group"
                  >
                    <p className="text-sm font-medium line-clamp-2 text-slate-300 group-hover:text-white">
                      {item.question}
                    </p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {item.subject} • {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
            <button 
              onClick={() => { clearCurrent(); setIsSidebarOpen(false); }}
              className="w-full py-4 px-4 bg-[#f59e0b] text-slate-900 rounded-xl font-black hover:bg-[#d97706] transition-all flex items-center justify-center gap-2 neon-orange uppercase tracking-wider text-xs"
            >
              <PlusCircle className="w-5 h-5" /> New Doubt
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-12 scroll-smooth">
          {!result && !isSolving && (
            <div className="max-w-3xl mx-auto mt-12 text-center animate-in fade-in zoom-in-95 duration-700">
              <div className="inline-flex p-8 bg-slate-900/50 border border-[#0ea5e9]/20 rounded-full mb-10 relative">
                <HelpCircle className="w-20 h-20 text-[#0ea5e9] animate-pulse" />
                <div className="absolute inset-0 bg-[#0ea5e9]/5 rounded-full blur-2xl"></div>
              </div>
              <h2 className="text-5xl font-black text-white mb-6 tracking-tighter leading-none uppercase">
                Expert NCERT <br/> <span className="text-[#f59e0b]">Clarity</span>
              </h2>
              <p className="text-slate-400 mb-12 max-w-lg mx-auto text-xl font-medium">
                Type or upload your doubt. DeltaSquare's AI provides institutional-grade 12th science solutions.
              </p>

              <div className="bg-[#0b1120] rounded-[2.5rem] shadow-2xl border border-slate-800 p-8 text-left relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#f59e0b]/5 rounded-full -mr-32 -mt-32 blur-[100px] pointer-events-none"></div>
                <textarea
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={`What is your ${selectedSubject} question today?`}
                  className="w-full h-44 p-6 bg-slate-950/80 border border-slate-800 rounded-3xl focus:ring-2 focus:ring-[#0ea5e9] focus:border-transparent outline-none transition-all resize-none mb-6 text-slate-100 text-lg placeholder-slate-700"
                />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <label className="flex items-center gap-3 px-6 py-4 bg-slate-900/80 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95 group/upload">
                    <ImageIcon className="w-6 h-6 text-[#f59e0b] group-hover/upload:scale-110 transition-transform" />
                    <span className="text-sm font-bold text-slate-300">
                      {base64Image ? 'Photo Attached' : 'Upload Image'}
                    </span>
                    <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  </label>

                  <button
                    onClick={handleSolve}
                    disabled={!question.trim() && !base64Image}
                    className="px-12 py-5 bg-[#0ea5e9] text-white rounded-[2rem] font-black shadow-2xl shadow-[#0ea5e9]/40 hover:bg-[#0284c7] hover:translate-y-[-2px] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 neon-blue uppercase tracking-widest"
                  >
                    Solve Now <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
                {base64Image && (
                  <div className="mt-6 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Image ready for analysis</span>
                    </div>
                    <button onClick={() => setBase64Image(null)} className="text-slate-500 hover:text-white transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {isSolving && (
            <div className="max-w-3xl mx-auto h-[70vh] flex flex-col items-center justify-center space-y-8 animate-in fade-in duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-[#0ea5e9]/20 rounded-full blur-3xl animate-pulse"></div>
                <Loader2 className="w-24 h-24 text-[#0ea5e9] animate-spin relative z-10" />
                <Logo className="w-10 h-10 absolute inset-0 m-auto z-20" />
              </div>
              <div className="text-center">
                <h3 className="text-3xl font-black text-white mb-3">DeltaSquare Intelligence</h3>
                <p className="text-slate-500 text-lg font-medium">Decoding complex scientific logic...</p>
              </div>
            </div>
          )}

          {result && (
            <div className="max-w-5xl mx-auto pb-32 space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
              {/* Result Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-slate-800 pb-8 gap-6 no-print">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-slate-900 border border-[#0ea5e9]/30 rounded-3xl neon-blue">
                    <SubjectIcon subject={selectedSubject} className="w-10 h-10 text-[#0ea5e9]" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedSubject} Master <span className="text-[#0ea5e9]">Output</span></h2>
                    <p className="text-xs text-slate-500 font-mono flex items-center gap-2">
                      <CheckCircle2 className="w-3 h-3 text-emerald-500" /> NCERT VERIFIED • {new Date().toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                  <button 
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-700 hover:border-[#0ea5e9] text-white rounded-2xl transition-all text-sm font-bold group"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400 group-hover:text-[#0ea5e9]" />}
                    {copied ? 'COPIED' : 'COPY TEXT'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-700 hover:border-[#f59e0b] text-white rounded-2xl transition-all text-sm font-bold group"
                  >
                    <Printer className="w-4 h-4 text-slate-400 group-hover:text-[#f59e0b]" /> PRINT
                  </button>
                  <button 
                    onClick={shareSolution}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 border border-slate-700 hover:border-emerald-400 text-white rounded-2xl transition-all text-sm font-bold group"
                  >
                    <Share2 className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" /> SHARE
                  </button>
                </div>
              </div>

              {/* Core Explanation */}
              <section className="bg-slate-900/40 backdrop-blur-md rounded-[3rem] p-10 md:p-14 shadow-2xl border border-slate-800/50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#0ea5e9]/5 rounded-full blur-[120px] pointer-events-none group-hover:bg-[#0ea5e9]/10 transition-all duration-1000"></div>
                <h3 className="text-3xl font-black text-white mb-8 flex items-center gap-4">
                  <div className="w-2 h-8 bg-[#0ea5e9] rounded-full"></div> Conceptual Logic
                </h3>
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-xl whitespace-pre-line font-medium">
                  {result.explanation}
                </div>
              </section>

              {/* Diagram */}
              <section className="bg-slate-950 rounded-[3rem] p-10 md:p-14 shadow-2xl border border-[#0ea5e9]/10 overflow-hidden">
                <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-4">
                   <div className="w-2 h-8 bg-[#f59e0b] rounded-full"></div> Visual Reconstruction
                </h3>
                <div className="bg-[#030712] rounded-[2.5rem] border border-slate-800/50 min-h-[450px] flex items-center justify-center relative group p-4">
                  {diagramUrl ? (
                    <div className="relative animate-in fade-in zoom-in-95 duration-1000">
                      <img src={diagramUrl} alt="Educational Diagram" className="max-w-full h-auto rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                    </div>
                  ) : (
                    <div className="text-center p-16">
                      <Loader2 className="w-16 h-16 text-[#0ea5e9] animate-spin mx-auto mb-6" />
                      <p className="text-2xl text-slate-400 font-black tracking-tight">AI Illustrator working...</p>
                      <p className="text-xs text-slate-600 mt-6 max-w-md mx-auto font-mono uppercase leading-relaxed tracking-wider">{result.diagramPrompt}</p>
                    </div>
                  )}
                </div>
              </section>

              {/* Step by Step */}
              <section className="bg-gradient-to-br from-[#0f172a] to-[#020617] text-white rounded-[3rem] p-10 md:p-14 border border-[#0ea5e9]/20 shadow-[0_0_80px_rgba(14,165,233,0.1)]">
                <h3 className="text-3xl font-black mb-12 flex items-center gap-4">
                   <div className="w-2 h-8 bg-[#0ea5e9] rounded-full"></div> Procedural Breakdown
                </h3>
                <div className="space-y-12 relative before:absolute before:left-8 before:top-4 before:bottom-4 before:w-[3px] before:bg-slate-800/50">
                  {result.stepByStep.map((step, i) => (
                    <div key={i} className="flex gap-12 relative items-start group">
                      <div className="flex-shrink-0 w-16 h-16 rounded-[1.5rem] bg-slate-950 border border-slate-800 flex items-center justify-center font-black text-[#0ea5e9] text-2xl z-10 shadow-2xl group-hover:border-[#0ea5e9]/50 transition-all">
                        {i + 1}
                      </div>
                      <div className="pt-3">
                        <p className="text-slate-200 text-xl leading-relaxed font-medium group-hover:text-white transition-colors">{step}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Tips and Tricks */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="bg-slate-900/60 rounded-[2.5rem] p-10 border border-[#f59e0b]/20 hover:border-[#f59e0b]/40 transition-all shadow-xl">
                  <h3 className="text-2xl font-black text-[#f59e0b] mb-8 flex items-center gap-3">
                    <Lightbulb className="w-7 h-7" /> Delta Tips
                  </h3>
                  <ul className="space-y-6">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex gap-4 items-start text-slate-300">
                        <span className="w-2 h-2 rounded-full bg-[#f59e0b] mt-3 flex-shrink-0 animate-pulse"></span>
                        <span className="text-lg font-medium leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </section>
                <section className="bg-slate-900/60 rounded-[2.5rem] p-10 border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-xl">
                  <h3 className="text-2xl font-black text-emerald-400 mb-8 flex items-center gap-3">
                    <Zap className="w-7 h-7" /> Memory Key
                  </h3>
                  <ul className="space-y-6">
                    {result.tricks.map((trick, i) => (
                      <li key={i} className="flex gap-4 items-start text-slate-300">
                        <Zap className="w-5 h-5 text-emerald-500 mt-2 flex-shrink-0" />
                        <span className="text-lg italic font-medium leading-relaxed">{trick}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Examples */}
              <section className="space-y-8">
                <h3 className="text-3xl font-black text-white flex items-center gap-4 px-4">
                   <div className="w-2 h-8 bg-[#0ea5e9] rounded-full"></div> Solved Scenarios
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {result.examples.map((ex, i) => (
                    <div key={i} className="bg-slate-900/40 backdrop-blur-sm rounded-[2.5rem] overflow-hidden border border-slate-800/80 flex flex-col hover:border-slate-600 transition-all group">
                      <div className="p-5 bg-slate-950/90 border-b border-slate-800 font-black text-slate-500 text-xs uppercase tracking-[0.2em]">
                        Reference Case {i + 1}
                      </div>
                      <div className="p-10 flex-1">
                        <p className="font-bold text-white text-xl mb-8 leading-tight group-hover:text-[#0ea5e9] transition-colors">{ex.problem}</p>
                        <div className="p-8 bg-slate-950/80 rounded-3xl border border-[#0ea5e9]/10 text-[#0ea5e9] text-lg font-mono leading-relaxed whitespace-pre-line shadow-inner">
                          {ex.solution}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}
        </div>
      </main>

      {/* Floating Action Button */}
      {!isSolving && result && (
        <button 
          onClick={clearCurrent}
          className="no-print fixed bottom-10 right-10 w-20 h-20 bg-[#f59e0b] text-slate-950 rounded-full shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center z-50 hover:scale-110 active:scale-90 transition-all neon-orange"
        >
          <PlusCircle className="w-12 h-12" />
        </button>
      )}
    </div>
  );
};

export default App;
