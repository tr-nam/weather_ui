// import axios from 'axios';

// const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;
// const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// export const getAiAdvice = async (weather, aqi, activity = '', unit) => {
     
//     if (!weather || !weather.current || !weather.daily) {
//         return 'Không có dữ liệu thời tiết để tạo lời khuyên.';
//     }

//     const prompt = `Bạn là một chuyên gia thời tiết và sức khỏe cộng đồng. Dựa trên các dữ liệu sau:
//                     - Nhiệt độ: ${weather.current.temp}°${unit === 'metric' ? 'C' : 'F'}  
//                     - Độ ẩm: ${weather.current.humidity}%  
//                     - Xác suất mưa: ${(weather.daily[0].pop * 100).toFixed(0)}%  
//                     - Chỉ số chất lượng không khí (AQI): ${aqi.list[0].main.aqi} (AQI từ 1 đến 5, tương ứng với các mức: 1 - Tốt, 2 - Ổn, 3 - Ô nhiễm nhẹ, 4 - Ô nhiễm nặng, 5 - Nguy hiểm)  
//                     - Hoạt động người dùng dự định thực hiện: "${activity}" **Nếu hoạt động nhận được không phải là động từ hoặc là một câu điều kiện hãy bỏ qua nó và tiếp tục hoàn thành lời khuyên bỏ " **Lời khuyên:**"**
//                     Hãy phân tích các yếu tố thời tiết và chất lượng không khí trên, sau đó đưa ra **một lời khuyên ngắn gọn bằng tiếng Việt** (2–5 câu), giúp người dùng quyết định có nên thực hiện hoạt động đó hay không, và cần lưu ý gì để đảm bảo sức khỏe.  
//                     Lời khuyên cần thực tế, ngắn gọn, dễ hiểu và lời chúc nếu có hành động thì lời chúc liên quan đến hành động đó ở cuối cho đại đa số người dùng.`;
//     try {
//         const response = await axios.post(
//             `${GEMINI_ENDPOINT}?key=${GOOGLE_API_KEY}`,
//             { contents: [{ parts: [{ text: prompt }] }] },
//             { headers: { 'Content-Type': 'application/json' } }
//         );
//         return response.data.candidates[0].content.parts[0].text;
//     } catch (error) {
//         console.error('Lỗi khi gọi Gemini API:', error.message);
//         return generateLocalAdvice(weather, aqi, activity); // Fallback to local advice
//     }
// };

import axios from 'axios';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

/**
 * Generate AI-based weather advice using Google Gemini API with fallback to local advice
 * @param {Object} weather - Weather data from OpenWeatherMap
 * @param {Object} aqi - Air quality index data
 * @param {string} [activity] - User's planned activity
 * @param {string} unit - Unit system ('metric' or 'imperial')
 * @returns {Promise<string>} A single piece of advice
 */
