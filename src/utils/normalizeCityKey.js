
export const normalizeCityKey = (city) => {
    return city
      .normalize('NFD')                      // Tách dấu tiếng Việt
      .replace(/[\u0300-\u036f]/g, '')       // Xoá dấu
      .toLowerCase()                         // Chuyển về chữ thường
      .replace(/\s+/g, '_')                  // Thay khoảng trắng bằng dấu gạch ngang
      .trim();
  };
  