"use client";
import { useEffect, useState } from "react";
import { FRONTEND_CHANGE, readFrontend } from "@/lib/frontendStore";
import settings from "@/data/settings.json";
import HomeHeader from "./HomeHeader";
import Footer from "./Footer";
export default function LocalPolicy({ kind }: { kind: "privacy" | "terms" }) {
  const [content, setContent] = useState(settings[kind]);
  useEffect(() => {
    const refresh = () => setContent(readFrontend().settings[kind]);
    refresh();
    window.addEventListener(FRONTEND_CHANGE, refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener(FRONTEND_CHANGE, refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [kind]);
  return (
    <>
      <HomeHeader />
      <main style={{ maxWidth: 1100, margin: "0 auto", padding: "90px 24px" }}>
        <h1
          style={{
            fontSize: "clamp(30px,5vw,52px)",
            color: "#514068",
            marginBottom: 32,
          }}
        >
          {kind === "privacy" ? "سياسة الخصوصية" : "الشروط والأحكام"}
        </h1>
        <article
          style={{
            whiteSpace: "pre-wrap",
            fontSize: 18,
            lineHeight: 2.2,
            background: "#fffdf8",
            borderRadius: 28,
            padding: "clamp(24px,5vw,56px)",
            border: "1px solid #e4dcef",
          }}
        >
          {content}
        </article>
      </main>
      <Footer />
    </>
  );
}
