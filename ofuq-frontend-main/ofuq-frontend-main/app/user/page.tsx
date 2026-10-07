'use client';

import React, { useEffect, useState } from 'react';
import UserWelcome from '../../components/UserWelcome';
import UserStats from '../../components/UserStats';
import WatchProgress from '../../components/WatchProgress';
import { getCurrentUser, User } from '../../utils/authService';
import { getBackendAssetUrl } from '../../utils/url';
import '../../styles/dashboard.css';

export default function UserDashboard() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userData = getCurrentUser();
    setUser(userData);
  }, []);

  const profileImage = user?.profile_picture ? getBackendAssetUrl(user.profile_picture) : '/profile.jpg';

  return (
    <div className="dashboard-container user-dashboard">
      <UserWelcome 
        userName={user?.name}
        profileImage={profileImage}
      />
      
      {/* <UserStats 
        lastTestScore={85}
        completedPrograms={3}
        registeredPrograms={5}
      /> */}

      <div className="dashboard-sections">
        <WatchProgress />
      </div>
    </div>
  );
}