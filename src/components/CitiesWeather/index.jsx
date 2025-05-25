import { useState, useEffect, useContext } from 'react';
import { fetchWeatherByCity } from '@/api/weather';
import { normalizeCityKey } from '@/utils/normalizeCityKey';
import WeatherIcon from '@/components/WeatherIcon';
import { useSearch } from '@/context/SearchContext';
import { UnitContext } from '@/context/UnitContext';

const DEFAULT_CITIES = ['Hà Nội', 'Hồ Chí Minh', 'Hà Tĩnh', 'Đà Nẵng'];

const Index = ({ onSelectCity }) => {
    const { unit } = useContext(UnitContext);
    const [recentCitiesWeather, setRecentCitiesWeather] = useState([]);
    const { searchTerm } = useSearch();

    const getWeatherWithCache = async (city, signal) => {
        const cacheKey = `weather_${normalizeCityKey(city)}_${unit}`;
        const cachedData = JSON.parse(localStorage.getItem(cacheKey));
        const CACHE_DURATION = 3600000; // 1 giờ

        const isCacheValid = cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION;
        if (isCacheValid) return cachedData.data;

        try {
            const data = await fetchWeatherByCity({ city, unit }, { signal });
            localStorage.setItem(cacheKey, JSON.stringify({ data, timestamp: Date.now() }));
            return data;
        } catch (error) {
            if (isCacheValid) return cachedData.data;
            throw error;
        }
    };

    // Tải danh sách thành phố khi khởi tạo hoặc khi unit thay đổi, giữ nguyên recentCities
    useEffect(() => {
        const controller = new AbortController();

        // Lấy danh sách recentCities từ localStorage
        let storedCities = [];
        try {
            storedCities = JSON.parse(localStorage.getItem('recentCities')) || [];
        } catch {
            storedCities = [];
        }

        // Bổ sung DEFAULT_CITIES nếu danh sách chưa đủ, loại bỏ trùng lặp
        const citiesToUse = [...new Set([...storedCities, ...DEFAULT_CITIES])].slice(0, 5);

        // Chỉ cập nhật localStorage nếu storedCities rỗng
        if (!storedCities.length) {
            localStorage.setItem('recentCities', JSON.stringify(citiesToUse));
        }

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
    }, [unit]); // Chạy lại khi unit thay đổi

    // Cập nhật khi searchTerm thay đổi
    useEffect(() => {
        if (!searchTerm?.trim()) return;

        const controller = new AbortController();

        const updateRecentCities = async () => {
            let stored = JSON.parse(localStorage.getItem('recentCities')) || [];

            // Thêm searchTerm lên đầu, loại bỏ trùng lặp
            stored = [searchTerm, ...stored.filter(c => c !== searchTerm)];

            // Bổ sung DEFAULT_CITIES nếu cần
            const updatedCities = [...new Set([...stored, ...DEFAULT_CITIES])].slice(0, 5);
            localStorage.setItem('recentCities', JSON.stringify(updatedCities));

            try {
                const weather = await getWeatherWithCache(searchTerm, controller.signal);
                setRecentCitiesWeather(prev => {
                    const without = prev.filter(item => item.city !== searchTerm);
                    return [{ city: searchTerm, weather }, ...without].slice(0, 5);
                });
            } catch (err) {
                console.error('Không lấy được dữ liệu thời tiết cho thành phố vừa tìm:', err.message);
            }
        };

        updateRecentCities();
        return () => controller.abort();
    }, [searchTerm, unit]); // Chạy lại khi searchTerm hoặc unit thay đổi

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
                        {weather ? `${weather.current.temp.toFixed(1)}°${unit === 'metric' ? 'C' : 'F'}` : '--'}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default Index;