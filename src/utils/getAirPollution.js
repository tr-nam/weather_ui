export const getAirPollution = ({ lang = "vi", aqi = 1 }) => {
  const AQI_RANGE = [
    {
      aqi: 1,
      label_vi: "Tốt",
      label_en: "Good",
      desc_vi: "Không khí trong lành",
      desc_en: "Air quality is considered satisfactory",
      color: "#009966",
    },
    {
      aqi: 2,
      label_vi: "Khá",
      label_en: "Fair",
      desc_vi: "Chấp Nhận Được",
      desc_en:
        "Acceptable air quality. Some pollutants may slightly affect very sensitive people",
      color: "#FFDE33",
    },
    {
      aqi: 3,
      label_vi: "Trung bình",
      label_en: "Moderate",
      desc_vi: "Nhạy cảm nên hạn chế ra ngoài",
      desc_en:
        "May cause problems for people who are sensitive to air pollution",
      color: "#FF9933",
    },
    {
      aqi: 4,
      label_vi: "Kém",
      label_en: "Poor",
      desc_vi: "Có hại cho sức khỏe",
      desc_en: "Unhealthy for sensitive groups. May cause health effects",
      color: "#CC0033",
    },
    {
      aqi: 5,
      label_vi: "Rất kém",
      label_en: "Very Poor",
      desc_vi: "Nguy hiểm",
      desc_en:
        "Health alert: Everyone may experience more serious health effects",
      color: "#660099",
    },
  ];

  const detail = AQI_RANGE.find((item) => item.aqi === aqi);
  if (!detail) return { label: "Không xác định", color: "#999" };

  return {
    aqi,
    label: lang === "en" ? detail.label_en : detail.label_vi,
    desc: lang == "en" ? detail.desc_en : detail.desc_vi,
    color: detail.color,
  };
};
