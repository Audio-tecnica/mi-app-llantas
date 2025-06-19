// src/Login.js
import React, { useState } from 'react';

function Protegido({ children }) {
  const [autenticado, setAutenticado] = useState(
    sessionStorage.getItem('autenticado') === 'true'
  );
  const [password, setPassword] = useState('');

  const manejarLogin = () => {
    if (password === 'at2025') {
      sessionStorage.setItem('autenticado', 'true');
      setAutenticado(true);
    } else {
      alert('Contraseña incorrecta');
    }
  };

  if (!autenticado) {
    return (
      <div className="p-8 max-w-md mx-auto">
        <h2 className="text-xl font-bold mb-4">Acceso restringido</h2>
        <input
          type="password"
          className="border p-2 rounded w-full mb-2"
          placeholder="Contraseña"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
        <button
          onClick={manejarLogin}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          Entrar
        </button>
      </div>
    );
  }

  return <>{children}</>;
}

export default Protegido;
