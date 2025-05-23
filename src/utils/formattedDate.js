const today = new Date();
const day = String(today.getDate()).padStart(2, '0');
const month = String(today.getMonth() + 1).padStart(2, '0'); // getMonth() trả về 0-11
const year = today.getFullYear();

export const formattedDate = `${day}/${month}/${year}`;