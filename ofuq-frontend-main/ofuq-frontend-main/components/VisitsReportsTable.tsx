'use client';

import React, { useState, useEffect } from 'react';

interface VisitRecord {
  id: number;
  courseName: string;
  purchaseCount: number;
  visitorCount: number;
  conversionRate: number;
}

const VisitsReportsTable = () => {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<keyof VisitRecord>('visitorCount');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Sample data - في التطبيق الحقيقي، ستأتي هذه البيانات من API
  useEffect(() => {
    const sampleData: VisitRecord[] = [
      {
        id: 1,
        courseName: 'دورة البرمجة الأساسية',
        purchaseCount: 45,
        visitorCount: 320,
        conversionRate: 14.1
      },
      {
        id: 2,
        courseName: 'دورة تطوير المواقع',
        purchaseCount: 62,
        visitorCount: 480,
        conversionRate: 12.9
      },
      {
        id: 3,
        courseName: 'دورة قواعد البيانات',
        purchaseCount: 38,
        visitorCount: 290,
        conversionRate: 13.1
      },
      {
        id: 4,
        courseName: 'دورة الذكاء الاصطناعي',
        purchaseCount: 28,
        visitorCount: 180,
        conversionRate: 15.6
      },
      {
        id: 5,
        courseName: 'دورة الأمن السيبراني',
        purchaseCount: 35,
        visitorCount: 250,
        conversionRate: 14.0
      },
      {
        id: 6,
        courseName: 'دورة تطوير التطبيقات',
        purchaseCount: 52,
        visitorCount: 410,
        conversionRate: 12.7
      },
      {
        id: 7,
        courseName: 'دورة التسويق الرقمي',
        purchaseCount: 41,
        visitorCount: 300,
        conversionRate: 13.7
      },
      {
        id: 8,
        courseName: 'دورة إدارة المشاريع',
        purchaseCount: 33,
        visitorCount: 220,
        conversionRate: 15.0
      }
    ];

    setTimeout(() => {
      setVisits(sampleData);
      setLoading(false);
    }, 1000);
  }, []);

  const handleSort = (column: keyof VisitRecord) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const filteredAndSortedVisits = visits
    .filter(visit =>
      visit.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visit.id.toString().includes(searchTerm)
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

  const totalPurchases = filteredAndSortedVisits.reduce((sum, visit) => sum + visit.purchaseCount, 0);
  const totalVisitors = filteredAndSortedVisits.reduce((sum, visit) => sum + visit.visitorCount, 0);
  const averageConversionRate = filteredAndSortedVisits.length > 0 
    ? filteredAndSortedVisits.reduce((sum, visit) => sum + visit.conversionRate, 0) / filteredAndSortedVisits.length
    : 0;

  if (loading) {
    return (
      <div className="visits-reports-loading">
        <div className="loading-spinner"></div>
        <p>جاري تحميل تقارير الزيارات...</p>
      </div>
    );
  }

  return (
    <div className="visits-reports-container">
      <div className="visits-reports-header">
        <h2>تقارير الزيارات والمبيعات</h2>
        <div className="visits-summary">
          <div className="summary-card">
            <span className="summary-label">إجمالي المشتريات</span>
            <span className="summary-value">{totalPurchases.toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">إجمالي الزوار</span>
            <span className="summary-value">{totalVisitors.toLocaleString()}</span>
          </div>
          <div className="summary-card">
            <span className="summary-label">متوسط معدل التحويل</span>
            <span className="summary-value">{averageConversionRate.toFixed(1)}%</span>
          </div>
        </div>
      </div>

      <div className="visits-reports-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="البحث في تقارير الزيارات..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="visits-table-container">
        <table className="visits-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('id')} className="sortable">
               ID
                {sortBy === 'id' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('courseName')} className="sortable">
                اسم الكورس
                {sortBy === 'courseName' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('purchaseCount')} className="sortable">
                عدد عمليات الشراء
                {sortBy === 'purchaseCount' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('visitorCount')} className="sortable">
                عدد الزائرين
                {sortBy === 'visitorCount' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
              <th onClick={() => handleSort('conversionRate')} className="sortable">
                معدل التحويل
                {sortBy === 'conversionRate' && (
                  <span className={`sort-arrow ${sortOrder}`}>
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedVisits.map((visit) => (
              <tr key={visit.id}>
                <td className="course-id">#{visit.id}</td>
                <td className="course-name">{visit.courseName}</td>
                <td className="purchase-count">{visit.purchaseCount.toLocaleString()}</td>
                <td className="visitor-count">{visit.visitorCount.toLocaleString()}</td>
                <td className="conversion-rate">
                  <span className={`rate-badge ${visit.conversionRate >= 15 ? 'high' : visit.conversionRate >= 13 ? 'medium' : 'low'}`}>
                    {visit.conversionRate.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredAndSortedVisits.length === 0 && (
          <div className="no-data">
            <p>لا توجد بيانات زيارات متاحة</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VisitsReportsTable;