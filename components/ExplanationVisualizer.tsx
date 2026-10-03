'use client';

import React, { useState, useMemo } from 'react';
import { MathRenderer, sanitizeLatex } from './MathRenderer';
import { 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  HelpCircle, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Minimize2, 
  Layout, 
  Cpu, 
  Compass, 
  Zap, 
  ChevronRight,
  ChevronLeft,
  Lightbulb,
  Hash,
  Copy,
  Check,
  ArrowRight,
  Calculator,
  Bookmark,
  Eye,
  Sliders,
  BookOpen,
  Award,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

export interface VisualDiagramData {
  type: 'circuit' | 'power_triangle' | 'phasor' | 'transformer' | 'pythagoras' | 'beam' | 'generic';
  title?: string;
  labels?: Record<string, string | number>;
  values?: Record<string, string | number>;
  notes?: string;
}

export interface WhiteboardSolution {
  given?: string[];
  find?: string;
  principles?: string[];
  diagram?: VisualDiagramData;
  steps: {
    title: string;
    description: string;
    latexFormula?: string;
    subSteps?: string[];
    resultBadge?: string;
  }[];
  finalAnswerLatex?: string;
  finalAnswerSummary?: string;
  tipsAndTricks?: string[];
  mnemonic?: string;
  reference?: string;
  keyPoint?: string;
  examTip?: string;
  commonMistake?: string;
}

interface ExplanationVisualizerProps {
  solution?: WhiteboardSolution;
  standardExplanation?: string;
  questionText?: string;
  correctAnswerText?: string;
  className?: string;
}

// Helper to cleanly extract formulas from text without corrupting decimals or capturing prose
function extractFormulaFromText(text: string): string | undefined {
  if (!text) return undefined;
  
  // 1. Look for explicit $$...$$ block math
  const blockMatch = text.match(/\$\$([^\$]+)\$\$/);
  if (blockMatch && blockMatch[1].trim()) {
    return sanitizeLatex(blockMatch[1].trim());
  }

  // 2. Look for explicit $...$ inline math that contains an equation or formula
  const inlineMatches = Array.from(text.matchAll(/\$([^\$]+)\$/g));
  const equationMatch = inlineMatches.find(m => m[1].includes('=') || /\\(frac|sqrt|times|int|sum|Omega)/.test(m[1]));
  if (equationMatch && equationMatch[1].trim()) {
    return sanitizeLatex(equationMatch[1].trim());
  }

  // 3. If no explicit $ delimiters, parse standard mathematical formulas
  // Split on connective prose words like "with", "where", "we find", "substituting", "therefore", "since"
  // Do NOT split on decimal points inside numbers like 3.14 or -3.0 or 9.81
  const sentences = text.split(/(?<=[^\d\.\\])(?:\bwith\b|\bwhere\b|\bwe find\b|\bwe get\b|\bsubstituting\b|\btherefore\b|\bthen\b|\bsince\b|;|\.\s+[A-Z]|\.\s*$)/i);
  
  const equationCandidates = sentences
    .map(s => s.trim())
    .filter(s => s.includes('=') || /\\(frac|sqrt|times)/.test(s));

  if (equationCandidates.length > 0) {
    // Pick the most formula-rich candidate (contains math operators or equals)
    const best = equationCandidates.find(s => /[\^_\{\}\\\/\+\-\*]/.test(s) && s.includes('=')) || equationCandidates[0];
    
    // Clean leading/trailing punctuation (like periods or colons) but keep parentheses/brackets
    let cleaned = best.replace(/^[^a-zA-Z0-9\\\$]+/, '').replace(/[\.,;:]+$/, '').trim();
    if (cleaned.length > 2) {
      return sanitizeLatex(cleaned);
    }
  }

  // Fallback: check for any equation with =
  const fallbackMatch = text.match(/([a-zA-Z0-9_\{\}\\\(\)]+\s*=\s*[^;\n]+)/);
  if (fallbackMatch) {
    let clean = fallbackMatch[1].replace(/[\.,;:]+$/, '').trim();
    return sanitizeLatex(clean);
  }

  return undefined;
}

// Intelligent Solution Decomposer & Layering Engine
// Deconstructs dense unstructured engineering/math explanations into clear, layered, sequential steps
export function decomposeAndLayerSolution(
  solution?: WhiteboardSolution,
  rawText?: string,
  questionText?: string,
  correctAnswer?: string
): WhiteboardSolution {
  // Combine text source
  const sourceText = (solution?.steps?.[0]?.description || rawText || '').trim();
  
  // Extract PEC or general references
  let reference = '';
  const refRegex = /(?:Reference|Ref|PEC|Philippine Electrical Code)[\s\:\—\-]+([^\n]+)/i;
  const refMatch = sourceText.match(refRegex);
  if (refMatch) {
    reference = refMatch[1].trim();
  }

  // Extract Key Point
  let keyPoint = '';
  const kpRegex = /(?:Key\s*Point|Keypoint|Key\s*Takeaway|Concept)[\s\:\—\-]+([^\n]+)/i;
  const kpMatch = sourceText.match(kpRegex);
  if (kpMatch) {
    keyPoint = kpMatch[1].trim();
  }

  // Extract Exam Tip
  let examTip = '';
  const etRegex = /(?:Exam\s*Tip|Board\s*Exam\s*Tip|Tip)[\s\:\—\-]+([^\n]+)/i;
  const etMatch = sourceText.match(etRegex);
  if (etMatch) {
    examTip = etMatch[1].trim();
  }

  // Extract Common Mistake
  let commonMistake = '';
  const cmRegex = /(?:Common\s*Mistake|Mistake|Pitfall|Trap)[\s\:\—\-]+([^\n]+)/i;
  const cmMatch = sourceText.match(cmRegex);
  if (cmMatch) {
    commonMistake = cmMatch[1].trim();
  }

  // Dynamic fallbacks based on question content
  const lowerText = ((questionText || '') + ' ' + sourceText).toLowerCase();
  
  if (!reference) {
    if (lowerText.includes('pec') || lowerText.includes('philippine electrical code') || lowerText.includes('national electrical code') || lowerText.includes('nec')) {
      const articleMatch = lowerText.match(/(?:article|sec|section|table)\s*(\d+(?:\.\d+)*)/i);
      if (articleMatch) {
        reference = `PEC 2017 — Article ${articleMatch[1]}`;
      } else {
        reference = 'PEC 2017 — Philippine Electrical Code Provision';
      }
    } else if (lowerText.includes('code') || lowerText.includes('standard') || lowerText.includes('provision')) {
      reference = 'PEC 2017 / Standard Engineering Reference';
    }
  }

  if (!keyPoint) {
    if (lowerText.includes('ohm') || lowerText.includes('resistance') || lowerText.includes('voltage') || lowerText.includes('current')) {
      keyPoint = "Ohm's Law states that voltage is directly proportional to current and resistance ($V = IR$). Conductor resistance is also given by Pouillet's Law: $R = \\rho \\frac{L}{A}$.";
    } else if (lowerText.includes('3-phase') || lowerText.includes('three-phase') || lowerText.includes('delta') || lowerText.includes('wye')) {
      keyPoint = 'In Wye connections, Line Voltage is $\\sqrt{3}$ times Phase Voltage ($V_L = \\sqrt{3}V_P$). In Delta connections, Line Current is $\\sqrt{3}$ times Phase Current ($I_L = \\sqrt{3}I_P$).';
    } else if (lowerText.includes('power factor') || lowerText.includes('pf') || lowerText.includes('apparent power')) {
      keyPoint = 'Power Factor is the ratio of Real Power ($P$ in W/kW) to Apparent Power ($S$ in VA/kVA). Mathematically, $PF = \\cos\\theta = P / S$.';
    } else if (lowerText.includes('transformer') || lowerText.includes('turns ratio')) {
      keyPoint = 'For an ideal transformer, the voltage ratio is directly proportional to the turns ratio, while current is inversely proportional: $\\frac{V_1}{V_2} = \\frac{N_1}{N_2} = \\frac{I_2}{I_1}$.';
    } else if (lowerText.includes('resonance') || lowerText.includes('resonant') || lowerText.includes('rlc')) {
      keyPoint = 'Resonance occurs in AC circuits when inductive reactance equals capacitive reactance ($X_L = X_C$). Total impedance is minimum and equal to resistance ($Z = R$), and power factor is unity ($PF = 1.0$).';
    } else if (lowerText.includes('capacitor') || lowerText.includes('capacitance')) {
      keyPoint = 'Capacitors store energy in an electric field. Capacitive reactance is inversely proportional to frequency and capacitance: $X_C = \\frac{1}{2\\pi f C}$. In parallel, capacitances add directly; in series, they add reciprocally.';
    } else if (lowerText.includes('inductor') || lowerText.includes('inductance')) {
      keyPoint = 'Inductors store energy in a magnetic field. Inductive reactance is directly proportional to frequency and inductance: $X_L = 2\\pi f L$. In series, inductances add directly; in parallel, they add reciprocally.';
    } else if (lowerText.includes('dc motor') || lowerText.includes('dc generator') || lowerText.includes('shunt') || lowerText.includes('armature')) {
      keyPoint = 'Induced EMF in generators is $E_g = V_t + I_a R_a$. Back EMF in motors is $E_b = V_t - I_a R_a$. Shunt machines have field winding in parallel with the armature.';
    } else if (lowerText.includes('illumination') || lowerText.includes('lighting') || lowerText.includes('lux') || lowerText.includes('lumen')) {
      keyPoint = 'Illuminance ($E$) in lux is equal to luminous flux in lumens divided by area in square meters ($E = \\frac{\\Phi}{A}$). The lumen method incorporates CU and LLF for practical lighting design.';
    } else {
      keyPoint = 'Verify the core electrical engineering equations, electrical parameters, and PEC requirements governing this specific problem.';
    }
  }

  if (!examTip) {
    if (lowerText.includes('ohm') || lowerText.includes('resistance') || lowerText.includes('voltage') || lowerText.includes('current')) {
      examTip = 'Always check the units! Resistances can be in micro-ohms or mega-ohms, and currents in milliamperes (mA). Convert all values to SI base units before starting calculation.';
    } else if (lowerText.includes('3-phase') || lowerText.includes('three-phase') || lowerText.includes('delta') || lowerText.includes('wye')) {
      examTip = 'Total 3-phase active power is $P = \\sqrt{3} V_L I_L \\cos\\theta$ regardless of Delta or Wye connection. Never use phase values with the $\\sqrt{3}$ multiplier.';
    } else if (lowerText.includes('power factor') || lowerText.includes('pf') || lowerText.includes('apparent power')) {
      examTip = 'If the power factor is "leading", the load is capacitive. If it is "lagging", the load is inductive. Drawing the power triangle is the fastest way to solve complex AC power questions.';
    } else if (lowerText.includes('transformer') || lowerText.includes('turns ratio')) {
      examTip = 'Identify which side is primary and which is secondary. Under-load transformer efficiency is maximized when copper losses equal constant core losses.';
    } else if (lowerText.includes('resonance') || lowerText.includes('resonant') || lowerText.includes('rlc')) {
      examTip = 'At resonance, reactances cancel out. The resonant frequency is given by $f_r = \\frac{1}{2\\pi\\sqrt{LC}}$. Use this to solve for $L$ or $C$ directly if resonant frequency is given.';
    } else if (lowerText.includes('capacitor') || lowerText.includes('capacitance') || lowerText.includes('inductor') || lowerText.includes('inductance')) {
      examTip = 'Capacitor connection formulas are the mathematical opposite of resistors. Parallel capacitors add up ($C_1+C_2$), while series capacitors use the reciprocal formula.';
    } else if (lowerText.includes('dc motor') || lowerText.includes('dc generator') || lowerText.includes('shunt') || lowerText.includes('armature')) {
      examTip = 'For DC motors, speed is directly proportional to back EMF and inversely proportional to field flux: $N \\propto \\frac{E_b}{\\Phi}$.';
    } else if (lowerText.includes('illumination') || lowerText.includes('lighting') || lowerText.includes('lux') || lowerText.includes('lumen')) {
      examTip = 'Remember that $1 \\text{ foot-candle} = 10.76 \\text{ lux}$. Watch out for this unit conversion in lighting questions!';
    } else if (lowerText.includes('pec') || lowerText.includes('code') || lowerText.includes('philippine electrical code')) {
      examTip = 'PEC questions are heavily tested on branch-circuit ratings, conductor sizes (specifically 14, 12, 10 AWG or 2.0, 3.5, 5.5 mm²), and grounding electrode sizes.';
    } else {
      examTip = 'Write down all given values with their corresponding units on scratch paper before performing any calculations to avoid scaling or conversion errors.';
    }
  }

  if (!commonMistake) {
    if (lowerText.includes('ohm') || lowerText.includes('resistance') || lowerText.includes('voltage') || lowerText.includes('current')) {
      commonMistake = 'Confusing resistivity ($\\rho$) in ohm-meters with resistance ($R$) in ohms, or using the wrong cross-sectional area units (circular mils vs square meters).';
    } else if (lowerText.includes('3-phase') || lowerText.includes('three-phase') || lowerText.includes('delta') || lowerText.includes('wye')) {
      commonMistake = 'Using phase voltage instead of line voltage in the 3-phase power formula $P = \\sqrt{3}V_L I_L \\cos\\theta$, or forgetting the $\\sqrt{3}$ multiplier entirely.';
    } else if (lowerText.includes('power factor') || lowerText.includes('pf') || lowerText.includes('apparent power')) {
      commonMistake = 'Adding real power ($P$) and reactive power ($Q$) directly like scalars ($P+Q$) instead of adding them phasorially to find apparent power $S = \\sqrt{P^2 + Q^2}$.';
    } else if (lowerText.includes('transformer') || lowerText.includes('turns ratio')) {
      commonMistake = 'Inverting the turns ratio multiplier or divider when finding secondary voltages or currents (multiplying by turns ratio instead of dividing, or vice versa).';
    } else if (lowerText.includes('resonance') || lowerText.includes('resonant') || lowerText.includes('rlc')) {
      commonMistake = 'Forgetting that total series impedance is minimum ($Z = R$) at resonance, but parallel resonance impedance is maximum.';
    } else if (lowerText.includes('capacitor') || lowerText.includes('capacitance') || lowerText.includes('inductor') || lowerText.includes('inductance')) {
      commonMistake = 'Applying standard series resistor formulas directly to series capacitors, resulting in simple addition instead of reciprocal-addition.';
    } else if (lowerText.includes('dc motor') || lowerText.includes('dc generator') || lowerText.includes('shunt') || lowerText.includes('armature')) {
      commonMistake = 'Using the generator voltage formula ($E = V + I_a R_a$) for a motor calculation ($E = V - I_a R_a$), leading to an incorrect EMF value.';
    } else if (lowerText.includes('illumination') || lowerText.includes('lighting') || lowerText.includes('lux') || lowerText.includes('lumen')) {
      commonMistake = 'Dividing lumens by square feet instead of converting feet to meters first, or forgetting to apply CU and LLF factors.';
    } else if (lowerText.includes('pec') || lowerText.includes('code') || lowerText.includes('philippine electrical code')) {
      commonMistake = 'Confusing ampacity (current-carrying capacity of wires) with overcurrent protection device (OCPD) ratings, which are sized differently.';
    } else {
      commonMistake = 'Forgetting to convert final answers back to the requested unit prefix (e.g., kW to MW, or $\\text{m}^2$ to $\\text{cm}^2$).';
    }
  }

  // If a multi-step solution is already well-defined with > 1 step, polish and return it
  if (solution && solution.steps && solution.steps.length > 1) {
    return {
      ...solution,
      steps: solution.steps.map((s, idx) => ({
        ...s,
        title: s.title && !s.title.toLowerCase().startsWith('step') ? `Step ${idx + 1}: ${s.title}` : s.title || `Step ${idx + 1}: Key Derivation`,
        latexFormula: s.latexFormula ? sanitizeLatex(s.latexFormula) : undefined,
      })),
      reference: reference || solution.reference,
      keyPoint: keyPoint || solution.keyPoint,
      examTip: examTip || solution.examTip,
      commonMistake: commonMistake || solution.commonMistake,
    };
  }

  if (!sourceText) {
    return {
      steps: [
        {
          title: 'Step 1: Conceptual Reasoning',
          description: 'No detailed mathematical explanation provided for this question.',
        }
      ],
      reference,
      keyPoint,
      examTip,
      commonMistake,
    };
  }

  const givenList: string[] = solution?.given ? [...solution.given] : [];
  const principlesList: string[] = solution?.principles ? [...solution.principles] : [];
  const findTarget = solution?.find || '';
  let finalAnsLatex = solution?.finalAnswerLatex || '';
  let finalAnsSummary = solution?.finalAnswerSummary || '';

  // Auto-detect Given parameters from Question or Explanation if empty
  if (givenList.length === 0) {
    const combinedContext = `${questionText || ''} ${sourceText}`;
    // Match patterns like "190.5 MW", "220 kV", "2.84 x 10^-8", "63 km", "P = ...", "V = ..."
    const givenMatches = combinedContext.match(/\b([A-Z][a-zA-Z0-9_]*\s*=\s*[\d\.\+\-\times\^eE\/\s]+(?:[a-zA-Z\Omega\%\°\^\-\/\d]+)?)/g);
    if (givenMatches) {
      const uniqueGivens = Array.from(new Set(givenMatches.map(g => g.trim()))).slice(0, 4);
      uniqueGivens.forEach(g => givenList.push(`$${sanitizeLatex(g)}$`));
    }
  }

  // Auto-decompose sentences into structured steps
  const steps: WhiteboardSolution['steps'] = [];

  // Strategy 1: Look for explicit step delimiters like "Step 1:", "1.", "First,", "\n\n"
  const explicitStepRegex = /(?:^|\n+|\.\s+)(?:Step\s*(\d+)[\:\.\-]|(?:Phase|Part)\s*([A-Z\d])[\:\.\-]|(\d+)[\.\)]\s+)([^\n]+)/gi;
  const explicitMatches = Array.from(sourceText.matchAll(explicitStepRegex));

  if (explicitMatches.length >= 2) {
    // Has explicit numbering
    explicitMatches.forEach((m, idx) => {
      const matchIndex = m.index ?? 0;
      const nextMatchIndex = idx < explicitMatches.length - 1 ? (explicitMatches[idx + 1].index ?? sourceText.length) : sourceText.length;
      const stepBlock = sourceText.substring(matchIndex, nextMatchIndex).trim();

      const stepNum = m[1] || m[2] || m[3] || `${idx + 1}`;
      const titleCandidate = m[4].split(/[\.\:\=]/)[0].trim();
      
      // Extract formula cleanly if present
      const formula = extractFormulaFromText(stepBlock);

      steps.push({
        title: `Step ${stepNum}: ${titleCandidate.length < 40 ? titleCandidate : 'Evaluate Sub-step'}`,
        description: stepBlock.replace(/^(?:Step\s*\d+[\:\.\-]|(?:\d+)[\.\)]\s*)/i, '').trim(),
        latexFormula: formula,
      });
    });
  } else {
    // Strategy 2: Intelligent Engineering Decomposer for dense math strings
    const sentenceSplitter = /(?<=[^\d\.\\])(?:\.\s+|\n+)(?=[A-Z]|\$|\\|[A-Za-z_]+\s*=)/g;
    const rawSegments = sourceText.split(sentenceSplitter).map(s => s.trim()).filter(Boolean);

    rawSegments.forEach((segment, sIdx) => {
      // Find title from context
      let stepTitle = `Step ${sIdx + 1}: `;
      let resultBadge = '';

      if (/line\s*loss|loss/i.test(segment) && !/per\s*phase/i.test(segment)) {
        stepTitle += 'Compute Allowed Total Line Loss';
      } else if (/current\s*I|I\s*=/i.test(segment)) {
        stepTitle += 'Determine Transmission Line Current (I)';
      } else if (/per\s*phase|P_\{?loss,1/i.test(segment)) {
        stepTitle += 'Calculate Power Loss per Phase';
      } else if (/resistance\s*R|R\s*=|phase\s*resistance/i.test(segment) && !/formula/i.test(segment)) {
        stepTitle += 'Solve for Conductor Resistance (R)';
      } else if (/resistance\s*formula|Pouillet|\rho\s*L/i.test(segment) || /Area\s*A|A\s*=/i.test(segment)) {
        stepTitle += 'Calculate Conductor Cross-Sectional Area (A)';
      } else if (/diameter\s*d|d\s*=|radius/i.test(segment)) {
        stepTitle += 'Determine Conductor Diameter (d)';
      } else if (/voltage|drop|regulation/i.test(segment)) {
        stepTitle += 'Evaluate Voltage Drop & Regulation';
      } else if (/efficiency|\b\eta\b/i.test(segment)) {
        stepTitle += 'Calculate System Efficiency';
      } else if (/torque|power|speed/i.test(segment)) {
        stepTitle += 'Analyze Mechanical & Electrical Parameters';
      } else {
        const words = segment.replace(/[\$\=\<\>]/g, '').split(/\s+/).slice(0, 5).join(' ');
        stepTitle += words.length > 5 ? words : `Layer ${sIdx + 1} Calculation`;
      }

      const formulaStr = extractFormulaFromText(segment);

      if (formulaStr && formulaStr.includes('=')) {
        const lastEqual = formulaStr.lastIndexOf('=');
        if (lastEqual !== -1) {
          resultBadge = formulaStr.substring(lastEqual + 1).trim();
        }
      }

      steps.push({
        title: stepTitle,
        description: segment,
        latexFormula: formulaStr,
        resultBadge: resultBadge ? sanitizeLatex(resultBadge) : undefined,
      });
    });
  }

  // If steps couldn't be split (only 1 step found), synthesize a layered structure
  if (steps.length <= 1 && sourceText.length > 100) {
    const chunks = sourceText.split(/(?<=\.)\s+/);
    if (chunks.length > 1) {
      steps.length = 0;
      chunks.forEach((chunk, cIdx) => {
        steps.push({
          title: `Step ${cIdx + 1}: Conceptual Evaluation`,
          description: chunk,
          latexFormula: extractFormulaFromText(chunk),
        });
      });
    }
  }

  // Detect final answer
  if (!finalAnsLatex && steps.length > 0) {
    const lastStep = steps[steps.length - 1];
    if (lastStep.resultBadge) {
      finalAnsLatex = lastStep.resultBadge;
    } else if (lastStep.latexFormula && lastStep.latexFormula.includes('=')) {
      const parts = lastStep.latexFormula.split('=');
      finalAnsLatex = parts[parts.length - 1].trim();
    }
  }

  if (!finalAnsSummary && correctAnswer) {
    finalAnsSummary = `The verified correct answer is ${correctAnswer}.`;
  }

  return {
    given: givenList.length > 0 ? givenList : undefined,
    find: findTarget || undefined,
    principles: principlesList.length > 0 ? principlesList : undefined,
    diagram: solution?.diagram,
    steps: steps.length > 0 ? steps : [
      {
        title: 'Step 1: Solution Evaluation',
        description: sourceText,
      }
    ],
    finalAnswerLatex: finalAnsLatex || undefined,
    finalAnswerSummary: finalAnsSummary || undefined,
    tipsAndTricks: solution?.tipsAndTricks || [
      'Double check unit conversions (e.g., MW to W, km to m, cm to m) to avoid scaling errors.',
      'Remember that for balanced 3-phase systems, total line loss is 3 times the loss of a single phase.'
    ],
    mnemonic: solution?.mnemonic,
    reference,
    keyPoint,
    examTip,
    commonMistake,
  };
}

