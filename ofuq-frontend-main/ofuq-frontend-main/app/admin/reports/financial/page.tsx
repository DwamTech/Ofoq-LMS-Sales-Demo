'use client';

import React from 'react';
import FinancialReportsTable from '../../../../components/FinancialReportsTable';
import styles from './FinancialReports.module.css';

const FinancialReportsPage = () => {
  return (
    <div className={styles["financialPage"]}>
      <FinancialReportsTable />
    </div>
  );
};

export default FinancialReportsPage;