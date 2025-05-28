import React from "react";

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-slate-700 border-t border-gray-200 dark:border-gray-700 py-10">
            <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-base text-gray-400 text-center md:text-right mt-2 md:mt-0">
                    Dự án được phát triển với mục đích học tập và phi thương mại.
                    Dữ liệu thời tiết từ <a href="https://openweathermap.org/" className="underline hover:text-yellow-500" target="_blank" rel="noreferrer">OpenWeather</a>.
                </div>
                <div className="text-base text-gray-500 dark:text-gray-400">
                    © {new Date().getFullYear()} NamTr_n, All rights Reserved..
                </div>
            </div>
        </footer>
    );
};

export default Footer;
