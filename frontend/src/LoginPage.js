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
      localStorage.setItem('timestamp', Date.now()); // ✅ esta línea es clave
      navigate('/');
    } else {
      setError('Contraseña incorrecta ❌');
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
    <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
    {/* Contenedor para el logo con fondo blanco */}
    <div className="bg-white p-4 rounded-lg shadow-lg">
      <img src="/logoLogin.png" className="h-13 w-48" alt="Logo" />
    </div></div>
  
      <form onSubmit={handleSubmit} className="bg-white/20 p-8 rounded shadow-md w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">🔐 Ingresar</h2>
        <input
          type="password"
          placeholder="Contraseña"
          value={input}
          onChange={e => setInput(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
          Entrar
        </button>
      </form>
    </div>
  );
}

export default LoginPage;