export const getAiAdvice = async (weather, aqi, activity = '', unit = 'metric') => {
  if (!weather || !weather.current || !weather.daily || !aqi || !aqi.list || !aqi.list[0]) {
    return 'Không có dữ liệu thời tiết hoặc chất lượng không khí để tạo lời khuyên.';
  }

  const { current, daily } = weather;
  const today = daily[0];

  // Create cache key
  const cacheKey = `ai_advice_${current.temp}_${current.humidity}_${today.pop}_${activity}_${aqi.list[0].main.aqi}_${unit}`;
  const cachedData = JSON.parse(localStorage.getItem(cacheKey));
  const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    return cachedData.data;
  }

  // Check quota to avoid 429 errors
  const quotaKey = 'gemini_quota';
  const quotaData = JSON.parse(localStorage.getItem(quotaKey)) || { count: 0, timestamp: Date.now() };
  const QUOTA_LIMIT = 15; // Free tier limit for Gemini 1.5 Flash
  if (Date.now() - quotaData.timestamp > 60 * 1000) {
    quotaData.count = 0;
    quotaData.timestamp = Date.now();
  }
  if (quotaData.count >= QUOTA_LIMIT) {
    console.warn('Vượt giới hạn quota Gemini API, sử dụng local advice.');
    const localAdvice = generateLocalAdvice(weather, aqi, activity, unit);
    localStorage.setItem(cacheKey, JSON.stringify({ data: localAdvice, timestamp: Date.now() }));
    return localAdvice;
  }

  // Prepare prompt for Gemini API
  const prompt = `Bạn là một chuyên gia thời tiết và sức khỏe cộng đồng. Dựa trên các dữ liệu sau:
    - Nhiệt độ: ${current.temp}°${unit === 'metric' ? 'C' : 'F'}
    - Độ ẩm: ${current.humidity}%
    - Xác suất mưa: ${(today.pop * 100).toFixed(0)}%
    - Chỉ số chất lượng không khí (AQI): ${aqi.list[0].main.aqi} (AQI từ 1 đến 5, tương ứng với các mức: 1 - Tốt, 2 - Ổn, 3 - Ô nhiễm nhẹ, 4 - Ô nhiễm nặng, 5 - Nguy hiểm)
    - Hoạt động người dùng dự định thực hiện: "${activity}"
    **Nếu hoạt động nhận được không phải là động từ hoặc là một câu điều kiện hãy bỏ qua nó và tiếp tục hoàn thành lời khuyên bỏ " **Lời khuyên:**"**
    Hãy phân tích các yếu tố thời tiết và chất lượng không khí trên, sau đó đưa ra **một lời khuyên ngắn gọn bằng tiếng Việt** (2–5 câu), giúp người dùng quyết định có nên thực hiện hoạt động đó hay không, và cần lưu ý gì để đảm bảo sức khỏe.
    Lời khuyên cần thực tế, ngắn gọn, dễ hiểu và lời chúc nếu có hành động thì lời chúc liên quan đến hành động đó ở cuối cho đại đa số người dùng.`;

  // Try Gemini API with exponential backoff
  const maxRetries = 3;
  let retryCount = 0;
  let delay = 1000; // Initial delay in ms

  while (retryCount <= maxRetries) {
    try {
      if (!GOOGLE_API_KEY) {
        throw new Error('Google API key không được thiết lập.');
      }

      const response = await axios.post(
        `${GEMINI_ENDPOINT}?key=${GOOGLE_API_KEY}`,
        { contents: [{ parts: [{ text: prompt }] }] },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const advice = response.data.candidates[0].content.parts[0].text.trim();
      localStorage.setItem(cacheKey, JSON.stringify({ data: advice, timestamp: Date.now() }));
      quotaData.count += 1;
      localStorage.setItem(quotaKey, JSON.stringify(quotaData));
      return advice;
    } catch (error) {
      if (error.response?.status === 429 && retryCount < maxRetries) {
        console.warn(`Gemini API 429, retrying after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
        retryCount++;
        continue;
      }
      console.error('Lỗi khi gọi Gemini API:', error.message);
      const localAdvice = generateLocalAdvice(weather, aqi, activity, unit);
      localStorage.setItem(cacheKey, JSON.stringify({ data: localAdvice, timestamp: Date.now() }));
      return localAdvice;
    }
  }

  // Final fallback if retries fail
  const localAdvice = generateLocalAdvice(weather, aqi, activity, unit);
  localStorage.setItem(cacheKey, JSON.stringify({ data: localAdvice, timestamp: Date.now() }));
  return localAdvice;
};

/**
 * Generate local advice based on weather, AQI, and activity
 * @param {Object} weather - Weather data
 * @param {Object} aqi - AQI data
 * @param {string} activity - User's activity
 * @param {string} unit - Unit system ('metric' or 'imperial')
 * @returns {string} A single piece of advice
 */
const generateLocalAdvice = (weather, aqi, activity = '', unit = 'metric') => {
  const { current, daily } = weather;
  const today = daily[0];
  const aqiValue = aqi.list[0].main.aqi;
  const advice = [];

  // Convert temperature to Fahrenheit if imperial
  const temp = unit === 'metric' ? current.temp : (current.temp * 9) / 5 + 32;
  const unitSymbol = unit === 'metric' ? '°C' : '°F';

  // Temperature advice
  if (unit === 'metric') {
    if (temp < 15) advice.push(`Nhiệt độ ${temp}${unitSymbol} khá lạnh, hãy mặc áo ấm và giữ cơ thể khô ráo.`);
    else if (temp >= 15 && temp < 25) advice.push(`Nhiệt độ ${temp}${unitSymbol} dễ chịu, phù hợp cho hầu hết các hoạt động ngoài trời.`);
    else advice.push(`Nhiệt độ ${temp}${unitSymbol} nóng, mặc quần áo thoáng mát và uống đủ nước.`);
  } else {
    if (temp < 59) advice.push(`Nhiệt độ ${temp}${unitSymbol} lạnh, hãy mặc áo khoác và giữ ấm.`);
    else if (temp >= 59 && temp < 77) advice.push(`Nhiệt độ ${temp}${unitSymbol} mát mẻ, lý tưởng để ra ngoài.`);
    else advice.push(`Nhiệt độ ${temp}${unitSymbol} nóng, mặc nhẹ và tránh nắng gắt.`);
  }

  // Precipitation advice
  if (today.pop > 0.5) {
    advice.push(`Xác suất mưa ${(today.pop * 100).toFixed(0)}%, mang theo ô hoặc áo mưa để tránh ướt.`);
  }

  // AQI advice
  if (aqiValue >= 4) {
    advice.push('Chất lượng không khí nguy hiểm, nên ở trong nhà và đóng cửa sổ.');
  } else if (aqiValue === 3) {
    advice.push('Không khí ô nhiễm nhẹ, hạn chế thời gian ngoài trời, đặc biệt nếu bạn nhạy cảm.');
  } else {
    advice.push('Chất lượng không khí ổn, bạn có thể thoải mái hoạt động ngoài trời.');
  }

  // Activity advice (only if it's a verb-like activity)
  const isValidActivity = activity && /^[a-zA-Z\s]+$/.test(activity) && !activity.includes('?') && !activity.includes('nếu');
  if (isValidActivity) {
    const lowerActivity = activity.toLowerCase();
    if (lowerActivity.includes('đi bộ') || lowerActivity.includes('chạy bộ')) {
      if (today.pop > 0.5) {
        advice.push('Mang ô hoặc chọn lộ trình có mái che vì trời có thể mưa.');
      } else if (aqiValue >= 3) {
        advice.push('Không khí kém, cân nhắc tập trong nhà thay vì đi bộ hoặc chạy bộ.');
      } else {
        advice.push(`Thời tiết phù hợp để ${lowerActivity}, hãy tận hưởng!`);
      }
    } else {
      advice.push(`Dự định ${lowerActivity}? Hãy chuẩn bị theo thời tiết để có trải nghiệm tốt nhất.`);
    }
    // Add activity-related wish
    advice.push(`Chúc bạn có một buổi ${lowerActivity} vui vẻ!`);
  } else {
    // General wish if no valid activity
    advice.push('Chúc bạn có một ngày tuyệt vời!');
  }

  // Join advice into a concise paragraph
  return advice.slice(0, 5).join(' '); // Limit to 5 sentences
};