"use client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { brand } from "@/lib/brand";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { isBrandedPublicRoute } from "./brand/publicRoutes";
import { PublicNavigation } from "./brand/PublicShell";
import {
  isAuthenticated,
  getCurrentUser,
  signout,
  User,
} from "../utils/authService";
import { getBackendAssetUrl } from "../utils/url";
import styles from "./HomeHeader.module.css";
import clsx from "clsx";
import MegaMenu from "./MegaMenu";
import { getPublicSectionsSafe, type Section } from "@/utils/sectionService";
import {
  PiCertificate,
  PiCaretDown,
  PiCaretLeft,
  PiHouse,
  PiGraduationCap,
  PiUsers,
  PiLightbulb,
  PiBooks,
  PiMicrophone,
  PiRocket,
  PiUsersThree,
  PiGlobe,
  PiChartLine,
  PiPhone,
  PiHeadset,
  PiNewspaper,
  PiChalkboardTeacher,
  PiMosque,
  PiMegaphone,
  PiBriefcase,
  PiScroll,
  PiHeart,
  PiCode,
  PiBrain,
  PiWrench,
  PiHandHeart,
  PiCalendarCheck,
  PiChatCircle,
  PiQuestion,
  PiLightning,
  PiTrophy,
  PiRobot,
  PiBookOpen,
  PiFile,
  PiFileAudio,
  PiVideo,
  PiFlask,
  PiCurrencyDollar,
  PiDevices,
  PiBuilding,
  PiStorefront,
  PiMagnifyingGlass,
  PiHandCoins,
  PiHandshake,
} from "react-icons/pi";

