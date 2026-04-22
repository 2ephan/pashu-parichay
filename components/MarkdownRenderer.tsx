import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  if (!content) return null;

  const parseInline = (text: string) => {
    // Handle Bold **text**
    const boldParts = text.split(/(\*\*.*?\*\*)/g);
    return boldParts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="font-bold text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>;
      }
      
      // Handle Italic *text* (inside non-bold parts)
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((subPart, subIndex) => {
        // Basic check to avoid matching list markers like "* item"
        if (subPart.startsWith('*') && subPart.endsWith('*') && subPart.length > 2 && !subPart.includes(' ')) {
           return <em key={`${index}-${subIndex}`} className="italic text-slate-800 dark:text-slate-200">{subPart.slice(1, -1)}</em>;
        }
        return subPart;
      });
    });
  };

  // Split by newlines but keep track of code blocks if needed (simple version here)
  const lines = content.split('\n');
  
  return (
    <div className={`space-y-1.5 font-medium ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        
        // Headers
        if (trimmed.startsWith('### ')) return <h3 key={i} className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-4 mb-1">{parseInline(trimmed.slice(4))}</h3>;
        if (trimmed.startsWith('## ')) return <h2 key={i} className="text-xl font-bold text-slate-900 dark:text-white mt-5 mb-2">{parseInline(trimmed.slice(3))}</h2>;
        
        // Bullet points (handle * or -)
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
                <div key={i} className="flex items-start gap-2 pl-2 mb-1">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 opacity-80" />
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{parseInline(trimmed.slice(2))}</span>
                </div>
            );
        }

        // Numbered lists
        if (/^\d+\.\s/.test(trimmed)) {
            const [num, ...rest] = trimmed.split('.');
            return (
                <div key={i} className="flex items-start gap-2 pl-1 mb-1">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-sm min-w-[1.2rem] mt-0.5">{num}.</span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{parseInline(rest.join('.').trim())}</span>
                </div>
            );
        }

        // Standard Paragraph
        return <p key={i} className="text-slate-700 dark:text-slate-300 leading-relaxed">{parseInline(line)}</p>;
      })}
    </div>
  );
};