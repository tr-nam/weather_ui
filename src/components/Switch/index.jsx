import React, { useState, useEffect } from 'react';

const Switch = ({
  textOn = 'ON',
  textOff = 'OFF',
  onChange,
  localStorageKey = null,
  valuePop = { true: '', false: '' }, // truyền object
}) => {
  const [isChecked, setIsChecked] = useState(false);

  useEffect(() => {
    if (localStorageKey) {
      const saved = localStorage.getItem(localStorageKey);
      if (saved !== null) {
        try {
          const parsed = JSON.parse(saved);
          setIsChecked(parsed.state === true);
        } catch (e) {
          console.error('Invalid localStorage format:', e);
        }
      }
    }
  }, [localStorageKey]);

  const handleToggle = (e) => {
    const value = e.target.checked;
    setIsChecked(value);

    if (localStorageKey) {
      const updated = {
        state: value,
        value: valuePop?.[value] || '',
      };
      localStorage.setItem(localStorageKey, JSON.stringify(updated));
    }

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
