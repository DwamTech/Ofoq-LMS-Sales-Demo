'use client';
import { BrandLogo } from '@/components/brand/BrandLogo'
import { brand } from '@/lib/brand'

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isBrandedPublicRoute } from './brand/publicRoutes';
import { PublicFooter } from './brand/PublicShell';
import styles from './Footer.module.css';
import { motion } from 'framer-motion';
import { FaWhatsapp } from 'react-icons/fa6';
import { FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa';
import { getPublicDiplomas, type Diploma } from '../utils/categoryService';

const Footer = () => {
  const techSupportNumber = '201555855857';
  const techSupportWhatsappMessage = `دعم فني ل${brand.name}:\n\n`;
  const techSupportWhatsappLink = `https://wa.me/${techSupportNumber}?text=${encodeURIComponent(techSupportWhatsappMessage)}`;
  const emailAddress = 'info@ofuq.academy';
  const locationText = 'القاهرة - مصر';
  const [diplomas, setDiplomas] = useState<Diploma[]>([]);
  const [diplomasLoading, setDiplomasLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        setDiplomasLoading(true);
        const result = await getPublicDiplomas();
        if (!isMounted) return;
        setDiplomas(Array.isArray(result) ? result : []);
      } catch {
        if (!isMounted) return;
        setDiplomas([]);
      } finally {
        if (!isMounted) return;
        setDiplomasLoading(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const footerDiplomas = useMemo(() => {
    const normalized = diplomas
      .filter((d) => Boolean(d?.slug) && Boolean(d?.name))
      .sort((a, b) => {
        const ao = a.display_order ?? Number.POSITIVE_INFINITY;
        const bo = b.display_order ?? Number.POSITIVE_INFINITY;
        if (ao !== bo) return ao - bo;
        return String(a.name).localeCompare(String(b.name), 'ar');
      });

    return normalized;
  }, [diplomas]);

  return (
    <footer className={styles['footer']}>
      {/* First Row - 4 Columns */}
      <div className={styles['footer-content']}>
        {/* Column 1 - Logo and Description */}
        <div className={styles['footer-column']}>
          <div className={styles['logo-section']}>
            <div className={styles['logo-card']}>
              <Link href="/" className={styles['logo-link']}>
                <BrandLogo className={styles['footer-logo']}/>
              </Link>
            </div>
            <p className={styles['footer-description']}>
              {brand.name} منصة تعليمية رائدة متخصصة في بناء وتقديم برامج دبلوم احترافية في مجالات متنوعة تجمع بين الأصالة والمعاصرة. تأسست المنصة لسد الفجوة بين التعليم النظري والممارسة العملية من خلال مناهج علمية مبتكرة ومتكاملة تواكب احتياجات سوق العمل وتحديات العصر.
            </p>
          </div>
        </div>

        {/* Column 2 - Contact Us */}
        <div className={styles['footer-column']}>

          <motion.h3 className={styles['footer-title']} whileHover={{ scale: 1.02 }}>
            تواصل معنا
          </motion.h3>
          <div className={styles['contact-info']}>
            <motion.div className={styles['contact-item']} whileHover={{ scale: 1.01 }}>
              <FaMapMarkerAlt className={styles['contact-icon']} />
              <span>{locationText}</span>
            </motion.div>

            {/* للدعم الفني التقني */}
            <motion.div className={`${styles['contact-item']} ${styles['contact-item-stacked']}`} whileHover={{ scale: 1.01 }}>
              <div className={styles['contact-label']}>للدعم الفني التقني</div>
              <div className={styles['contact-row']}>
                <FaWhatsapp className={`${styles['contact-icon']} ${styles['whatsapp']}`} />
                <span className={styles['phone-wrap']} dir="ltr">
                  <span className={styles['phone-plus']}>+</span>
                  <span className={styles['phone-number']}>{techSupportNumber}</span>
                </span>
                <div className={styles['contact-actions']}>
                  {/* <motion.a
                    href={`tel:${techSupportDial}`}
                    className={`${styles['contact-btn']} ${styles['contact-btn-outline']}`}
                    aria-label="اتصال"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FaPhone style={{ marginLeft: 6 }} />
                    اتصال
                  </motion.a> */}
                  <motion.a
                    href={techSupportWhatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${styles['contact-btn']} ${styles['contact-btn-primary']}`}
                    aria-label="واتساب"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FaWhatsapp style={{ marginLeft: 6 }} />
                    واتساب
                  </motion.a>
                </div>
              </div>
            </motion.div>

            <motion.div className={styles['contact-item']} whileHover={{ scale: 1.01 }}>
              <FaEnvelope className={styles['contact-icon']} />
              <span>البريد الإلكتروني للدعم</span>
              <motion.a
                href={`mailto:${emailAddress}`}
                className={`${styles['contact-btn']} ${styles['contact-btn-outline']}`}
                aria-label="إرسال بريد"
                whileHover={{ scale: 1.05 }}
              >
                إرسال بريد
              </motion.a>
            </motion.div>
          </div>
          {/* Social icons row under contact info */}
          <div className={styles['social-row']}>
            {/*
            <motion.a href="#" className={styles['social-icon']} aria-label="Facebook" whileHover={{ scale: 1.05 }}>
              <FaFacebook />
            </motion.a>
            <motion.a href="#" className={styles['social-icon']} aria-label="Instagram" whileHover={{ scale: 1.05 }}>
              <FaInstagram />
            </motion.a>
            */}
            {/* واتساب مكرر أعلى — نزيله من صف السوشيال */}
            {/*
            <motion.a href={whatsappLink} target="_blank" rel="noopener noreferrer" className={styles['social-icon']} aria-label="Whatsapp" whileHover={{ scale: 1.05 }}>
              <FaWhatsapp />
            </motion.a>
            */}
            {/*
            <motion.a href="#" className={styles['social-icon']} aria-label="Twitter/X" whileHover={{ scale: 1.05 }}>
              <FaXTwitter />
            </motion.a>
            <motion.a href="#" className={styles['social-icon']} aria-label="LinkedIn" whileHover={{ scale: 1.05 }}>
              <FaLinkedin />
            </motion.a>
            */}
          </div>
        </div>

        {/* Column 3 - Browse Website */}
        <div className={styles['footer-column']}>
          <motion.h3 className={styles['footer-title']} whileHover={{ scale: 1.02 }}>تصفح الموقع</motion.h3>
          <div className={styles['footer-links']}>
            <Link prefetch={false} href="/about" className={styles['footer-link']}>عنّا</Link>
            <Link prefetch={false} href="/verify-certificate" className={styles['footer-link']}>التحقق من الشهادة</Link>
            <Link prefetch={false} href="/privacy" className={styles['footer-link']}>سياسة الخصوصية</Link>
            <Link prefetch={false} href="/terms" className={styles['footer-link']}>الشروط والأحكام</Link>
          </div>
        </div>

        {/* Column 4 - Diplomas */}
        <div className={styles['footer-column']}>
          <motion.h3 className={styles['footer-title']} whileHover={{ scale: 1.02 }}>الدبلومات</motion.h3>
          <ul className={styles['footer-list']}>
            {diplomasLoading ? (
              <li className={styles['footer-item']}>جاري تحميل الدبلومات...</li>
            ) : footerDiplomas.length > 0 ? (
              footerDiplomas.map((diploma) => (
                <Link key={diploma.slug} prefetch={false} href={`/diplomas/${diploma.slug}`}>
                  <li className={styles['footer-item']}>{diploma.name}</li>
                </Link>
              ))
            ) : (
              <li className={styles['footer-item']}>لا توجد دبلومات حالياً</li>
            )}

            <Link prefetch={false} href="/community"><li className={styles['footer-item']}>مجتمع {brand.name}</li></Link>
          </ul>
        </div>
      </div>

      {/* Second Row - Copyright */}
      <div className={styles['footer-bottom']}>
        <p className={styles['copyright']}>
          <motion.a
            href="https://dwam-tech.com"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05, color: '#00aaff' }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {brand.name} © جميع الحقوق محفوظة.
          </motion.a>
        </p>
      </div>

      {/* removed styled-jsx in favor of CSS Modules */}
    </footer>
  );
};

export default function ScopedFooter() {
  const path = usePathname();
  return isBrandedPublicRoute(path) ? <PublicFooter /> : <Footer />;
}
