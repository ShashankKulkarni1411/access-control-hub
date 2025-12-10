import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Save, Play, Copy, Lock, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CodeEditorProps {
  code: string;
  onChange: (code: string) => void;
  onSave?: () => void;
  fileName?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ code, onChange, onSave, fileName = 'index.tsx' }) => {
  const { canEdit, role } = useAuth();
  const [localCode, setLocalCode] = useState(code);
  const isEditable = canEdit();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!isEditable) { toast.error('Permission Denied'); return; }
    setLocalCode(e.target.value);
    onChange(e.target.value);
  };

  const handleSave = () => { if (isEditable) { onSave?.(); toast.success('Saved!'); } };
  const handleCopy = () => { navigator.clipboard.writeText(localCode); toast.success('Copied!'); };

  const lines = localCode.split('\n');

  return (
    <div className="workspace-panel h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[hsl(var(--workspace-border))]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-destructive/60" />
            <span className="w-3 h-3 rounded-full bg-workspace-warning/60" />
            <span className="w-3 h-3 rounded-full bg-workspace-success/60" />
          </div>
          <span className="text-sm text-muted-foreground font-mono">{fileName}</span>
          {!isEditable && <span className="flex items-center gap-1.5 px-2 py-1 rounded bg-destructive/10 text-destructive text-xs"><Lock className="w-3 h-3" />Read Only</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleCopy} className="btn-workspace-secondary p-2"><Copy className="w-4 h-4" /></button>
          <button onClick={handleSave} disabled={!isEditable} className={cn("btn-workspace p-2", !isEditable && "opacity-50")}><Save className="w-4 h-4" /></button>
          <button disabled={!isEditable} className={cn("btn-workspace px-3 py-2", !isEditable && "opacity-50")}><Play className="w-4 h-4" /><span className="text-sm">Run</span></button>
        </div>
      </div>

      {!isEditable && (
        <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-destructive" />
          <span className="text-sm text-destructive">Viewing as <span className="font-semibold">{role}</span> — editing disabled</span>
        </div>
      )}

      <div className="flex-1 overflow-auto">
        <div className="editor-container min-h-full">
          <div className="flex">
            <div className="select-none py-4 px-3 text-right text-editor-gutter border-r border-editor-line">
              {lines.map((_, i) => <div key={i} className="leading-6 text-xs">{i + 1}</div>)}
            </div>
            <div className="flex-1 relative">
              <textarea value={localCode} onChange={handleChange} readOnly={!isEditable} className={cn("w-full h-full p-4 bg-transparent resize-none outline-none font-mono text-sm leading-6 text-foreground", !isEditable && "cursor-not-allowed opacity-75")} spellCheck={false} style={{ minHeight: `${lines.length * 24 + 32}px` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
