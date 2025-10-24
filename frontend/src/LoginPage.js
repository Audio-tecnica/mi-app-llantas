import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FaceLogin from "./FaceLogin";

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

  {mostrarFaceLogin ? (
  <FaceLogin onSuccess={() => navigate("/app")} />
   ) : (
  <button
    onClick={() => setMostrarFaceLogin(true)}
    className="bg-green-600 text-white px-4 py-2 rounded"
     >
    Ingresar con reconocimiento facial
    </button>
  )}

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: "url('/logowp.PNG')",
        backgroundSize: 'auto 150px',
        backgroundPosition: '50% 20%',
        backgroundRepeat: 'no-repeat'
      }}
    >
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