export const ExplanationVisualizer: React.FC<ExplanationVisualizerProps> = ({
  solution,
  standardExplanation,
  questionText,
  correctAnswerText,
  className = ''
}) => {
  const [boardStyle, setBoardStyle] = useState<'whiteboard' | 'chalkboard' | 'technical'>('chalkboard');
  const [viewMode, setViewMode] = useState<'stacked' | 'carousel' | 'summary'>('stacked');
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Run the intelligent decomposition & layering engine
  const parsedSolution = useMemo(() => {
    return decomposeAndLayerSolution(solution, standardExplanation, questionText, correctAnswerText);
  }, [solution, standardExplanation, questionText, correctAnswerText]);

  const totalSteps = parsedSolution.steps.length;

  const handleCopyStep = (textToCopy: string, index: number) => {
    navigator.clipboard?.writeText(textToCopy);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textParts: string[] = [];
    if (questionText) textParts.push(`Question: ${questionText}`);
    if (correctAnswerText) textParts.push(`Correct Answer: ${correctAnswerText}`);
    
    if (parsedSolution.given && parsedSolution.given.length > 0) {
      textParts.push(`Given parameters: ${parsedSolution.given.join(', ')}.`);
    }
    
    parsedSolution.steps.forEach((step, idx) => {
      textParts.push(`${step.title}. ${step.description}`);
    });
    
    if (parsedSolution.finalAnswerSummary) {
      textParts.push(`Conclusion: ${parsedSolution.finalAnswerSummary}`);
    }

    const utterance = new SpeechSynthesisUtterance(textParts.join(' '));
    utterance.rate = 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  // Theme color definitions
  const boardBg = 
    boardStyle === 'chalkboard' 
      ? 'bg-slate-950 text-slate-100 border-slate-800 shadow-xl ring-1 ring-white/5' 
      : boardStyle === 'technical'
      ? 'bg-sky-950/30 text-sky-100 border-sky-800/60 shadow-lg ring-1 ring-sky-500/20'
      : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800 shadow-md';

  return (
    <div 
      className={cn(
        'rounded-2xl border transition-all duration-300 overflow-hidden',
        boardBg,
        isFullscreen ? 'fixed inset-4 z-50 overflow-y-auto shadow-2xl p-6 bg-slate-950' : 'p-4 sm:p-6',
        className
      )}
    >
      {/* Top Header & Interactive Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold flex items-center gap-2 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Layered Step-by-Step Solution</span>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-300 font-medium border border-indigo-500/20">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {totalSteps} {totalSteps === 1 ? 'Layer' : 'Sequential Layers'}
          </span>
        </div>

        {/* View Mode & Board Style Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Layer View Mode Switcher */}
          <div className="inline-flex rounded-lg p-1 bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('stacked')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer',
                viewMode === 'stacked' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
              title="View all step layers stacked sequentially"
            >
              <Sliders className="w-3 h-3" />
              <span>Full Flow</span>
            </button>
            <button
              onClick={() => setViewMode('carousel')}
              className={cn(
                'px-2.5 py-1 rounded-md transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer',
                viewMode === 'carousel' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
              title="Walk through the solution one layer at a time"
            >
              <Eye className="w-3 h-3" />
              <span>Step-by-Step</span>
            </button>
          </div>

          {/* Board Theme Selector */}
          <div className="hidden sm:inline-flex rounded-lg p-1 bg-white/5 border border-white/10 text-xs">
            <button
              onClick={() => setBoardStyle('chalkboard')}
              className={cn(
                'px-2 py-1 rounded-md transition-all text-xs font-medium cursor-pointer',
                boardStyle === 'chalkboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
            >
              Darkboard
            </button>
            <button
              onClick={() => setBoardStyle('technical')}
              className={cn(
                'px-2 py-1 rounded-md transition-all text-xs font-medium cursor-pointer',
                boardStyle === 'technical' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              )}
            >
              Blueprint
            </button>
            <button
              onClick={() => setBoardStyle('whiteboard')}
              className={cn(
                'px-2 py-1 rounded-md transition-all text-xs font-medium cursor-pointer',
                boardStyle === 'whiteboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-white'
              )}
            >
              Whiteboard
            </button>
          </div>

          {/* Read Aloud Audio */}
          <button
            onClick={toggleSpeech}
            title={isSpeaking ? 'Stop Audio Explanation' : 'Read Aloud Step-by-Step'}
            className={cn(
              'p-2 rounded-lg border text-xs flex items-center gap-1.5 transition-all cursor-pointer font-medium',
              isSpeaking 
                ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse' 
                : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
            )}
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{isSpeaking ? 'Stop' : 'Voice'}</span>
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg border bg-white/5 border-white/10 text-slate-300 hover:bg-white/10 text-xs transition-all cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Whiteboard'}
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Given Parameters & Governing Principles Strip */}
      {(parsedSolution.given?.length || parsedSolution.find || parsedSolution.principles?.length) ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-6 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
          {/* Given Parameters */}
          {parsedSolution.given && parsedSolution.given.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-indigo-400" /> Given Parameters
              </span>
              <div className="flex flex-wrap gap-1.5">
                {parsedSolution.given.map((g, idx) => (
                  <span key={idx} className="font-mono text-xs bg-indigo-950/50 border border-indigo-800/40 text-indigo-200 px-2.5 py-1 rounded-md">
                    <MathRenderer content={g} inline />
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Required Output */}
          {parsedSolution.find && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-emerald-400" /> Required To Find
              </span>
              <div className="text-xs font-mono font-semibold text-emerald-200 bg-emerald-950/50 p-2 rounded-md border border-emerald-800/40">
                <MathRenderer content={parsedSolution.find} inline />
              </div>
            </div>
          )}

          {/* Governing Principles */}
          {parsedSolution.principles && parsedSolution.principles.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Governing Equations & Laws
              </span>
              <div className="text-xs space-y-1">
                {parsedSolution.principles.map((p, idx) => (
                  <div key={idx} className="flex items-start gap-1 text-slate-300">
                    <span className="text-amber-400 font-bold">•</span>
                    <span><MathRenderer content={p} inline /></span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Main Solution Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Diagram Column (if available) */}
        {parsedSolution.diagram && (
          <div className={cn(
            'lg:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border bg-white/5 border-white/10',
            boardStyle === 'chalkboard' ? 'border-slate-800 bg-slate-900/60' : ''
          )}>
            <div className="w-full flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layout className="w-3.5 h-3.5 text-blue-400" />
                {parsedSolution.diagram.title || 'Schematic Diagram'}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 uppercase font-mono border border-blue-700/50">
                {parsedSolution.diagram.type}
              </span>
            </div>

            <div className="w-full aspect-4/3 max-h-64 flex items-center justify-center">
              {renderSvgDiagram(parsedSolution.diagram, boardStyle)}
            </div>

            {parsedSolution.diagram.notes && (
              <p className="mt-3 text-xs text-center text-slate-400 italic">
                {parsedSolution.diagram.notes}
              </p>
            )}
          </div>
        )}

        {/* Steps Column */}
        <div className={cn(
          parsedSolution.diagram ? 'lg:col-span-7' : 'lg:col-span-12',
          'space-y-4'
        )}>
          {/* Carousel Mode Controls */}
          {viewMode === 'carousel' && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 mb-2">
              <button
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-slate-200 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev Step</span>
              </button>

              <div className="flex flex-col items-center gap-1">
                <span className="text-xs font-bold text-indigo-300">
                  Step {activeStepIndex + 1} of {totalSteps}
                </span>
                <div className="w-32 bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{ width: `${((activeStepIndex + 1) / totalSteps) * 100}%` }}
                  />
                </div>
              </div>

              <button
                disabled={activeStepIndex === totalSteps - 1}
                onClick={() => setActiveStepIndex(prev => Math.min(totalSteps - 1, prev + 1))}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold text-white transition-all cursor-pointer"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sequential Step Cards */}
          <div className="space-y-4 relative">
            {/* Visual vertical connector line for stacked mode */}
            {viewMode === 'stacked' && totalSteps > 1 && (
              <div className="absolute left-[19px] top-6 bottom-6 w-0.5 bg-gradient-to-b from-indigo-500/60 via-purple-500/40 to-emerald-500/60 z-0 hidden sm:block" />
            )}

            {parsedSolution.steps.map((step, idx) => {
              // In carousel mode, only render active step
              if (viewMode === 'carousel' && idx !== activeStepIndex) {
                return null;
              }

              const isLastStep = idx === totalSteps - 1;

              return (
                <div 
                  key={idx}
                  className={cn(
                    'p-4 sm:p-5 rounded-xl border transition-all duration-200 relative z-10',
                    'bg-slate-900/90 dark:bg-slate-900/90 border-white/10 hover:border-indigo-500/50 shadow-md',
                    boardStyle === 'technical' ? 'bg-sky-950/40 border-sky-800/60' : ''
                  )}
                >
                  {/* Step Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-md',
                        isLastStep 
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/20' 
                          : 'bg-indigo-600 text-white ring-4 ring-indigo-500/20'
                      )}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-sm sm:text-base text-white tracking-tight flex items-center gap-2">
                          {step.title}
                        </h4>
                        <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                          Layer {idx + 1} of {totalSteps}
                        </span>
                      </div>
                    </div>

                    {/* Copy step button */}
                    <button
                      onClick={() => handleCopyStep(`${step.title}\n${step.latexFormula || ''}\n${step.description}`, idx)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all text-xs flex items-center gap-1 cursor-pointer"
                      title="Copy this step calculation"
                    >
                      {copiedIndex === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[10px] text-emerald-400 font-semibold">Copied</span>
                        </>
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Highlighted LaTeX Formula Display Box */}
                  {step.latexFormula && (
                    <div className="my-3 p-3.5 rounded-xl bg-black/40 border border-indigo-500/30 text-indigo-200 overflow-x-auto shadow-inner text-center font-mono">
                      <MathRenderer content={`$$${step.latexFormula}$$`} />
                    </div>
                  )}

                  {/* Descriptive Explanation & Rationale */}
                  <div className="text-xs sm:text-sm text-slate-200 leading-relaxed space-y-1.5 pt-1">
                    <MathRenderer content={step.description} />
                  </div>

                  {/* Intermediate Result / Metric Badge */}
                  {step.resultBadge && (
                    <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-semibold font-mono">
                      <Calculator className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Step Result: <MathRenderer content={`$${step.resultBadge}$`} inline /></span>
                    </div>
                  )}

                  {/* Sub-steps */}
                  {step.subSteps && step.subSteps.length > 0 && (
                    <ul className="mt-3 space-y-1.5 pl-4 border-l-2 border-indigo-500/40">
                      {step.subSteps.map((sub, sIdx) => (
                        <li key={sIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                          <ChevronRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span><MathRenderer content={sub} inline /></span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

          {/* Final Answer Banner */}
          {(parsedSolution.finalAnswerLatex || parsedSolution.finalAnswerSummary) && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-teal-950/60 border border-emerald-500/40 text-emerald-100 flex items-start gap-3.5 shadow-lg">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="space-y-1 flex-1">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  Final Evaluated Result & Review Conclusion
                </span>
                
                {parsedSolution.finalAnswerLatex && (
                  <div className="text-base sm:text-xl font-bold font-mono py-1.5 text-emerald-200">
                    <MathRenderer content={`$$${parsedSolution.finalAnswerLatex}$$`} />
                  </div>
                )}

                {parsedSolution.finalAnswerSummary && (
                  <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed font-medium">
                    <MathRenderer content={parsedSolution.finalAnswerSummary} />
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Board Exam Learning Mode Cards: Reference, Key Point, Exam Tip, Common Mistake */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-2">
            {/* Key Point */}
            {parsedSolution.keyPoint && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                  <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Key Point & Core Concept</span>
                </div>
                <p className="text-xs text-amber-100/90 leading-relaxed">
                  <MathRenderer content={parsedSolution.keyPoint} />
                </p>
              </div>
            )}

            {/* Exam Tip */}
            {parsedSolution.examTip && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
                  <Award className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Board Exam Solving Tip</span>
                </div>
                <p className="text-xs text-emerald-100/90 leading-relaxed">
                  <MathRenderer content={parsedSolution.examTip} />
                </p>
              </div>
            )}

            {/* Common Mistake */}
            {parsedSolution.commonMistake && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-200 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  <span>Common Trap / Pitfall to Avoid</span>
                </div>
                <p className="text-xs text-rose-100/90 leading-relaxed">
                  <MathRenderer content={parsedSolution.commonMistake} />
                </p>
              </div>
            )}

            {/* Code Reference / Standard */}
            {parsedSolution.reference && (
              <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-sky-200 flex flex-col gap-1.5 shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-400">
                  <BookOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span>Reference / Provision</span>
                </div>
                <p className="text-xs text-sky-100/90 font-mono font-medium leading-relaxed">
                  <MathRenderer content={parsedSolution.reference} />
                </p>
              </div>
            )}
          </div>

          {/* Board Exam Strategy & Tips */}
          {(parsedSolution.tipsAndTricks?.length || parsedSolution.mnemonic) && (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <span>PRC Board Exam Pro-Tips & Memory Aids</span>
              </div>
              {parsedSolution.mnemonic && (
                <p className="text-xs font-mono font-semibold bg-amber-900/40 px-3 py-1.5 rounded-lg border border-amber-700/50">
                  <span className="text-amber-300">Memory Key:</span> {parsedSolution.mnemonic}
                </p>
              )}
              {parsedSolution.tipsAndTricks && (
                <ul className="text-xs space-y-1 pl-4 text-amber-200/90">
                  {parsedSolution.tipsAndTricks.map((tip, tIdx) => (
                    <li key={tIdx} className="flex items-start gap-1.5">
                      <span className="text-amber-400 font-bold">•</span>
                      <span><MathRenderer content={tip} inline /></span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper SVG diagram generator for engineering schemas
function renderSvgDiagram(diagram: VisualDiagramData, style: 'whiteboard' | 'chalkboard' | 'technical') {
  const isDark = style === 'chalkboard' || style === 'technical';
  const strokeColor = isDark ? '#38bdf8' : '#2563eb';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const accentColor = '#f59e0b';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  switch (diagram.type) {
    case 'power_triangle':
      return (
        <svg viewBox="0 0 240 180" className="w-full h-full max-w-[240px]">
          <line x1="30" y1="140" x2="210" y2="140" stroke={gridColor} strokeDasharray="3,3" />
          <line x1="210" y1="140" x2="210" y2="30" stroke={gridColor} strokeDasharray="3,3" />
          <polygon 
            points="30,140 210,140 210,30" 
            fill={isDark ? 'rgba(56, 189, 248, 0.1)' : 'rgba(37, 99, 235, 0.08)'} 
            stroke={strokeColor} 
            strokeWidth="2.5" 
          />
          <path d="M 65 140 A 35 35 0 0 0 58 122" fill="none" stroke={accentColor} strokeWidth="2" />
          <text x="70" y="132" fill={accentColor} fontSize="12" fontWeight="bold">θ</text>
          <text x="120" y="158" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="middle">
            P (Real Power, kW)
          </text>
          {diagram.labels?.P && (
            <text x="120" y="172" fill={strokeColor} fontSize="10" textAnchor="middle">
              {diagram.labels.P}
            </text>
          )}
          <text x="218" y="85" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="start">
            Q (kVAR)
          </text>
          {diagram.labels?.Q && (
            <text x="218" y="98" fill={strokeColor} fontSize="10" textAnchor="start">
              {diagram.labels.Q}
            </text>
          )}
          <text x="105" y="75" fill={accentColor} fontSize="12" fontWeight="bold" textAnchor="middle">
            S (kVA)
          </text>
          {diagram.labels?.S && (
            <text x="105" y="88" fill={textColor} fontSize="10" textAnchor="middle">
              {diagram.labels.S}
            </text>
          )}
        </svg>
      );

    case 'circuit':
      return (
        <svg viewBox="0 0 240 160" className="w-full h-full max-w-[240px]">
          <rect x="40" y="30" width="160" height="100" fill="none" stroke={strokeColor} strokeWidth="2.5" rx="4" />
          <circle cx="40" cy="80" r="14" fill={isDark ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth="2" />
          <text x="40" y="76" fill={textColor} fontSize="10" fontWeight="bold" textAnchor="middle">+</text>
          <text x="40" y="90" fill={textColor} fontSize="10" fontWeight="bold" textAnchor="middle">-</text>
          <text x="18" y="83" fill={accentColor} fontSize="11" fontWeight="bold" textAnchor="end">
            {diagram.labels?.V || 'V (Source)'}
          </text>
          <rect x="100" y="24" width="40" height="12" fill={isDark ? '#0f172a' : '#ffffff'} stroke={strokeColor} strokeWidth="2" />
          <text x="120" y="18" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="middle">
            {diagram.labels?.R || 'R (Load)'}
          </text>
          <path d="M 60 20 L 80 20" fill="none" stroke={accentColor} strokeWidth="2" markerEnd="url(#arrow)" />
          <text x="70" y="14" fill={accentColor} fontSize="10" fontWeight="bold" textAnchor="middle">I →</text>
        </svg>
      );

    case 'transformer':
      return (
        <svg viewBox="0 0 240 160" className="w-full h-full max-w-[240px]">
          <rect x="105" y="30" width="30" height="100" fill="none" stroke={gridColor} strokeWidth="4" />
          <path d="M 70 40 Q 95 50 70 60 Q 95 70 70 80 Q 95 90 70 100 Q 95 110 70 120" fill="none" stroke={strokeColor} strokeWidth="3" />
          <text x="50" y="85" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="end">
            {diagram.labels?.Np || 'N₁ (Primary)'}
          </text>
          <path d="M 170 40 Q 145 50 170 60 Q 145 70 170 80 Q 145 90 170 100 Q 145 110 170 120" fill="none" stroke={accentColor} strokeWidth="3" />
          <text x="190" y="85" fill={textColor} fontSize="11" fontWeight="bold" textAnchor="start">
            {diagram.labels?.Ns || 'N₂ (Secondary)'}
          </text>
        </svg>
      );

    default:
      return (
        <div className="flex flex-col items-center justify-center p-6 text-center text-slate-400">
          <Layers className="w-10 h-10 mb-2 text-indigo-400" />
          <span className="text-xs font-semibold text-slate-300">Technical Breakdown Diagram</span>
          <span className="text-[11px] text-slate-400">Step-by-step mathematical visual model</span>
        </div>
      );
  }
}

