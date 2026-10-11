'use client';
import { motion } from 'framer-motion';
import styles from './Experience.module.css';
import { BrandLogo } from '@/components/brand/BrandLogo';

export function HorizonIntro({ stage }: { stage: 'initial'|'horizon'|'ready' }) {
  return <div className={styles.horizonIntro} data-intro-stage={stage} aria-hidden="true">
    <motion.svg viewBox="0 0 1200 180" preserveAspectRatio="xMidYMid meet" initial={false} animate={{ opacity: stage === 'ready' ? .35 : 1 }} transition={{ duration: .45 }}>
      <motion.path d="M20 115h380l60-60h70M680 55h70l60 60h370" initial={false} animate={{ pathLength: stage === 'initial' ? .03 : 1 }} transition={{ duration: .9, ease: 'easeInOut' }}/>
    </motion.svg>
    <motion.div className={styles.introLogo} initial={false} animate={{ opacity: stage === 'initial' ? 0 : stage === 'ready' ? .35 : 1 }} transition={{ duration: .7 }}><BrandLogo variant="icon" decorative/></motion.div>
  </div>;
}
