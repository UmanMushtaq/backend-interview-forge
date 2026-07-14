import { Children, isValidElement } from 'react';
import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { Mermaid } from './Mermaid';

function extractText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (typeof child === 'number') return String(child);
      if (isValidElement<{ children?: ReactNode }>(child)) return extractText(child.props.children);
      return '';
    })
    .join('');
}

export function Markdown({ children, className = '' }: { children: string; className?: string }) {
  return (
    <div className={`prose-forge ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={{
          pre({ children: preChildren, ...props }) {
            const child = Children.only(preChildren);
            const isMermaid =
              isValidElement<{ className?: string }>(child) && child.props.className?.includes('language-mermaid');
            if (isMermaid) return <>{preChildren}</>;
            return <pre {...props}>{preChildren}</pre>;
          },
          code({ className: codeClassName, children: codeChildren, ...props }) {
            if (codeClassName?.includes('language-mermaid')) {
              return <Mermaid chart={extractText(codeChildren)} />;
            }
            return (
              <code className={codeClassName} {...props}>
                {codeChildren}
              </code>
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
