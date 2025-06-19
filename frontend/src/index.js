import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import SubirArchivo from './SubirArchivo';
import Protegido from './Login'; // asumiendo que tu lógica de login está ahí
import './index.css';
import Login from './Login'; // o Protegido si renombraste

<Route path="/subir" element={<Protegido><SubirArchivo /></Protegido>} />


const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/subir" element={<Protegido><SubirArchivo /></Protegido>} />
    </Routes>
  </BrowserRouter>
);
