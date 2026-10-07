import '../../styles/profile-header.css';
import ProfileHeader from '../../components/ProfileHeader';

export default function ProfileHeaderPage() {
  return (
    <div className="profile-header-page">
      <ProfileHeader />
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <h1>صفحة Profile Header</h1>
        <p>هذه صفحة تجريبية لعرض الـ Profile Header الجديد</p>
      </div>
    </div>
  );
}