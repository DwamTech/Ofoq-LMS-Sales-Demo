'use client';

import React from 'react';
import VisitsReportsTable from '../../../../components/VisitsReportsTable';
import styles from './VisitsReports.module.css';

const VisitsReportsPage = () => {
  return (
    <div className={styles["visitsPage"]}>
      <VisitsReportsTable />
    </div>
  );
};

export default VisitsReportsPage;