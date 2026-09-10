import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cardData } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger);

interface CardProps {
  id: number;
  title: string;
  description: string;
  index: number;
  totalCards: number;
}

const Card: React.FC<CardProps> = ({ title, description, index, totalCards }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const card = cardRef.current;
    const container = containerRef.current;
    if (!card || !container) return;

    const targetScale = 1 - (totalCards - index) * 0.05;

    gsap.set(card, {
      scale: 1,
      transformOrigin: "center top",
    });

    ScrollTrigger.create({
      trigger: container,
      start: "top center",
      end: "bottom center",
      scrub: 1,
      onUpdate: (self) => {
        const progress = self.progress;
        const scale = gsap.utils.interpolate(1, targetScale, progress);
        gsap.set(card, {
          scale: Math.max(scale, targetScale),
          transformOrigin: "center top",
        });
      },
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [index, totalCards]);

  return (
    <div
      ref={containerRef}
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "sticky",
        top: 0,
      }}
    >
      <div
        ref={cardRef}
        style={{
          position: "relative",
          width: "70%",
          height: "450px",
          borderRadius: "24px",
          isolation: "isolate",
          top: `calc(-5vh + ${index * 25}px)`,
          transformOrigin: "top",
        }}
        className="card-content"
      >
        {/* Subtle blue border glow */}
        <div
          style={{
            position: "absolute",
            inset: "-2px",
            borderRadius: "26px",
            padding: "2px",
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(59,130,246,0.35) 90deg, transparent 180deg, rgba(34,211,238,0.2) 270deg, transparent 360deg)",
            zIndex: -1,
          }}
        />

        {/* Main Card Content */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderRadius: "24px",
            background: "linear-gradient(145deg, rgba(15,23,42,0.85), rgba(15,23,42,0.7))",
            backdropFilter: "blur(25px) saturate(180%)",
            border: "1px solid rgba(59,130,246,0.15)",
            boxShadow: `
              0 8px 32px rgba(0,0,0,0.4),
              0 2px 8px rgba(0,0,0,0.3),
              inset 0 1px 0 rgba(255,255,255,0.06),
              inset 0 -1px 0 rgba(255,255,255,0.02)
            `,
            overflow: "hidden",
          }}
        >
          {/* Top glass reflection */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "60%",
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, transparent 100%)",
              pointerEvents: "none",
              borderRadius: "24px 24px 0 0",
            }}
          />

          {/* Top shine line */}
          <div
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              right: "10px",
              height: "1px",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.4) 50%, transparent 100%)",
              borderRadius: "1px",
              pointerEvents: "none",
            }}
          />

          {/* Left edge highlight */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "1px",
              height: "100%",
              background: "linear-gradient(180deg, rgba(59,130,246,0.2) 0%, transparent 50%)",
              borderRadius: "24px 0 0 24px",
              pointerEvents: "none",
            }}
          />

          {/* Frosted texture overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 30%, rgba(59,130,246,0.06) 1px, transparent 2px),
                radial-gradient(circle at 80% 70%, rgba(34,211,238,0.04) 1px, transparent 2px),
                radial-gradient(circle at 40% 80%, rgba(255,255,255,0.03) 1px, transparent 2px)
              `,
              backgroundSize: "30px 30px, 25px 25px, 35px 35px",
              pointerEvents: "none",
              borderRadius: "24px",
              opacity: 0.7,
            }}
          />

          {/* Card text content */}
          <div style={{ position: "relative", zIndex: 1, padding: "2.5rem" }}>
            <h3
              style={{
                fontSize: "1.5rem",
                fontWeight: 600,
                color: "#f1f5f9",
                marginBottom: "0.75rem",
                letterSpacing: "-0.01em",
              }}
            >
              {title}
            </h3>
            <p
              style={{
                fontSize: "1rem",
                lineHeight: 1.6,
                color: "rgba(148,163,184,1)",
                maxWidth: "480px",
              }}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export const StackedCards: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    gsap.fromTo(container, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: "power2.out" });
  }, []);

  return (
    <main ref={containerRef} style={{ background: "#070b14" }}>
      {/* Hero Section */}
      <section
        style={{
          height: "70vh",
          width: "100%",
          display: "grid",
          placeContent: "center",
          position: "relative",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(to right, rgba(59,130,246,0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(59,130,246,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "54px 54px",
            maskImage: "radial-gradient(ellipse 60% 50% at 50% 0%, #000 70%, transparent 100%)",
          }}
        />
        <h1
          style={{
            fontSize: "clamp(2rem, 5vw, 4rem)",
            fontWeight: 500,
            textAlign: "center",
            lineHeight: 1.2,
            padding: "0 2rem",
            position: "relative",
            zIndex: 1,
          }}
        >
          How It Works
          <br />
          <span style={{ color: "rgba(148,163,184,1)", fontSize: "0.7em" }}>
            Scroll down to explore
          </span>
        </h1>
      </section>

      {/* Cards Section */}
      <section style={{ color: "#ffffff", width: "100%" }}>
        {cardData.map((card, index) => (
          <Card
            key={card.id}
            id={card.id}
            title={card.title}
            description={card.description}
            index={index}
            totalCards={cardData.length}
          />
        ))}
      </section>
    </main>
  );
};
