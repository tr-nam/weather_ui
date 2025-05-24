import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/3.0/';
const AIR_QUALITY_URL = 'https://api.openweathermap.org/data/2.5/';
const GEO_URL = 'https://api.openweathermap.org/geo/1.0/';

/**
 * Lấy tọa độ địa lý từ tên thành phố sử dụng OpenWeatherMap Geocoding API.
 * Nếu cung cấp mã quốc gia, kết quả sẽ được giới hạn chính xác hơn.
 *
 * @param {string} city - Tên thành phố cần tìm (ví dụ: "Hanoi")
 * @param {string} [countryCode] - Mã quốc gia ISO 3166 (ví dụ: "VN")
 * @returns {Promise<Object>} Trả về đối tượng chứa lat, lon, và thông tin địa phương
 * @throws {Error} Nếu không tìm thấy thành phố hoặc xảy ra lỗi API
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
        limit: 5, // Lấy kết quả đầu tiên
        appid: API_KEY,
      },
    });

    if (res.data.length === 0) {
      throw new Error(`Không tìm thấy thành phố: ${city}`);
    }
    return res.data;
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
 * Lấy thông tin thành phố gần nhất từ tọa độ địa lý sử dụng Geocoding API.
 *
 * @param {number} lat - Vĩ độ
 * @param {number} lon - Kinh độ
 * @returns {Promise<Object>} Thông tin thành phố (tên, quốc gia, v.v.)
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
 * Lấy thông tin chất lượng không khí từ tọa độ sử dụng OpenWeatherMap Air Pollution API.
 *
 * @param {{ lat: number, lon: number }} coords - Tọa độ cần kiểm tra
 * @param {Object} [options] - Các tùy chọn bổ sung cho Axios (ví dụ: AbortController)
 * @returns {Promise<Object>} Dữ liệu chỉ số chất lượng không khí (AQI, thành phần khí, v.v.)
 * @throws {Error} Nếu xảy ra lỗi trong quá trình lấy dữ liệu
 */
export const fetchAirQualityByCoord = async ({ lat, lon }, options = {}) => {
  if (!API_KEY) {
    throw new Error('API key không được thiết lập.');
  }
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error('Tọa độ không hợp lệ.');
  }

  try {
    const res = await axios.get(`${AIR_QUALITY_URL}air_pollution`, {
      params: {
        lat,
        lon,
        appid: API_KEY,
      },
      signal: options.signal,
    });

    // Trả về dữ liệu AQI và các chỉ số khí
    return res.data;
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
 * Lấy dữ liệu thời tiết chi tiết tại vị trí cụ thể bao gồm thông tin hiện tại, theo giờ, theo ngày, cảnh báo và kết hợp thêm thông tin thành phố + chất lượng không khí.
 *
 * @param {{ lat: number, lon: number }} coords - Tọa độ địa lý
 * @param {Object} [options] - Các tùy chọn bổ sung cho Axios (ví dụ: signal để hủy yêu cầu)
 * @returns {Promise<Object>} Dữ liệu thời tiết kết hợp với thông tin thành phố và chất lượng không khí
 * @throws {Error} Nếu có lỗi khi gọi API hoặc tọa độ không hợp lệ
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
    } catch (Error) {
      console.warn('Không thể lấy thông tin thành phố:', Error.message);
    }
    // Lấy thông tin chất lượng không khí
    let airPollution = null;
    try {
      airPollution = await fetchAirQualityByCoord({ lat: lat, lon: lon });
    } catch (Error) {
      console.warn('Không thể lấy chất lượng không khí:', Error.message);
    }
    return {
      ...res.data,
      cityInfo,
      airPollution
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
 * Lấy dữ liệu thời tiết dựa trên tên thành phố, tự động chuyển tên thành tọa độ trước khi gọi One Call API 3.0.
 *
 * @param {string} city - Tên thành phố (ví dụ: "Hanoi")
 * @param {Object} [options] - Các tùy chọn bổ sung cho Axios (ví dụ: signal để hủy yêu cầu)
 * @returns {Promise<Object>} Dữ liệu thời tiết đầy đủ (bao gồm cả thông tin thành phố và chất lượng không khí)
 * @throws {Error} Nếu không thể lấy được tọa độ hoặc dữ liệu thời tiết
 */
// export const fetchWeatherByCity = async (city, options = {}) => {
//   const cityInfo = await getCoordinatesByCity(city);
//   const { lat, lon } = cityInfo;

//   const weatherData = await fetchWeatherByCoord({ lat, lon }, options);
//   return { ...weatherData, cityInfo };
// };
export const fetchWeatherByCity = async (city, options = {}) => {
  const geoResults = await getCoordinatesByCity(city);
  const cityInfo = geoResults[0]; // Lấy kết quả đầu tiên

  if (!cityInfo || !cityInfo.lat || !cityInfo.lon) {
    throw new Error(`Không thể tìm thấy tọa độ cho thành phố: ${city}`);
  }

  const { lat, lon } = cityInfo;
  const weatherData = await fetchWeatherByCoord({ lat, lon }, options);
  return { ...weatherData, cityInfo };
};


/**
 * Chuẩn hóa tên thành phố để làm khóa lưu cache: viết thường, bỏ khoảng trắng.
 *
 * @param {string} city - Tên thành phố đầu vào
 * @returns {string} Tên chuẩn hóa để sử dụng làm key (ví dụ: "hanoi", "ho_chi_minh")
 */
export const normalizeCityKey = (city) => {
  return city.toLowerCase().trim().replace(/\s+/g, '_');
};

/**
 * Lấy tọa độ vị trí hiện tại của thiết bị thông qua trình duyệt.
 *
 * @returns {Promise<{ latitude: number, longitude: number }>} Tọa độ vị trí hiện tại
 * @throws {Error} Nếu không thể truy cập định vị hoặc bị từ chối quyền truy cập
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