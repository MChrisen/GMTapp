import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

type Props = {
  tex: string;
  block?: boolean;
  className?: string;
};

export function Math({ tex, block = false, className }: Props) {
  const ref = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    try {
      katex.render(tex, ref.current, {
        displayMode: block,
        throwOnError: false,
        strict: 'ignore',
        output: 'html',
      });
    } catch {
      if (ref.current) ref.current.textContent = tex;
    }
  }, [tex, block]);

  if (block) {
    return <div className={className}><span ref={ref} /></div>;
  }
  return <span ref={ref} className={className} />;
}
