// FaceLogin.js
import React, { useRef, useState } from 'react';

function FaceLogin({ onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Inicia la cámara
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
      videoRef.current.play();
    } catch (err) {
      setError('No se pudo acceder a la cámara');
    }
  };

  // Captura la foto y hace la “validación” simulada
  const captureAndVerify = () => {
    setLoading(true);
    setError('');

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = canvas.toDataURL('image/png');

    // Aquí iría la integración real con un API de reconocimiento facial
    // Para ejemplo, simulamos una verificación exitosa
    setTimeout(() => {
      setLoading(false);
      // Simulamos que la cara coincide
      const isMatch = true;

      if (isMatch) {
        onSuccess(); // Ejecuta la función que maneja el login
      } else {
        setError('No se reconoció la cara');
      }
    }, 1500);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <h2 className="text-xl font-bold">Iniciar sesión con reconocimiento facial</h2>

      <video ref={videoRef} className="border rounded w-64 h-48" />

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && <p className="text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          onClick={startCamera}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Activar cámara
        </button>

        <button
          onClick={captureAndVerify}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          disabled={loading}
        >
          {loading ? 'Verificando...' : 'Iniciar sesión'}
        </button>
      </div>
    </div>
  );
}

export default FaceLogin;
