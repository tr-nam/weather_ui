import React, { useState, useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { UnitContext } from '@/context/UnitContext';

import Switch from '@/components/Switch';


const MenuSettings = ({ onToggleTheme, onChangeLanguage, onToggleCF }) => {
    const { toggleTheme } = useContext(ThemeContext);
    const [language, setLanguage] = useState('vi');
    const { unit, toggleUnit } = useContext(UnitContext);


    return (
        <div className="p-4 w-64">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Cài đặt</h2>

            {/* Theme Switch */}
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-mm font-medium text-gray-700 dark:text-gray-300">
                    Giao diện
                </label>
                <Switch onChange={toggleTheme} textOff='Sáng' textOn='Tối' localStorageKey='theme'/>
            </div>
            {/* Unit Toggle */}
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-mm font-medium text-gray-700 dark:text-gray-300">
                    Đơn vị
                </label>
                <Switch onChange={toggleUnit} textOff='°C' textOn='°F' localStorageKey='until_toggle' valuePop={{ true: 'imperial', false: 'metric' }}/>
            </div>

            {/* Language Select */}
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-mm font-medium text-gray-700 dark:text-gray-300">
                    Ngôn Ngữ
                </label>
                <Switch onChange={()=>{handleLanguageChange}} textOff='Vi' textOn='En' localStorageKey='lang'/>
            </div>
        </div>
    );
};

export default MenuSettings;
