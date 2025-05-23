import React, { useEffect, useState } from 'react'
import { getAirPollution } from '@/utils/getAirPollution';
import { label } from 'three/tsl';

const index = ({ airPollution }) => {
    const [aqi, setAQI] = useState({});
    const [airData, setAirData] = useState({});
    useEffect(() => {
        setAQI(getAirPollution({ lang: 'vi', aqi: airPollution.list[0].main.aqi }));
        setAirData(airPollution.list[0].components);
    }, [airPollution])
    if (!airPollution) return <p>Đang tải ... </p>;
    return (
        <div className="col-span-2 row-span-3 gap-2 shadow-md bg-white rounded-lg text-black p-4">
            <div className="col-span-2 text-[20px] font-bold">Chất Lượng Không Khí</div>
            <div className='flex items-center justify-between pt-4 pb-3'>
                <p>Chỉ số AQI</p>
                <p
                    className="px-2.5 rounded-2xl text-black font-semibold"
                    style={{ backgroundColor: aqi.color }}
                >
                    {aqi.label}
                </p>
            </div>
            <div className='w-full h-3 bg-gray-300/70 rounded-2xl'>
                <div className='h-full rounded-2xl'
                    style={{ width: 20 + ((aqi.aqi - 1) / 4) * 80 + '%', background: aqi.color }}
                ></div>
            </div>
            <div className="shrink-0 flex p-4 mt-2 bg-blue-100/60 rounded-2xl"
                style={{background: aqi.color + '20'}}
            >
                <svg className="shrink-0 size-4 mt-0.5" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill={aqi.color} viewBox="0 0 16 16">
                    <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"></path>
                </svg>
                <div className="ms-3">
                    <p className="text-sm text-gray-700 dark:text-neutral-400">
                        {aqi.desc}.
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-2 grid-rows-2 gap-4 py-2">
                <div >
                    <p className='flex flex-col p-1'>
                        PM2.5
                        <span className='font-semibold'>
                            {airData.pm2_5} µg/m³
                        </span>
                    </p>

                </div>
                <div >
                    <p className='flex flex-col p-1'>
                        PM10
                        <span className='font-semibold'>
                            {airData.pm10} µg/m³
                        </span>
                    </p>
                </div>
                <div className="row-start-2">
                    <p className='flex flex-col p-1'>
                        NO2
                        <span className='font-semibold'>
                            {airData.no2} µg/m³
                        </span>
                    </p>
                </div>
                <div className="row-start-2">
                    <p className='flex flex-col p-1'>
                        O3
                        <span className='font-semibold'>
                            {airData.o3} µg/m³
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default index