'use client';

import React from 'react';
import HomeHeader from '../../components/HomeHeader';
import Footer from '../../components/Footer';
import '../../styles/public-terms.css';

export default function TermsPage() {
  return (
    <>
      <HomeHeader />
      <div className="public-terms-page">
        <div className="public-terms-container">
          <div className="public-terms-header">
            <h1 className="public-terms-title">الشروط والأحكام</h1>
            <p className="public-terms-subtitle">يرجى قراءة هذه الشروط والأحكام بعناية قبل استخدام خدماتنا</p>
          </div>

          <div className="public-terms-content">
            <section className="public-terms-section">
              <h2 className="public-section-title">قبول الشروط</h2>
              <p className="public-section-text">
                باستخدامك لموقعنا الإلكتروني وخدماتنا التعليمية، فإنك توافق على الالتزام بهذه الشروط والأحكام.
                إذا كنت لا توافق على أي من هذه الشروط، يرجى عدم استخدام خدماتنا.
              </p>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">الخدمات المقدمة</h2>
              <p className="public-section-text">
                نحن نقدم منصة تعليمية إلكترونية تشمل:
              </p>
              <ul className="public-terms-list">
                <li>دورات تدريبية متخصصة في مختلف المجالات</li>
                <li>محتوى تعليمي تفاعلي ومتطور</li>
                <li>شهادات معتمدة عند إتمام الدورات</li>
                <li>دعم فني ومتابعة أكاديمية</li>
                <li>منتدى للنقاش والتفاعل بين الطلاب</li>
              </ul>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">التسجيل والحساب</h2>
              <p className="public-section-text">
                عند التسجيل في منصتنا، يجب عليك:
              </p>
              <ul className="public-terms-list">
                <li>تقديم معلومات صحيحة ومحدثة</li>
                <li>الحفاظ على سرية كلمة المرور الخاصة بك</li>
                <li>إشعارنا فوراً بأي استخدام غير مصرح به لحسابك</li>
                <li>تحمل المسؤولية عن جميع الأنشطة التي تتم من خلال حسابك</li>
              </ul>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">الدفع والاسترداد</h2>
              <p className="public-section-text">
                سياسة الدفع والاسترداد:
              </p>
              <ul className="public-terms-list">
                <li>جميع الأسعار معروضة بالجنيه المصري</li>
                <li>الدفع مطلوب قبل الوصول إلى المحتوى التعليمي</li>
                <li>يمكن طلب استرداد المال خلال 30 يوماً من تاريخ الشراء</li>
                <li>لا يحق الاسترداد بعد إتمام أكثر من 50% من الدورة</li>
                <li>معالجة طلبات الاسترداد تستغرق 5-10 أيام عمل</li>
              </ul>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">الملكية الفكرية</h2>
              <p className="public-section-text">
                جميع المحتويات التعليمية والمواد المتاحة على منصتنا محمية بحقوق الطبع والنشر.
                يُمنع منعاً باتاً نسخ أو توزيع أو مشاركة المحتوى دون إذن كتابي مسبق منا.
              </p>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">قواعد السلوك</h2>
              <p className="public-section-text">
                يُمنع على المستخدمين:
              </p>
              <ul className="public-terms-list">
                <li>استخدام المنصة لأغراض غير قانونية</li>
                <li>نشر محتوى مسيء أو غير لائق</li>
                <li>التدخل في عمل المنصة أو أمانها</li>
                <li>انتهاك حقوق المستخدمين الآخرين</li>
                <li>محاولة الوصول غير المصرح به للنظام</li>
              </ul>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">إنهاء الخدمة</h2>
              <p className="public-section-text">
                نحتفظ بالحق في إنهاء أو تعليق حسابك في حالة انتهاك هذه الشروط والأحكام.
                كما يمكنك إنهاء حسابك في أي وقت من خلال إعدادات الحساب.
              </p>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">إخلاء المسؤولية</h2>
              <p className="public-section-text">
                نحن نبذل قصارى جهدنا لتقديم خدمة عالية الجودة، لكننا لا نضمن أن الخدمة ستكون
                متاحة دائماً أو خالية من الأخطاء. نحن غير مسؤولين عن أي أضرار مباشرة أو غير مباشرة
                قد تنتج عن استخدام خدماتنا.
              </p>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">تعديل الشروط</h2>
              <p className="public-section-text">
                نحتفظ بالحق في تعديل هذه الشروط والأحكام في أي وقت. سيتم إشعار المستخدمين
                بأي تغييرات مهمة عبر البريد الإلكتروني أو من خلال إشعار على المنصة.
              </p>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">القانون المطبق</h2>
              <p className="public-section-text">
                تخضع هذه الشروط والأحكام للقوانين المصرية، وأي نزاع ينشأ عنها يخضع
                لاختصاص المحاكم المصرية.
              </p>
            </section>

            <section className="public-terms-section">
              <h2 className="public-section-title">التواصل</h2>
              <p className="public-section-text">
                لأي استفسارات حول هذه الشروط والأحكام، يرجى التواصل معنا:
              </p>
              <div className="public-contact-info">
                <p>البريد الإلكتروني: legal@mahadalofq.com</p>
                <p>الهاتف: +20 123 456 7890</p>
              </div>
            </section>
          </div>

          <div className="public-terms-footer">
            <p className="public-last-updated">آخر تحديث: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}