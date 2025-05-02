// src/utils/timeUtils.js

export const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };
  
  export const isNightTime = (currentTime, sunrise, sunset) => {
    return currentTime < sunrise || currentTime > sunset;
  };
  