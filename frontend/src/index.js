// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import SubirArchivo from './SubirArchivo';
import Login from './Login';
import Protegido from './Protegido';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Protegido><App /></Protegido>} />
      <Route path="/subir" element={<Protegido><SubirArchivo /></Protegido>} />
    </Routes>
  </BrowserRouter>
);

