'use client';

import { forwardRef, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface FadeInProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    className?: string;
    delay?: number;
    duration?: number;
    direction?: 'up' | 'down' | 'left' | 'right' | 'none';
    fullWidth?: boolean;
}

// Forwards refs and spreads extra props so FadeIn can be used as an
// `asChild` target (e.g. Radix DialogTrigger), which injects onClick/aria
// props into its immediate child.
export const FadeIn = forwardRef<HTMLDivElement, FadeInProps>(function FadeIn(
    {
        children,
        className,
        delay = 0,
        duration = 700,
        direction = 'up',
        fullWidth = false,
        style,
        ...rest
    },
    forwardedRef
) {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.unobserve(entry.target);
                }
            },
            {
                threshold: 0.1,
                rootMargin: '50px',
            }
        );

        const el = ref.current;
        if (el) {
            observer.observe(el);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    const getDirectionClass = () => {
        switch (direction) {
            case 'up':
                return 'slide-in-from-bottom-8';
            case 'down':
                return 'slide-in-from-top-8';
            case 'left':
                return 'slide-in-from-right-8';
            case 'right':
                return 'slide-in-from-left-8';
            default:
                return '';
        }
    };

    return (
        <div
            {...rest}
            ref={(node) => {
                ref.current = node;
                if (typeof forwardedRef === 'function') {
                    forwardedRef(node);
                } else if (forwardedRef) {
                    forwardedRef.current = node;
                }
            }}
            className={cn(
                'transition-opacity',
                isVisible ? 'opacity-100 animate-in fade-in zoom-in-95' : 'opacity-0',
                isVisible && getDirectionClass(),
                fullWidth ? 'w-full' : '',
                className
            )}
            style={{
                animationDuration: `${duration}ms`,
                animationDelay: `${delay}ms`,
                animationFillMode: 'both',
                ...style,
            }}
        >
            {children}
        </div>
    );
});
