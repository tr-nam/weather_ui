import React, { useEffect, useState } from 'react';
import './WeatherEffect.css';

const WeatherEffect = ({ weatherType = 'clear', sunrise = 6, sunset = 18 }) => {
  const [isDayTime, setIsDayTime] = useState(true);

  useEffect(() => {
    const updateDayNight = () => {
      const hour = new Date().getHours();
      setIsDayTime(hour >= sunrise && hour < sunset);
    };

    updateDayNight();
    const interval = setInterval(updateDayNight, 60000); // mỗi phút check lại

    return () => clearInterval(interval);
  }, [sunrise, sunset]);

  useEffect(() => {
    const effectClasses = ['weather-rain', 'weather-snow', 'weather-wind'];
    effectClasses.forEach(cls => document.body.classList.remove(cls));

    if (weatherType === 'rain') document.body.classList.add('weather-rain');
    else if (weatherType === 'snow') document.body.classList.add('weather-snow');
    else if (weatherType === 'wind') document.body.classList.add('weather-wind');

    return () => {
      effectClasses.forEach(cls => document.body.classList.remove(cls));
    };
  }, [weatherType]);

  return (
    <div className={`weather-bg ${isDayTime ? 'day' : 'night'}`}>
      {weatherType === 'rain' && <div className="rain"></div>}
      {weatherType === 'snow' && <div className="snow"></div>}
      {weatherType === 'wind' && <div className="wind"></div>}
    </div>
  );
};

export default WeatherEffect;
