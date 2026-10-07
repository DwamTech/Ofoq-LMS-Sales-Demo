"use client";

import React, { useEffect, useState, useMemo, useRef, memo, useCallback } from "react";
import {
  ComposableMap,
  Geographies,
  Geography
} from "react-simple-maps";
import {
  FaGlobe,
  FaUsers,
  FaGraduationCap,
  FaChartLine
} from 'react-icons/fa';
import {
  HiSparkles
} from 'react-icons/hi2';
import {
  IoRocketSharp
} from 'react-icons/io5';
import { getGeneralStats, getStudentsByCountry, type GeneralStats, type StudentsByCountryItem } from "@/utils/statsService";
import { getPublicDiplomasCount } from "@/utils/categoryService";
import { StatCard } from "./StatCard";
import styles from "./WorldUsersMap.module.css";

// Reliable CDN for TopoJSON (includes numeric IDs usually)
const GEO_URL = `/world-topology.json?v=${new Date().getTime()}`;

// Mapping Numeric ID (from world-atlas) to ISO Alpha-3
const ID_TO_ISO: Record<string, string> = {
  "012": "DZA", "024": "AGO", "204": "BEN", "072": "BWA", "854": "BFA", "108": "BDI", "120": "CMR",
  "132": "CPV", "140": "CAF", "148": "TCD", "174": "COM", "178": "COG", "180": "COD", "262": "DJI",
  "818": "EGY", "226": "GNQ", "232": "ERI", "231": "ETH", "266": "GAB", "270": "GMB", "288": "GHA",
  "324": "GIN", "624": "GNB", "384": "CIV", "404": "KEN", "426": "LSO", "430": "LBR", "434": "LBY",
  "450": "MDG", "454": "MWI", "466": "MLI", "478": "MRT", "480": "MUS", "504": "MAR", "508": "MOZ",
  "516": "NAM", "562": "NER", "566": "NGA", "646": "RWA", "678": "STP", "686": "SEN", "690": "SYC",
  "694": "SLE", "706": "SOM", "710": "ZAF", "728": "SSD", "729": "SDN", "748": "SWZ", "834": "TZA",
  "768": "TGO", "788": "TUN", "800": "UGA", "894": "ZMB", "716": "ZWE", "732": "ESH"
};



const AR_TO_ISO: Record<string, string> = {
  'مصر': 'EGY',
  'السعودية': 'SAU',
  'الإمارات': 'ARE',
  'الكويت': 'KWT',
  'قطر': 'QAT',
  'البحرين': 'BHR',
  'عمان': 'OMN',
  'اليمن': 'YEM',
  'الأردن': 'JOR',
  'سوريا': 'SYR',
  'لبنان': 'LBN',
  'فلسطين': 'PSE',
  'العراق': 'IRQ',
  'ليبيا': 'LBY',
  'تونس': 'TUN',
  'الجزائر': 'DZA',
  'المغرب': 'MAR',
  'موريتانيا': 'MRT',
  'السودان': 'SDN',
  'الصومال': 'SOM',
  'جيبوتي': 'DJI',
  'جزر القمر': 'COM',
  'تركيا': 'TUR',
  'إيران': 'IRN',
  'ماليزيا': 'MYS',
  'إندونيسيا': 'IDN',
  'باكستان': 'PAK',
  'أفغانستان': 'AFG',
  'نيجيريا': 'NGA',
  'نيجريا': 'NGA',
  'غانا': 'GHA',
  'السنغال': 'SEN',
  'مالي': 'MLI',
  'النيجر': 'NER',
  'تشاد': 'TCD',
  'كينيا': 'KEN',
  'تنزانيا': 'TZA',
  'أوغندا': 'UGA',
  'إثيوبيا': 'ETH',
  'جنوب أفريقيا': 'ZAF',
  'بنين': 'BEN',
  'بوركينا فاسو': 'BFA',
  'الكاميرون': 'CMR',
  'ساحل العاج': 'CIV'
};

// Memoized Map Component
const MapComponent = memo(({ isoToCount, onHover, onLeave }: {
  isoToCount: Map<string, number>,
  onHover: (name: string, count: number, iso: string) => void,
  onLeave: () => void
}) => {
  return (
    <ComposableMap
      width={800}
      height={450}
      projection="geoMercator"
      projectionConfig={{
        scale: 140,
        center: [0, 0] // World View
      }}
      style={{ width: "100%", height: "auto" }}
    >
      <Geographies geography={GEO_URL}>
        {({ geographies }: { geographies: any[] }) =>
          geographies
            .map((geo: any) => {
              // Resolve to ISO3 using ID mapping
              // world-atlas uses numeric IDs
              const numericId = geo.id;
              // Try to get ISO from properties if available, else map from ID
              const iso3 = geo.properties?.ISO_A3 || ID_TO_ISO[String(numericId)];

              // Render all countries, no filter
              const count = isoToCount.get(iso3) || 0;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={() => onHover("", count, iso3)}
                  onMouseLeave={onLeave}
                  style={{
                    default: {
                      fill: count ? "#0891b2" : "#E2E8F0",
                      stroke: "#FFFFFF",
                      strokeWidth: 0.5,
                      outline: "none",
                      transition: "fill 0.3s"
                    },
                    hover: {
                      fill: count ? "#0e7490" : "#94a3b8",
                      stroke: "#FFFFFF",
                      strokeWidth: 0.75,
                      outline: "none",
                      cursor: "pointer"
                    },
                    pressed: {
                      fill: "#06b6d4",
                      outline: "none"
                    }
                  }}
                />
              );
            })
        }
      </Geographies>
    </ComposableMap>
  );
});

