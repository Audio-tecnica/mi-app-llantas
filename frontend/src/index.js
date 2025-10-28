import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import SubirArchivo from './SubirArchivo';
import Protegido from './Protegido';
import LoginPage from './LoginPage';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protegido><App /></Protegido>} />
      <Route path="/subir" element={<Protegido><SubirArchivo /></Protegido>} />
      <Route path="*" element={<LoginPage />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  </HashRouter>
);








