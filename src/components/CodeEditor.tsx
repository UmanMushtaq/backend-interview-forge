import Editor from '@monaco-editor/react';
import { useProgressState } from '../hooks/useProgress';

export function CodeEditor({
  value,
  onChange,
  language = 'typescript',
  height = '100%',
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  language?: string;
  height?: string | number;
  readOnly?: boolean;
}) {
  const { settings } = useProgressState();
  return (
    <Editor
      height={height}
      language={language}
      theme={settings.theme === 'dark' ? 'vs-dark' : 'light'}
      value={value}
      onChange={(v) => onChange?.(v ?? '')}
      loading={<div className="p-4 text-sm text-muted">Loading editor…</div>}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 13,
        scrollBeyondLastLine: false,
        tabSize: 2,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
        fontFamily: 'JetBrains Mono, Fira Code, monospace',
        smoothScrolling: true,
      }}
    />
  );
}
