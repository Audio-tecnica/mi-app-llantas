import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import App from './App';
import SubirArchivo from './SubirArchivo';
import Protegido from './Protegido';
import LoginPage from './LoginPage';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <HashRouter>
    <Routes>
      {/* Ruta principal redirige al login */}
      <Route index element={<Navigate to="/login" replace />} />

      {/* Login */}
      <Route path="/login" element={<LoginPage />} />

      {/* App protegida */}
      <Route path="/home" element={<Protegido><App /></Protegido>} />

      {/* Subir archivo */}
      <Route path="/subir" element={<Protegido><SubirArchivo /></Protegido>} />

      {/* Cualquier ruta desconocida también redirige al login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  </HashRouter>
);









