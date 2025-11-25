import React from 'react';
import { Navigate } from 'react-router-dom';

const PASSWORD = 'at2025';
const MAX_TIEMPO = 60 * 60 * 1000; // 60 minutos

function Protegido({ children }) {
  const acceso = localStorage.getItem('acceso');
  const timestamp = localStorage.getItem('timestamp');
  const expirado = !timestamp || Date.now() - parseInt(timestamp) > MAX_TIEMPO;

  if (acceso === PASSWORD && !expirado) {
    return children;
  }

  // Si está expirado, limpiamos localStorage
  localStorage.removeItem('acceso');
  localStorage.removeItem('timestamp');

  return <Navigate to="/login" />;
}

export default Protegido;





