import React, { useState } from 'react'
import { NavLink } from 'react-router';
import { AlignJustify } from 'lucide-react';

import assets from '@/assets';//import lấy ảnh
import InputSearch from '@/components/InputSearch';
import Menu from '@/components/Menu';
import MenuSwitch from '@/components/MenuSwitch';

const Header = () => {
    const [isActive, setIsActive] = useState(false)

    const navigation = [
        {
            name: "Home",
            link: "/"
        },
        {
            name: "Map",
            link: "/map"
        },
    ]

    return (
        <nav className="sticky top-0 z-50 bg-white backdrop-blur-md border-b shadow-sm dark:bg-slate-700">
            <div className="container mx-auto flex justify-between items-center py-2">
                <div className="w-3xs h-12 flex justify-center items-center">
                    <img src={assets.logo__dark} alt="logo" className='bg-cover w-1/2' />
                </div>
                <div className='w-fit flex items-center gap-2'>
                    {navigation.map((item) => (
                        <NavLink
                            to={item.link}
                            key={item.link}
                            className={
                                ({ isActive }) =>
                                    `text-xl px-1.5 font-bold transition-colors duration-200 
                                ${isActive ? 'text-blue-300 dark:text-slate-100' : 'text-gray-700 hover:text-gray-950 dark:text-slate-300/60 dark:hover:text-slate-500'}`
                            }>
                            {item.name}
                        </NavLink>
                    ))}
                    <div className='h-5 w-0.5 bg-gray-300'></div>
                    <InputSearch className="ml-2 " />
                    <div className='relative'>
                        <div className='text-gray-500 px-4' >
                            <MenuSwitch onClick={() => { setIsActive(!isActive) }}/>
                        </div>
                        {isActive &&
                            <div className='absolute top-13 right-4 z-50 bg-white dark:bg-slate-700 shadow rounded-md p-2 '>
                                <Menu />
                            </div>
                        }
                    </div>
                </div>
            </div>
        </nav >
    )
}

export default Header