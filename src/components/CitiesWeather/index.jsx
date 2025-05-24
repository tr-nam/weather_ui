import { useState, useEffect, useContext } from 'react';
import { fetchWeatherByCity } from '@/api/weather';
import { normalizeCityKey } from '@/utils/normalizeCityKey';
import WeatherIcon from '@/components/WeatherIcon';

const Index = ({ onSelectCity }) => {
    const [recentCitiesWeather, setRecentCitiesWeather] = useState([]);
    const getWeatherWithCache = async (city, signal) => {
        const cacheKey = `weather_${normalizeCityKey(city)}`;
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        const CACHE_DURATION = 3600000; // 1 giờ

        const isCacheValid = cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION;

        if (isCacheValid) {
            return cachedData.data;
        }

        try {
            const data = await fetchWeatherByCity(city, 'VN', { signal });
            localStorage.setItem(
                cacheKey,
                JSON.stringify({ data, timestamp: Date.now() })
            );
            return data;
        } catch (error) {
            if (isCacheValid) return cachedData.data; // fallback nếu lỗi API
            throw error;
        }
    };

    useEffect(() => {
        const controller = new AbortController();

        // Lấy từ localStorage hoặc mặc định
        let recentCities = JSON.parse(localStorage.getItem('recentCities'));
        if (!recentCities || !recentCities.length) {
            recentCities = ['Hà Nội', 'Hồ Chí Minh', 'Hà Tĩnh', 'Đà Nẵng'];
            localStorage.setItem('recentCities', JSON.stringify(recentCities));
        }

        const loadAll = async () => {
            const results = await Promise.allSettled(
                recentCities.map(city => getWeatherWithCache(city, controller.signal))
            );

            const merged = results.map((res, index) => ({
                city: recentCities[index],
                weather: res.status === 'fulfilled' ? res.value : null,
            }));

            setRecentCitiesWeather(merged);
        };

        loadAll();

        return () => controller.abort();
    }, []);
    
    return (
        <div className="col-span-2 row-span-3 gap-2 shadow-md rounded-lg p-4 bg-white dark:bg-slate-700 text-black dark:text-slate-100">
            <div className="col-span-2 text-[20px] font-bold">Xem Gần Đây</div>

            {recentCitiesWeather.map(({ city, weather }, index) => (
                <div
                    key={index}
                    onClick={() => onSelectCity(city)}
                    className="col-span-2 flex justify-between p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <span className="text-[18px] font-bold">{city}</span>
                    <span className='flex items-center'><WeatherIcon iconCode={weather?.current?.weather[0]?.icon} size={32}/>{weather ? `${(weather?.current?.temp).toFixed(1)}°C` : '--'}</span>
                </div>
            ))}
        </div>
    );
};

export default Index;
