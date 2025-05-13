import { useState } from "react";

function TemperatureSlider({ min, max, value }) {
  const [isHovering, setIsHovering] = useState(false);

  const percent = ((value - min) / (max - min)) * 100;

  return (
    <div className="relative w-full flex justify-center">
      {/* Tooltip */}
      {isHovering && (
        <div
          className="absolute -top-10 text-sm font-medium text-white bg-black px-2 py-1 rounded"
          style={{ left: `calc(${percent}% - 35px)` }}
        >
          {value.toFixed(1)}°C
        </div>
      )}

      <input
        type="range"
        min="0"
        max="100"
        value={percent}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        readOnly
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-yellow-300 to-orange-500"
      />
    </div>
  );
}

export default TemperatureSlider;