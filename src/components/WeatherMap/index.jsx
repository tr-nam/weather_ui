import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';



const WeatherMap = ({ cityCoordinates = [21.0285, 105.8542] }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const API_KEY = import.meta.env.VITE_WEATHER_API_KEY; // OpenWeatherMap API key
  const MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY; // Mapbox Access Token


  const weatherLayers = {
    precipitation_new: 'Lượng Mưa',
    clouds_new: 'Mây',
    temp_new: 'Nhiệt Độ',
    wind_new: 'Tốc Độ Gió',
  }

  const [activeLayer, setActiveLayer] = useState('precipitation_new');


  // URL cho Weather Maps 1.0 (lớp lượng mưa)
  const weatherLayerUrl = `https://tile.openweathermap.org/map/${activeLayer}/{z}/{x}/{y}.png?appid=${API_KEY}`;

  useEffect(() => {
    if (!MAPBOX_API_KEY) {
      console.error('Mapbox API key is missing');
      return;
    }

    // Khởi tạo Mapbox
    mapboxgl.accessToken = MAPBOX_API_KEY;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Giao diện bản đồ
      center: [cityCoordinates[1], cityCoordinates[0]], // [lng, lat]
      zoom: 8.5,
    });

    // Khi bản đồ tải xong, thêm lớp thời tiết
    map.current.on('load', () => {
      map.current.addSource('weather', {
        type: 'raster',
        tiles: [weatherLayerUrl],
        tileSize: 256,
      });

      map.current.addLayer({
        id: 'weather-layer',
        type: 'raster',
        source: 'weather',
        paint: {
          'raster-opacity': 0.9, // Độ trong suốt
        },
      });
    });

    // Cập nhật trung tâm bản đồ khi tọa độ thay đổi
    map.current.setCenter([cityCoordinates[1], cityCoordinates[0]]);

    // Dọn dẹp khi component unmount
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [cityCoordinates, API_KEY, MAPBOX_API_KEY, weatherLayerUrl]);



  return (
    <div className="relative w-full h-screen" style={{ height: '90vh', width: '100%' }}>
      <div
        ref={mapContainer}
        className="relative w-full h-full"
        style={{ height: '100%', width: '100%' }}
      />
      <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded-md shadow text-black">
        <select
          id="layer-select"
          value={activeLayer}
          onChange={(e) => setActiveLayer(e.target.value)}
          className="rounded focus-visible:outline-none"
        >
          {Object.entries(weatherLayers).map(([key, name]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
      </div>
      <div className="absolute bottom-0 right-0 z-10 bg-white px-6 py-1 rounded-md shadow text-black">
        <div className="flex items-center gap-2 text-sm"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-map-pin h-4 w-4 text-primary" >
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0">
          </path><circle cx="12" cy="10" r="3"></circle>
        </svg>
          <span className="font-medium">Vị trí hiện tại:</span>
          <span>Hồ Chí Minh, Việt Nam</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherMap;
