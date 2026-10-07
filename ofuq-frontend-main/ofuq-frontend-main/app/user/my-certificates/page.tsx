'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMyCertificates, DiplomaCertificate, CourseCertificate } from '@/utils/certificateService';
import { isAuthenticated } from '@/utils/authService';
import CertificateCard from '@/components/CertificateCard';
import { SkeletonCourseCard } from '@/components/Skeleton';
import styles from './MyCertificates.module.css';
import '@/components/Toast';

interface CertificateData {
  id: number;
  uuid: string;
  diploma_name?: string;
  course_title?: string;
  user_name: string;
  issued_at: string;
  file_path?: string;
  qr_path?: string;
  category_id?: number;
  course_id?: number;
  type: 'diploma' | 'course';
}

export default function MyCertificatesPage() {
  const [diplomaCertificates, setDiplomaCertificates] = useState<DiplomaCertificate[]>([]);
  const [courseCertificates, setCourseCertificates] = useState<CourseCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'diplomas' | 'courses'>('diplomas');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.push('/login');
        return;
      }
      fetchCertificates();
    };

    checkAuth();
  }, [router]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      // جلب جميع الشهادات
      const allCertificates = await getMyCertificates();

      // فصل شهادات الدبلومات عن شهادات الكورسات
      const diplomas = allCertificates.filter(cert => cert.type === 'diploma');
      const courses = allCertificates.filter(cert => cert.type === 'course');

      setDiplomaCertificates(diplomas);
      setCourseCertificates(courses as unknown as CourseCertificate[]);
    } catch (err: any) {
      console.error('Error fetching certificates:', err);
      setError(err.message || 'فشل في تحميل الشهادات');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`my-certificates-page ${styles.myCertificatesPage}`}>
        <div className="certificates-container">
          <div className="page-header">
            <h1>شهاداتي</h1>
            <p className="page-subtitle">جاري تحميل الشهادات...</p>
          </div>
          <div className="certificates-grid">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCourseCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`my-certificates-page ${styles.myCertificatesPage}`}>
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>حدث خطأ</h3>
          <p>{error}</p>
          <button onClick={fetchCertificates} className="retry-btn">
            حاول مرة أخرى
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`my-certificates-page ${styles.myCertificatesPage}`}>
      <div className="certificates-container">
        <div className="page-header">
          <h1>شهاداتي</h1>
          <p className="page-subtitle">جميع شهاداتك المهنية في مكان واحد</p>
        </div>

        {/* تبويبات التنقل */}
        <div className="certificates-tabs">
          <button
            className={`tab-btn ${activeTab === 'diplomas' ? 'active' : ''}`}
            onClick={() => setActiveTab('diplomas')}
          >
            <span className="tab-icon">🎓</span>
            شهادات الدبلومات
            <span className="tab-count">{diplomaCertificates.length}</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            <span className="tab-icon">📚</span>
            شهادات الكورسات
            <span className="tab-count">{courseCertificates.length}</span>
          </button>
        </div>

        {/* محتوى التبويبات */}
        <div className="tab-content">
          {activeTab === 'diplomas' && (
            <div className="certificates-section">
              <h2 className="section-title">الشهادات المهنية (الدبلومات)</h2>
              {diplomaCertificates.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">🎓</div>
                  <h3>لا توجد شهادات دبلومات</h3>
                  <p>لم تحصل على أي شهادات دبلومات بعد. أكمل متطلبات الدبلومات للحصول على شهاداتك.</p>
                  <button
                    className="browse-btn"
                    onClick={() => router.push('/diploms')}
                  >
                    تصفح الدبلومات
                  </button>
                </div>
              ) : (
                <div className="certificates-grid">
                  {diplomaCertificates.map((certificate) => (
                    <CertificateCard
                      key={certificate.id}
                      courseName={certificate.diploma_name || 'دبلومة'}
                      completionDate={formatDate(certificate.issued_at || '')}
                      certificateId={certificate.uuid}
                      downloadUrl={certificate.file_path}
                      verificationUrl={`${window.location.origin}/verify-certificate/${certificate.uuid}`}
                      type="diploma"
                      categoryId={certificate.category_id}
                      userName={certificate.user_name}
                      showShareButton={false}
                      showViewButton={false}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div className="certificates-section">
              <h2 className="section-title">شهادات الكورسات</h2>
              {courseCertificates.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📚</div>
                  <h3>لا توجد شهادات كورسات</h3>
                  <p>لم تحصل على أي شهادات كورسات بعد. أكمل الكورسات للحصول على شهاداتك.</p>
                  <button
                    className="browse-btn"
                    onClick={() => router.push('/courses')}
                  >
                    تصفح الكورسات
                  </button>
                </div>
              ) : (
                <div className="certificates-grid">
                  {courseCertificates.map((certificate) => (
                    <CertificateCard
                      key={certificate.id}
                      courseName={(certificate as any).course_title || 'مقرر'}
                      completionDate={formatDate(certificate.issued_at || '')}
                      certificateId={(certificate as any).uuid}
                      downloadUrl={(certificate as any).file_path}
                      verificationUrl={`${window.location.origin}/verify-certificate/${(certificate as any).uuid}`}
                      type="course"
                      courseId={(certificate as any).course_id}
                      userName={(certificate as any).user_name}
                      showShareButton={false}
                      showViewButton={false}
                      diplomaName={(certificate as any).diploma_name}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}