"use client";
import { brand } from "@/lib/brand";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import styles from "./brand/Showcase.module.css";

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
  searchQuery = "",
  activeFilter = "الكل",
  title,
}: HeroSearchSectionProps) {
  const [query, setQuery] = useState(searchQuery);
  const [filter, setFilter] = useState(activeFilter);
  useEffect(() => setQuery(searchQuery), [searchQuery]);
  useEffect(() => setFilter(activeFilter), [activeFilter]);
  return (
    <section className={styles.catalogHeader}>
      <span className={styles.eyebrow}>
        {brand.name} / THE LEARNING CATALOG
      </span>
      <h1>{title || "استكشف البرامج التعليمية"}</h1>
      <form
        className={styles.catalogSearch}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch?.(query.trim());
        }}
      >
        <label htmlFor="catalog-search" className={styles.srOnly}>
          ابحث عن برنامج أو مقرر
        </label>
        <input
          id="catalog-search"
          value={query}
          type="search"
          placeholder="ما الذي تريد أن تتعلمه؟"
          onChange={(event) => {
            setQuery(event.target.value);
            onSearch?.(event.target.value);
          }}
        />
        <button type="submit">
          بحث <Search size={16} />
        </button>
      </form>
      {onFilterChange && (
        <div
          className={styles.catalogFilters}
          role="group"
          aria-label="ترتيب البرامج"
        >
          {["الكل", "الأحدث", "الأكثر تسجيلاً", "السعر (من الأقل)"].map(
            (label) => (
              <button
                type="button"
                aria-pressed={filter === label}
                key={label}
                onClick={() => {
                  setFilter(label);
                  onFilterChange(label);
                }}
              >
                {label}
              </button>
            ),
          )}
        </div>
      )}
      <p className={styles.catalogDisclosure}>
        كتالوج عرض تعليمي · الأعداد تخص تجربة المنصة وليست تبنيًا تجاريًا ·
        الأسعار بلا عملة محددة لهذا العرض.
      </p>
    </section>
  );
}
