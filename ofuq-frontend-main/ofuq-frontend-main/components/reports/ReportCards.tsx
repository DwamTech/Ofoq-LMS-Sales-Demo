'use client';

import styles from './reports.module.css';
import { AccuracyBadge, CostBadge, SyncStatusBadge } from './Badges';

export interface ReportCardItem {
  key: string;
  label: string;
  value: string | number;
  description?: string | null;
  status?: string | null;
  badgeType?: 'cost' | 'accuracy' | 'sync';
}

interface ReportCardsProps {
  cards: ReportCardItem[];
}

export default function ReportCards({ cards }: ReportCardsProps) {
  if (!cards.length) return null;

  return (
    <div className={styles.cardsGrid}>
      {cards.map((card) => (
        <section className={styles.summaryCard} key={card.key}>
          <div className={styles.cardHeader}>
            <h3>{card.label}</h3>
            {card.status && card.badgeType === 'cost' ? <CostBadge status={card.status} /> : null}
            {card.status && card.badgeType === 'accuracy' ? <AccuracyBadge status={card.status} /> : null}
            {card.status && card.badgeType === 'sync' ? <SyncStatusBadge status={card.status} /> : null}
          </div>
          <div className={styles.cardValue}>{card.value}</div>
          {card.description ? <p className={styles.cardDescription}>{card.description}</p> : null}
        </section>
      ))}
    </div>
  );
}
