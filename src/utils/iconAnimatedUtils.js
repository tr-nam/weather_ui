const icons = import.meta.glob('@/assets/weather-icons/animated/*.svg', {
  eager: true,
  import: 'default',
});

const iconAnimatedMap = {};

for (const path in icons) {
  const fileName = path.split('/').pop(); // ví dụ: cloudy-day-1.svg
  const nameWithoutExt = fileName.replace('.svg', ''); // cloudy-day-1
  iconAnimatedMap[nameWithoutExt] = `src/assets/weather-icons/animated/${fileName}`;
}

export const getAnimatedIconUrl = (iconCode) => {
  // ánh xạ iconCode từ API sang tên file
  const fileNameMap = {
    '01d': 'day',
    '01n': 'night',
    '02d': 'cloudy-day-1',
    '02n': 'cloudy-night-1',
    '03d': 'cloudy',
    '03n': 'cloudy',
    '04d': 'cloudy-day-3',
    '04n': 'cloudy-night-3',
    '09d': 'rainy-6',
    '09n': 'rainy-6',
    '10d': 'rainy-3',
    '10n': 'rainy-8',
    '11d': 'thunder',
    '11n': 'thunder',
    '13d': 'snowy-3',
    '13n': 'snowy-7',
    '50d': 'mist',
    '50n': 'mist',
  };

  const name = fileNameMap[iconCode];
  return name && iconAnimatedMap[name] ? iconAnimatedMap[name] : iconAnimatedMap['weather']; // fallback
};
