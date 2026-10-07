'use client';
import React, { useState, useEffect } from 'react';

// 💡 الخطوة 1: استيراد ملفات CSS مباشرةً في الجزء العلوي
// هذا يحل مشكلة Cannot find module 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

interface CertificateViewerProps {
  pdfUrl: string;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({ pdfUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [Document, setDocument] = useState<React.ComponentType<any> | null>(null);
  const [Page, setPage] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // هذه الخطوة ضرورية للتأكد من أن الكود يعمل فقط في جانب العميل (Client Side)
    setIsClient(true);
    
    // 💡 الخطوة 2: الاستيراد الديناميكي لمكونات react-pdf فقط (Document, Page, pdfjs)
    import('react-pdf')
      .then((reactPdfModule) => {
        const { Document: PdfDocument, Page: PdfPage, pdfjs } = reactPdfModule;
        
        // **إعداد العامل (Worker) لـ pdf.js**
        // استخدام CDN هو الأكثر موثوقية، تأكد من استخدام إصدار المكتبة الصحيح.
        pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`; 
        
        setDocument(() => PdfDocument);
        setPage(() => PdfPage);
      })
      .catch((error) => {
        console.error('Error loading PDF components:', error);
      });
  }, []);

  /**
   * دالة تُنفذ عند تحميل ملف PDF بنجاح.
   * @param {Object} - يحتوي على عدد الصفحات (numPages).
   */
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
  }

  // حالة التحميل (Loading State)
  if (!isClient || !Document || !Page) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>جاري تحميل عارض PDF...</p>
      </div>
    );
  }

  // **عرض عارض PDF**
  return (
    <div className="pdf-viewer-container" style={{ textAlign: 'center', margin: '20px auto' }}>
      {/* عرض مكون Document المستورد ديناميكياً */}
      <Document
        file={pdfUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={<div>جاري جلب الملف...</div>}
        error={<div>فشل في تحميل ملف PDF.</div>}
      >
        {/* حلقة لعرض جميع صفحات الملف باستخدام مكون Page */}
        {numPages !== null && Array.from(new Array(numPages), (el, index) => (
          <div key={`page_wrapper_${index + 1}`} style={{ margin: '10px 0', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
            <Page 
              pageNumber={index + 1} 
              scale={1.0} // يمكنك تعديل مقياس العرض هنا
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        ))}
      </Document>
      {numPages && (
        <p style={{ marginTop: '10px', fontSize: '14px' }}>
          الصفحات المعروضة: 1 من {numPages}
        </p>
      )}
    </div>
  );
};

export default CertificateViewer;