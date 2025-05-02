import React from 'react';
import { Routes, Route } from 'react-router';
import Header from './layouts/Header'
import Content from './layouts/Content'
import HomePage from './pages/Home';
import MapPage from './pages/Map';

const App = () => {
  return (
    <>
      <Header />
      <Content>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/map" element={<MapPage />} />
        </Routes>
      </Content>

    </>
  )
}

export default App