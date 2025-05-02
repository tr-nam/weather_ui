import { getAnimatedIconUrl } from '@/utils/iconAnimatedUtils';

const WeatherIcon = ({ iconCode, size = 48 }) => {
  const iconUrl = getAnimatedIconUrl(iconCode);

  return iconUrl ? (
    <img src={iconUrl} alt={iconCode} width={size} height={size} />
  ) : null;
};

export default WeatherIcon;
