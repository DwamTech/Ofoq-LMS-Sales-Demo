import React from 'react';

interface CardProps {
  children: React.ReactNode;
}

const Card: React.FC<CardProps> = ({ children }) => {
  return (
    <div>
      {/* محتوى المكون سيتم إضافته لاحقاً */}
      {children}
    </div>
  );
};

export default Card;