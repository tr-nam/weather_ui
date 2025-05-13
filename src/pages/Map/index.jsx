import {useEffect, useState} from 'react'
import WeatherMap from '@/components/WeatherMap'
import { getDeviceLocation } from '@/api/weather.jsx'

const Map = () => {
  const [location, setLocation] = useState({latitude: 0, longitude: 0});
  const [error, setError] = useState(null)
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const loc = await getDeviceLocation();
        setLocation(loc);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchLocation();
  }, []);

  
  return (
    <WeatherMap cityCoordinates = {[location.latitude, location.longitude]}/>
  )
}

export default Map