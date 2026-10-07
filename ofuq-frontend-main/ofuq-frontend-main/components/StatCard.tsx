import React from 'react';
import { IconType } from 'react-icons';
import styles from './WorldUsersMap.module.css';

interface StatCardProps {
    icon: IconType;
    title: string;
    value: number;
    label: string;
    description: string;
    progress: number;
    delay: string;
}

export function StatCard({ icon: Icon, title, value, label, description, progress, delay }: StatCardProps) {
    return (
        <div className={styles['stat-card']} style={{ animationDelay: delay }}>
            <div className={styles['stat-icon-container']}>
                <Icon className={styles['stat-icon']} />
            </div>
            <div className={styles['stat-body']}>
                <div className={styles['stat-info']}>
                    <h3 className={styles['stat-title']}>{title}</h3>
                    <span className={styles['stat-label']}>{label}</span>
                </div>
                <div className={styles['stat-number']}>{value.toLocaleString()}</div>
            </div>
        </div>
    );
}
