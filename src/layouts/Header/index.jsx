import React from 'react'
import { NavLink } from 'react-router';

import assets from '@/assets';//import lấy ảnh
import InputSearch from '@/components/InputSearch';

const Header = () => {
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
        <nav className="sticky top-0 z-50 bg-white backdrop-blur-md border-b shadow-sm">
            <div className="container mx-auto flex justify-between items-center py-4">
                <div className="w-3xs h-12 flex justify-center items-center">
                    <img src={assets.logo__dark} alt="logo" className='bg-cover w-1/2' />
                </div>
                <div className='w-fit flex items-center'>
                    {navigation.map((item) => (
                        <NavLink
                            to={item.link}
                            key={item.link}
                            className={
                                ({ isActive }) =>
                                    `text-xl px-1.5 font-bold transition-colors duration-200 
                                ${isActive ? 'text-blue-300' : 'text-gray-700 hover:text-gray-950'}`
                            }>
                            {item.name}
                        </NavLink>
                    ))}
                    <InputSearch className="ml-5" />
                </div>
            </div>
        </nav >
    )
}

export default Header