import React from 'react';
import { Navigate } from 'react-router-dom';

const PASSWORD = 'at2025';

function Protegido({ children }) {
  const acceso = localStorage.getItem('acceso');

  if (acceso === PASSWORD) {
    return children;
  }

  return <Navigate to="/login" />;
}

export default Protegido;



