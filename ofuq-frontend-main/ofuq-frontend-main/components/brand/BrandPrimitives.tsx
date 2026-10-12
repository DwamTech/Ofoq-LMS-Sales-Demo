import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  ReactNode,
  CSSProperties,
} from "react";
import { brand } from "@/lib/brand";
import Link from "next/link";
import styles from "./BrandSystem.module.css";
import { ofoqDisplayFont, ofoqUiFont } from "./brandFonts";

type ChildrenProps = { children: ReactNode; className?: string };
const join = (...names: Array<string | undefined | false>) =>
  names.filter(Boolean).join(" ");

export function BrandScope({ children, className }: ChildrenProps) {
  const tokens = {
    "--brand-ink": brand.colors.ink,
    "--brand-purple": brand.colors.purple,
    "--brand-ivory": brand.colors.ivory,
    "--brand-paper": brand.colors.paper,
    "--brand-lime": brand.colors.lime,
    "--brand-copper": brand.colors.copper,
  } as CSSProperties;
  return (
    <div
      className={join(
        styles.scope,
        ofoqDisplayFont.variable,
        ofoqUiFont.variable,
        className,
      )}
      style={tokens}
      dir="rtl"
    >
      {children}
    </div>
  );
}

export function BrandContainer({ children, className }: ChildrenProps) {
  return <div className={join(styles.container, className)}>{children}</div>;
}

export function BrandSection({
  children,
  className,
  dark = false,
  ...props
}: ChildrenProps & HTMLAttributes<HTMLElement> & { dark?: boolean }) {
  return (
    <section
      className={join(styles.section, dark && styles.sectionDark, className)}
      {...props}
    >
      {children}
    </section>
  );
}

export function BrandHeading({
  children,
  as: Tag = "h2",
  level = "h2",
  className,
  ...props
}: ChildrenProps &
  HTMLAttributes<HTMLElement> & {
    as?: "h1" | "h2" | "h3" | "p";
    level?: "display" | "h1" | "h2" | "h3";
  }) {
  const levelClass = {
    display: styles.headingDisplay,
    h1: styles.headingH1,
    h2: styles.headingH2,
    h3: styles.headingH3,
  }[level];
  return (
    <Tag className={join(styles.heading, levelClass, className)} {...props}>
      {children}
    </Tag>
  );
}

export function BrandSectionIntro({
  eyebrow,
  title,
  children,
  dark = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  dark?: boolean;
}) {
  return (
    <div className={styles.sectionIntro}>
      {eyebrow ? (
        <span className={styles.sectionEyebrow}>{eyebrow}</span>
      ) : null}
      <BrandHeading as="h2" level="h2" className={dark ? undefined : ""}>
        {title}
      </BrandHeading>
      {children ? <p>{children}</p> : null}
    </div>
  );
}

type BrandButtonProps = {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  href?: string;
  className?: string;
} & ButtonHTMLAttributes<HTMLButtonElement>;
export function BrandButton({
  children,
  variant = "primary",
  href,
  className,
  type = "button",
  ...props
}: BrandButtonProps) {
  const variantClass = {
    primary: styles.buttonPrimary,
    secondary: styles.buttonSecondary,
    ghost: styles.buttonGhost,
  }[variant];
  const classes = join(styles.button, variantClass, className);
  if (href)
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}

export function BrandBadge({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "achievement" | "success";
}) {
  return (
    <span
      className={join(
        styles.badge,
        tone === "achievement" && styles.badgeAchievement,
        tone === "success" && styles.badgeSuccess,
      )}
    >
      {children}
    </span>
  );
}

export function BrandCard({
  children,
  interactive = false,
  className,
}: ChildrenProps & { interactive?: boolean }) {
  return (
    <article
      className={join(
        styles.card,
        interactive && styles.cardInteractive,
        className,
      )}
    >
      {children}
    </article>
  );
}

export function BrandSurface({
  children,
  raised = false,
  className,
}: ChildrenProps & { raised?: boolean }) {
  return (
    <div
      className={join(
        styles.surface,
        raised && styles.surfaceRaised,
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BrandDivider() {
  return <hr className={styles.divider} />;
}

export function BrandMetric({
  value,
  label,
}: {
  value: ReactNode;
  label: ReactNode;
}) {
  return (
    <div className={styles.metric}>
      <strong className={styles.metricValue}>{value}</strong>
      <span className={styles.metricLabel}>{label}</span>
    </div>
  );
}
