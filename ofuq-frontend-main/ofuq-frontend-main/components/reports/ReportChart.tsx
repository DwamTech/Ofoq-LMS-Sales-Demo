'use client';

import React from 'react';
import styles from './reports.module.css';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface ReportChartProps {
  title: string;
  data: any[];
  xDataKey: string;
  yDataKey: string;
  yDataLabel?: string;
  color?: string;
  height?: number;
}

export default function ReportChart({
  title,
  data,
  xDataKey,
  yDataKey,
  yDataLabel,
  color = '#028faf',
  height = 300,
}: ReportChartProps) {
  if (!data || data.length === 0) return null;

  return (
    <div className={styles.chartCard}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <BarChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
            <XAxis
              dataKey={xDataKey}
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fill: '#6b7280', fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              cursor={{ fill: 'rgba(2, 143, 175, 0.05)' }}
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                direction: 'rtl',
                textAlign: 'right'
              }}
              itemStyle={{ color: '#111827', fontWeight: 'bold' }}
            />
            <Bar
              dataKey={yDataKey}
              name={yDataLabel || yDataKey}
              fill={color}
              radius={[6, 6, 0, 0]}
              animationDuration={1500}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={index === 0 ? '#036276' : color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
