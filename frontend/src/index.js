import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import SubirArchivo from './SubirArchivo';
import Protegido from './Protegido';
import LoginPage from './LoginPage';
import Tapetes from './Tapetes';
import Rines from './Rines';
import Carpas from './Carpas';
import './index.css';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<Protegido><App /></Protegido>} />
      <Route path="/subir" element={<Protegido><SubirArchivo /></Protegido>} />
      <Route path="/tapetes" element={<Protegido><Tapetes /></Protegido>} />
      <Route path="/rines" element={<Protegido><Rines /></Protegido>} />
      <Route path="/carpas" element={<Carpas />} />
    </Routes>
  </BrowserRouter>
);

serviceWorkerRegistration.register();




