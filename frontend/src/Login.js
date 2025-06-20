// src/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PASSWORD = 'at2025';

function Login() {
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    if (clave === PASSWORD) {
      localStorage.setItem('acceso', PASSWORD);
      navigate('/');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleLogin} className="bg-white p-6 rounded shadow-md w-80">
        <h2 className="text-lg font-semibold mb-4">Ingresa la contraseña</h2>
        <input
          type="password"
          className="border w-full p-2 mb-4 rounded"
          value={clave}
          onChange={e => setClave(e.target.value)}
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button type="submit" className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;





