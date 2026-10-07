import React from 'react';
import styles from './FilterBar.module.css';

interface FilterOption {
    id: string | number;
    label: string;
    count?: number;
}

interface FilterBarProps {
    filters: FilterOption[];
    activeFilter: string | number;
    onFilterChange: (id: string | number) => void;
    title?: string;
}

export default function FilterBar({ filters, activeFilter, onFilterChange, title }: FilterBarProps) {
    return (
        <div className={styles.filterContainer}>
            {title && <h4 className={styles.filterTitle}>{title}</h4>}
            <div className={styles.filterScroll}>
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        className={`${styles.filterChip} ${activeFilter === filter.id ? styles.active : ''}`}
                        onClick={() => onFilterChange(filter.id)}
                    >
                        {filter.label}
                        {filter.count !== undefined && (
                            <span className={styles.filterCount}>{filter.count}</span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    );
}
