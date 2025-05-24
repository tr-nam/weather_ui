import React from 'react';
import { Routes, Route } from 'react-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { SearchProvider } from '@/context/SearchContext';

import Header from './layouts/Header'
import Content from './layouts/Content'
import HomePage from './pages/Home';
import MapPage from './pages/Map';

const App = () => {
  return (
    <ThemeProvider>
      <SearchProvider>
        <Header />
        <Content>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/map" element={<MapPage />} />
          </Routes>
        </Content>
      </SearchProvider>
    </ThemeProvider>
  )
}

export default App