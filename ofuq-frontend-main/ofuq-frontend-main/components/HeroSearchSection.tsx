'use client';

import { useState, useEffect } from 'react';
import '../styles/hero-search-section.css';

interface HeroSearchSectionProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: string) => void;
  searchQuery?: string;
  activeFilter?: string;
  title?: string;
}

export default function HeroSearchSection({ 
  onSearch, 
  onFilterChange, 
  searchQuery = '', 
  activeFilter = 'الكل',
  title
}: HeroSearchSectionProps) {
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [localActiveFilter, setLocalActiveFilter] = useState(activeFilter);
  const [expanded, setExpanded] = useState(false);

  // تحديث الحالة عند تغيّر القيم القادمة من الأعلى
  useEffect(() => {
    setLocalSearchQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setLocalActiveFilter(activeFilter);
  }, [activeFilter]);

  const handleSearch = () => {
    const q = localSearchQuery.trim();
    if (onSearch) onSearch(q);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);
    // بحث لحظي
    if (onSearch) onSearch(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch?.(localSearchQuery.trim());
    }
  };

  const handleLaunch = () => {
    // توسعة الواجهة وإظهار الفلتر الذكي والعنوان وشريط البحث
    setExpanded(true);
  };

  return (
    <section className={`hero-search-section ${expanded ? 'expanded' : 'collapsed'}`}>
      <div className="hero-background">
        {/* الفلتر الأساسي يُفعل تدريجيًا عند التوسّع */}
        <div className="hero-overlay" />

        {/* طبقة Aurora الذكية */}
        <div className="aurora">
          <span className="aurora-dot aurora-dot-1" />
          <span className="aurora-dot aurora-dot-2" />
          <span className="aurora-dot aurora-dot-3" />
        </div>

        <div className="hero-content">
          {!expanded && (
            <button 
              className="search-launcher" 
              onClick={handleLaunch}
              aria-label="ابدأ البحث"
              title="ابدأ البحث"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          {expanded && (
            <>
              <h1 className="hero-title"><span className="title-chip"><span className="title-icon"></span>{title ?? 'برامجنا التدريبية'}</span></h1>

              <div className="search-container">
                <div className="search-box">
                  <input
                    type="text"
                    placeholder="ابحث عن الكورسات، المدربين، أو المجالات..."
                    value={localSearchQuery}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    className="search-input"
                  />
                  <button 
                    onClick={handleSearch}
                    className="search-button"
                    aria-label="بحث"
                  >
                    بحث
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}