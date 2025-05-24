import axios from 'axios';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_AI_API_KEY;
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

export const getAiAdvice = async (weather, aqi, activity = '') => {

    if (!weather || !weather.current || !weather.daily) {
        return 'Không có dữ liệu thời tiết để tạo lời khuyên.';
    }

    const prompt = `Bạn là một chuyên gia thời tiết và sức khỏe cộng đồng. Dựa trên các dữ liệu sau:
                    - Nhiệt độ: ${weather.current.temp}°C  
                    - Độ ẩm: ${weather.current.humidity}%  
                    - Xác suất mưa: ${(weather.daily[0].pop * 100).toFixed(0)}%  
                    - Chỉ số chất lượng không khí (AQI): ${aqi.list[0].main.aqi} (AQI từ 1 đến 5, tương ứng với các mức: 1 - Tốt, 2 - Ổn, 3 - Ô nhiễm nhẹ, 4 - Ô nhiễm nặng, 5 - Nguy hiểm)  
                    - Hoạt động người dùng dự định thực hiện: "${activity}" **Nếu hoạt động nhận được không phải là động từ hoặc là một câu điều kiện hãy bỏ qua nó và tiếp tục hoàn thành lời khuyên bỏ " **Lời khuyên:**"**
                    Hãy phân tích các yếu tố thời tiết và chất lượng không khí trên, sau đó đưa ra **một lời khuyên ngắn gọn bằng tiếng Việt** (2–5 câu), giúp người dùng quyết định có nên thực hiện hoạt động đó hay không, và cần lưu ý gì để đảm bảo sức khỏe.  
                    Lời khuyên cần thực tế, ngắn gọn, dễ hiểu và lời chúc nếu có hành động thì lời chúc liên quan đến hành động đó ở cuối cho đại đa số người dùng.`;
    try {
        const response = await axios.post(
            `${GEMINI_ENDPOINT}?key=${GOOGLE_API_KEY}`,
            { contents: [{ parts: [{ text: prompt }] }] },
            { headers: { 'Content-Type': 'application/json' } }
        );
        return response.data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error('Lỗi khi gọi Gemini API:', error.message);
        return generateLocalAdvice(weather, aqi, activity); // Fallback to local advice
    }
};