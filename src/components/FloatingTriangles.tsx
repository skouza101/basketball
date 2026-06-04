"use client";

import gsap from "gsap";
import { useEffect, useRef, useState } from "react";

interface TriangleProp {
  id: number;
  size: number;
  color: string;
  left: string;
  top: string;
  duration: number;
  delay: number;
  rotateX: number;
  rotateY: number;
  rotateZ: number;
  zBase: number;
}

const createTriangles = (): TriangleProp[] => {
  const colors = [
    "#ff5500", // Brand Orange
    "#111111", // Dark almost black
    "#333333", // Dark grey
    "#888888", // Mid grey
    "#555555", // Mid-dark grey
  ];

  return Array.from({ length: 25 }, (_, id) => {
    const size = Math.random() * 50 + 20; // 20px to 70px
    const isDark = Math.random() > 0.8;
    const color = isDark
      ? "#ff5500"
      : colors[Math.floor(Math.random() * colors.length)];

    return {
      id,
      size,
      color,
      left: `${Math.random() * 100}%`,
      top: `${100 + Math.random() * 50}%`, // Start below the screen
      duration: Math.random() * 10 + 15, // 15s to 25s for slow floating
      delay: -(Math.random() * 20), // Start at different times, some already in view
      rotateX: Math.random() * 360,
      rotateY: Math.random() * 360,
      rotateZ: Math.random() * 360,
      zBase: Math.random() * 200 - 100, // For 3D perspective layering
    };
  });
};

export default function FloatingTriangles() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [triangles, setTriangles] = useState<TriangleProp[]>([]);

  useEffect(() => {
    setTriangles(createTriangles());
  }, []);

  useEffect(() => {
    if (!containerRef.current || triangles.length === 0) return;
    const context = gsap.context(() => {
      const triangleElements = gsap.utils.toArray<HTMLElement>(
        ".anti-gravity-triangle",
      );

      for (const el of triangleElements) {
        const duration = Number.parseFloat(
          el.getAttribute("data-duration") || "10",
        );
        const delay = Number.parseFloat(el.getAttribute("data-delay") || "0");

        // Continuous anti-gravity upward movement
        gsap.to(el, {
          y: "-120vh", // move well above the viewport
          ease: "none",
          duration,
          delay,
          repeat: -1,
        });

        // Continuous 3D rotation
        gsap.to(el, {
          rotationX: "+=360",
          rotationY: "+=360",
          rotationZ: "+=180",
          ease: "none",
          duration: duration * 1.5,
          repeat: -1,
        });
      }
    }, containerRef);

    return () => context.revert();
  }, [triangles.length]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ perspective: "1000px" }}
    >
      {triangles.map((t) => (
        <div
          key={t.id}
          className="anti-gravity-triangle absolute"
          data-duration={t.duration}
          data-delay={t.delay}
          style={{
            left: t.left,
            top: t.top,
            width: `${t.size}px`,
            height: `${t.size}px`,
            transform: `translateZ(${t.zBase}px) rotateX(${t.rotateX}deg) rotateY(${t.rotateY}deg) rotateZ(${t.rotateZ}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {/* We use an SVG to represent a 3D-like shaded triangle */}
          <svg
            viewBox="0 0 100 100"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
            aria-hidden="true"
            focusable="false"
            style={{ overflow: "visible" }}
          >
            <defs>
              <linearGradient
                id={`grad-${t.id}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={t.color} />
                <stop offset="100%" stopColor="#000000" stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <polygon
              points="50,0 100,100 0,100"
              fill={`url(#grad-${t.id})`}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
            {/* Adding a side face for fake 3D volume */}
            <polygon
              points="50,0 100,100 75,90"
              fill="#000000"
              fillOpacity={0.6}
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
