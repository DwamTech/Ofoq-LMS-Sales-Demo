'use client';

import React from 'react';

interface CertificateProps {
  courseName?: string;
  instructorName?: string;
  studentName?: string;
  completionDate?: string;
  onClose?: () => void;
}

const Certificate: React.FC<CertificateProps> = ({
  courseName = "كورس البرمجة الأساسية",
  instructorName = "د. أحمد محمد",
  studentName = "الطالب المتميز",
  completionDate = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }),
  onClose
}) => {
  const handleDownload = () => {
    // محاكاة تحميل الشهادة
    alert('تم تحميل الشهادة بنجاح!');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.8)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '800px',
        width: '100%',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
      }}>
        {/* زر الإغلاق */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#666'
          }}
        >
          ×
        </button>

        {/* محتوى الشهادة */}
        <div style={{
          textAlign: 'center',
          border: '8px solid #019EBB',
          borderRadius: '15px',
          padding: '40px 30px',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          position: 'relative'
        }}>
          {/* الزخارف */}
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(45deg, #019EBB, #667eea)',
            borderRadius: '50%',
            opacity: 0.1
          }}></div>
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '60px',
            height: '60px',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            borderRadius: '50%',
            opacity: 0.1
          }}></div>

          {/* العنوان الرئيسي */}
          <h1 style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#019EBB',
            margin: '0 0 20px 0',
            fontFamily: 'Arial, sans-serif'
          }}>
            شهادة إتمام
          </h1>

          {/* النص التوضيحي */}
          <p style={{
            fontSize: '18px',
            color: '#666',
            margin: '0 0 30px 0',
            lineHeight: '1.6'
          }}>
            نشهد بأن
          </p>

          {/* اسم الطالب */}
          <h2 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2c3e50',
            margin: '0 0 30px 0',
            borderBottom: '3px solid #019EBB',
            paddingBottom: '10px',
            display: 'inline-block'
          }}>
            {studentName}
          </h2>

          {/* النص الوسطي */}
          <p style={{
            fontSize: '18px',
            color: '#666',
            margin: '0 0 20px 0',
            lineHeight: '1.6'
          }}>
            قد أتم بنجاح دراسة
          </p>

          {/* اسم الكورس */}
          <h3 style={{
            fontSize: '28px',
            fontWeight: 'bold',
            color: '#667eea',
            margin: '0 0 30px 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {courseName}
          </h3>

          {/* معلومات المحاضر والتاريخ */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '2px solid #e0e0e0'
          }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>المحاضر</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
                {instructorName}
              </p>
            </div>
            
            <div style={{
              width: '80px',
              height: '80px',
              background: 'linear-gradient(135deg, #019EBB 0%, #667eea 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px'
            }}>
              🏆
            </div>

            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontSize: '16px', color: '#666' }}>تاريخ الإتمام</p>
              <p style={{ margin: '5px 0 0 0', fontSize: '20px', fontWeight: 'bold', color: '#2c3e50' }}>
                {completionDate}
              </p>
            </div>
          </div>
        </div>

        {/* أزرار العمليات */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '20px',
          marginTop: '30px'
        }}>
          <button
            onClick={handleDownload}
            style={{
              background: 'linear-gradient(135deg, #019EBB 0%, #667eea 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            📥 تحميل الشهادة
          </button>
          
          <button
            onClick={handlePrint}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              padding: '12px 30px',
              borderRadius: '25px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🖨️ طباعة الشهادة
          </button>
        </div>
      </div>
    </div>
  );
};

export default Certificate;