MapComponent.displayName = 'MapComponent';

export default function WorldUsersMap() {
  const [distribution, setDistribution] = useState<StudentsByCountryItem[]>([]);
  const [generalStats, setGeneralStats] = useState<GeneralStats | null>(null);
  const [diplomasCount, setDiplomasCount] = useState<number>(0);

  // Tooltip State
  const [activeTooltip, setActiveTooltip] = useState<{ name: string; count: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [dist, gen, diplCount] = await Promise.all([
          getStudentsByCountry(),
          getGeneralStats(),
          getPublicDiplomasCount(),
        ]);
        if (mounted) {
          const cleanDist = dist.map(item => {
            let name = item.country_ar.trim();
            name = name.replace('أ', 'ا').replace('إ', 'ا');
            return { ...item, country_ar: name };
          });
          setDistribution(cleanDist);
          setGeneralStats(gen);
          setDiplomasCount(diplCount);
        }
      } catch (e) {
        console.error("Failed to fetch map data", e);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const isoToCount = useMemo(() => {
    const map = new Map<string, number>();
    distribution.forEach(item => {
      // Lookup ISO
      let iso = AR_TO_ISO[item.country_ar];
      if (!iso) {
        const normalizedInput = item.country_ar.replace('أ', 'ا').replace('إ', 'ا');
        const match = Object.keys(AR_TO_ISO).find(k => k.replace('أ', 'ا').replace('إ', 'ا') === normalizedInput);
        if (match) iso = AR_TO_ISO[match];
      }

      if (iso) {
        map.set(iso, (map.get(iso) || 0) + item.students_count);
      }
    });
    return map;
  }, [distribution]);

  const handleMapHover = useCallback((namePlaceHolder: string, count: number, iso: string) => {
    if (!count || count <= 0) {
      setActiveTooltip(null);
      return;
    }

    // Lookup Arabic name
    let displayName = "منطقة غير معرفة";
    const reverseMatch = Object.keys(AR_TO_ISO).find(key => AR_TO_ISO[key] === iso);
    if (reverseMatch) displayName = reverseMatch;

    setActiveTooltip({ name: displayName, count });
  }, []);

  const handleMapLeave = useCallback(() => {
    setActiveTooltip(null);
  }, []);

  // Direct DOM manipulation for High-FPS Tooltip Movement
  const handleMouseMove = (e: React.MouseEvent) => {
    if (tooltipRef.current && activeTooltip) {
      const x = e.clientX;
      const y = e.clientY - 10;
      tooltipRef.current.style.top = `${y}px`;
      tooltipRef.current.style.left = `${x}px`;
    }
  };

  const TARGET_STUDENTS = 5000;
  const progressStudents = Math.round(Math.min(100, ((generalStats?.total_students ?? 0) / TARGET_STUDENTS) * 100));

  return (
    <section className={styles['world-stats-section']}>
      <div className={styles['stats-wrapper']}>

        <div className={styles['section-header']}>
          <div className={styles['title-wrapper']}>
            <HiSparkles className={styles['sparkle-icon']} />
            <h2 className={styles['section-title']}>رواد المنصة حول العالم</h2>
            <HiSparkles className={styles['sparkle-icon']} />
          </div>
          <p className={styles['section-subtitle']}>
            <IoRocketSharp className={styles['rocket-icon']} />
            توزيع الطلاب في جميع أنحاء العالم
          </p>
        </div>

        <div className={styles['content-grid']}>


          <div className={styles['stats-cards']}>
            <StatCard
              icon={FaGlobe}
              title="الدول النشطة"
              value={distribution.filter(d => {
                const iso = AR_TO_ISO[d.country_ar] || AR_TO_ISO[d.country_ar.replace('أ', 'ا')];
                return !!iso;
              }).length}
              label="دولة"
              description="الدول حول العالم"
              progress={100}
              delay="0.1s"
            />
            <StatCard
              icon={FaUsers}
              title="إجمالي الطلاب"
              value={generalStats?.total_students ?? 0}
              label="طالب"
              description="إجمالي طلاب المنصة"
              progress={progressStudents}
              delay="0.2s"
            />
            <StatCard
              icon={FaGraduationCap}
              title="المقررات"
              value={generalStats?.total_courses ?? 0}
              label="مقرر"
              description="المقررات المتاحة"
              progress={100}
              delay="0.3s"
            />
            <StatCard
              icon={FaChartLine}
              title="الدبلومات"
              value={diplomasCount}
              label="دبلومة"
              description="المسارات التعليمية"
              progress={100}
              delay="0.4s"
            />
          </div>

          <div
            className={styles['map-container']}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMapLeave}
          >
            <MapComponent
              isoToCount={isoToCount}
              onHover={handleMapHover}
              onLeave={handleMapLeave}
            />

            <div
              ref={tooltipRef}
              className={styles['map-tooltip']}
              style={{
                opacity: activeTooltip ? 1 : 0,
                visibility: activeTooltip ? 'visible' : 'hidden',
                left: 0,
                top: 0
              }}
            >
              {activeTooltip && (
                <>
                  <div className={styles['tooltip-header']}>
                    <FaGlobe className={styles['tooltip-icon']} />
                    <span>{activeTooltip.name}</span>
                  </div>
                  {activeTooltip.count > 0 ? (
                    <div className={styles['tooltip-body']}>
                      <FaUsers className={styles['tooltip-data-icon']} />
                      <span className={styles['tooltip-count']}>{activeTooltip.count} طالب</span>
                    </div>
                  ) : (
                    <div className={styles['tooltip-body']}>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>لا يوجد طلاب</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}