// Mobile Sidebar Menu Data (with icons)
const mobileMenuData = [
  {
    label: "الرئيسية",
    href: "/",
    icon: <PiHouse />,
    children: [
      {
        label: "من نحن",
        href: "/about",
        icon: <PiUsersThree />,
        children: [
          { label: "التعريف", href: "/about#intro", icon: <PiFile /> },
          { label: "الأهداف", href: "/about#goals", icon: <PiLightbulb /> },
          { label: "القيم", href: "/about#values", icon: <PiHeart /> },
          {
            label: "منهجية التعليم والتدريب",
            href: "/about#methodology",
            icon: <PiChalkboardTeacher />,
          },
          { label: "الرسالة", href: "/about#mission", icon: <PiScroll /> },
          {
            label: "الميزات التنافسية",
            href: "/about#advantages",
            icon: <PiTrophy />,
          },
        ],
      },
      {
        label: "رواد المنصة حول العالم",
        href: "#",
        icon: <PiGlobe />,
        comingSoon: true,
      },
      {
        label: "الإحصائيات",
        href: "#",
        icon: <PiChartLine />,
        comingSoon: true,
        children: [
          {
            label: "عدد رواد المنصة",
            href: "#",
            icon: <PiUsers />,
            comingSoon: true,
          },
          {
            label: "عدد الكورسات",
            href: "#",
            icon: <PiGraduationCap />,
            comingSoon: true,
          },
          {
            label: "عدد الملفات الصوتية",
            href: "#",
            icon: <PiFileAudio />,
            comingSoon: true,
          },
          { label: "أخرى", href: "#", icon: <PiChartLine />, comingSoon: true },
        ],
      },
      {
        label: "بيانات التواصل",
        href: "#",
        icon: <PiPhone />,
        comingSoon: true,
      },
      {
        label: "عداد المسجلين",
        href: "#",
        icon: <PiUsers />,
        comingSoon: true,
      },
      {
        label: "شؤون الطلاب",
        href: "#",
        icon: <PiGraduationCap />,
        comingSoon: true,
        children: [
          {
            label: "الإحصاءات والحركة",
            href: "#",
            icon: <PiChartLine />,
            comingSoon: true,
          },
          {
            label: "الشهادات المجانية",
            href: "#",
            icon: <PiCertificate />,
            comingSoon: true,
          },
          {
            label: "الشهادات المعتمدة",
            href: "#",
            icon: <PiCertificate />,
            comingSoon: true,
          },
          {
            label: "السجل التعليمي للطلاب",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
          {
            label: "مجموعات التواصل التعليمية",
            href: "#",
            icon: <PiChatCircle />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "الدعم الفني",
        href: "#",
        icon: <PiHeadset />,
        comingSoon: true,
      },
      {
        label: "الصفحات في الوسائط",
        href: "#",
        icon: <PiNewspaper />,
        comingSoon: true,
        children: [
          { label: "تويتر", href: "#", icon: <PiGlobe />, comingSoon: true },
          { label: "فيس بوك", href: "#", icon: <PiGlobe />, comingSoon: true },
          { label: "تيك توك", href: "#", icon: <PiGlobe />, comingSoon: true },
          { label: "تلجرام", href: "#", icon: <PiGlobe />, comingSoon: true },
          { label: "واتساب", href: "#", icon: <PiGlobe />, comingSoon: true },
          { label: "انستجرام", href: "#", icon: <PiGlobe />, comingSoon: true },
          { label: "يوتيوب", href: "#", icon: <PiGlobe />, comingSoon: true },
        ],
      },
    ],
  },
  {
    label: "الدبلومات",
    href: "/diploms",
    icon: <PiGraduationCap />,
    children: [
      {
        label: "التربوية",
        href: "/courses?section=educational",
        icon: <PiChalkboardTeacher />,
      },
      { label: "الدعوية", href: "/courses?section=dawah", icon: <PiMosque /> },
      {
        label: "الإعلامية",
        href: "/courses?section=media",
        icon: <PiMegaphone />,
      },
      {
        label: "الإدارية",
        href: "/courses?section=management",
        icon: <PiBriefcase />,
      },
      { label: "الشرعية", href: "/courses?section=sharia", icon: <PiScroll /> },
      {
        label: "تطوير الذات",
        href: "/courses?section=self-development",
        icon: <PiHeart />,
      },
      { label: "التقنية", href: "/courses?section=tech", icon: <PiCode /> },
      {
        label: "السلوكية",
        href: "/courses?section=behavioral",
        icon: <PiBrain />,
      },
      {
        label: "المهنية",
        href: "/courses?section=professional",
        icon: <PiWrench />,
      },
      {
        label: "خدمة المجتمع",
        href: "/courses?section=community-service",
        icon: <PiHandHeart />,
      },
    ],
  },
  {
    label: `مجتمع ${brand.name}`,
    href: "/community",
    icon: <PiUsers />,
    children: [
      {
        label: "اللقاءات الإثرائية",
        href: "#",
        icon: <PiCalendarCheck />,
        comingSoon: true,
        children: [
          { label: "للدعاة", href: "#", icon: <PiMosque />, comingSoon: true },
          {
            label: "لطلاب العلم",
            href: "#",
            icon: <PiGraduationCap />,
            comingSoon: true,
          },
          { label: "للوجهاء", href: "#", icon: <PiUsers />, comingSoon: true },
          {
            label: "للقيادات المجتمعية",
            href: "#",
            icon: <PiUsersThree />,
            comingSoon: true,
          },
          {
            label: "للمؤثرين",
            href: "#",
            icon: <PiMegaphone />,
            comingSoon: true,
          },
          {
            label: "للتجار",
            href: "#",
            icon: <PiBriefcase />,
            comingSoon: true,
          },
          {
            label: "للمتفقين",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "المنتدى التفاعلي",
        href: "#",
        icon: <PiChatCircle />,
        comingSoon: true,
      },
      {
        label: "الإعلانات",
        href: "#",
        icon: <PiMegaphone />,
        comingSoon: true,
      },
      {
        label: "أخبار المنصة",
        href: "#",
        icon: <PiNewspaper />,
        comingSoon: true,
      },
      {
        label: "صفحة الخبراء",
        href: "#",
        icon: <PiChalkboardTeacher />,
        comingSoon: true,
      },
      {
        label: "شات الحوار بين الرواد",
        href: "#",
        icon: <PiChatCircle />,
        comingSoon: true,
      },
      {
        label: "الاستشارات",
        href: "#",
        icon: <PiQuestion />,
        comingSoon: true,
        children: [
          {
            label: "مستشارك الدعوي",
            href: "#",
            icon: <PiMosque />,
            comingSoon: true,
          },
          {
            label: "مستشارك التربوي",
            href: "#",
            icon: <PiChalkboardTeacher />,
            comingSoon: true,
          },
          {
            label: "مستشارك التعليمي",
            href: "#",
            icon: <PiGraduationCap />,
            comingSoon: true,
          },
          {
            label: "مستشارك في التدريب",
            href: "#",
            icon: <PiWrench />,
            comingSoon: true,
          },
          {
            label: "مستشارك البحثي",
            href: "#",
            icon: <PiMagnifyingGlass />,
            comingSoon: true,
          },
          {
            label: "مستشارك الأسري",
            href: "#",
            icon: <PiHeart />,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    label: "نادي الابتكار",
    href: "#",
    icon: <PiLightbulb />,
    comingSoon: true,
    children: [
      {
        label: "كورسات الابتكار",
        href: "#",
        icon: <PiGraduationCap />,
        comingSoon: true,
      },
      {
        label: "ابتكارات الرواد",
        href: "#",
        icon: <PiLightning />,
        comingSoon: true,
      },
      {
        label: "براءات الاختراع",
        href: "#",
        icon: <PiTrophy />,
        comingSoon: true,
      },
      {
        label: "ورش عمل صناعة الأفكار",
        href: "#",
        icon: <PiWrench />,
        comingSoon: true,
      },
      {
        label: "الذكاء الاصطناعي",
        href: "#",
        icon: <PiRobot />,
        comingSoon: true,
        children: [
          {
            label: "منتدى الذكاء",
            href: "#",
            icon: <PiChatCircle />,
            comingSoon: true,
          },
          {
            label: "محركات بحث الذكاء",
            href: "#",
            icon: <PiMagnifyingGlass />,
            comingSoon: true,
          },
          {
            label: "الذكاء التوليدي",
            href: "#",
            icon: <PiRobot />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "كتابي",
        href: "#",
        icon: <PiBookOpen />,
        comingSoon: true,
        children: [
          { label: "تلخيص", href: "#", icon: <PiFile />, comingSoon: true },
          { label: "صوتي", href: "#", icon: <PiFileAudio />, comingSoon: true },
          {
            label: "بودكاست",
            href: "#",
            icon: <PiMicrophone />,
            comingSoon: true,
          },
          {
            label: "رسم بياناتي",
            href: "#",
            icon: <PiChartLine />,
            comingSoon: true,
          },
          {
            label: "أصل الكتاب",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
          {
            label: "اختبار وشهادة",
            href: "#",
            icon: <PiCertificate />,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    label: "المعرض",
    href: "#",
    icon: <PiBooks />,
    comingSoon: true,
    children: [
      {
        label: "الكتب والمقررات",
        href: "#",
        icon: <PiBookOpen />,
        comingSoon: true,
      },
      {
        label: "الأدلة والوثائق",
        href: "#",
        icon: <PiFile />,
        comingSoon: true,
      },
      { label: "الملخصات", href: "#", icon: <PiFile />, comingSoon: true },
      {
        label: "الكورسات",
        href: "#",
        icon: <PiGraduationCap />,
        comingSoon: true,
      },
      { label: "الفيديوهات", href: "#", icon: <PiVideo />, comingSoon: true },
      {
        label: "الملفات الصوتية",
        href: "#",
        icon: <PiFileAudio />,
        comingSoon: true,
      },
      {
        label: "البحوث والدراسات",
        href: "#",
        icon: <PiFlask />,
        comingSoon: true,
      },
      {
        label: "اكسب معنا",
        href: "#",
        icon: <PiCurrencyDollar />,
        comingSoon: true,
        children: [
          {
            label: "كتاب ومسابقة",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
          {
            label: "السحب العشوائي على المتفاعلين",
            href: "#",
            icon: <PiTrophy />,
            comingSoon: true,
          },
          {
            label: "مسابقات بناء المحتوى الهادف",
            href: "#",
            icon: <PiLightbulb />,
            comingSoon: true,
          },
          {
            label: "المسابقات الثقافية",
            href: "#",
            icon: <PiFlask />,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    label: "زاد المحاضر والخطيب",
    href: "#",
    icon: <PiMicrophone />,
    comingSoon: true,
    children: [
      {
        label: "دليل الموضوعات",
        href: "#",
        icon: <PiFile />,
        comingSoon: true,
      },
      {
        label: "الخطب",
        href: "#",
        icon: <PiMosque />,
        comingSoon: true,
        children: [
          {
            label: "خطب نموذجية من المساجد المركزية",
            href: "#",
            icon: <PiMosque />,
            comingSoon: true,
          },
          {
            label: "دليل الخطب المنبرية",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "الدروس المهمة",
        href: "#",
        icon: <PiChalkboardTeacher />,
        comingSoon: true,
      },
      {
        label: "المجالس",
        href: "#",
        icon: <PiUsersThree />,
        comingSoon: true,
        children: [
          {
            label: "مجالس التدبر",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
          {
            label: "مجالس التفسير",
            href: "#",
            icon: <PiScroll />,
            comingSoon: true,
          },
          {
            label: "ديوانيات الدعاة والمؤثرين",
            href: "#",
            icon: <PiUsers />,
            comingSoon: true,
          },
          {
            label: "مجالس أهل الذكر",
            href: "#",
            icon: <PiMosque />,
            comingSoon: true,
          },
        ],
      },
    ],
  },
  {
    label: `فضاء ${brand.name}`,
    href: "#",
    icon: <PiRocket />,
    comingSoon: true,
    children: [
      {
        label: "التطبيقات",
        href: "#",
        icon: <PiDevices />,
        comingSoon: true,
        children: [
          {
            label: "تطبيق معلومة",
            href: "#",
            icon: <PiLightbulb />,
            comingSoon: true,
          },
          {
            label: "تطبيق تربية",
            href: "#",
            icon: <PiChalkboardTeacher />,
            comingSoon: true,
          },
          {
            label: "تطبيق مشورة",
            href: "#",
            icon: <PiQuestion />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "الأكاديميات",
        href: "#",
        icon: <PiBuilding />,
        comingSoon: true,
        children: [
          {
            label: `أكاديمية ${brand.name} لتأهيل الدعاة`,
            href: "#",
            icon: <PiMosque />,
            comingSoon: true,
          },
          {
            label: `أكاديمية ${brand.name} للتقنية والعلوم`,
            href: "#",
            icon: <PiCode />,
            comingSoon: true,
          },
          {
            label: "أكاديمية بارع الإعلامية",
            href: "#",
            icon: <PiMegaphone />,
            comingSoon: true,
          },
          {
            label: "أكاديمية تمكين",
            href: "#",
            icon: <PiLightning />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "المتجر",
        href: "#",
        icon: <PiStorefront />,
        comingSoon: true,
        children: [
          {
            label: "معرض المنتجات",
            href: "#",
            icon: <PiStorefront />,
            comingSoon: true,
          },
          {
            label: "الاشتراك في الكورسات والدورات",
            href: "#",
            icon: <PiGraduationCap />,
            comingSoon: true,
          },
          {
            label: "الوسائل التعليمية",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "الخدمات الرقمية",
        href: "#",
        icon: <PiGlobe />,
        comingSoon: true,
        children: [
          {
            label: "تصميم المواقع للجهات والأفراد",
            href: "#",
            icon: <PiCode />,
            comingSoon: true,
          },
          {
            label: "نوافذ فرعية للتأجير",
            href: "#",
            icon: <PiBuilding />,
            comingSoon: true,
          },
          {
            label: "مواقع مصغرة لأفرع متخصصة",
            href: "#",
            icon: <PiGlobe />,
            comingSoon: true,
          },
          {
            label: "استضافة المسابقات والأنشطة",
            href: "#",
            icon: <PiTrophy />,
            comingSoon: true,
          },
          {
            label: "عقود تنفيذ المناشط",
            href: "#",
            icon: <PiHandshake />,
            comingSoon: true,
          },
          {
            label: "التنسيق مع الشبكات الإعلامية",
            href: "#",
            icon: <PiNewspaper />,
            comingSoon: true,
          },
          {
            label: "الدعم الفني بمقابل",
            href: "#",
            icon: <PiHeadset />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "الخدمات البحثية",
        href: "#",
        icon: <PiMagnifyingGlass />,
        comingSoon: true,
        children: [
          {
            label: "بناء الدبلوم العلمية والمهنية",
            href: "#",
            icon: <PiCertificate />,
            comingSoon: true,
          },
          {
            label: "بناء المناهج",
            href: "#",
            icon: <PiBookOpen />,
            comingSoon: true,
          },
          {
            label: "البحوث والدراسات",
            href: "#",
            icon: <PiFlask />,
            comingSoon: true,
          },
          {
            label: "الحقائب التعليمية والتدريبية",
            href: "#",
            icon: <PiBriefcase />,
            comingSoon: true,
          },
          {
            label: "ملخصات الكتب والبحوث",
            href: "#",
            icon: <PiFile />,
            comingSoon: true,
          },
          {
            label: "الفهرسة والمراجعة والتدقيق",
            href: "#",
            icon: <PiMagnifyingGlass />,
            comingSoon: true,
          },
          {
            label: "دراسات الجدوى",
            href: "#",
            icon: <PiChartLine />,
            comingSoon: true,
          },
          {
            label: "تصميم وإنتاج الإعلانات",
            href: "#",
            icon: <PiMegaphone />,
            comingSoon: true,
          },
          {
            label: "الحملات الإعلامية الرقمية",
            href: "#",
            icon: <PiGlobe />,
            comingSoon: true,
          },
          {
            label: "كتابة الخطط والمشاريع",
            href: "#",
            icon: <PiFile />,
            comingSoon: true,
          },
        ],
      },
      {
        label: "التوكيلات",
        href: "#",
        icon: <PiHandCoins />,
        comingSoon: true,
        children: [
          {
            label: "تسويق الوسائل التعليمية",
            href: "#",
            icon: <PiStorefront />,
            comingSoon: true,
          },
          {
            label: "تعاقدات تنفيذ البرامج التعليمية والتدريبية",
            href: "#",
            icon: <PiHandshake />,
            comingSoon: true,
          },
        ],
      },
    ],
  },
];

const buildMobileDiplomaChildren = (sections: Section[]) =>
  sections.map((section) => ({
    label: section.name,
    href: `/courses?section=${encodeURIComponent(section.name)}`,
  }));

type MobileMenuChild = {
  label: string;
  href: string;
  icon?: React.ReactNode;
  comingSoon?: boolean;
  children?: MobileMenuChild[];
};

const HomeHeader = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [avatarClicked, setAvatarClicked] = useState(false);
  const [imageTimestamp, setImageTimestamp] = useState<number>(Date.now());
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const [expandedSubmenus, setExpandedSubmenus] = useState<string[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Video popup removed per request

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setExpandedMenus([]);
    setExpandedSubmenus([]);
  };

  const toggleMobileMenu = (label: string) => {
    setExpandedMenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  const toggleMobileSubmenu = (label: string) => {
    setExpandedSubmenus((prev) =>
      prev.includes(label)
        ? prev.filter((item) => item !== label)
        : [...prev, label],
    );
  };

  // Check authentication status on mount and listen for updates
  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsLoggedIn(authenticated);
      if (authenticated) {
        setUser(getCurrentUser());
      }
    };

    checkAuth();

    // Listen for profile updates
    const handleUserDataUpdate = () => {
      checkAuth();
      setImageTimestamp(Date.now());
    };

    window.addEventListener("userDataUpdated", handleUserDataUpdate);

    return () => {
      window.removeEventListener("userDataUpdated", handleUserDataUpdate);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    getPublicSectionsSafe().then((items) => {
      if (mounted) setSections(items);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Close profile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
    setAvatarClicked(true);
    setTimeout(() => setAvatarClicked(false), 400);
  };

  const handleLogout = async () => {
    try {
      await signout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggedIn(false);
      setUser(null);
      router.push("/auth");
    }
  };

  const renderedMobileMenuData = mobileMenuData.map((item) =>
    item.label === "الدبلومات"
      ? { ...item, children: buildMobileDiplomaChildren(sections) }
      : item,
  );

  return (
    <>
      <header className={styles["home-header"]} dir="rtl">
        <div className={styles["header-container"]}>
          {/* Logo and Navigation Group */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {/* Logo */}
            <div className={styles["header-logo"]}>
              <Link href="/" prefetch={false}>
                <BrandLogo className={styles["logo-image"]} />
              </Link>
            </div>

            {/* Desktop Navigation - MegaMenu */}
            <div className={styles["desktop-nav"]}>
              <MegaMenu />
            </div>

            {/* Certificate Verification Button - Icon Only with Tooltip */}
            <Link
              href="/verify-certificate"
              prefetch={false}
              className={clsx(
                styles["verify-btn-icon"],
                styles["desktop-only"],
              )}
              title="تحقق من شهادتك"
            >
              <PiCertificate className={styles["verify-icon"]} />
              <span className={styles["verify-tooltip"]}>تحقق من شهادتك</span>
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            className={clsx(styles["hamburger-btn"], styles["mobile-only"])}
            onClick={toggleSidebar}
            aria-label="فتح القائمة"
          >
            <span className={styles["hamburger-line"]}></span>
            <span className={styles["hamburger-line"]}></span>
            <span className={styles["hamburger-line"]}></span>
          </button>

          {/* Auth / Profile */}
          <div
            className={clsx(
              styles["header-auth"],
              !isLoggedIn && styles["mobile-hide"],
            )}
            ref={profileMenuRef}
          >
            {isLoggedIn ? (
              <div
                className={styles["profile-menu-container"]}
                onClick={toggleProfileMenu}
              >
                <div className={styles["profile-info"]}>
                  <div
                    className={clsx(
                      styles["profile-avatar"],
                      avatarClicked && styles["click-effect"],
                    )}
                    ref={avatarRef}
                  >
                    <img
                      src={
                        user?.profile_picture
                          ? `${getBackendAssetUrl(user.profile_picture)}${getBackendAssetUrl(user.profile_picture).includes("?") ? "&" : "?"}t=${imageTimestamp}`
                          : "/avatar.jpg"
                      }
                      alt="Profile"
                      width={36}
                      height={36}
                      className={styles["profile-image"]}
                    />
                  </div>
                  <span className={styles["profile-role"]}>
                    {user?.role === "admin" ? "إدارة" : "طالب"}
                  </span>
                </div>

                {isProfileMenuOpen && (
                  <div
                    className={styles["profile-dropdown"]}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link
                      href={user?.role === "admin" ? "/admin" : "/user"}
                      className={styles["dropdown-item"]}
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      لوحة التحكم
                    </Link>
                    <Link
                      href={
                        user?.role === "admin"
                          ? "/admin/profile-management"
                          : "/user/settings"
                      }
                      className={styles["dropdown-item"]}
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      إدارة الحساب الشخصي
                    </Link>
                    <Link
                      href="/user/fav"
                      className={styles["dropdown-item"]}
                      onClick={() => setIsProfileMenuOpen(false)}
                    >
                      المفضلة
                    </Link>
                    <div className={styles["dropdown-separator"]}></div>
                    <button
                      className={clsx(
                        styles["dropdown-item"],
                        styles["logout"],
                      )}
                      onClick={handleLogout}
                    >
                      تسجيل الخروج
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/auth?tab=login"
                  prefetch={false}
                  className={clsx(styles["auth-btn"], styles["login-btn1"])}
                >
                  تسجيل دخول
                </Link>
                <Link
                  href="/auth?tab=signup"
                  prefetch={false}
                  className={clsx(styles["auth-btn"], styles["signup-btn"])}
                >
                  إنشاء حساب
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <div
        className={clsx(
          styles["mobile-sidebar"],
          isSidebarOpen && styles["open"],
        )}
      >
        <div className={styles["sidebar-overlay"]} onClick={closeSidebar}></div>
        <div className={styles["sidebar-content"]}>
          <div className={styles["sidebar-header"]}>
            <button className={styles["close-btn"]} onClick={closeSidebar}>
              <span>&times;</span>
            </button>
          </div>

          {/* Certificate Verification Button in Sidebar */}
          <Link
            href="/verify-certificate"
            prefetch={false}
            className={styles["sidebar-verify-btn"]}
            onClick={closeSidebar}
          >
            <PiCertificate className={styles["sidebar-verify-icon"]} />
            <span>التحقق من الشهادة</span>
          </Link>

          {/* Accordion Navigation */}
          <nav className={styles["sidebar-nav"]}>
            {renderedMobileMenuData.map((item) => (
              <div key={item.label} className={styles["accordion-item"]}>
                <div
                  className={styles["accordion-header"]}
                  onClick={() =>
                    item.children.length > 0 && toggleMobileMenu(item.label)
                  }
                >
                  {item.children.length > 0 ? (
                    <>
                      <span className={styles["accordion-icon"]}>
                        {item.icon}
                      </span>
                      <span className={styles["accordion-label"]}>
                        {item.label}
                      </span>
                      {item.comingSoon && (
                        <span className={styles["coming-soon-badge"]}>
                          قريباً
                        </span>
                      )}
                      <PiCaretDown
                        className={clsx(
                          styles["accordion-arrow"],
                          expandedMenus.includes(item.label) &&
                            styles["rotated"],
                        )}
                      />
                    </>
                  ) : (
                    <Link
                      href={item.comingSoon ? "#" : item.href}
                      className={clsx(
                        styles["accordion-link"],
                        item.comingSoon && styles["disabled-link"],
                      )}
                      onClick={(e) => {
                        if (item.comingSoon) {
                          e.preventDefault();
                        } else {
                          closeSidebar();
                        }
                      }}
                    >
                      <span className={styles["accordion-icon"]}>
                        {item.icon}
                      </span>
                      {item.label}
                      {item.comingSoon && (
                        <span className={styles["coming-soon-badge"]}>
                          قريباً
                        </span>
                      )}
                    </Link>
                  )}
                </div>

                {/* Accordion Content */}
                {item.children.length > 0 &&
                  expandedMenus.includes(item.label) && (
                    <div className={styles["accordion-content"]}>
                      {item.children.map((child: MobileMenuChild) => (
                        <div key={child.label}>
                          {child.children ? (
                            // Nested submenu (كتابي)
                            <div className={styles["nested-accordion"]}>
                              <div
                                className={styles["nested-header"]}
                                onClick={() => toggleMobileSubmenu(child.label)}
                              >
                                <span className={styles["nested-icon"]}>
                                  {child.icon}
                                </span>
                                <span>{child.label}</span>
                                {child.comingSoon && (
                                  <span className={styles["coming-soon-badge"]}>
                                    قريباً
                                  </span>
                                )}
                                <PiCaretLeft
                                  className={clsx(
                                    styles["nested-arrow"],
                                    expandedSubmenus.includes(child.label) &&
                                      styles["rotated"],
                                  )}
                                />
                              </div>
                              {expandedSubmenus.includes(child.label) && (
                                <div className={styles["nested-content"]}>
                                  {child.children.map(
                                    (subChild: MobileMenuChild) =>
                                      subChild.comingSoon ? (
                                        <span
                                          key={subChild.label}
                                          className={clsx(
                                            styles["nested-link"],
                                            styles["disabled-link"],
                                          )}
                                        >
                                          <span
                                            className={styles["nested-icon"]}
                                          >
                                            {subChild.icon}
                                          </span>
                                          {subChild.label}
                                          <span
                                            className={
                                              styles["coming-soon-badge"]
                                            }
                                          >
                                            قريباً
                                          </span>
                                        </span>
                                      ) : (
                                        <Link
                                          key={subChild.label}
                                          href={subChild.href}
                                          className={styles["nested-link"]}
                                          onClick={closeSidebar}
                                        >
                                          <span
                                            className={styles["nested-icon"]}
                                          >
                                            {subChild.icon}
                                          </span>
                                          {subChild.label}
                                        </Link>
                                      ),
                                  )}
                                </div>
                              )}
                            </div>
                          ) : child.comingSoon ? (
                            <span
                              className={clsx(
                                styles["accordion-sublink"],
                                styles["disabled-link"],
                              )}
                            >
                              <span className={styles["sublink-icon"]}>
                                {child.icon}
                              </span>
                              {child.label}
                              <span className={styles["coming-soon-badge"]}>
                                قريباً
                              </span>
                            </span>
                          ) : (
                            <Link
                              href={child.href}
                              className={styles["accordion-sublink"]}
                              onClick={closeSidebar}
                            >
                              {child.icon ? (
                                <span className={styles["sublink-icon"]}>
                                  {child.icon}
                                </span>
                              ) : null}
                              {child.label}
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
            ))}
          </nav>

          {!isLoggedIn && (
            <div className={styles["sidebar-auth"]}>
              <Link
                href="/auth?tab=login"
                prefetch={false}
                className={clsx(styles["auth-btn"], styles["login-btn1"])}
                onClick={closeSidebar}
              >
                تسجيل دخول
              </Link>
              <Link
                href="/auth?tab=signup"
                prefetch={false}
                className={clsx(styles["auth-btn"], styles["signup-btn"])}
                onClick={closeSidebar}
              >
                إنشاء حساب
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Help video popup removed */}
    </>
  );
};

export default function ScopedHomeHeader() {
  const path = usePathname();
  return isBrandedPublicRoute(path) ? <PublicNavigation /> : <HomeHeader />;
}
