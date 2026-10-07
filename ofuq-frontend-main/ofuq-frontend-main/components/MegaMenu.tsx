'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import {
    PiCertificate,
    PiGraduationCap,
    PiUsers,
    PiLightbulb,
    PiBooks,
    PiMicrophone,
    PiRocket,
    PiHouse,
    PiCaretDown,
    PiCaretLeft,
    PiChalkboardTeacher,
    PiHandshake,
    PiChartLine,
    PiPhone,
    PiUsersThree,
    PiHeadset,
    PiNewspaper,
    PiMosque,
    PiMegaphone,
    PiBriefcase,
    PiHeart,
    PiCode,
    PiBrain,
    PiHandHeart,
    PiVideo,
    PiChatCircle,
    PiCalendarCheck,
    PiQuestion,
    PiLightning,
    PiTrophy,
    PiScroll,
    PiWrench,
    PiRobot,
    PiBookOpen,
    PiFile,
    PiFileAudio,
    PiMagnifyingGlass,
    PiCurrencyDollar,
    PiDevices,
    PiBuilding,
    PiStorefront,
    PiGlobe,
    PiFlask,
    PiHandCoins
} from 'react-icons/pi';
import styles from './MegaMenu.module.css';
import { getPublicSectionsSafe, type Section } from '@/utils/sectionService';

// Define menu structure types
interface SubMenuItem {
    label: string;
    href: string;
    icon?: React.ReactNode;
    comingSoon?: boolean;
}

interface NestedMenuItem extends SubMenuItem {
    children?: SubMenuItem[];
}

interface MenuItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    hasDropdown: boolean;
    comingSoon?: boolean;
    children?: NestedMenuItem[];
}

// Existing pages that work (keep href as is)
// /, /about, /diploms, /community, /verify-certificate

