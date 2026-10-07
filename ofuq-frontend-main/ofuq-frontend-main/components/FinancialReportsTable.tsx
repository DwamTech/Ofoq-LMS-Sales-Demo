'use client';

import React, { useState, useEffect, useMemo } from 'react';
import ReportChart from '@/components/reports/ReportChart';

interface PaymentRecord {
  id: number;
  studentId: string;
  accountName: string;
  courseName: string;
  amountPaid: number;
  paymentDate: string;
}

const FinancialReportsTable = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof PaymentRecord>('paymentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sample data - في التطبيق الحقيقي، ستأتي هذه البيانات من API
  useEffect(() => {
    const sampleData: PaymentRecord[] = [
      {
        id: 1,
        studentId: 'STU001',
        accountName: 'أحمد محمد علي',
        courseName: 'دورة البرمجة الأساسية',
        amountPaid: 250,
        paymentDate: '2024-01-15'
      },
      {
        id: 2,
        studentId: 'STU002',
        accountName: 'فاطمة أحمد',
        courseName: 'دورة تطوير المواقع',
        amountPaid: 400,
        paymentDate: '2024-01-20'
      },
      {
        id: 3,
        studentId: 'STU001',
        accountName: 'أحمد محمد علي',
        courseName: 'دورة قواعد البيانات',
        amountPaid: 300,
        paymentDate: '2024-02-01'
      },
      {
        id: 4,
        studentId: 'STU003',
        accountName: 'محمد سالم',
        courseName: 'دورة الذكاء الاصطناعي',
        amountPaid: 500,
        paymentDate: '2024-02-10'
      },
      {
        id: 5,
        studentId: 'STU002',
        accountName: 'فاطمة أحمد',
        courseName: 'دورة الأمن السيبراني',
        amountPaid: 350,
        paymentDate: '2024-02-15'
      }
    ];

    setTimeout(() => {
      setPayments(sampleData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSort = (column: keyof PaymentRecord) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedPayments = payments
    .filter(payment =>
      payment.accountName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.studentId.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue, 'ar')
          : bValue.localeCompare(aValue, 'ar');
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  const totalAmount = filteredAndSortedPayments.reduce((sum, payment) => sum + payment.amountPaid, 0);

  const revenueByCourse = useMemo(() => {
    const grouped = filteredAndSortedPayments.reduce((acc, curr) => {
      acc[curr.courseName] = (acc[curr.courseName] || 0) + curr.amountPaid;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(grouped).map(([name, amount]) => ({
      courseName: name,
      amount: amount
    }));
  }, [filteredAndSortedPayments]);

  if (loading) {
    return (
      <div className="financial-reports-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل التقارير المالية...</p>
      </div>
    );
  }

  return (
    <div className="financial-reports-container">
      <div className="financial-reports-header">
        <h2>التقارير المالية</h2>
        <div className="financial-summary">
          <div className="summary-card">
            <span className="summary-label">إجمالي المدفوعات</span>
            <span className="summary-value">{totalAmount.toLocaleString()} جنيه</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">عدد المعاملات</span>
            <span className="summary-value">{filteredAndSortedPayments.length}</span>
          </div>
        </div>
      </div>

      <div className="financial-reports-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="البحث في التقارير..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {revenueByCourse.length > 0 && (
        <div style={{ padding: '0 20px 20px' }}>
          <ReportChart 
            title="إيرادات المقررات التعليمية"
            data={revenueByCourse}
            xDataKey="courseName"
            yDataKey="amount"
            yDataLabel="الإيرادات"
            color="#10b981"
          />
        </div>
      )}

      <div className="financial-table-container">
        <table className="financial-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('studentId')} className="sortable">
                رقم الطالب
                {sortBy === 'studentId' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('accountName')} className="sortable">
                اسم الحساب
                {sortBy === 'accountName' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('courseName')} className="sortable">
                اسم المقرر
                {sortBy === 'courseName' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('amountPaid')} className="sortable">
                المبلغ المدفوع
                {sortBy === 'amountPaid' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('paymentDate')} className="sortable">
                تاريخ الدفع
                {sortBy === 'paymentDate' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedPayments.map((payment, index) => (
               <tr key={payment.id}>
                 <td>{payment.studentId}</td>
                 <td>{payment.accountName}</td>
                 <td>{payment.courseName}</td>
                 <td className="amount">{payment.amountPaid.toLocaleString('ar-EG')} جنيه</td>
                 <td>{new Date(payment.paymentDate).toLocaleDateString('ar-EG')}</td>
               </tr>
             ))}
          </tbody>
        </table>

        {filteredAndSortedPayments.length === 0 && (
          <div className="no-data">
            <p>لا توجد بيانات مالية متاحة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialReportsTable;