"use client";
import { useState } from "react";
import guides from "@/data/community.json";
import { ArrowUpLeft, BookOpen, Download } from "lucide-react";
import styles from "./PublicEducation.module.css";

type Language = keyof typeof guides;
export default function CommunityMedia() {
  const [language, setLanguage] = useState<Language>("ar");
  const languages: Language[] = ["ar", "en", "fr"];
  return (
    <section className={styles.communityMedia}>
      <div role="tablist" aria-label="لغة الفيديو" className={styles.mediaTabs}>
        {languages.map((lang, index) => (
          <button
            key={lang}
            id={`media-${lang}`}
            role="tab"
            type="button"
            aria-selected={language === lang}
            aria-controls="community-media"
            tabIndex={language === lang ? 0 : -1}
            onClick={() => setLanguage(lang)}
            onKeyDown={(event) => {
              const next =
                event.key === "Home"
                  ? 0
                  : event.key === "End"
                    ? 2
                    : event.key === "ArrowRight"
                      ? (index + 1) % 3
                      : event.key === "ArrowLeft"
                        ? (index + 2) % 3
                        : -1;
              if (next >= 0) {
                event.preventDefault();
                setLanguage(languages[next]);
                document.getElementById(`media-${languages[next]}`)?.focus();
              }
            }}
          >
            {lang === "ar" ? "عربي" : lang === "en" ? "English" : "Français"}
          </button>
        ))}
      </div>
      <div
        id="community-media"
        role="tabpanel"
        aria-labelledby={`media-${language}`}
      >
        <div
          className={styles.unavailableMedia}
          dir={language === "ar" ? "rtl" : "ltr"}
        >
          <span data-media-empty-icon aria-hidden="true">
            <BookOpen size={34} />
          </span>
          <h2>{guides[language].title}</h2>
          <p>{guides[language].description}</p>
          <ol
            style={{
              textAlign: "start",
              lineHeight: 2.1,
              maxWidth: 650,
              margin: "16px auto",
            }}
          >
            {guides[language].steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <button
            type="button"
            style={{
              padding: "12px 20px",
              borderRadius: 16,
              background: "#63507e",
              color: "white",
              border: 0,
              font: "inherit",
              cursor: "pointer",
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
            }}
            onClick={() => {
              const guide = guides[language],
                url = URL.createObjectURL(
                  new Blob(
                    [
                      guide.title +
                        "\n\n" +
                        guide.description +
                        "\n\n" +
                        guide.steps.join("\n"),
                    ],
                    { type: "text/plain;charset=utf-8" },
                  ),
                );
              const link = document.createElement("a");
              link.href = url;
              link.download = "learning-worksheet-" + language + ".txt";
              link.click();
              setTimeout(() => URL.revokeObjectURL(url), 1000);
            }}
          >
            <Download size={18} />
            {guides[language].download}
          </button>
          <a href="/diploms">
            {guides[language].action}
            <ArrowUpLeft size={19} aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