// Navigation Data
const menuData: MenuItem[] = [
    {
        label: 'الرئيسية',
        href: '/',
        icon: <PiHouse />,
        hasDropdown: true,
        children: [
            {
                label: 'من نحن',
                href: '/about',
                icon: <PiUsersThree />,
                children: [
                    { label: 'التعريف', href: '/about#intro', icon: <PiFile /> },
                    { label: 'الأهداف', href: '/about#goals', icon: <PiLightbulb /> },
                    { label: 'القيم', href: '/about#values', icon: <PiHeart /> },
                    { label: 'منهجية التعليم والتدريب', href: '/about#methodology', icon: <PiChalkboardTeacher /> },
                    { label: 'الرسالة', href: '/about#mission', icon: <PiScroll /> },
                    { label: 'الميزات التنافسية', href: '/about#advantages', icon: <PiTrophy /> },
                ]
            },
            { label: 'رواد المنصة حول العالم', href: '#', icon: <PiGlobe />, comingSoon: true },
            {
                label: 'الإحصائيات',
                href: '#',
                icon: <PiChartLine />,
                comingSoon: true,
                children: [
                    { label: 'عدد رواد المنصة', href: '#', icon: <PiUsers />, comingSoon: true },
                    { label: 'عدد الكورسات', href: '#', icon: <PiGraduationCap />, comingSoon: true },
                    { label: 'عدد الملفات الصوتية', href: '#', icon: <PiFileAudio />, comingSoon: true },
                    { label: 'أخرى', href: '#', icon: <PiChartLine />, comingSoon: true },
                ]
            },
            { label: 'بيانات التواصل', href: '#', icon: <PiPhone />, comingSoon: true },
            { label: 'عداد المسجلين', href: '#', icon: <PiUsers />, comingSoon: true },
            {
                label: 'شؤون الطلاب',
                href: '#',
                icon: <PiGraduationCap />,
                comingSoon: true,
                children: [
                    { label: 'الإحصاءات والحركة', href: '#', icon: <PiChartLine />, comingSoon: true },
                    { label: 'الشهادات المجانية', href: '#', icon: <PiCertificate />, comingSoon: true },
                    { label: 'الشهادات المعتمدة', href: '#', icon: <PiCertificate />, comingSoon: true },
                    { label: 'السجل التعليمي للطلاب', href: '#', icon: <PiBookOpen />, comingSoon: true },
                    { label: 'مجموعات التواصل التعليمية', href: '#', icon: <PiChatCircle />, comingSoon: true },
                ]
            },
            { label: 'الدعم الفني', href: '#', icon: <PiHeadset />, comingSoon: true },
            {
                label: 'الصفحات في الوسائط',
                href: '#',
                icon: <PiNewspaper />,
                comingSoon: true,
                children: [
                    { label: 'تويتر', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'فيس بوك', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'تيك توك', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'تلجرام', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'واتساب', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'انستجرام', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'يوتيوب', href: '#', icon: <PiGlobe />, comingSoon: true },
                ]
            },
        ]
    },
    {
        label: 'الدبلومات',
        href: '/diploms',
        icon: <PiGraduationCap />,
        hasDropdown: true,
        children: [
            { label: 'التربوية', href: '/courses?section=educational', icon: <PiChalkboardTeacher /> },
            { label: 'الدعوية', href: '/courses?section=dawah', icon: <PiMosque /> },
            { label: 'الإعلامية', href: '/courses?section=media', icon: <PiMegaphone /> },
            { label: 'الإدارية', href: '/courses?section=management', icon: <PiBriefcase /> },
            { label: 'الشرعية', href: '/courses?section=sharia', icon: <PiScroll /> },
            { label: 'تطوير الذات', href: '/courses?section=self-development', icon: <PiHeart /> },
            { label: 'التقنية', href: '/courses?section=tech', icon: <PiCode /> },
            { label: 'السلوكية', href: '/courses?section=behavioral', icon: <PiBrain /> },
            { label: 'المهنية', href: '/courses?section=professional', icon: <PiWrench /> },
            { label: 'خدمة المجتمع', href: '/courses?section=community-service', icon: <PiHandHeart /> },
        ]
    },
    {
        label: 'مجتمع أفق',
        href: '/community',
        icon: <PiUsers />,
        hasDropdown: true,
        children: [
            {
                label: 'اللقاءات الإثرائية',
                href: '#',
                icon: <PiCalendarCheck />,
                comingSoon: true,
                children: [
                    { label: 'للدعاة', href: '#', icon: <PiMosque />, comingSoon: true },
                    { label: 'لطلاب العلم', href: '#', icon: <PiGraduationCap />, comingSoon: true },
                    { label: 'للوجهاء', href: '#', icon: <PiUsers />, comingSoon: true },
                    { label: 'للقيادات المجتمعية', href: '#', icon: <PiUsersThree />, comingSoon: true },
                    { label: 'للمؤثرين', href: '#', icon: <PiMegaphone />, comingSoon: true },
                    { label: 'للتجار', href: '#', icon: <PiBriefcase />, comingSoon: true },
                    { label: 'للمتفقين', href: '#', icon: <PiBookOpen />, comingSoon: true },
                ]
            },
            { label: 'المنتدى التفاعلي', href: '#', icon: <PiChatCircle />, comingSoon: true },
            { label: 'الإعلانات', href: '#', icon: <PiMegaphone />, comingSoon: true },
            { label: 'أخبار المنصة', href: '#', icon: <PiNewspaper />, comingSoon: true },
            { label: 'صفحة الخبراء', href: '#', icon: <PiChalkboardTeacher />, comingSoon: true },
            { label: 'شات الحوار بين الرواد', href: '#', icon: <PiChatCircle />, comingSoon: true },
            {
                label: 'الاستشارات',
                href: '#',
                icon: <PiQuestion />,
                comingSoon: true,
                children: [
                    { label: 'مستشارك الدعوي', href: '#', icon: <PiMosque />, comingSoon: true },
                    { label: 'مستشارك التربوي', href: '#', icon: <PiChalkboardTeacher />, comingSoon: true },
                    { label: 'مستشارك التعليمي', href: '#', icon: <PiGraduationCap />, comingSoon: true },
                    { label: 'مستشارك في التدريب', href: '#', icon: <PiWrench />, comingSoon: true },
                    { label: 'مستشارك البحثي', href: '#', icon: <PiMagnifyingGlass />, comingSoon: true },
                    { label: 'مستشارك الأسري', href: '#', icon: <PiHeart />, comingSoon: true },
                ]
            },
        ]
    },
    {
        label: 'نادي الابتكار',
        href: '#',
        icon: <PiLightbulb />,
        hasDropdown: true,
        comingSoon: true,
        children: [
            { label: 'كورسات الابتكار', href: '#', icon: <PiGraduationCap />, comingSoon: true },
            { label: 'ابتكارات الرواد', href: '#', icon: <PiLightning />, comingSoon: true },
            { label: 'براءات الاختراع', href: '#', icon: <PiTrophy />, comingSoon: true },
            { label: 'ورش عمل صناعة الأفكار', href: '#', icon: <PiWrench />, comingSoon: true },
            {
                label: 'الذكاء الاصطناعي',
                href: '#',
                icon: <PiRobot />,
                comingSoon: true,
                children: [
                    { label: 'منتدى الذكاء', href: '#', icon: <PiChatCircle />, comingSoon: true },
                    { label: 'محركات بحث الذكاء', href: '#', icon: <PiMagnifyingGlass />, comingSoon: true },
                    { label: 'الذكاء التوليدي', href: '#', icon: <PiRobot />, comingSoon: true },
                ]
            },
            {
                label: 'كتابي',
                href: '#',
                icon: <PiBookOpen />,
                comingSoon: true,
                children: [
                    { label: 'تلخيص', href: '#', icon: <PiFile />, comingSoon: true },
                    { label: 'صوتي', href: '#', icon: <PiFileAudio />, comingSoon: true },
                    { label: 'بودكاست', href: '#', icon: <PiMicrophone />, comingSoon: true },
                    { label: 'رسم بياناتي', href: '#', icon: <PiChartLine />, comingSoon: true },
                    { label: 'أصل الكتاب', href: '#', icon: <PiBookOpen />, comingSoon: true },
                    { label: 'اختبار وشهادة', href: '#', icon: <PiCertificate />, comingSoon: true },
                ]
            },
        ]
    },
    {
        label: 'المعرض',
        href: '#',
        icon: <PiBooks />,
        hasDropdown: true,
        comingSoon: true,
        children: [
            { label: 'الكتب والمقررات', href: '#', icon: <PiBookOpen />, comingSoon: true },
            { label: 'الأدلة والوثائق', href: '#', icon: <PiFile />, comingSoon: true },
            { label: 'الملخصات', href: '#', icon: <PiFile />, comingSoon: true },
            { label: 'الكورسات', href: '#', icon: <PiGraduationCap />, comingSoon: true },
            { label: 'الفيديوهات', href: '#', icon: <PiVideo />, comingSoon: true },
            { label: 'الملفات الصوتية', href: '#', icon: <PiFileAudio />, comingSoon: true },
            { label: 'البحوث والدراسات', href: '#', icon: <PiFlask />, comingSoon: true },
            {
                label: 'اكسب معنا',
                href: '#',
                icon: <PiCurrencyDollar />,
                comingSoon: true,
                children: [
                    { label: 'كتاب ومسابقة', href: '#', icon: <PiBookOpen />, comingSoon: true },
                    { label: 'السحب العشوائي على المتفاعلين', href: '#', icon: <PiTrophy />, comingSoon: true },
                    { label: 'مسابقات بناء المحتوى الهادف', href: '#', icon: <PiLightbulb />, comingSoon: true },
                    { label: 'المسابقات الثقافية', href: '#', icon: <PiFlask />, comingSoon: true },
                ]
            },
        ]
    },
    {
        label: 'زاد المحاضر والخطيب',
        href: '#',
        icon: <PiMicrophone />,
        hasDropdown: true,
        comingSoon: true,
        children: [
            { label: 'دليل الموضوعات', href: '#', icon: <PiFile />, comingSoon: true },
            {
                label: 'الخطب',
                href: '#',
                icon: <PiMosque />,
                comingSoon: true,
                children: [
                    { label: 'خطب نموذجية من المساجد المركزية', href: '#', icon: <PiMosque />, comingSoon: true },
                    { label: 'دليل الخطب المنبرية', href: '#', icon: <PiBookOpen />, comingSoon: true },
                ]
            },
            { label: 'الدروس المهمة', href: '#', icon: <PiChalkboardTeacher />, comingSoon: true },
            {
                label: 'المجالس',
                href: '#',
                icon: <PiUsersThree />,
                comingSoon: true,
                children: [
                    { label: 'مجالس التدبر', href: '#', icon: <PiBookOpen />, comingSoon: true },
                    { label: 'مجالس التفسير', href: '#', icon: <PiScroll />, comingSoon: true },
                    { label: 'ديوانيات الدعاة والمؤثرين', href: '#', icon: <PiUsers />, comingSoon: true },
                    { label: 'مجالس أهل الذكر', href: '#', icon: <PiMosque />, comingSoon: true },
                ]
            },
        ]
    },
    {
        label: 'فضاء أفق',
        href: '#',
        icon: <PiRocket />,
        hasDropdown: true,
        comingSoon: true,
        children: [
            {
                label: 'التطبيقات',
                href: '#',
                icon: <PiDevices />,
                comingSoon: true,
                children: [
                    { label: 'تطبيق معلومة', href: '#', icon: <PiLightbulb />, comingSoon: true },
                    { label: 'تطبيق تربية', href: '#', icon: <PiChalkboardTeacher />, comingSoon: true },
                    { label: 'تطبيق مشورة', href: '#', icon: <PiQuestion />, comingSoon: true },
                ]
            },
            {
                label: 'الأكاديميات',
                href: '#',
                icon: <PiBuilding />,
                comingSoon: true,
                children: [
                    { label: 'أكاديمية أفق لتأهيل الدعاة', href: '#', icon: <PiMosque />, comingSoon: true },
                    { label: 'أكاديمية أفق للتقنية والعلوم', href: '#', icon: <PiCode />, comingSoon: true },
                    { label: 'أكاديمية بارع الإعلامية', href: '#', icon: <PiMegaphone />, comingSoon: true },
                    { label: 'أكاديمية تمكين', href: '#', icon: <PiLightning />, comingSoon: true },
                ]
            },
            {
                label: 'المتجر',
                href: '#',
                icon: <PiStorefront />,
                comingSoon: true,
                children: [
                    { label: 'معرض المنتجات', href: '#', icon: <PiStorefront />, comingSoon: true },
                    { label: 'الاشتراك في الكورسات والدورات', href: '#', icon: <PiGraduationCap />, comingSoon: true },
                    { label: 'الوسائل التعليمية', href: '#', icon: <PiBookOpen />, comingSoon: true },
                ]
            },
            {
                label: 'الخدمات الرقمية',
                href: '#',
                icon: <PiGlobe />,
                comingSoon: true,
                children: [
                    { label: 'تصميم المواقع للجهات والأفراد', href: '#', icon: <PiCode />, comingSoon: true },
                    { label: 'نوافذ فرعية للتأجير', href: '#', icon: <PiBuilding />, comingSoon: true },
                    { label: 'مواقع مصغرة لأفرع متخصصة', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'استضافة المسابقات والأنشطة', href: '#', icon: <PiTrophy />, comingSoon: true },
                    { label: 'عقود تنفيذ المناشط', href: '#', icon: <PiHandshake />, comingSoon: true },
                    { label: 'التنسيق مع الشبكات الإعلامية', href: '#', icon: <PiNewspaper />, comingSoon: true },
                    { label: 'الدعم الفني بمقابل', href: '#', icon: <PiHeadset />, comingSoon: true },
                ]
            },
            {
                label: 'الخدمات البحثية',
                href: '#',
                icon: <PiMagnifyingGlass />,
                comingSoon: true,
                children: [
                    { label: 'بناء الدبلوم العلمية والمهنية', href: '#', icon: <PiCertificate />, comingSoon: true },
                    { label: 'بناء المناهج', href: '#', icon: <PiBookOpen />, comingSoon: true },
                    { label: 'البحوث والدراسات', href: '#', icon: <PiFlask />, comingSoon: true },
                    { label: 'الحقائب التعليمية والتدريبية', href: '#', icon: <PiBriefcase />, comingSoon: true },
                    { label: 'ملخصات الكتب والبحوث', href: '#', icon: <PiFile />, comingSoon: true },
                    { label: 'الفهرسة والمراجعة والتدقيق', href: '#', icon: <PiMagnifyingGlass />, comingSoon: true },
                    { label: 'دراسات الجدوى', href: '#', icon: <PiChartLine />, comingSoon: true },
                    { label: 'تصميم وإنتاج الإعلانات', href: '#', icon: <PiMegaphone />, comingSoon: true },
                    { label: 'الحملات الإعلامية الرقمية', href: '#', icon: <PiGlobe />, comingSoon: true },
                    { label: 'كتابة الخطط والمشاريع', href: '#', icon: <PiFile />, comingSoon: true },
                ]
            },
            {
                label: 'التوكيلات',
                href: '#',
                icon: <PiHandCoins />,
                comingSoon: true,
                children: [
                    { label: 'تسويق الوسائل التعليمية', href: '#', icon: <PiStorefront />, comingSoon: true },
                    { label: 'تعاقدات تنفيذ البرامج التعليمية والتدريبية', href: '#', icon: <PiHandshake />, comingSoon: true },
                ]
            },
        ]
    },
];

