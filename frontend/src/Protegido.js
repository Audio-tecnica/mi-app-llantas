import React from 'react';
import { Navigate } from 'react-router-dom';

const Protegido = ({ children }) => {
  const acceso = localStorage.getItem('acceso');
  const timestamp = localStorage.getItem('timestamp');
  const maxTiempo = 120 * 60 * 1000; // 2 horas
  const expirado = !acceso || !timestamp || Date.now() - parseInt(timestamp) > maxTiempo;

  if (expirado) {
    localStorage.removeItem('acceso');
    localStorage.removeItem('timestamp');
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default Protegido;






