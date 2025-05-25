import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import countries from 'i18n-iso-countries';
import enLocale from 'i18n-iso-countries/langs/en.json';
import viLocale from 'i18n-iso-countries/langs/vi.json';

import { useDebounced } from '@/hooks';
import { useSearch } from '@/context/SearchContext';

import { getCoordinatesByCity } from '@/api/weather';


countries.registerLocale(viLocale);

const getCountryName = (code) => {
  return countries.getName(code, 'vi') || code;
};

const Input = ({ className }) => {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const debouncedValue = useDebounced(value, 700);
  const { setSearchTerm } = useSearch();

  useEffect(() => {
    const fetchCoordinates = async () => {
      if (!debouncedValue.trim()) {
        setResult(null);
        return;
      }

      getCoordinatesByCity(debouncedValue)
        .then((response) => {
          setError(null)
          setResult(response);
        })
        .catch((err) => {
          setResult(null);
          setError(err.message)
        })
    };

    fetchCoordinates();
  }, [debouncedValue]);


  return (
    <StyledWrapper>
      <div className="search">
        <input
          onChange={(e) => { setValue(e.target.value) }}
          value={value}
          type="text"
          className={`${className} search__input`}
          placeholder="Search..." />
        <button
          onClick={() => {
            setValue('');
            document.querySelector('.search__input').focus();
          }}
          className="search__button text-gray-400"
        >
          {!value ?
            <svg className="search__icon" aria-hidden="true" viewBox="0 0 24 24">
              <g>
                <path d="M21.53 20.47l-3.66-3.66C19.195 15.24 20 13.214 20 11c0-4.97-4.03-9-9-9s-9 4.03-9 9 4.03 9 9 9c2.215 0 4.24-.804 5.808-2.13l3.66 3.66c.147.146.34.22.53.22s.385-.073.53-.22c.295-.293.295-.767.002-1.06zM3.5 11c0-4.135 3.365-7.5 7.5-7.5s7.5 3.365 7.5 7.5-3.365 7.5-7.5 7.5-7.5-3.365-7.5-7.5z" />
              </g>
            </svg>
            :
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x-icon lucide-x">
              <path d="M18 6 6 18" /><path d="m6 6 12 12" />
            </svg>
          }
        </button>
      </div>
      <div className='relative'>
        {value.trim() && result?.length > 0 && (
          <div className='absolute top-5 w-64 bg-white dark:bg-slate-700 text-black dark:text-slate-100 shadow rounded-md'>
            <ul>
              {result.map((city, index) => (
                <li
                  key={index}
                  onClick={() => {
                    setSearchTerm(city.name); // gửi về context
                    setValue('')
                    setResult(null); // ẩn dropdown
                  }}
                  className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600"
                >
                  {city.name}, {getCountryName(city.country)}
                </li>
              ))}
            </ul>
          </div>
        )}
        {error > 0 && (
          <div className='absolute top-5 w-64 bg-white dark:bg-slate-700 text-black dark:text-slate-100 shadow rounded-md'>
            <ul>
              <li className="cursor-pointer px-4 py-2 hover:bg-gray-100 dark:hover:bg-slate-600">
                <p>Không tìm thấy thành phố</p>
              </li>
            </ul>
          </div>
        )}
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .search {
    display: flex;
    align-items: center;
    justify-content: space-between;
    text-align: center;
  }

  .search__input {
    font-family: inherit;
    font-size: inherit;
    background-color: #f4f2f2;
    border: none;
    color: #646464;
    padding: 0.3rem 1rem;
    border-radius: 30px;
    width: 12em;
    transition: all ease-in-out .5s;
    margin-right: -2rem;
  }

  .search__input:hover, .search__input:focus {
    box-shadow: 0 0 1em #00000013;
  }

  .search__input:focus {
    outline: none;
    background-color: #f0eeee;
  }

  .search__input::-webkit-input-placeholder {
    font-weight: 100;
    color: #ccc;
  }

  .search__input:focus + .search__button {
    background-color: #f0eeee;
  }

  .search__button {
    border: none;
    background-color: #f4f2f2;
    margin-top: .1em;
  }

  .search__button:hover {
    cursor: pointer;
  }

  .search__icon {
    height: 1.3em;
    width: 1.3em;
    fill: #b4b4b4;
  }`;

export default Input;
