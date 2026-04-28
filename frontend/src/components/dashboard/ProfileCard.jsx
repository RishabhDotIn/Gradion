import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/profileCard.css';

const ProfileCard = ({ user, compact }) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 2); // Show 2 days before today by default
    return d;
  });

  // Generate 6 days based on startDate
  const days = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      arr.push(d);
    }
    return arr;
  }, [startDate]);

  const handlePrev = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() - 6);
    setStartDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + 6);
    setStartDate(newDate);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric'
    });
  };

  const getDayName = (date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'short' });
  };

  const isSameDay = (d1, d2) => {
    return d1.getDate() === d2.getDate() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getFullYear() === d2.getFullYear();
  };

  return (
    <div className={`profile-card ${compact ? 'compact' : ''}`}>
      <div className="profile-section">
        <div className="profile-image-container">
          <img 
            src="/profile.png" 
            alt="Profile" 
            className="profile-image" 
          />
        </div>
        <h2 className="user-name">{user?.fullName || "Andreas Iniesta"}</h2>
        <p className="user-role">College Student</p>
      </div>

      <div className="date-nav-section">
        <div className="month-year-nav">
          <button className="nav-arrow" onClick={handlePrev}>
            <i className="fas fa-chevron-left" />
          </button>
          <span className="month-year-text">{formatMonthYear(startDate)}</span>
          <button className="nav-arrow" onClick={handleNext}>
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        <div className="date-selector">
          {days.map((date, index) => {
            const selected = isSameDay(date, selectedDate);
            return (
              <div 
                key={index} 
                className={`date-item ${selected ? 'selected' : ''}`}
                onClick={() => setSelectedDate(new Date(date))}
              >
                <span className="day-name">{getDayName(date)}</span>
                <span className="day-number">{date.getDate()}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
