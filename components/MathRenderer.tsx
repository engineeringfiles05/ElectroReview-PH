import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  text?: string;
  content?: string;
  className?: string;
  inline?: boolean;
}

// Clean and normalize LaTeX strings before feeding to KaTeX to prevent syntax errors
export function sanitizeLatex(latex: string): string {
  if (!latex) return '';
  let cleaned = latex.trim();

  // Strip leading/trailing outer math delimiters if present
  if (cleaned.startsWith('$$') && cleaned.endsWith('$$') && cleaned.length >= 4) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('$') && cleaned.endsWith('$') && cleaned.length >= 2) {
    cleaned = cleaned.slice(1, -1).trim();
  } else if (cleaned.startsWith('\\[') && cleaned.endsWith('\\]') && cleaned.length >= 4) {
    cleaned = cleaned.slice(2, -2).trim();
  } else if (cleaned.startsWith('\\(') && cleaned.endsWith('\\)') && cleaned.length >= 4) {
    cleaned = cleaned.slice(2, -2).trim();
  }

  // 1. Fix common English connecting words inside math mode if not already wrapped in \text{...}
  // Words like 'with', 'we find', 'we get', 'where', 'when', 'if', 'then', 'let', 'for', 'since', 'gives', 'therefore', 'substituting', 'yields'
  const connectives = [
    'we find that', 'we find', 'we get', 'we have', 'substituting', 'which gives',
    'with', 'where', 'when', 'since', 'therefore', 'yields', 'leads to', 'let', 'then', 'for'
  ];

  connectives.forEach(phrase => {
    // Only replace if not preceded by backslash and not already inside \text{...}
    const escaped = phrase.replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(?<!\\\\[a-zA-Z]*)\\b(${escaped})\\b(?![^{]*\\})`, 'gi');
    cleaned = cleaned.replace(regex, (match) => `\\text{ ${match} }`);
  });

  // 2. Fix broken phi subscripts or malformed escape sequences
  cleaned = cleaned.replace(/\\1\\phi/g, '1\\phi');
  cleaned = cleaned.replace(/_\{([^}]*?)1\\phi\}/g, '_{\\text{$1, 1}\\phi}');
  cleaned = cleaned.replace(/_([a-zA-Z0-9]+,1\\phi)/g, '_{\\text{$1}}');
  
  // 3. Fix unbracketed multi-letter subscripts like P_loss -> P_{\text{loss}}, v_final -> v_{\text{final}}
  cleaned = cleaned.replace(/\b([PVIREQZXvVa-z])_([a-zA-Z]{2,})\b/g, '$1_{\\text{$2}}');

  // 4. Fix common units and symbols
  cleaned = cleaned.replace(/\\ohm\b/g, '\\Omega');
  cleaned = cleaned.replace(/\\degree\b/g, '^{\\circ}');
  cleaned = cleaned.replace(/\\deg\b/g, '^{\\circ}');
  cleaned = cleaned.replace(/°/g, '^{\\circ}');
  cleaned = cleaned.replace(/(\d+)\s*x\s*10\^/gi, '$1 \\times 10^');
  cleaned = cleaned.replace(/(\d+)\s*\*\s*(\d+)/g, '$1 \\times $2');
  cleaned = cleaned.replace(/-->|==>/g, '\\implies ');
  cleaned = cleaned.replace(/->/g, '\\rightarrow ');

  // 5. Fix common engineering units inside math if raw
  cleaned = cleaned.replace(/\b(\d+(?:\.\d+)?)\s*(m\/s\^2|m\/s|km\/h|rad\/s|kVAR|kVA|MW|kW|kV|mA|pF|uF|µF|mH|uH|µH|Hz|kHz|MHz|GHz|N-m|N\cdot m)\b/g, '$1\\text{ $2}');

  // 6. Clean dangling trailing backslashes or incomplete LaTeX macros
  cleaned = cleaned.replace(/\\+$/, '');
  cleaned = cleaned.replace(/\\sqrt\s*$/g, '');
  cleaned = cleaned.replace(/\\frac\s*$/g, '');

  // 7. Auto-balance braces { and }
  let openBraces = 0;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '{' && (i === 0 || cleaned[i - 1] !== '\\')) openBraces++;
    if (cleaned[i] === '}' && (i === 0 || cleaned[i - 1] !== '\\')) openBraces--;
  }
  if (openBraces > 0) {
    cleaned += '}'.repeat(openBraces);
  } else if (openBraces < 0) {
    while (openBraces < 0 && cleaned.endsWith('}')) {
      cleaned = cleaned.slice(0, -1);
      openBraces++;
    }
  }

  // 8. Auto-balance parentheses ( and )
  let openParens = 0;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '(' && (i === 0 || cleaned[i - 1] !== '\\')) openParens++;
    if (cleaned[i] === ')' && (i === 0 || cleaned[i - 1] !== '\\')) openParens--;
  }
  if (openParens > 0) {
    cleaned += ')'.repeat(openParens);
  }

  // 9. Auto-balance brackets [ and ]
  let openBrackets = 0;
  for (let i = 0; i < cleaned.length; i++) {
    if (cleaned[i] === '[' && (i === 0 || cleaned[i - 1] !== '\\')) openBrackets++;
    if (cleaned[i] === ']' && (i === 0 || cleaned[i - 1] !== '\\')) openBrackets--;
  }
  if (openBrackets > 0) {
    cleaned += ']'.repeat(openBrackets);
  }

  return cleaned;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ text, content, className = '', inline = false }) => {
  const targetText = text ?? content ?? '';
  if (!targetText) return null;

  // Regex pattern to split math equations from standard text
  // Supports $$...$$, $...$, \\[...\\] and \\(...\\) delimiters
  const pattern = /(\$\$(?:[^\$]|\\\$)*\$\$|\$(?:[^\$]|\\\$)*\$|\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g;
  const parts = targetText.split(pattern);

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part) return null;

        const isBlock = (part.startsWith('$$') && part.endsWith('$$')) || 
                        (part.startsWith('\\[') && part.endsWith('\\]'));
        
        const isInline = (part.startsWith('$') && part.endsWith('$')) || 
                         (part.startsWith('\\(') && part.endsWith('\\)'));

        if (isBlock) {
          let math = part.slice(2, -2).trim();
          math = sanitizeLatex(math);
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
              errorColor: '#f43f5e',
              strict: false,
            });
            return (
              <span
                key={index}
                className="block my-2 overflow-x-auto text-center py-2 px-3 rounded-xl bg-black/40 border border-white/10 font-mono text-sm sm:text-base tracking-wide"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code key={index} className="block my-2 bg-white/5 p-2 rounded text-xs whitespace-pre-wrap font-mono">
                {part}
              </code>
            );
          }
        } else if (isInline) {
          let math = part.startsWith('$') ? part.slice(1, -1).trim() : part.slice(2, -2).trim();
          math = sanitizeLatex(math);
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
              errorColor: '#f43f5e',
              strict: false,
            });
            return (
              <span
                key={index}
                className="inline-block align-middle mx-0.5 font-mono text-sm"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch {
            return (
              <code key={index} className="bg-white/5 px-1 rounded text-xs font-mono">
                {part}
              </code>
            );
          }
        } else {
          // If the text part itself contains obvious inline math expressions like "P_loss = ...",
          // let's check if we can format mathematical sub-clauses nicely
          return <span key={index}>{renderTextWithMathHeuristic(part)}</span>;
        }
      })}
    </span>
  );
};

// Heuristic renderer to detect and format LaTeX fragments embedded without $ delimiters
function renderTextWithMathHeuristic(rawText: string): React.ReactNode {
  // If string contains explicit LaTeX commands like \frac, \sqrt, \times, \Omega, \rho, \implies, etc.
  if (/\\(frac|sqrt|times|Omega|rho|implies|pi|sum|int|alpha|beta|gamma|theta|sigma|mu|pm|approx|le|ge)\b/.test(rawText)) {
    try {
      const sanitized = sanitizeLatex(rawText);
      const html = katex.renderToString(sanitized, {
        displayMode: false,
        throwOnError: false,
        errorColor: '#f43f5e',
        strict: false,
      });
      return <span className="inline-block align-middle mx-0.5" dangerouslySetInnerHTML={{ __html: html }} />;
    } catch {
      return rawText;
    }
  }
  return rawText;
}

