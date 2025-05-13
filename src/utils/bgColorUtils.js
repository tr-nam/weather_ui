const fileColorMap = {
'01d': 'linear-gradient(to top, #fefcea, #f1da36)',
'01n': 'linear-gradient(to top, #1e130c, #9a8478)',
'02d': 'linear-gradient(to top, #d7d2cc, #304352)',
'02n': 'linear-gradient(to top, #2c3e50, #4ca1af)',
'03d': 'linear-gradient(to top, #bdc3c7, #2c3e50)',
'03n': 'linear-gradient(to top, #434343, #000000)',
'04d': 'linear-gradient(to top, #d7d2cc, #304352)',
'04n': 'linear-gradient(to top, #2c3e50, #4ca1af)',
'09d': 'linear-gradient(to top, #a1c4fd, #c2e9fb)',
'09n': 'linear-gradient(to top, #232526, #414345)',
'10d': 'linear-gradient(to top, #a1c4fd, #c2e9fb)',
'10n': 'linear-gradient(to top, #232526, #414345)',
'11d': 'linear-gradient(to top, #373b44, #4286f4)',
'11n': 'linear-gradient(to top, #0f2027, #203a43, #2c5364)',
'13d': 'linear-gradient(to top, #e6dada, #274046)',
'13n': 'linear-gradient(to top, #83a4d4, #b6fbff)',
'50d': 'mist',
'50n': 'mist',
};
export function getBgColor(weatherCode) {
  const color = fileColorMap[weatherCode];
  return color;
}