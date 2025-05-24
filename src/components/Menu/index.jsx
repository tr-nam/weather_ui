import React, { useState, useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';

import Switch from '@/components/Switch';


const MenuSettings = ({ onToggleTheme, onChangeLanguage, onToggleCF }) => {
    const { toggleTheme } = useContext(ThemeContext);
    const [language, setLanguage] = useState('vi');
    const [unit, setUnit] = useState('C');

    const handleLanguageChange = (e) => {
        const lang = e.target.value;
        setLanguage(lang);
        onChangeLanguage(lang);
    };

    const handleUnitToggle = () => {
        const nextUnit = unit === 'C' ? 'F' : 'C';
        setUnit(nextUnit);
        onToggleCF(nextUnit);
    };

    return (
        <div className="p-4 w-64">
            <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Cài đặt</h2>

            {/* Theme Switch */}
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-mm font-medium text-gray-700 dark:text-gray-300">
                    Giao diện
                </label>
                <Switch onChange={toggleTheme} textOff='Sáng' textOn='Tối'/>
            </div>
            {/* Unit Toggle */}
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-mm font-medium text-gray-700 dark:text-gray-300">
                    Đơn vị
                </label>
                <Switch onChange={()=>{handleUnitToggle}} textOff='°C' textOn='°F'/>
            </div>

            {/* Language Select */}
            <div className="flex items-center justify-between">
                <label className="block mb-1 text-mm font-medium text-gray-700 dark:text-gray-300">
                    Ngôn Ngữ
                </label>
                <Switch onChange={()=>{handleLanguageChange}} textOff='Vi' textOn='En'/>
            </div>
        </div>
    );
};

export default MenuSettings;
