// src/LoginPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const PASSWORD = 'at2025';

function LoginPage() {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input === PASSWORD) {
      localStorage.setItem('acceso', PASSWORD);
      navigate('/');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded shadow-md w-80">
        <h2 className="text-lg font-bold mb-4 text-center">🔒 Ingreso</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full p-2 border rounded mb-3"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default LoginPage;
