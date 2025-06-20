// src/Login.js
import React from 'react';
import { Navigate } from 'react-router-dom';

const PASSWORD = 'at2025';

function Protegido({ children }) {
  const acceso = localStorage.getItem('acceso');

  if (acceso === PASSWORD) return children;

  const ingresar = window.prompt('Ingresa la contraseña:');
  if (ingresar === PASSWORD) {
    localStorage.setItem('acceso', PASSWORD);
    return children;
  }

  return <Navigate to="/" />;
}

export default Protegido;



