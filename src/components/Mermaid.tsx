import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../hooks/useTheme';

interface Props {
  chart: string;
}

const LIGHT_THEME_VARS = {
  background: '#ffffff',
  primaryColor: '#f1f5f9',
  primaryTextColor: '#0f172a',
  primaryBorderColor: '#cbd5e1',
  secondaryColor: '#f8fafc',
  secondaryBorderColor: '#e2e8f0',
  tertiaryColor: '#f1f5f9',
  tertiaryBorderColor: '#e2e8f0',
  lineColor: '#64748b',
  textColor: '#0f172a',
  mainBkg: '#f1f5f9',
  nodeTextColor: '#0f172a',
  clusterBkg: '#f8fafc',
  clusterBorder: '#e2e8f0',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
};

const DARK_THEME_VARS = {
  background: '#111622',
  primaryColor: '#181f2f',
  primaryTextColor: '#e2e8f0',
  primaryBorderColor: '#3a4762',
  secondaryColor: '#111622',
  secondaryBorderColor: '#242e42',
  tertiaryColor: '#181f2f',
  tertiaryBorderColor: '#242e42',
  lineColor: '#94a3b8',
  textColor: '#e2e8f0',
  mainBkg: '#181f2f',
  nodeTextColor: '#e2e8f0',
  clusterBkg: '#111622',
  clusterBorder: '#242e42',
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
};

let renderCounter = 0;

/** Renders a mermaid code block client-side, matching the platform's dark/light theme. */
export function Mermaid({ chart }: Props) {
  const { theme } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);

    (async () => {
      const { default: mermaid } = await import('mermaid');
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: 'base',
        themeVariables: theme === 'dark' ? DARK_THEME_VARS : LIGHT_THEME_VARS,
      });
      try {
        const id = `mermaid-diagram-${++renderCounter}`;
        const { svg } = await mermaid.render(id, chart);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [chart, theme]);

  if (error) {
    return (
      <div className="my-4 space-y-2 rounded-lg border border-danger/30 bg-danger/10 p-3 text-xs text-danger">
        <p>Diagram failed to render: {error}</p>
        <pre className="overflow-x-auto whitespace-pre-wrap">{chart}</pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto rounded-lg border border-border bg-surface p-4"
    />
  );
}
