import React from 'react';
import './Loader.css';

export const Loader = ({ text = 'جاري التحميل...' }) => {
  return (
    <div className="loader-container">
      <div className="loader-spinner"></div>
      <p className="loader-text">{text}</p>
    </div>
  );
};
