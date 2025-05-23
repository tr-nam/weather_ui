 export function getWindDirection(degree) {
  const directions = [
    'Bắc',        // 0°
    'Bắc Đông Bắc',
    'Đông Bắc',
    'Đông Đông Bắc',
    'Đông',       // 90°
    'Đông Đông Nam',
    'Đông Nam',
    'Nam Đông Nam',
    'Nam',        // 180°
    'Nam Tây Nam',
    'Tây Nam',
    'Tây Tây Nam',
    'Tây',        // 270°
    'Tây Tây Bắc',
    'Tây Bắc',
    'Bắc Tây Bắc'
  ];

  const index = Math.round(degree / 22.5) % 16;
  return directions[index];
}
