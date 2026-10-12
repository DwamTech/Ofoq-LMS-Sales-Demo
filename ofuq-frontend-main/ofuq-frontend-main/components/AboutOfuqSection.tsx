"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { brand } from "@/lib/brand";

import Link from "next/link";
import styles from "./AboutOfuqSection.module.css";

export default function AboutOfuqSection() {
  return (
    <section
      className={styles.section}
      aria-labelledby="about-ofuq-title"
      dir="rtl"
    >
      <div className={styles.box}>
        <header className={styles.header}>
          <h2 id="about-ofuq-title" className={styles.title}>
            <span className={styles.titleAccent}>عن {brand.name}</span>
          </h2>
          <div className={styles.titleLine} aria-hidden="true" />
        </header>

        <div className={styles.content}>
          <aside className={styles.logoCard} aria-hidden="true">
            <BrandLogo className={styles.logo} />
          </aside>

          <div className={styles.textArea}>
            <p className={styles.description}>
              {brand.name} منصة تعليمية رائدة تقدّم برامج دبلوم احترافية تجمع
              بين الأصالة والمعاصرة، وتؤسس تجربة تعلم عالية الجودة. نُصمّم مناهج
              متوازنة ومتكاملة تسد الفجوة بين النظرية والممارسة، وتواكب احتياجات
              سوق العمل وتحديات العصر.
            </p>

            <div className={styles.actions}>
              <Link
                href="/diploms"
                className={`${styles.btn} ${styles.btnPrimary}`}
              >
                استكشف الدبلومات
              </Link>
              <Link
                href="/about"
                className={`${styles.btn} ${styles.btnSecondary}`}
              >
                اعرف أكثر عنا
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
