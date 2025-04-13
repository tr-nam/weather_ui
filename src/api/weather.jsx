// src/api/weather.js
import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5/';

export const fetchWeatherByCity = async (city) => {
  try {
    const res = await axios.get(`${BASE_URL}weather`, {
      params: {
        q: city,
        appid: API_KEY,
        units: 'metric',
        lang: 'vi',
      },
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};
