import { useState } from 'react';
import { fetchWeatherByCity } from './api/weather';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);

  const handleSearch = async () => {
    try {
      const data = await fetchWeatherByCity(city);
      setWeather(data);
    } catch (err) {
      alert('Không tìm thấy thành phố!');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-blue-100 p-4">
      <div className="flex space-x-2">
        <input
          type="text"
          placeholder="Nhập tên thành phố..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="border px-4 py-2 rounded-md"
        />
        <button onClick={handleSearch} className="bg-blue-500 text-white px-4 py-2 rounded-md">
          Tìm
        </button>
      </div>

      {weather && (
        <div className="mt-6 bg-white p-6 rounded-xl shadow-lg text-center text-amber-200">
          <h2 className="text-2xl font-bold">{weather.name}</h2>
          <p>{weather.weather[0].description}</p>
          <p className="text-3xl mt-2">{weather.main.temp}°C</p>
          <p>Độ ẩm: {weather.main.humidity}%</p>
          <p>Gió: {weather.wind.speed} m/s</p>
        </div>
      )}
    </div>
  );
}

export default App;
