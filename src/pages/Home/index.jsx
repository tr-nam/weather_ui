import { useState, useEffect } from 'react';
import {
  ThermometerSun,
  Wind,
  Droplets,
  Sunrise,
  Sunset,
} from 'lucide-react';
import clsx from 'clsx';
import style from './style.module.css';
import { formatTime } from '@/utils/timeUtils';
import { formattedDate } from '@/utils/formattedDate';
import { getWeekdayName } from '@/utils/dayUtils';
import { normalizeCityKey } from '@/utils/normalizeCityKey';
import { fetchWeatherByCity, fetchWeatherByCoord, getDeviceLocation } from '@/api/weather';
import WeatherIcon from '@/components/WeatherIcon';
import SunTimeChart from '@/components/SunTimeChart';
import CitiesWeather from '@/components/CitiesWeather';
import TemperatureSlider from '@/components/TemperatureSlider';
import WeatherBanner from '@/components/WeatherBanner';
import AirPollution from '@/components/AirPollution';
import AiAdvice from '@/components/AiAdvice';

const Home = () => {
  const [city, setCity] = useState('');
  const [coord, setCoord] = useState(null);
  const [weather, setWeather] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isMinuteZero, setIsMinuteZero] = useState(false);

  // Kiểm tra xem có phải là đầu giờ (phút 00) không
  useEffect(() => {
    const checkMinute = () => {
      const now = new Date();
      setIsMinuteZero(now.getMinutes() === 0);
    };

    checkMinute();
    const intervalId = setInterval(checkMinute, 60000);
    return () => clearInterval(intervalId);
  }, []);

  // Lấy vị trí thiết bị khi component mount
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const location = await getDeviceLocation();
        setCoord(location);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchLocation();
  }, []);

  // Fetch dữ liệu thời tiết khi city, coord hoặc isMinuteZero thay đổi
  useEffect(() => {
    const controller = new AbortController();

    const fetchWeatherData = async () => {
      if (!city && !coord) return;

      const dataSource = city
        ? { type: 'city', value: city }
        : { type: 'coord', value: { lat: coord.latitude, lon: coord.longitude } };

      const cacheKey = dataSource.type === 'city'
        ? `weather_${normalizeCityKey(city)}`
        : `weather_coord_${dataSource.value.lat.toFixed(3)}_${dataSource.value.lon.toFixed(3)}`;

      const cachedData = localStorage.getItem(cacheKey)
        ? JSON.parse(localStorage.getItem(cacheKey))
        : null;
      const CACHE_DURATION = 3600000; // 1 giờ

      if (
        cachedData &&
        Date.now() - cachedData.timestamp < CACHE_DURATION &&
        !isMinuteZero
      ) {
        setWeather(cachedData.data);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        let weatherData;

        if (dataSource.type === 'city') {
          weatherData = await fetchWeatherByCity(dataSource.value, {
            signal: controller.signal,
          });
        } else {
          weatherData = await fetchWeatherByCoord(dataSource.value, {
            signal: controller.signal,
          });
        }

        setWeather(weatherData);
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ data: weatherData, timestamp: Date.now() })
        );
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('API request cancelled.');
          return;
        }
        setError(error.message);
        console.error('Error fetching weather data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWeatherData();

    return () => {
      controller.abort();
    };
  }, [city, coord, isMinuteZero]);

  // Hàm xử lý thay đổi city từ input
  const handleCityChange = (e) => {
    setCity(e.target.value);
  };

  // Hàm xử lý chọn thành phố từ CitiesWeather
  const handleSelectCity = (selectedCity) => {
    setCity(selectedCity);
  };

  return (
    <div className="container mx-auto h-full">
      <section className={clsx(style.banner, 'w-full py-2.5')}>
        {weather && (
          <div
            className="h-90 flex justify-center items-center text-amber-500 shadow-md rounded-lg relative">
            <WeatherBanner
              weatherCondition={weather.current.weather[0].main.toLowerCase()}
              precipitationProbability={weather.current.clouds || 0}
              timeOfDay={'auto'}
            />
          </div>
        )}
      </section>
      <section className={clsx(style.content)}>

        {isLoading && (
          <div className="text-center">
            <p>Đang tải dữ liệu thời tiết...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p>Lỗi: {error}</p>
          </div>
        )}

        <div className="grid grid-cols-5 grid-rows-5 gap-4">
          <div className="col-span-3 row-span-5 mb-24">
            <div className="grid grid-cols-5 grid-rows-1 gap-4">
              {/* Main weather info */}
              <div className="col-span-5 row-span-2 shadow-md bg-white rounded-lg text-black p-4 py-6">
                {weather && (
                  <>
                    <p className='font-light text-gray-400'>Cập Nhật Lần Cuối: {formatTime(weather.current.dt)} - {formattedDate}</p>
                    <div className='flex items-center justify-between'>
                      <h2 className="text-3xl font-bold">
                        {weather.cityInfo?.local_names?.vi || weather.cityInfo?.name || 'Unknown Location'}
                      </h2>
                      <p className="flex flex-col items-center pe-5 capitalize font-semibold"><WeatherIcon iconCode={weather.current.weather[0].icon} size={120} /> {weather.current.weather[0].description}</p>
                    </div>
                    <div className='flex items-end gap-3 pb-2'>
                      <p className="text-4xl font-bold"> {weather.current.temp.toFixed(1)}°C</p>
                      <p className='text-gray-400'>C: {weather.daily[0].temp.max.toFixed(1)}° T: {weather.daily[0].temp.min.toFixed(1)}°</p>
                    </div>
                  </>
                )}
              </div>
              {/* Feels like */}
              <div className="row-start-3 shadow-md bg-white rounded-lg p-4 text-center">
                <ThermometerSun className="text-amber-400 w-full" />
                {weather && (
                  <div className="text-black">
                    <p>Cảm Giác Như</p>
                    <h2 className="text-2xl font-bold">{weather.current.feels_like.toFixed(1)}°C</h2>
                  </div>
                )}
              </div>
              {/* Wind */}
              <div className="row-start-3 shadow-md bg-white rounded-lg p-4 text-center">
                <Wind className="text-blue-400 w-full" />
                {weather && (
                  <div className="text-black">
                    <p>Gió</p>
                    <h2 className="text-2xl font-bold">{(weather.current.wind_speed * 3.6).toFixed(1)} km/h</h2>
                  </div>
                )}
              </div>
              {/* Humidity */}
              <div className="row-start-3 shadow-md bg-white rounded-lg p-4 text-center">
                <Droplets className="text-amber-400 w-full" />
                {weather && (
                  <div className="text-black">
                    <p>Độ Ẩm</p>
                    <h2 className="text-2xl font-bold">{weather.current.humidity}%</h2>
                  </div>
                )}
              </div>
              {/* Sunrise, Sunset */}
              <div className="row-start-3 col-span-2 shadow-md bg-white rounded-lg p-4 text-center">
                {weather && (
                  <div className="text-black flex justify-between h-full relative">
                    <span className="mt-auto ml-3">
                      <Sunrise className="text-amber-300 w-full" />
                      <p className="font-bold">{formatTime(weather.current.sunrise)}</p>
                    </span>
                    <SunTimeChart
                      className="absolute w-full flex justify-center"
                      sunrise={weather.current.sunrise}
                      sunset={weather.current.sunset}
                    />
                    <span className="mt-auto mr-3">
                      <Sunset className="text-amber-300 w-full" />
                      <p className="font-bold">{formatTime(weather.current.sunset)}</p>
                    </span>
                  </div>
                )}
              </div>
              {/* Hourly Forecast */}
              <div className="col-span-5 row-span-1 row-start-4 shadow-md bg-white rounded-lg p-4">
                <div className="grid grid-cols-9 grid-rows-3 gap-2 text-black">
                  <div className="col-span-9 text-[20px] font-bold">
                    Dự báo theo giờ
                  </div>
                  {weather?.hourly?.slice(0, 10).map((element, index) => (
                    <div
                      key={index}
                      className="row-span-2 row-start-2 flex flex-col items-center justify-between px-2 py-4 rounded-lg hover:shadow-md hover:-translate-y-1"
                    >
                      <span>
                        {new Date(element.dt * 1000).getHours() === new Date().getHours()
                          ? 'Bây Giờ'
                          : formatTime(element.dt)}
                      </span>
                      <WeatherIcon iconCode={element.weather[0].icon} size={64} />
                      <span className="font-medium">
                        {element.temp.toFixed(1)}°C
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Daily Forecast */}
              <div className="col-span-5 row-span-1 row-start-5 shadow-md bg-white rounded-lg p-4">
                <div className="grid grid-cols-3 grid-rows-8 gap-1 text-black">
                  <div className="col-span-5 text-[20px] font-bold">
                    7 Ngày Tới
                  </div>
                  {weather?.daily?.slice(0, 7).map((element, index) => (
                    <div key={index} className="col-span-5 px-2.5">
                      <div className="grid grid-cols-3 grid-rows-1 min-h-14">
                        <div className="flex items-center justify-start">
                          {new Date(element.dt * 1000).getDay() === new Date().getDay()
                            ? 'Hôm Nay'
                            : getWeekdayName(element.dt)}
                        </div>
                        <div className="flex items-center justify-start">
                          <WeatherIcon iconCode={element.weather[0].icon} size={62} />
                          {element.pop && `${(element.pop * 100).toFixed(0)}%`}
                        </div>
                        <div className="grid grid-cols-3 items-center w-full gap-2">
                          <div className="text-center font-bold text-sm">T: {element.temp.min.toFixed(1)}°</div>
                          <TemperatureSlider
                            min={element.temp.min}
                            max={element.temp.max}
                            value={element.temp.day}
                          />
                          <div className="text-center font-bold text-sm">C: {element.temp.max.toFixed(1)}°</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="col-span-2 row-span-5 col-start-4">
            <div className="grid grid-cols-2 grid-rows-3 gap-4">
              <CitiesWeather onSelectCity={handleSelectCity} />
              <div className="col-span-2 row-span-2 row-start-4 shadow-md bg-white rounded-lg">
                {weather && <AirPollution airPollution={weather.airPollution}/>}
              </div>
              <div className="col-span-2 row-span-2 row-start-6 shadow-md bg-white rounded-lg">
                {weather && <AiAdvice weather={weather} aqi={weather.airPollution}/>}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;