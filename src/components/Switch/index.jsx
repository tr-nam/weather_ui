// import React from 'react';

// const Switch = ({textOn='ON', textOff='OFF', onChange}) => {
//   return (
//     <label className="switch cursor-pointer relative flex w-[6.7rem] scale-75 overflow-hidden p-2">
//       <input onChange={onChange} type="checkbox" name className="peer hidden" />
//       <div className="absolute -right-[6.5rem] z-[1] flex h-10 w-24 skew-x-12 items-center justify-center text-lg duration-500 peer-checked:right-1">
//         <span className="-skew-x-12 text-black dark:text-white">{textOn}</span>
//       </div>
//       <div className="z-0 h-10 w-24 -skew-x-12 border border-black dark:border-white duration-500 peer-checked:skew-x-12" />
//       <div className="absolute left-[0.3rem] flex h-10 w-24 -skew-x-12 items-center justify-center text-lg duration-500 peer-checked:-left-[6.5rem]">
//         <span className="skew-x-12 text-black dark:text-white">{textOff}</span>
//       </div>
//     </label>
//   );
// }

// export default Switch;

import React, { useState, useEffect } from 'react';

const Switch = ({ textOn = 'ON', textOff = 'OFF', onChange }) => {
  const LOCAL_KEY = 'my_switch_status';

  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved !== null) setIsChecked(saved === 'true');
  }, []);

  const handleToggle = (e) => {
    const value = e.target.checked;
    setIsChecked(value);
    localStorage.setItem(LOCAL_KEY, value);
    onChange && onChange(value);
  };

  return (
    <label className="switch cursor-pointer relative flex w-[6.7rem] scale-75 overflow-hidden p-2">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleToggle}
        className="peer hidden"
      />
      <div className="absolute -right-[6.5rem] z-[1] flex h-10 w-24 skew-x-12 items-center justify-center text-lg duration-500 peer-checked:right-1">
        <span className="-skew-x-12 text-black dark:text-white">{textOn}</span>
      </div>
      <div className="z-0 h-10 w-24 -skew-x-12 border border-black dark:border-white duration-500 peer-checked:skew-x-12" />
      <div className="absolute left-[0.3rem] flex h-10 w-24 -skew-x-12 items-center justify-center text-lg duration-500 peer-checked:-left-[6.5rem]">
        <span className="skew-x-12 text-black dark:text-white">{textOff}</span>
      </div>
    </label>
  );
};

export default Switch;


