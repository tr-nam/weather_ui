import { useState, useEffect, useCallback } from 'react';
import { Thermometer, Droplets, Wind, Umbrella, AlertTriangle, CloudRain, Sun, Moon } from 'lucide-react';
import { throttle } from 'lodash';
import { getAiAdvice } from '@/api/ai'; // Updated import
import { useContext } from 'react';
import { UnitContext } from '@/context/UnitContext';

/**
 * Component hiển thị lời khuyên hàng ngày dựa trên thời tiết, chất lượng không khí, và hoạt động người dùng
 * @param {Object} props
 * @param {Object} props.weather - Dữ liệu thời tiết từ API OpenWeatherMap
 * @param {Object} [props.aqi] - Dữ liệu chất lượng không khí (AQI)
 * @returns {JSX.Element}
 */
const DailyAdvice = ({ weather, aqi }) => {
  const [userActivity, setUserActivity] = useState('');
  const [aiAdvice, setAiAdvice] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { unit } = useContext(UnitContext);

  // Hàm xác định thời gian trong ngày
  const getTimeOfDay = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 20) return 'evening';
    return 'night';
  };

  // Hàm lấy lời khuyên với throttling
  const fetchAiAdvice = useCallback(
    throttle(async (weather, aqi, activity, unit) => {
      if (!weather || !weather.current || !weather.daily) return;
      setIsLoading(true);
      try {
        const advice = await getAiAdvice(weather, aqi, activity, unit);
        setAiAdvice([{ icon: AlertTriangle, text: advice }]);
      } catch (error) {
        console.error('Failed to fetch AI advice:', error.message);
        setAiAdvice(generateLocalAdvice());
      } finally {
        setIsLoading(false);
      }
    }, 5000), // Throttle 5 seconds
    []
  );

  // Gọi fetchAiAdvice khi weather, aqi, hoặc unit thay đổi
  useEffect(() => {
    fetchAiAdvice(weather, aqi, userActivity, unit);
  }, [weather, aqi, unit, fetchAiAdvice]);

  // Hàm tạo danh sách lời khuyên cục bộ (fallback)
  const generateLocalAdvice = () => {
    const adviceList = [];
    const timeOfDay = getTimeOfDay();

    if (!weather || !weather.current || !weather.daily) {
      return [{ icon: AlertTriangle, text: 'Không có dữ liệu thời tiết để đưa ra lời khuyên.' }];
    }

    const { current, daily } = weather;
    const today = daily[0];
    const temp = unit === 'metric' ? current.temp : (current.temp * 9) / 5 + 32;
    const unitSymbol = unit === 'metric' ? '°C' : '°F';

    // Time-based advice
    if (timeOfDay === 'morning') {
      adviceList.push({
        icon: Sun,
        text: 'Buổi sáng, hãy bắt đầu ngày mới với một bữa sáng lành mạnh!',
      });
    } else if (timeOfDay === 'afternoon') {
      adviceList.push({
        icon: Sun,
        text: 'Buổi chiều, tận hưởng thời gian ngoài trời nếu thời tiết cho phép.',
      });
    } else if (timeOfDay === 'evening') {
      adviceList.push({
        icon: Moon,
        text: 'Buổi tối, thư giãn và chuẩn bị cho một giấc ngủ ngon.',
      });
    } else {
      adviceList.push({
        icon: Moon,
        text: 'Buổi đêm, hạn chế ra ngoài nếu không cần thiết để giữ an toàn.',
      });
    }

    // Temperature advice
    if (unit === 'metric') {
      if (temp < 15) {
        adviceList.push({
          icon: Thermometer,
          text: `Nhiệt độ ${temp}${unitSymbol} khá lạnh, hãy mặc áo ấm và khăn choàng.`,
        });
      } else if (temp >= 15 && temp < 25) {
        adviceList.push({
          icon: Thermometer,
          text: `Nhiệt độ ${temp}${unitSymbol} dễ chịu, áo mỏng là lựa chọn tốt.`,
        });
      } else {
        adviceList.push({
          icon: Thermometer,
          text: `Nhiệt độ ${temp}${unitSymbol} nóng, mặc thoáng mát và uống nhiều nước.`,
        });
      }
    } else {
      if (temp < 59) {
        adviceList.push({
          icon: Thermometer,
          text: `Nhiệt độ ${temp}${unitSymbol} lạnh, hãy mặc áo khoác dày.`,
        });
      } else if (temp >= 59 && temp < 77) {
        adviceList.push({
          icon: Thermometer,
          text: `Nhiệt độ ${temp}${unitSymbol} mát mẻ, lý tưởng cho hoạt động ngoài trời.`,
        });
      } else {
        adviceList.push({
          icon: Thermometer,
          text: `Nhiệt độ ${temp}${unitSymbol} nóng, mặc nhẹ và tránh nắng gắt.`,
        });
      }
    }

    // Humidity advice
    if (current.humidity > 80) {
      adviceList.push({
        icon: Droplets,
        text: 'Độ ẩm cao, giữ cơ thể khô ráo và dùng máy hút ẩm nếu ở trong nhà.',
      });
    } else if (current.humidity < 30) {
      adviceList.push({
        icon: Droplets,
        text: 'Độ ẩm thấp, dùng kem dưỡng ẩm và uống đủ nước để tránh khô da.',
      });
    }

    // Precipitation advice
    if (today.pop && today.pop > 0.5) {
      adviceList.push({
        icon: Umbrella,
        text: `Xác suất mưa ${(today.pop * 100).toFixed(0)}%, mang ô hoặc áo mưa khi ra ngoài.`,
      });
    }

    // Wind advice
    if (current.wind_speed * 3.6 > 30) {
      adviceList.push({
        icon: Wind,
        text: 'Gió mạnh, cẩn thận khi di chuyển và tránh khu vực có vật dễ rơi.',
      });
    }

    // AQI advice (aligned with OpenWeatherMap 1-5 scale)
    if (aqi && aqi.list && aqi.list[0] && aqi.list[0].main) {
      const aqiValue = aqi.list[0].main.aqi;
      if (aqiValue >= 4) {
        adviceList.push({
          icon: AlertTriangle,
          text: 'Chất lượng không khí nguy hiểm, ở trong nhà và đóng cửa sổ.',
        });
      } else if (aqiValue === 3) {
        adviceList.push({
          icon: AlertTriangle,
          text: 'Không khí ô nhiễm nhẹ, hạn chế thời gian ngoài trời nếu bạn nhạy cảm.',
        });
      } else {
        adviceList.push({
          icon: AlertTriangle,
          text: 'Chất lượng không khí tốt, phù hợp cho các hoạt động ngoài trời.',
        });
      }
    }

    // Activity advice
    const isValidActivity = userActivity && /^[a-zA-Z\s]+$/.test(userActivity) && !userActivity.includes('?') && !userActivity.includes('nếu');
    if (isValidActivity) {
      const lowerActivity = userActivity.toLowerCase();
      if (lowerActivity.includes('đi bộ') || lowerActivity.includes('chạy bộ')) {
        if (today.pop && today.pop > 0.5) {
          adviceList.push({
            icon: CloudRain,
            text: `Bạn định ${lowerActivity}? Mang ô hoặc chọn lộ trình có mái che vì trời có thể mưa.`,
          });
        } else if (aqi && aqi.list[0].main.aqi >= 3) {
          adviceList.push({
            icon: AlertTriangle,
            text: `Không khí kém, cân nhắc tập trong nhà thay vì ${lowerActivity}.`,
          });
        } else if (temp > (unit === 'metric' ? 30 : 86)) {
          adviceList.push({
            icon: Thermometer,
            text: `Trời nóng, hãy ${lowerActivity} vào sáng sớm hoặc tối muộn và mang nước.`,
          });
        } else {
          adviceList.push({
            icon: Sun,
            text: `Thời tiết lý tưởng để ${lowerActivity}, tận hưởng không khí trong lành!`,
          });
        }
      }
      // Add activity-related wish
      adviceList.push({
        icon: Sun,
        text: `Chúc bạn có một buổi ${lowerActivity} vui vẻ!`,
      });
    } else {
      adviceList.push({
        icon: Sun,
        text: 'Chúc bạn có một ngày tuyệt vời!',
      });
    }

    return adviceList.slice(0, 5); // Limit to 5 advice items
  };

  // Xử lý nhập hoạt động của người dùng
  const handleActivitySubmit = async (e) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      const advice = await getAiAdvice(weather, aqi, userActivity, unit);
      setAiAdvice([{ icon: AlertTriangle, text: advice }]);
    } catch (error) {
      console.error('Failed to fetch AI advice on submit:', error.message);
      setAiAdvice(generateLocalAdvice());
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="shadow-md rounded-lg p-4 bg-white dark:bg-slate-700 text-black dark:text-slate-100">
      <h2 className="text-xl font-bold mb-4">Lời Khuyên Hôm Nay</h2>
      <form onSubmit={handleActivitySubmit} className="mb-4 flex items-center gap-2">
        <div className="relative w-full flex items-center">
          <input
            type="text"
            value={userActivity}
            onChange={(e) => setUserActivity(e.target.value)}
            placeholder="Hoạt động hôm nay của bạn? (VD: Chơi thể thao, Đi làm)"
            className="border border-gray-300 rounded-lg p-2 w-full dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
          {userActivity && (
            <button
              type="button"
              onClick={() => setUserActivity('')}
              className="absolute right-2 text-black dark:text-white font-bold bg-transparent p-2"
            >
              x
            </button>
          )}
        </div>
        <button
          type="submit"
          className="bg-blue-300 text-white text-[0.9rem] text-nowrap rounded-lg px-4 py-2.5 hover:bg-blue-400 dark:bg-blue-500 dark:hover:bg-blue-600"
          disabled={isLoading}
        >
          {isLoading ? 'Đang tải...' : 'Nhận lời khuyên'}
        </button>
      </form>
      <div className="p-3 rounded-md bg-blue-100/60 dark:bg-gray-400/50">
        {aiAdvice ? (
          <div className="pb-2 font-semibold text-[1rem]">Lời khuyên từ AI</div>
        ) : (
          <div className="py-2 font-semibold text-[1rem]">Lời khuyên từ hệ thống</div>
        )}
        <ul className="space-y-3">
          {isLoading ? (
            <li>Đang tạo lời khuyên...</li>
          ) : (
            (aiAdvice || generateLocalAdvice()).map((advice, index) => (
              <li key={index} className="flex items-center gap-3">
                <span>{advice.text}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};

export default DailyAdvice;




// import { useState, useEffect } from 'react';
// import { Thermometer, Droplets, Wind, Umbrella, AlertTriangle, CloudRain, Sun, Moon } from 'lucide-react';
// import { getAiAdvice } from '@/api/ai';
// import { useContext } from 'react';
// import { UnitContext } from '@/context/UnitContext';


// /**
//  * Component hiển thị lời khuyên hàng ngày dựa trên thời tiết, chất lượng không khí, và hoạt động người dùng
//  * @param {Object} props
//  * @param {Object} props.weather - Dữ liệu thời tiết từ API OpenWeatherMap
//  * @param {Object} [props.aqi] - Dữ liệu chất lượng không khí (AQI)
//  * @returns {JSX.Element}
//  */
// const DailyAdvice = ({ weather, aqi }) => {
//     const [userActivity, setUserActivity] = useState('');
//     const [aiAdvice, setAiAdvice] = useState(null);
//     const [isLoading, setIsLoading] = useState(false);
//     const { unit } = useContext(UnitContext);


//     // Hàm xác định thời gian trong ngày
//     const getTimeOfDay = () => {
//         const now = new Date();
//         const hour = now.getHours();
//         if (hour >= 5 && hour < 12) return 'morning';
//         if (hour >= 12 && hour < 17) return 'afternoon';
//         if (hour >= 17 && hour < 20) return 'evening';
//         return 'night';
//     };

//     // Lấy lời khuyên từ AI khi weather hoặc aqi thay đổi
//     useEffect(() => {
//         const fetchAiAdvice = async () => {
//             if (!weather || !weather.current || !weather.daily) return;
//             setIsLoading(true);
//             try {
//                 const advice = await getAiAdvice(weather, aqi, userActivity, unit);
//                 setAiAdvice([{ icon: AlertTriangle, text: advice }]);
//             } catch (error) {
//                 console.error('Failed to fetch AI advice:', error.message);
//                 setAiAdvice(generateLocalAdvice());
//             } finally {
//                 setIsLoading(false);
//             }
//         };
//         fetchAiAdvice();
//     }, [weather, aqi,userActivity, unit]);

//     // Hàm tạo danh sách lời khuyên cục bộ (fallback)
//     const generateLocalAdvice = () => {
//         const adviceList = [];
//         const timeOfDay = getTimeOfDay();

//         if (!weather || !weather.current || !weather.daily) {
//             return [{ icon: AlertTriangle, text: 'Không có dữ liệu thời tiết để đưa ra lời khuyên.' }];
//         }

//         const { current, daily } = weather;
//         const today = daily[0];

//         if (timeOfDay === 'morning') {
//             adviceList.push({
//                 icon: Sun,
//                 text: 'Buổi sáng, hãy bắt đầu ngày mới với một bữa sáng lành mạnh!',
//             });
//         } else if (timeOfDay === 'night') {
//             adviceList.push({
//                 icon: Moon,
//                 text: 'Buổi tối, hạn chế ra ngoài nếu không cần thiết để giữ an toàn.',
//             });
//         }

//         if (current.temp < 15) {
//             adviceList.push({
//                 icon: Thermometer,
//                 text: 'Trời lạnh, hãy mặc áo ấm, khăn choàng, và mang găng tay.',
//             });
//         } else if (current.temp >= 15 && current.temp < 25) {
//             adviceList.push({
//                 icon: Thermometer,
//                 text: 'Nhiệt độ dễ chịu, áo mỏng hoặc áo dài tay là lựa chọn tốt.',
//             });
//         } else {
//             adviceList.push({
//                 icon: Thermometer,
//                 text: 'Trời nóng, mặc quần áo thoáng mát, đội mũ và uống nhiều nước.',
//             });
//         }

//         if (current.humidity > 80) {
//             adviceList.push({
//                 icon: Droplets,
//                 text: 'Độ ẩm cao, hãy giữ cơ thể khô ráo và sử dụng máy hút ẩm nếu ở trong nhà.',
//             });
//         } else if (current.humidity < 30) {
//             adviceList.push({
//                 icon: Droplets,
//                 text: 'Độ ẩm thấp, sử dụng kem dưỡng ẩm và uống đủ nước để tránh khô da.',
//             });
//         }

//         if (today.pop && today.pop > 0.5) {
//             adviceList.push({
//                 icon: Umbrella,
//                 text: `Xác suất mưa ${(today.pop * 100).toFixed(0)}%, nhớ mang ô hoặc áo mưa khi ra ngoài.`,
//             });
//         }

//         if (current.wind_speed * 3.6 > 30) {
//             adviceList.push({
//                 icon: Wind,
//                 text: 'Gió mạnh, cẩn thận khi di chuyển và tránh các khu vực có vật dễ rơi.',
//             });
//         }

//         if (aqi) {
//             const aqiValue = aqi.value || 0;
//             if (aqiValue > 100 && aqiValue <= 150) {
//                 adviceList.push({
//                     icon: AlertTriangle,
//                     text: 'Chất lượng không khí trung bình, người nhạy cảm nên hạn chế hoạt động ngoài trời.',
//                 });
//             } else if (aqiValue > 150) {
//                 adviceList.push({
//                     icon: AlertTriangle,
//                     text: 'Chất lượng không khí kém, nên ở trong nhà và đeo khẩu trang N95 nếu phải ra ngoài.',
//                 });
//             } else {
//                 adviceList.push({
//                     icon: AlertTriangle,
//                     text: 'Chất lượng không khí tốt, phù hợp cho các hoạt động ngoài trời.',
//                 });
//             }
//         }

//         if (userActivity) {
//             if (userActivity.toLowerCase().includes('đi bộ') || userActivity.toLowerCase().includes('chạy bộ')) {
//                 if (today.pop && today.pop > 0.5) {
//                     adviceList.push({
//                         icon: CloudRain,
//                         text: 'Bạn định đi bộ/chạy bộ? Mang ô hoặc chọn lộ trình có mái che vì trời có thể mưa.',
//                     });
//                 } else if (aqi && aqi.value > 100) {
//                     adviceList.push({
//                         icon: AlertTriangle,
//                         text: 'Chất lượng không khí không tốt, cân nhắc tập thể dục trong nhà thay vì đi bộ/chạy bộ.',
//                     });
//                 } else if (current.temp > 30) {
//                     adviceList.push({
//                         icon: Thermometer,
//                         text: 'Trời nóng, hãy đi bộ/chạy bộ vào sáng sớm hoặc tối muộn và mang theo nước.',
//                     });
//                 } else {
//                     adviceList.push({
//                         icon: Sun,
//                         text: 'Thời tiết lý tưởng để đi bộ/chạy bộ, tận hưởng không khí trong lành!',
//                     });
//                 }
//             }
//         }

//         return adviceList;
//     };

//     // Xử lý nhập hoạt động của người dùng
//     const handleActivitySubmit = async (e) => {
//         e.preventDefault();
//         setIsLoading(true);
//         try {
//             const advice = await getAiAdvice(weather, aqi, userActivity, unit);
//             setAiAdvice([{ icon: AlertTriangle, text: advice }]);
//         } catch (error) {
//             console.error('Failed to fetch AI advice on submit:', error.message);
//             setAiAdvice(generateLocalAdvice());
//         } finally {
//             setIsLoading(false);
//         }
//     };

//     return (
//         <div className="shadow-md  rounded-lg p-4 bg-white dark:bg-slate-700 text-black dark:text-slate-100">
//             <h2 className="text-xl font-bold mb-4">Lời Khuyên Hôm Nay</h2>
//             <form onSubmit={handleActivitySubmit} className="mb-4 flex items-center gap-2">
//                 <div className="relative w-full flex items-center">
//                     <input
//                         type="text"
//                         value={userActivity}
//                         onChange={(e) => setUserActivity(e.target.value)}
//                         placeholder="Hoạt động hôm nay của bạn? (VD: Chơi thể thao, Đi làm)"
//                         className="border border-gray-300 rounded-lg p-2 w-full"
//                     />
//                     {userActivity && (
//                         <button
//                             type="button"
//                             onClick={() => setUserActivity('')}
//                             className="absolute right-2 'text-black dark:text-white font-bold bg-transparent p-2"
//                         >
//                             x
//                         </button>
//                     )}
//                 </div>
//                 <button
//                     type="submit"
//                     className="bg-blue-300 text-white text-[0.9rem] text-nowrap rounded-lg px-4 py-2.5 hover:bg-blue-400"
//                     disabled={isLoading}
//                 >
//                     {isLoading ? 'Đang tải...' : 'Nhận lời khuyên'}
//                 </button>
//             </form>
//             <div className=' p-3 rounded-md bg-blue-100/60 dark:bg-gray-400/50'>
//                 {aiAdvice ? <div className='pb-2 font-semibold text-[1rem]'>Lời khuyên từ AI</div> : <div className='py-2 font-semibold text-[1rem]'>Lời khuyên từ hệ thống</div>}
//                 <ul className="space-y-3">
//                     {isLoading ? (
//                         <li>Đang tạo lời khuyên...</li>
//                     ) : (
//                         (aiAdvice || generateLocalAdvice()).map((advice, index) => (
//                             <li key={index} className="flex items-center gap-3">
//                                 <span>{advice.text}</span>
//                             </li>
//                         ))
//                     )}
//                 </ul>
//             </div>
//         </div>
//     );
// };

// export default DailyAdvice;