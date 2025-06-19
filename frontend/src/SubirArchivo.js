// SubirArchivo.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function SubirArchivo() {
  const [archivo, setArchivo] = useState(null);
  const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!archivo) {
      setMensaje({ texto: 'Selecciona un archivo Excel', tipo: 'error' });
      return;
    }

    const formData = new FormData();
    formData.append('file', archivo); // 👈 clave 'file' debe coincidir con backend

    try {
      await axios.post('https://mi-app-llantas.onrender.com/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMensaje({ texto: 'Archivo cargado correctamente ✅', tipo: 'success' });

      // Redirecciona luego de 1.5 segundos
      setTimeout(() => {
        navigate('/'); // navegación suave
        window.location.reload(); // fuerza recarga si algo falla
      }, 1500);

    } catch (error) {
      console.error(error);
      setMensaje({ texto: 'Error al subir el archivo ❌', tipo: 'error' });
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Subir Archivo Excel</h2>

      {mensaje.texto && (
        <div className={`mb-4 ${mensaje.tipo === 'error' ? 'text-red-600' : 'text-green-600'}`}>
          {mensaje.texto}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="file" accept=".xlsx, .xls" onChange={handleChange} className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Subir
        </button>
      </form>
    </div>
  );
}

export default SubirArchivo;




