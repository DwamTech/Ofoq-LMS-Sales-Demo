import { brand } from "@/lib/brand";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpLeft,
  BookOpen,
  Compass,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  ShieldCheck,
  Target,
} from "lucide-react";
import { PublicNavigation, PublicFooter } from "@/components/brand/PublicShell";
import { BrandLogo } from "@/components/brand/BrandLogo";
import styles from "./About.module.css";

const sections = [
  [
    "intro",
    "التعريف",
    "مساحة واحدة للتجربة التعليمية.",
    `${brand.name} منصة عربية تجمع إدارة البرامج والمقررات وتجربة الطالب والاختبارات والشهادات والتقارير. تخدم الأكاديميات والجهات التدريبية التي تحتاج إلى تنظيم العمل التعليمي ومتابعته.`,
  ],
  [
    "mission",
    "الرسالة",
    "تقريب التشغيل من التعلم.",
    "إعطاء فريقك إطارًا واضحًا لتقديم البرامج، وإعطاء المتعلم سياقًا متصلًا لمتابعة محتواه وتقدمه وإنجازه.",
  ],
  [
    "goals",
    "الأهداف",
    "وضوح أكبر في كل مرحلة.",
    "تنظيم المحتوى والتسجيل، متابعة الدروس والاختبارات، وتوثيق الإتمام بشهادات قابلة للتحقق. ترتبط هذه المراحل بالبرنامج التعليمي نفسه.",
  ],
  [
    "values",
    "القيم",
    "الوضوح. الترابط. قابلية التحقق.",
    "واجهة عربية تراعي اتجاه القراءة، ومسارات تحفظ سياق المتعلم، وشهادات يرتبط إصدارها بمتطلبات الإتمام.",
  ],
  [
    "methodology",
    "المنهجية",
    "من البنية إلى الإنجاز.",
    "دبلومة تضم مقررات؛ مقرر يضم فصولًا ودروسًا. تسجيل، تعلم، تقييم، ثم شهادة. لكل خطوة مكانها داخل المنصة.",
  ],
  [
    "advantages",
    "قدرات المنصة",
    "رؤية مشتركة للطالب والإدارة.",
    "لوحة طالب للمقررات والاختبارات والشهادات، ولوحة إدارة للمستخدمين والمحتوى والتقارير، مع صلاحيات حسب الدور.",
  ],
] as const;

export default function AboutPage() {
  const icons = [
    Layers3,
    Compass,
    Target,
    ShieldCheck,
    BookOpen,
    LayoutDashboard,
  ];
  return (
    <div id="top">
      <PublicNavigation />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="about-title">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>
                <span />
                التجربة التعليمية
              </span>
              <h1 id="about-title">
                التعليم يستحق
                <br />
                <em>تجربة متصلة.</em>
              </h1>
              <p>
                منتج للأكاديميات والجهات التدريبية. يجمع التفاصيل التي تجعل
                البرنامج التعليمي تجربة مترابطة.
              </p>
            </div>
            <div className={styles.visual} aria-hidden="true">
              <div className={styles.visualOrbit} />
              <div className={styles.visualOrbitOuter} />
              <svg viewBox="0 0 400 300" fill="none">
                <path d="M85 75L200 150L315 75M200 150L200 260" />
              </svg>
              <div className={styles.visualHub}>
                <BrandLogo variant="icon" decorative />
              </div>
              {[BookOpen, LayoutDashboard, GraduationCap].map((Icon, i) => (
                <span className={styles.visualNode} data-node={i} key={i}>
                  <Icon size={30} />
                </span>
              ))}
            </div>
          </div>
          <nav className={styles.index} aria-label="أقسام التعريف">
            {sections.map(([id, label], i) => {
              const Icon = icons[i];
              return (
                <a href={`#${id}`} key={id}>
                  <Icon size={18} aria-hidden="true" />
                  <span>{label}</span>
                  <ArrowDownLeft size={16} aria-hidden="true" />
                </a>
              );
            })}
          </nav>
        </section>
        <section className={styles.details}>
          <div className={styles.detailsGrid}>
            <aside className={styles.intro}>
              <span className={styles.eyebrow}>{brand.name}</span>
              <h2>
                من أول برنامج،
                <br />
                إلى آخر <em>شهادة.</em>
              </h2>
              <div className={styles.path} aria-hidden="true">
                <Layers3 size={22} />
                <i />
                <BookOpen size={22} />
                <i />
                <GraduationCap size={24} />
              </div>
              <Link href="/auth" className={styles.action}>
                استكشف {brand.name} <ArrowUpLeft size={20} aria-hidden="true" />
              </Link>
            </aside>
            <div className={styles.articles}>
              {sections.map(([id, label, title, content], i) => {
                const Icon = icons[i];
                return (
                  <article id={id} key={id} className={styles.article}>
                    <div className={styles.articleTop}>
                      <span className={styles.articleIcon}>
                        <Icon size={24} aria-hidden="true" />
                      </span>
                      <span className={styles.articleLabel}>{label}</span>
                    </div>
                    <h2>{title}</h2>
                    <p>{content}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
