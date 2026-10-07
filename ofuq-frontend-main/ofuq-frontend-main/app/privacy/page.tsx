'use client';

import React from 'react';
import HomeHeader from '../../components/HomeHeader';
import Footer from '../../components/Footer';
import '../../styles/public-privacy.css';

export default function PrivacyPage() {
  return (
    <>
      <HomeHeader />
      <div className="public-privacy-page">
        <div className="public-privacy-container">
          <div className="public-privacy-header">
            <h1 className="public-privacy-title">سياسة الخصوصية</h1>
            <p className="public-privacy-subtitle">نحن نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية</p>
          </div>

          <div className="public-privacy-content">
            <section className="public-privacy-section">
              <h2 className="public-section-title">جمع المعلومات</h2>
              <p className="public-section-text">
                نقوم بجمع المعلومات التي تقدمها لنا مباشرة عند التسجيل في موقعنا أو استخدام خدماتنا.
                هذه المعلومات قد تشمل اسمك، عنوان بريدك الإلكتروني، رقم هاتفك، وأي معلومات أخرى تختار مشاركتها معنا.
              </p>
            </section>

            <section className="public-privacy-section">
              <h2 className="public-section-title">استخدام المعلومات</h2>
              <p className="public-section-text">
                نستخدم المعلومات التي نجمعها للأغراض التالية:
              </p>
              <ul className="public-privacy-list">
                <li>تقديم وتحسين خدماتنا التعليمية</li>
                <li>التواصل معك بشأن حسابك والدورات التدريبية</li>
                <li>إرسال التحديثات والإشعارات المهمة</li>
                <li>تخصيص تجربتك التعليمية</li>
                <li>ضمان أمان وحماية منصتنا</li>
              </ul>
            </section>

            <section className="public-privacy-section">
              <h2 className="public-section-title">مشاركة المعلومات</h2>
              <p className="public-section-text">
                نحن لا نبيع أو نؤجر أو نشارك معلوماتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:
              </p>
              <ul className="public-privacy-list">
                <li>عندما نحصل على موافقتك الصريحة</li>
                <li>لتقديم الخدمات التي طلبتها</li>
                <li>للامتثال للقوانين واللوائح المعمول بها</li>
                <li>لحماية حقوقنا وحقوق المستخدمين الآخرين</li>
              </ul>
            </section>

            <section className="public-privacy-section">
              <h2 className="public-section-title">أمان البيانات</h2>
              <p className="public-section-text">
                نتخذ تدابير أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التغيير أو الكشف أو التدمير.
                نستخدم تقنيات التشفير والحماية المتقدمة لضمان أمان بياناتك.
              </p>
            </section>

            <section className="public-privacy-section">
              <h2 className="public-section-title">ملفات تعريف الارتباط</h2>
              <p className="public-section-text">
                نستخدم ملفات تعريف الارتباط (الكوكيز) لتحسين تجربتك على موقعنا وتذكر تفضيلاتك.
                يمكنك التحكم في إعدادات ملفات تعريف الارتباط من خلال متصفحك.
              </p>
            </section>

            <section className="public-privacy-section">
              <h2 className="public-section-title">حقوقك</h2>
              <p className="public-section-text">
                لديك الحق في:
              </p>
              <ul className="public-privacy-list">
                <li>الوصول إلى معلوماتك الشخصية</li>
                <li>تصحيح أو تحديث معلوماتك</li>
                <li>حذف حسابك ومعلوماتك</li>
                <li>الاعتراض على معالجة بياناتك</li>
                <li>نقل بياناتك إلى خدمة أخرى</li>
              </ul>
            </section>

            <section className="public-privacy-section">
              <h2 className="public-section-title">التحديثات</h2>
              <p className="public-section-text">
                قد نقوم بتحديث سياسة الخصوصية هذه من وقت لآخر. سنقوم بإشعارك بأي تغييرات مهمة
                عبر البريد الإلكتروني أو من خلال إشعار على موقعنا.
              </p>
            </section>

            <section className="public-privacy-section">
              <h2 className="public-section-title">اتصل بنا</h2>
              <p className="public-section-text">
                إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى التواصل معنا عبر:
              </p>
              <div className="public-contact-info">
                <p>البريد الإلكتروني: privacy@mahadalofq.com</p>
                <p>الهاتف: +20 123 456 7890</p>
              </div>
            </section>
          </div>

          <div className="public-privacy-footer">
            <p className="public-last-updated">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}