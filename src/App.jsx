import React from 'react';
import { Routes, Route } from 'react-router';
import Header from './layouts/Header'
import HomePage from './pages/Home';
import MapPage from './pages/Map';

const App = () => {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/map" element={<MapPage />} />
      </Routes>
    </>
  )
}

export default App