import { brand } from "@/lib/brand";
import { experienceRoutes } from "@/lib/experienceRoutes";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpLeft,
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Layers3,
  LayoutDashboard,
  Plus,
  ShieldCheck,
  Users,
} from "lucide-react";
import { getPublicDiplomas } from "@/utils/categoryService";
import { PublicNavigation, PublicFooter } from "@/components/brand/PublicShell";
import {
  HeroVisual,
  JourneyStory,
  ProductExplorer,
  Reveal,
} from "@/components/brand/ShowcaseMotion";
import { ProductPanel } from "@/components/brand/ProductPanel";
import { ProgramGraphic } from "@/components/brand/ProgramGraphic";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { HomeExperienceSection } from "@/components/experience/HomeExperienceSection";
import { publicDescription } from "@/components/brand/publicContent";
import styles from "@/components/brand/Showcase.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: brand.name,
  description:
    "منصة عربية لإدارة البرامج التعليمية والمقررات والتعلم والاختبارات والشهادات والتقارير. للأكاديميات والجهات التدريبية.",
};

export default async function HomePage() {
  const result = await getPublicDiplomas()
    .then((data) => ({ data, failed: false }))
    .catch(() => ({ data: [], failed: true }));
  const programs = result.data;
  return (
    <div id="top">
      <PublicNavigation />
      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.heroKicker}>
                <span className={styles.tinyDot} /> للأكاديميات والجهات
                التدريبية الطموحة
              </span>
              <h1 id="hero-title">
                <em>{brand.name}.</em>
                <span className={styles.heroTitleLine}>
                  لإدارة التجربة
                </span>{" "}
                <span className={styles.heroTitleLine}>التعليمية.</span>
              </h1>
              <p>
                منصتك لإدارة البرامج والتعلّم والاختبارات والشهادات. لتمنح فريقك
                وضوحًا أكبر، ومتعلميك تجربة متصلة.
              </p>
              <div className={styles.heroActions}>
                <Link href={experienceRoutes.gateway} className={styles.action}>
                  استكشف المنصة <ArrowUpLeft size={19} />
                </Link>
                <a href="#journey" className={styles.secondaryAction}>
                  شاهد كيف تتصل الرحلة <ArrowDown size={15} />
                </a>
              </div>
            </div>
            <HeroVisual programs={programs} />
          </div>
        </section>
        <HomeExperienceSection
          program={
            programs[0]
              ? {
                  name: programs[0].name,
                  courses: programs[0].courses_count ?? 0,
                }
              : null
          }
        />
        <JourneyStory programs={programs} />
        <section
          className={`${styles.section} ${styles.productSection}`}
          id="product"
        >
          <div className={styles.sectionIntro}>
            <div>
              <h2>
                من يدير التجربة.
                <br />
                <em>ومن يعيشها.</em>
              </h2>
            </div>
            <p>
              البرنامج نفسه، من منظورين مختلفين. استكشف بنية تجربة الإدارة
              والطالب، ثم انتقل إلى المنصة الفعلية.
            </p>
          </div>
          <Reveal>
            <ProductExplorer programs={programs} />
          </Reveal>
        </section>
        <section
          className={`${styles.section} ${styles.capabilitySection}`}
          id="capabilities"
        >
          <div className={styles.capabilities}>
            <div className={styles.capabilityIntro}>
              <h2 className={styles.capabilityTitle}>
                تفاصيل التشغيل،
                <br />
                تعمل <em>معًا.</em>
              </h2>
              <div className={styles.capabilityDiagram} aria-hidden="true">
                <svg viewBox="0 0 300 240" fill="none">
                  <path d="M150 120V30 M150 120L265 90 M150 120L220 215 M150 120L80 215 M150 120L35 90" />
                  <path
                    className={styles.capabilityFlow}
                    d="M150 120V30 M150 120L265 90 M150 120L220 215 M150 120L80 215 M150 120L35 90"
                  />
                  <circle cx="150" cy="120" r="75" />
                </svg>
                <div className={styles.capabilityHub}>
                  <BrandLogo variant="icon" decorative />
                </div>
                {[
                  Layers3,
                  BookOpen,
                  ClipboardCheck,
                  GraduationCap,
                  LayoutDashboard,
                ].map((Icon, i) => (
                  <span className={styles.capabilityNode} data-node={i} key={i}>
                    <Icon size={24} />
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.capabilityRows}>
              {[
                [
                  "برامج لها بنية",
                  "نظّم الدبلومات والمقررات والفصول والدروس. تحكم في المحتوى المنشور واجعل مسار البرنامج واضحًا.",
                ],
                [
                  "تعلم له سياق",
                  "إدارة التسجيل ومقررات الطالب والتقدم في الدروس، مع تجربة فيديو تعليمية مرتبطة بالمحتوى.",
                ],
                [
                  "تقييم له مرجع",
                  "بنوك أسئلة واختبارات نهائية ومحاولات ونتائج؛ ترتبط بالمقرر وتجربة المتعلم.",
                ],
                [
                  "إنجاز له توثيق",
                  "شهادات مقررات ودبلومات قابلة للتنزيل والتحقق، بعد استيفاء شروط الإتمام.",
                ],
                [
                  "إدارة لها رؤية",
                  "صلاحيات للأدوار، وإدارة مستخدمين وبرامج، وتقارير للطلاب والمقررات والدبلومات.",
                ],
              ].map(([title, description], i) => {
                const Icon = [
                  Layers3,
                  BookOpen,
                  ClipboardCheck,
                  GraduationCap,
                  LayoutDashboard,
                ][i];
                return (
                  <details key={title} open={i === 0}>
                    <summary>
                      <span className={styles.capabilityIcon}>
                        <Icon size={22} aria-hidden="true" />
                      </span>
                      <span className={styles.capabilityLabel}>{title}</span>
                      <span className={styles.capabilityToggle}>
                        <Plus size={18} aria-hidden="true" />
                      </span>
                    </summary>
                    <p>{description}</p>
                  </details>
                );
              })}
            </div>
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.programSection}`}
          id="programs"
        >
          <div className={`${styles.sectionIntro} ${styles.programIntro}`}>
            <div>
              <h2>
                ليست مجرد واجهات.
                <br />
                هنا محتوى <em>يعمل.</em>
              </h2>
            </div>
            <p>
              برامج منشورة من كتالوج المنصة الحالي. أسماء ومقررات وتفاصيل يمكن
              فتحها واستكشافها؛ هذه بيانات عرض تعليمية وليست أرقام عملاء.
            </p>
          </div>
          <div className={styles.programGrid}>
            {programs.slice(0, 3).map((program, i) => (
              <Link
                className={styles.programCard}
                key={program.id}
                href={`/diplomas/${program.slug}`}
              >
                <div className={styles.programCover}>
                  <ProgramGraphic
                    title={program.name}
                    identity={program.slug}
                  />
                  <div className={styles.programCoverTop}>
                    <small>
                      {brand.name} / PROGRAM 0{i + 1}
                    </small>
                    <span>
                      <BookOpen size={20} aria-hidden="true" />
                    </span>
                  </div>
                  <strong>{program.name.replace(/^دبلومة\s*/, "")}</strong>
                  <small>{brand.name}</small>
                </div>
                <div className={styles.programBody}>
                  <h3>{program.name}</h3>
                  <p>{publicDescription(program.description).slice(0, 120)}</p>
                  <div className={styles.programMeta}>
                    <span>
                      <Layers3 size={17} aria-hidden="true" />
                      {program.courses_count ?? "—"} مقررات تعليمية
                    </span>
                    <span className={styles.programArrow}>
                      <ArrowUpLeft size={20} aria-hidden="true" />
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {programs.length === 0 && (
            <div className={styles.programEmpty}>
              <div className={styles.programEmptyArt} aria-hidden="true">
                <span />
                <span />
                <span>
                  <BookOpen size={36} />
                </span>
              </div>
              <p role="status">
                {result.failed
                  ? "تعذر الاتصال بكتالوج البرامج الآن. يمكنك إعادة المحاولة من صفحة البرامج."
                  : "لا توجد برامج منشورة حاليًا."}
              </p>
            </div>
          )}
          <div className={styles.programFooter}>
            <Link href="/diploms" className={styles.catalogLink}>
              استكشف كل البرامج <ArrowUpLeft size={20} />
            </Link>
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.achievement}`}
          id="achievement"
        >
          <div className={styles.achievementCopy}>
            <h2>
              التعلم رحلة.
              <br />
              والإنجاز <em>أثر.</em>
            </h2>
            <p>
              من تقدم الدروس إلى الاختبار النهائي، ثم شهادة المقرر أو الدبلومة.
              خطوات مترابطة، وشهادة يمكن الرجوع إلى مرجعها للتحقق.
            </p>
            <div className={styles.achievementPath} aria-hidden="true">
              <span>
                <BookOpen size={22} />
              </span>
              <i />
              <span>
                <ClipboardCheck size={22} />
              </span>
              <i />
              <span>
                <GraduationCap size={24} />
              </span>
            </div>
            <Link href="/verify-certificate" className={styles.catalogLink}>
              <ShieldCheck size={19} /> تحقق من شهادة <ArrowUpLeft size={18} />
            </Link>
          </div>
          <div className={styles.achievementVisual}>
            <div className={styles.achievementOrbit} aria-hidden="true" />
            <div className={styles.achievementStamp} aria-hidden="true">
              <ShieldCheck size={32} />
            </div>
            <ProductPanel perspective="certificate" programs={programs} />
          </div>
        </section>
        <section
          className={`${styles.section} ${styles.intelligence}`}
          id="intelligence"
        >
          <div className={styles.intelligenceCopy}>
            <div className={styles.intelligenceMark} aria-hidden="true">
              <LayoutDashboard size={25} />
              <span />
            </div>
            <h2>
              قريب من التفاصيل.
              <br />
              مُطّلع على <em>الصورة الكاملة.</em>
            </h2>
            <p>
              تابع الطلاب والمقررات والدبلومات من التقارير الموجودة بالمنصة.
              واجهة إدارة واحدة تجمع ما يحتاجه فريق التشغيل التعليمي.
            </p>
          </div>
          <div className={styles.reportList}>
            {[
              ["الطلاب والمستفيدون", "STUDENTS"],
              ["المقررات والدروس", "COURSES"],
              ["الدبلومات والبرامج", "PROGRAMS"],
            ].map(([label, english], i) => {
              const Icon = [Users, BookOpen, Layers3][i];
              return (
                <Link
                  href={experienceRoutes.gateway}
                  key={label}
                  className={styles.reportCard}
                >
                  <span className={styles.reportIcon}>
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <div className={styles.reportCopy}>
                    <strong>{label}</strong>
                    <span lang="en" dir="ltr">
                      {english}
                    </span>
                  </div>
                  <svg
                    className={styles.reportGraphic}
                    viewBox="0 0 100 48"
                    fill="none"
                    aria-hidden="true"
                  >
                    {i === 0 ? (
                      <>
                        <path d="M5 40H95M10 29L28 33L46 19L64 25L90 8" />
                        <circle cx="90" cy="8" r="4" />
                      </>
                    ) : i === 1 ? (
                      <>
                        <rect x="8" y="24" width="13" height="17" rx="3" />
                        <rect x="32" y="16" width="13" height="25" rx="3" />
                        <rect x="56" y="21" width="13" height="20" rx="3" />
                        <rect x="80" y="7" width="13" height="34" rx="3" />
                      </>
                    ) : (
                      <>
                        <rect x="9" y="10" width="44" height="28" rx="5" />
                        <rect x="28" y="14" width="44" height="28" rx="5" />
                        <rect x="47" y="6" width="44" height="28" rx="5" />
                      </>
                    )}
                  </svg>
                  <span className={styles.reportArrow}>
                    <ArrowUpLeft size={20} aria-hidden="true" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
        <section className={styles.closing} id="closing">
          <div className={styles.closingCard}>
            <div className={styles.closingCopy}>
              <span className={styles.eyebrow}>التجربة التعليمية</span>
              <h2>
                تجربتك التعليمية،
                <br />
                <span>متصلة من البداية.</span>
              </h2>
              <p>
                شاهد المنصة من الداخل. واكتشف كيف تجتمع الرحلة في مكان واحد.
              </p>
              <Link href={experienceRoutes.gateway} className={styles.action}>
                ادخل إلى المنصة <ArrowUpLeft size={20} aria-hidden="true" />
              </Link>
            </div>
            <div className={styles.closingVisual} aria-hidden="true">
              <div className={styles.closingRing} />
              <div className={styles.closingRingOuter} />
              <svg viewBox="0 0 360 300" fill="none">
                <path d="M255 45C290 110 225 130 180 150S38 150 40 200S180 290 250 260" />
                <circle cx="290" cy="155" r="5" />
                <circle cx="125" cy="53" r="4" />
              </svg>
              <div className={styles.closingHub}>
                <BrandLogo variant="icon" decorative />
              </div>
              <span className={styles.closingTile} data-tile="0">
                <BookOpen size={28} />
              </span>
              <span className={styles.closingTile} data-tile="1">
                <ShieldCheck size={28} />
              </span>
              <span className={styles.closingTile} data-tile="2">
                <GraduationCap size={30} />
              </span>
            </div>
          </div>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
}
