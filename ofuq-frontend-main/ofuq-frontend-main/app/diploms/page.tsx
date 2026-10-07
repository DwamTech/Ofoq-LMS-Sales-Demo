"use client";

import { Suspense, useState, useMemo, useEffect } from 'react';
export const dynamic = 'force-dynamic';
import { useSearchParams } from 'next/navigation';
import HomeHeader from '../../components/HomeHeader'; // تأكد من المسار
import Footer from '../../components/Footer'; // تأكد من المسار
import HeroSearchSection from '../../components/HeroSearchSection'; // تأكد من المسار
// --- تغيير الكومبوننت ---
// import CourseCard from '../../components/CourseCard'; // لم نعد نستخدمه هنا
import DiplomaCard from '../../components/DiplomaCard'; // <-- كومبوننت جديد (سننشئه)
import { SkeletonCourseCard } from '../../components/Skeleton';
import ScrollToTop from '../../components/ScrollToTop'; // تأكد من المسار
import SocialMediaFloat from '../../components/SocialMediaFloat'; // تأكد من المسار
// --- تغيير الخدمات ---
// import { getAllCourses, Course } from '../../utils/courseService'; // لم نعد نستخدمه هنا
import { getPublicDiplomas, type Diploma } from '../../utils/categoryService'; // <-- جلب الدبلومات
import { getBackendAssetUrl } from '../../utils/url'; // تأكد من المسار
import { getPublicSectionsSafe, type Section } from '../../utils/sectionService';
import styles from './diploms.module.css';

interface DiplomaCardViewModel {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  isFree: boolean;
  slug: string;
  studentsCount: number;
  coursesCount: number;
  createdAt: string;
}

function DiplomsContent() {
  const searchParams = useSearchParams();
  const sectionSlug = searchParams.get('section') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('الكل');
  // --- تغيير الحالة ---
  const [allDiplomas, setAllDiplomas] = useState<Diploma[]>([]); // <-- حالة للدبلومات
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initial = searchParams.get('search') || '';
    if (initial) {
      setSearchQuery(initial);
    }
  }, [searchParams]);

  useEffect(() => {
    getPublicSectionsSafe().then(setSections);
  }, []);

  // --- تغيير جلب البيانات ---
  useEffect(() => {
    const loadAllDiplomas = async () => { // <-- تغيير اسم الدالة
      try {
        setLoading(true);
        const diplomas = await getPublicDiplomas(sectionSlug ? { section: sectionSlug } : undefined); // <-- استدعاء الخدمة الصحيحة
        setAllDiplomas(diplomas);
      } catch (err) {
        console.error('Error loading diplomas:', err);
        setError('فشل في تحميل الدبلومات');
      } finally {
        setLoading(false);
      }
    };

    loadAllDiplomas();
  }, [sectionSlug]);

  // --- دالة تحويل بيانات الدبلومة لبطاقة العرض ---
  const transformDiplomaData = (diploma: Diploma): DiplomaCardViewModel | null => {
    if (!diploma?.id) {
      console.warn('Diploma without valid ID found:', diploma);
      return null;
    }
    // Diploma interface already has cover_image_url
    const coverImage = getBackendAssetUrl(diploma.cover_image_url || '') || '/banner.jpg'; // صورة افتراضية

    return {
      id: diploma.id.toString(),
      name: diploma.name || 'اسم غير متوفر',
      description: diploma.description || '', // الوصف لعرضه (ربما مختصر)
      image: coverImage,
      price: Number(diploma?.price ?? 0),
      isFree: Boolean(diploma.is_free),
      slug: diploma.slug, // <-- Slug للرابط
      studentsCount: diploma.students_count || 0, // عدد الطلاب (للفلترة/الترتيب)
      coursesCount: diploma.courses_count || 0, // عدد المقررات (للعرض)
      createdAt: diploma?.created_at || new Date().toISOString(), // للترتيب
    };
  };

  // --- تحديث منطق الفلترة والترتيب ---
  const filteredDiplomas = useMemo(() => {
    if (loading || allDiplomas.length === 0) return [];

    const transformedDiplomas = allDiplomas
      .map(transformDiplomaData)
      .filter((diploma): diploma is DiplomaCardViewModel => diploma !== null); // Ensure no nulls

    let filtered = [...transformedDiplomas];

    // فلترة البحث (بالاسم أو الوصف)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((diploma) =>
        diploma.name.toLowerCase().includes(query) ||
        diploma.description.toLowerCase().includes(query)
      );
    }

    // فلترة/ترتيب إضافي
    if (selectedFilter && selectedFilter !== 'الكل') {
      switch (selectedFilter) {
        // يمكنك إضافة فلاتر خاصة بالدبلومات هنا إذا أردت
        case 'الأحدث':
          filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
        case 'الأكثر تسجيلاً': // تغيير من الأكثر مبيعاً
          filtered.sort((a, b) => b.studentsCount - a.studentsCount);
          break;
        case 'السعر (من الأقل)': // تغيير
          filtered.sort((a, b) => a.price - b.price);
          break;
        // أزل الفلاتر غير المنطقية للدبلومات (مثل المحاضر, المستوى)
        default:
          break;
      }
    }

    return filtered;
  }, [searchQuery, selectedFilter, allDiplomas, loading]);

  const activeSection = useMemo(() => (
    sectionSlug ? sections.find((section) => section.slug === sectionSlug) : undefined
  ), [sectionSlug, sections]);

  const pageTitle = activeSection ? `دبلومات ${activeSection.name}` : 'دبلومات منصة أفق';

  return (
    <main>
      <HeroSearchSection
        title={pageTitle}
        onSearch={setSearchQuery}
        onFilterChange={setSelectedFilter}
        searchQuery={searchQuery}
        activeFilter={selectedFilter}
      />

      <section className={styles['popular-courses-section']}> {/* يمكن تغيير اسم الكلاس */}
        <div className={styles['popular-courses-container']}>
          <div className={styles['popular-courses-header']}>
            <div className={styles['popular-courses-left']}>
              <div className={styles['popular-badge']}>الدبلومات</div>
              <h2 className={styles['popular-title']}>
                {searchQuery ? `نتائج البحث عن "${searchQuery}"` : activeSection ? `دبلومات ${activeSection.name}` : 'الدبلومات المتاحة'}
                <span style={{ fontSize: '16px', color: '#666', marginRight: '10px' }}>
                  ({loading ? '...' : filteredDiplomas.length} دبلوم)
                </span>
              </h2>
            </div>
          </div>

          {/* --- تغيير عرض البطاقات --- */}
          <div className={styles['courses-grid']}> {/* يمكن تغيير اسم الكلاس */}
            {loading ? (
              <>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <SkeletonCourseCard key={i} />
                ))}
              </>
            ) : error ? (
              <div className={styles['error-state']}>{error}</div>
            ) : filteredDiplomas.length > 0 ? (
              filteredDiplomas.map((diploma) => (
                <DiplomaCard // <-- استخدام الكومبوننت الجديد
                  key={diploma.id}
                  id={diploma.id}
                  name={diploma.name}
                  description={diploma.description}
                  image={diploma.image}
                  price={diploma.price}
                  isFree={diploma.isFree}
                  slug={diploma.slug}
                  coursesCount={diploma.coursesCount}
                // يمكنك تمرير أي بيانات أخرى يحتاجها الكومبوننت
                />
              ))
            ) : (
              <div className={styles['empty-state']}>لا توجد دبلومات تطابق معايير البحث</div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}

