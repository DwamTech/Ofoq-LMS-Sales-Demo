import StudentsManagement from '../../../components/students managment/StudentsManagement';
import styles from './Students.module.css';

export default function StudentsPage() {
  return (
    <div className={styles["studentsPage"]}>
      <StudentsManagement />
    </div>
  );
}