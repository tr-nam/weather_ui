import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/3.0/';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/';

/**
 * Tìm tọa độ từ tên thành phố sử dụng Geocoding API.
 * @param {string} city - Tên thành phố (ví dụ: "Hanoi")
 * @param {string} [countryCode] - Mã quốc gia (ví dụ: "VN") để thu hẹp kết quả
 * @returns {Promise<Object>} Tọa độ { lat, lon, local_names }
 * @throws {Error} Nếu không tìm thấy thành phố hoặc yêu cầu thất bại
 */
export const getCoordinatesByCity = async (city, countryCode = '') => {
  if (!API_KEY) {
    throw new Error('API key không được thiết lập.');
  }
  if (!city || typeof city !== 'string') {
    throw new Error('Tên thành phố không hợp lệ.');
  }

  try {
    const query = countryCode ? `${city},${countryCode}` : city;
    const res = await axios.get(`${GEO_URL}direct`, {
      params: {
        q: query,
        limit: 1, // Lấy kết quả đầu tiên
        appid: API_KEY,
      },
    });

    if (res.data.length === 0) {
      throw new Error(`Không tìm thấy thành phố: ${city}`);
    }
    return res.data[0];
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        throw new Error('API key không hợp lệ.');
      } else if (status === 429) {
        throw new Error('Vượt giới hạn API miễn phí.');
      } else {
        throw new Error(`Lỗi từ Geocoding API: ${data.message || 'Không xác định'}`);
      }
    }
    throw new Error(`Lỗi: ${error.message}`);
  }
};

/**
 * Lấy tên thành phố từ tọa độ sử dụng Geocoding API.
 * @param {number} lat - Vĩ độ
 * @param {number} lon - Kinh độ
 * @returns {Promise<Object>} Thông tin thành phố
 * @throws {Error} Nếu không tìm thấy thành phố hoặc yêu cầu thất bại
 */
export const getCityByCoord = async (lat, lon) => {
  if (!API_KEY) {
    throw new Error('API key không được thiết lập.');
  }
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('Tọa độ không hợp lệ.');
  }

  try {
    const res = await axios.get(`${GEO_URL}reverse`, {
      params: {
        lat,
        lon,
        limit: 1, // Lấy kết quả đầu tiên
        appid: API_KEY,
      },
    });

    if (res.data.length === 0) {
      throw new Error(`Không tìm thấy địa điểm tại tọa độ này`);
    }
    return res.data[0];
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        throw new Error('API key không hợp lệ.');
      } else if (status === 429) {
        throw new Error('Vượt giới hạn API miễn phí.');
      } else {
        throw new Error(`Lỗi từ Geocoding API: ${data.message || 'Không xác định'}`);
      }
    }
    throw new Error(`Lỗi: ${error.message}`);
  }
};

/**
 * Lấy dữ liệu thời tiết từ OpenWeatherMap One Call API 3.0 dựa trên tọa độ.
 * @param {Object} coords - Tọa độ địa lý
 * @param {number} coords.lat - Vĩ độ
 * @param {number} coords.lon - Kinh độ
 * @param {Object} [options] - Tùy chọn Axios (ví dụ: signal để hủy yêu cầu)
 * @returns {Promise<Object>} Dữ liệu thời tiết (current, minutely, hourly, daily, alerts)
 * @throws {Error} Nếu yêu cầu thất bại hoặc thiếu API key
 */
export const fetchWeatherByCoord = async ({ lat, lon }, options = {}) => {
  if (!API_KEY) {
    throw new Error('API key không được thiết lập.');
  }
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('Tọa độ không hợp lệ.');
  }

  try {
    // Lấy dữ liệu thời tiết
    const res = await axios.get(`${BASE_URL}onecall`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
        lang: 'vi',
        units: 'metric',
      },
      signal: options.signal,
    });
    
    // Lấy thông tin thành phố
    let cityInfo = null;
    try {
      cityInfo = await getCityByCoord(lat, lon);
    } catch (cityError) {
      console.warn('Không thể lấy thông tin thành phố:', cityError.message);
    }
    return { 
      ...res.data, 
      cityInfo 
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error;
    }
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        throw new Error('API key không hợp lệ.');
      } else if (status === 429) {
        throw new Error('Vượt giới hạn API miễn phí.');
      } else {
        throw new Error(`Lỗi từ API: ${data.message || 'Không xác định'}`);
      }
    }
    throw new Error(`Lỗi: ${error.message}`);
  }
};

/**
 * Lấy dữ liệu thời tiết từ tên thành phố.
 * @param {string} city - Tên thành phố (ví dụ: "Hanoi")
 * @param {Object} [options] - Tùy chọn Axios (ví dụ: signal để hủy yêu cầu)
 * @returns {Promise<Object>} Dữ liệu thời tiết (current, minutely, hourly, daily, alerts)
 * @throws {Error} Nếu không tìm thấy thành phố hoặc yêu cầu thất bại
 */
export const fetchWeatherByCity = async (city, options = {}) => {
  const cityInfo = await getCoordinatesByCity(city);
  const { lat, lon } = cityInfo;
  
  const weatherData = await fetchWeatherByCoord({ lat, lon }, options);
  return { ...weatherData, cityInfo };
};

/**
 * Chuẩn hóa khóa thành phố để sử dụng trong cache
 * @param {string} city - Tên thành phố
 * @returns {string} Khóa chuẩn hóa
 */
export const normalizeCityKey = (city) => {
  return city.toLowerCase().trim().replace(/\s+/g, '_');
};

/**
 * Lấy tọa độ thiết bị
 * @returns {Promise<Object>} Tọa độ { latitude, longitude }
 * @throws {Error} Nếu không thể lấy được vị trí
 */
export const getDeviceLocation = async () => {
  if (!('geolocation' in navigator)) {
    throw new Error('Trình duyệt không hỗ trợ định vị');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        resolve({ latitude, longitude });
      },
      (error) => {
        reject(new Error('Không thể lấy vị trí: ' + error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  });
};