export default function DiplomsPage() {
  return (
    <div dir="rtl">
      <HomeHeader />
      <Suspense fallback={<div className={styles['loading-state']}>جاري التحميل...</div>}>
        <DiplomsContent />
      </Suspense>
      <Footer />
      <ScrollToTop />
      <SocialMediaFloat />
    </div>
  );
}

// ----- تعريف مقترح لكومبوننت DiplomaCard (ضعه في ملف منفصل مثل components/DiplomaCard.tsx) -----
/*
import Link from 'next/link';
import Image from 'next/image';

interface DiplomaCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  isFree: boolean;
  slug: string;
  coursesCount?: number;
}

const DiplomaCard: React.FC<DiplomaCardProps> = ({
  id,
  name,
  description,
  image,
  price,
  isFree,
  slug,
  coursesCount
}) => {
  // دالة لتقصير النص إذا كان طويلاً جداً
  const truncateDescription = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="diploma-card"> {/* استخدم كلاسات CSS الخاصة بك */
{/* <Link href={`/diplomas/${slug}`} passHref> */ }
{/* <a className="diploma-card-link"> */ }
{/* <div className="diploma-card-image-container">
            <Image
              src={image}
              alt={name}
              layout="fill"
              objectFit="cover"
              className="diploma-card-image"
            />
          </div>
          <div className="diploma-card-content">
            <h3 className="diploma-card-title">{name}</h3>
            <p className="diploma-card-description">{truncateDescription(description)}</p>
            <div className="diploma-card-footer">
              <span className="diploma-card-price">
                {isFree ? 'مجانية' : `${price.toLocaleString()} ر.س`}
              </span>
              <span className="diploma-card-courses">
                {coursesCount ? `${coursesCount} مقرر` : ''}
              </span>
            </div>
             <button className="diploma-card-button">عرض التفاصيل</button> {/* أو اجعل الرابط كله زرًا */}
{/* </div> */ }
{/* </a> */ }
{/* </Link> */ }
{/* إصلاح لـ Link */ }
{/* <Link href={`/diplomas/${slug}`} passHref legacyBehavior> */ }
{/* <a className="diploma-card-link"> */ }
{/* ... (نفس محتوى البطاقة أعلاه) ... */ }
{/* </a> */ }
{/* </Link> */ }
{/* </div> */ }
{/* ); */ }
{/* }; */ }

{/* export default DiplomaCard; */ }
