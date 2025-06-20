// src/Protegido.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PASSWORD = 'at2025';

function Protegido({ children }) {
  const acceso = localStorage.getItem('acceso');
  return acceso === PASSWORD ? children : <Navigate to="/login" />;
}

export default Protegido;
