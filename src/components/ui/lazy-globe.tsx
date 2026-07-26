'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';

const World = dynamic(() => import('@/components/ui/globe').then((m) => m.World), {
  ssr: false,
});

type WorldComponentProps = React.ComponentProps<typeof World>;

export type LazyGlobeProps = Omit<WorldComponentProps, 'inView'>;

/**
 * Defers mounting the WebGL globe until the section is close to the viewport,
 * and pauses its render loop while it is off-screen.
 *
 * The wrapper div is `w-full h-full`, which is exactly the box the r3f <Canvas>
 * occupies today (Canvas renders with inline width:100%; height:100%). The
 * parent already reserves a fixed box via `aspect-[4/3] md:aspect-square`, so
 * the pre-mount placeholder is layout-identical to the mounted globe: zero CLS.
 */
export function LazyGlobe(props: LazyGlobeProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [shouldMount, setShouldMount] = React.useState(false);
  const [inView, setInView] = React.useState(false);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Safety net for environments without IntersectionObserver: render eagerly.
    if (typeof IntersectionObserver === 'undefined') {
      setShouldMount(true);
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[entries.length - 1];
        if (!entry) return;
        setInView(entry.isIntersecting);
        // Once mounted, never unmount — only the frameloop is toggled.
        if (entry.isIntersecting) setShouldMount(true);
      },
      { rootMargin: '400px' },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className="w-full h-full">
      {shouldMount ? <World {...props} inView={inView} /> : null}
    </div>
  );
}

export default LazyGlobe;
