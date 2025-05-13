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
    wind_new: 'Tóc Độ Gió',
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
      <div className="absolute top-4 right-4 z-10 bg-white p-2 rounded shadow text-black">
        <select
          id="layer-select"
          value={activeLayer}
          onChange={(e) => setActiveLayer(e.target.value)}
          className="p-1 rounded focus-visible:outline-none"
        >
          {Object.entries(weatherLayers).map(([key, name]) => (
            <option key={key} value={key}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default WeatherMap;
