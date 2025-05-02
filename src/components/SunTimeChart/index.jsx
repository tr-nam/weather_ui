import { LineChart, Line, XAxis, YAxis, ReferenceArea, ReferenceLine, ReferenceDot } from 'recharts';
import { useState, useEffect } from 'react';

// Custom Tooltip Component with Sun or Moon Icon
const CustomTooltip = ({ time, xPos, yPos, formatTime, isNight }) => {
  return (
    <div style={{ position: 'absolute',top: yPos - yPos, left: xPos}}>
      <div
        style={{
          backgroundColor: 'transparent',
          color: 'black',
          fontSize: '12px',
          position: 'absolute',
          top: yPos - 30,
          left: 0,
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
        }}
      >
        {formatTime(time)}
      </div>
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          transform: 'translate(-50%, 0%)',
        }}
      >
        {isNight ? (
          <>
            <circle cx="14.2" cy="10" r="8" fill="#9ca3af" />
            <path d="M16 4a6 6 0 0 1-8 8 7 7 0 1 0 8-8z" fill="#d1d5db" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="5" fill="#facc15" />
            <path
              d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke="#facc15"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
    </div>
  );
};

const SunTimeChart = ({ className = '', sunrise, sunset }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const generateExtendedData = (sunrise, sunset) => {
    if (!sunrise || !sunset) return [];

    const sunriseTime = sunrise * 1000;
    const sunsetTime = sunset * 1000;
    const solarNoon = (sunriseTime + sunsetTime) / 2;
    const maxAltitude = 100;
    const interval = 15 * 60 * 1000;

    const chartStartTime = sunriseTime - 3600 * 1000;
    const chartEndTime = sunsetTime + 3600 * 1000;

    const data = [];

    for (let time = chartStartTime; time < sunriseTime; time += interval) {
      data.push({ time: time / 1000, altitude: 0 });
    }

    for (let time = sunriseTime; time <= sunsetTime; time += interval) {
      const t = (time - solarNoon) / (sunsetTime - solarNoon);
      const altitude = maxAltitude * (1 - t * t);
      data.push({ time: time / 1000, altitude });
    }

    for (let time = sunsetTime + interval; time <= chartEndTime; time += interval) {
      data.push({ time: time / 1000, altitude: 0 });
    }

    data.push({ time: chartEndTime / 1000, altitude: 0 });

    return data;
  };

  const getTooltipPosition = (time, sunrise, sunset, chartWidth, chartHeight, maxAltitude) => {
    if (!time || !sunrise || !sunset) return { xPos: 0, yPos: 0, altitude: 0 };

    const sunriseTime = sunrise * 1000;
    const sunsetTime = sunset * 1000;
    const solarNoon = (sunriseTime + sunsetTime) / 2;
    const chartStartTime = sunrise - 3600;
    const chartEndTime = sunset + 3600;

    const timeMs = time * 1000;
    const timeRange = chartEndTime - chartStartTime;
    const xPos = ((time - chartStartTime) / timeRange) * chartWidth;

    let altitude = 0;
    if (timeMs >= sunriseTime && timeMs <= sunsetTime) {
      const t = (timeMs - solarNoon) / (sunsetTime - solarNoon);
      altitude = maxAltitude * (1 - t * t);
    }

    const yPos = chartHeight - (altitude / maxAltitude) * chartHeight;
    return { xPos, yPos, altitude };
  };

  const getSunPosition = (sunrise, sunset, chartWidth) => {
    if (!sunrise || !sunset) return { sunX: 0, moonX1: 0, moonX2: 0 };

    const chartStartTime = sunrise - 3600;
    const chartEndTime = sunset + 3600;
    const timeRange = chartEndTime - chartStartTime;

    const currentTime = Math.floor(Date.now() / 1000);
    const isNight = currentTime < sunrise || currentTime > sunset;

    // Sun position (only during day)
    const sunX = ((sunrise - chartStartTime) / timeRange) * chartWidth +
      ((sunset - sunrise) / timeRange) * chartWidth / 2;

    // Moon positions (before sunrise and after sunset)
    const moonX1 = ((sunrise - chartStartTime) / timeRange) * chartWidth / 2;
    const moonX2 = ((chartEndTime - sunset) / timeRange) * chartWidth / 2 +
      ((sunset - chartStartTime) / timeRange) * chartWidth;

    return { sunX, moonX1, moonX2, isNight, currentTime };
  };

  const data = generateExtendedData(sunrise, sunset);
  const chartStartTime = sunrise ? sunrise - 3600 : sunrise;
  const chartEndTime = sunset ? sunset + 3600 : sunset;

  const chartWidth = 280;
  const chartHeight = 45;
  const maxAltitude = 100;
  // const currentTime = Math.floor(Date.now() / 1000);
  const [currentTime, setCurrentTime] = useState(Math.floor(Date.now() / 1000));
  const isWithinRange = currentTime >= chartStartTime && currentTime <= chartEndTime;
  const isNight = currentTime < sunrise || currentTime > sunset;
  const { xPos, yPos } = getTooltipPosition(currentTime, sunrise, sunset, chartWidth, chartHeight, maxAltitude);
  const { sunX, moonX1, moonX2 } = getSunPosition(sunrise, sunset, chartWidth);


  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Math.floor(Date.now() / 1000));
    }, 60000); // mỗi phút

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={className}>
      <LineChart
        width={300}
        height={65}
        data={data}
        margin={{ top: 10, right: 10, left: 10, bottom: 10 }}
      >
        <XAxis dataKey="time" hide domain={[chartStartTime, chartEndTime]} />
        <YAxis hide />
        {sunrise && (
          <ReferenceArea x1={chartStartTime} x2={sunrise} y1={0} y2={100} fill="#e5e7eb" fillOpacity={0.5} />
        )}
        {sunset && (
          <ReferenceArea x1={sunset} x2={chartEndTime} y1={0} y2={100} fill="#e5e7eb" fillOpacity={0.5} />
        )}

        {/* Horizontal line connecting sunrise and sunset */}
        {sunrise && sunset && (
          <ReferenceLine
            y={0}
            stroke="#facc15"
            strokeWidth={2}
            strokeDasharray="3 3"
            x1={sunrise}
            x2={sunset}
          />
        )}

        {/* Sun position indicator */}
        {!isNight && (
          <ReferenceDot
            x={sunrise + (sunset - sunrise) / 2}
            y={maxAltitude}
            r={5}
            fill="#facc15"
            stroke="#fff"
            strokeWidth={2}
          />
        )}

        {/* Moon position indicators (before sunrise and after sunset) */}
        {isNight && currentTime < sunrise && (
          <ReferenceDot
            x={chartStartTime + (sunrise - chartStartTime) / 2}
            y={10}
            r={4}
            fill="#9ca3af"
            stroke="#fff"
            strokeWidth={1}
          />
        )}

        {isNight && currentTime > sunset && (
          <ReferenceDot
            x={sunset + (chartEndTime - sunset) / 2}
            y={10}
            r={4}
            fill="#9ca3af"
            stroke="#fff"
            strokeWidth={1}
          />
        )}

        {sunrise && (
          <ReferenceLine x={sunrise} stroke="#666" strokeWidth={1} strokeDasharray="3 3" />
        )}
        {sunset && (
          <ReferenceLine x={sunset} stroke="#666" strokeWidth={1} strokeDasharray="3 3" />
        )}

        <Line type="monotone" dataKey="altitude" stroke="#facc15" dot={false} strokeWidth={2} />
      </LineChart>
      {isWithinRange && (
        <CustomTooltip
          time={currentTime}
          xPos={xPos + 10}
          yPos={yPos + 10}
          formatTime={formatTime}
          isNight={isNight}
        />
      )}
    </div>
  );
};

export default SunTimeChart;