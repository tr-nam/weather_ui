import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/3.0/';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/';

/**
 * Tìm tọa độ từ tên thành phố sử dụng Geocoding API.
 * @param {string} city - Tên thành phố (ví dụ: "Hanoi")
 * @param {string} [countryCode] - Mã quốc gia (ví dụ: "VN") để thu hẹp kết quả
 * @returns {Promise<Object>} Tọa độ { lat, lon }
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
 * Lấy dữ liệu thời tiết từ OpenWeatherMap One Call API 3.0 dựa trên tọa độ.
 * @param {Object} coords - Tọa độ địa lý
 * @param {number} coords.lat - Vĩ độ
 * @param {number} coords.lon - Kinh độ
 * @param {Object} [options] - Tùy chọn Axios (ví dụ: signal để hủy yêu cầu)
 * @returns {Promise<Object>} Dữ liệu thời tiết (current, minutely, hourly, daily, alerts)
 * @throws {Error} Nếu yêu cầu thất bại hoặc thiếu API key
 */
export const fetchWeatherByCoord = async ({local_names, lat, lon }, options = {}) => {
  if (!API_KEY) {
    throw new Error('API key không được thiết lập.');
  }
  if (typeof lat !== 'number' || typeof lon !== 'number' || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('Tọa độ không hợp lệ.');
  }

  try {
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
    return {...res.data, local_names};
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
 * @param {string} [countryCode] - Mã quốc gia (ví dụ: "VN")
 * @returns {Promise<Object>} Dữ liệu thời tiết (current, minutely, hourly, daily, alerts)
 * @throws {Error} Nếu không tìm thấy thành phố hoặc yêu cầu thất bại
 */
export const fetchWeatherByCity = async (city, countryCode = '') => {
  const coords = await getCoordinatesByCity(city, countryCode);
  return fetchWeatherByCoord(coords);
};