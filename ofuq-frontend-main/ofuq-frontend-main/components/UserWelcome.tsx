import React from 'react';
import '../styles/user-welcome.css';

interface UserWelcomeProps {
  userName?: string;
  profileImage?: string;
}

export default function UserWelcome({ 
  userName = "أحمد محمد", 
  profileImage = "/profile.jpg" 
}: UserWelcomeProps) {
  return (
    <div className="user-welcome">
      <div className="profile-section">
        <img 
          src={profileImage} 
          alt="صورة المستخدم" 
          className="profile-image"
        />
      </div>
      <div className="welcome-text">
        <h1 className="welcome-greeting">أهلاً بعودتك {userName}</h1>
        <p className="welcome-description">إليك نظرة عامة على برامجك التدريبية</p>
      </div>
    </div>
  );
}