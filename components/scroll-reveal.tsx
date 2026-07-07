"use client";

/**
 * Fade-up-on-scroll wrapper (HOMEPAGE-REDESIGN.md section 11): opacity 0->1,
 * translateY 16px->0, 0.5s ease-out, triggered once via IntersectionObserver
 * as the section enters the viewport. No animation library — CSS transition
 * classes toggled by observer state. Respects prefers-reduced-motion by
 * skipping straight to the revealed state (no observer, no transition).
 */

import { useEffect, useRef, useState } from "react";

export function ScrollReveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