const buildDiplomaChildren = (sections: Section[]): NestedMenuItem[] => (
    sections.map((section) => ({
        label: section.name,
        href: `/courses?section=${encodeURIComponent(section.name)}`,
    }))
);

// MegaMenu Component
const MegaMenu = () => {
    const pathname = usePathname();
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        let mounted = true;
        getPublicSectionsSafe().then((items) => {
            if (mounted) setSections(items);
        });
        return () => {
            mounted = false;
        };
    }, []);

    // Handle clicking outside to close dropdown
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveDropdown(null);
                setActiveSubmenu(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMouseEnter = (label: string) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        setActiveDropdown(label);
    };

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setActiveDropdown(null);
            setActiveSubmenu(null);
        }, 150);
    };

    const handleSubmenuEnter = (label: string) => {
        setActiveSubmenu(label);
    };

    const isActive = (href: string) => {
        if (href === '/') {
            return pathname === '/';
        }
        return pathname?.startsWith(href);
    };

    const renderedMenuData = menuData.map((item) => (
        item.label === 'الدبلومات'
            ? { ...item, hasDropdown: sections.length > 0, children: buildDiplomaChildren(sections) }
            : item
    ));

    return (
        <nav className={styles.megaMenu} ref={dropdownRef}>
            <ul className={styles.menuList}>
                {renderedMenuData.map((item) => (
                    <li
                        key={item.label}
                        className={styles.menuItem}
                        onMouseEnter={() => item.hasDropdown && handleMouseEnter(item.label)}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Link
                            href={item.href}
                            className={clsx(
                                styles.menuLink,
                                isActive(item.href) && styles.active
                            )}
                        >
                            <span className={styles.menuIcon}>{item.icon}</span>
                            <span className={styles.menuLabel}>{item.label}</span>
                            {item.hasDropdown && (
                                <PiCaretDown className={clsx(
                                    styles.dropdownArrow,
                                    activeDropdown === item.label && styles.rotated
                                )} />
                            )}
                        </Link>

                        {/* Dropdown Panel */}
                        {item.hasDropdown && item.children && activeDropdown === item.label && (
                            <div
                                className={styles.dropdownPanel}
                                onMouseEnter={() => handleMouseEnter(item.label)}
                                onMouseLeave={handleMouseLeave}
                            >
                                <div className={styles.dropdownGrid}>
                                    {item.children.map((child, childIndex) => (
                                        <div
                                            key={child.label}
                                            className={clsx(
                                                styles.dropdownItem,
                                                child.children && styles.hasSubmenu,
                                                child.comingSoon && styles.comingSoon
                                            )}
                                            onMouseEnter={() => child.children && handleSubmenuEnter(child.label)}
                                        >
                                            {child.comingSoon ? (
                                                <span className={clsx(styles.dropdownLink, styles.disabledLink)}>
                                                    <span className={styles.dropdownIcon}>{child.icon}</span>
                                                    <span>{child.label}</span>
                                                    <span className={styles.comingSoonBadge}>قريباً</span>
                                                </span>
                                            ) : (
                                                <Link href={child.href} className={styles.dropdownLink}>
                                                    {child.icon ? <span className={styles.dropdownIcon}>{child.icon}</span> : null}
                                                    <span>{child.label}</span>
                                                    {child.children && <PiCaretLeft className={styles.submenuArrow} />}
                                                </Link>
                                            )}

                                            {/* Nested Submenu - position based on column */}
                                            {child.children && activeSubmenu === child.label && (
                                                <div className={clsx(
                                                    styles.submenuPanel,
                                                    childIndex % 2 === 0 ? styles.submenuLeft : styles.submenuRight
                                                )}>
                                                    {child.children.map((subChild) => (
                                                        subChild.comingSoon ? (
                                                            <span
                                                                key={subChild.label}
                                                                className={clsx(styles.submenuLink, styles.disabledLink)}
                                                            >
                                                                <span className={styles.submenuIcon}>{subChild.icon}</span>
                                                                <span>{subChild.label}</span>
                                                                <span className={styles.comingSoonBadge}>قريباً</span>
                                                            </span>
                                                        ) : (
                                                            <Link
                                                                key={subChild.label}
                                                                href={subChild.href}
                                                                className={styles.submenuLink}
                                                            >
                                                                <span className={styles.submenuIcon}>{subChild.icon}</span>
                                                                <span>{subChild.label}</span>
                                                            </Link>
                                                        )
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export default MegaMenu;
