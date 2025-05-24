import { useState, useEffect } from 'react';
import { fetchWeatherByCity } from '@/api/weather';
import { normalizeCityKey } from '@/utils/normalizeCityKey';
import WeatherIcon from '@/components/WeatherIcon';
import { useSearch } from '@/context/SearchContext';

const DEFAULT_CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Hà Tĩnh', 'Đà Nẵng'];

const Index = ({ onSelectCity }) => {
    const [recentCitiesWeather, setRecentCitiesWeather] = useState([]);
    const { searchTerm } = useSearch();

    const getWeatherWithCache = async (city, signal) => {
        const cacheKey = `weather_${normalizeCityKey(city)}`;
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        const CACHE_DURATION = 3600000; // 1 giờ

        const isCacheValid = cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION;
        if (isCacheValid) return cachedData.data;

        try {
            const data = await fetchWeatherByCity(city, 'VN', { signal });
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
            return data;
        } catch (error) {
            if (isCacheValid) return cachedData.data;
            throw error;
        }
    };

    //Load ban đầu
    useEffect(() => {
        const controller = new AbortController();

        let stored = [];
        try {
            stored = JSON.parse(localStorage.getItem('recentCities')) || [];
        } catch {
            stored = [];
        }

        // Bổ sung nếu chưa đủ
        const citiesToUse = [...stored];
        for (const city of DEFAULT_CITIES) {
            if (citiesToUse.length >= 5) break;
            if (!citiesToUse.includes(city)) citiesToUse.push(city);
        }

        // Lưu lại localStorage
        localStorage.setItem('recentCities', JSON.stringify(citiesToUse));

        const loadAll = async () => {
            const results = await Promise.allSettled(
                citiesToUse.map(city => getWeatherWithCache(city, controller.signal))
            );
            const merged = results.map((res, index) => ({
                city: citiesToUse[index],
                weather: res.status === 'fulfilled' ? res.value : null,
            }));
            setRecentCitiesWeather(merged);
        };

        loadAll();
        return () => controller.abort();
    }, []);


    //Cập nhật khi searchTerm thay đổi
    useEffect(() => {
        if (!searchTerm?.trim()) return;

        const updateRecentCities = async () => {
            let stored = JSON.parse(localStorage.getItem('recentCities')) || [];

            // Di chuyển searchTerm lên đầu nếu đã có, hoặc thêm mới
            stored = [searchTerm, ...stored.filter(c => c !== searchTerm)];

            // Bổ sung thêm city phổ biến nếu thiếu
            for (const city of DEFAULT_CITIES) {
                if (stored.length >= 5) break;
                if (!stored.includes(city)) stored.push(city);
            }

            // Giữ đúng 6 thành phố
            const updated = stored.slice(0, 5);
            localStorage.setItem('recentCities', JSON.stringify(updated));

            try {
                const weather = await getWeatherWithCache(searchTerm);
                setRecentCitiesWeather(prev => {
                    const without = prev.filter(item => item.city !== searchTerm);
                    return [{ city: searchTerm, weather }, ...without].slice(0, 5);
                });
            } catch (err) {
                console.error('Không lấy được thời tiết thành phố vừa tìm:', err.message);
            }
        };

        updateRecentCities();
    }, [searchTerm]);
    
    return (
        <div className="col-span-2 row-span-3 gap-2 shadow-md rounded-lg p-4 bg-white dark:bg-slate-700 text-black dark:text-slate-100">
            <div className="col-span-2 text-[20px] font-bold">Xem Gần Đây</div>
            {recentCitiesWeather.map(({ city, weather }, index) => (
                <div
                    key={index}
                    onClick={() => onSelectCity(city)}
                    className="col-span-2 flex justify-between p-3 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                    <span className="text-[18px] font-bold">{weather?.cityInfo?.local_names?.vi || city}</span>
                    <span className='flex items-center'>
                        <WeatherIcon iconCode={weather?.current?.weather[0]?.icon} size={32} />
                        {weather ? `${(weather?.current?.temp).toFixed(1)}°C` : '--'}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default Index;
