import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

function VisualizadorRines() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: Captura, 2: Selección, 3: Edición, 4: Resultado
  const [imagenVehiculo, setImagenVehiculo] = useState(null);
  const [imagenVehiculoURL, setImagenVehiculoURL] = useState(null);
  const [mensaje, setMensaje] = useState("");
  
  const inputFileRef = useRef(null);
  const videoRef = useRef(null);
  const [usandoCamara, setUsandoCamara] = useState(false);

  // Detectar si es dispositivo móvil
  const esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Función para manejar la selección de archivo
  const handleArchivoSeleccionado = (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    // Validar que sea imagen
    if (!archivo.type.startsWith("image/")) {
      setMensaje("Por favor selecciona un archivo de imagen ❌");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    // Validar tamaño (max 10MB)
    if (archivo.size > 10 * 1024 * 1024) {
      setMensaje("La imagen no puede superar 10MB ❌");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }

    // Crear URL de la imagen
    const url = URL.createObjectURL(archivo);
    setImagenVehiculo(archivo);
    setImagenVehiculoURL(url);
    setMensaje("Imagen cargada exitosamente ✅");
    setTimeout(() => setMensaje(""), 2000);
  };

  // Función para activar la cámara (solo móvil)
  const activarCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Cámara trasera
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setUsandoCamara(true);
      }
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      setMensaje("No se pudo acceder a la cámara ❌");
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  // Función para capturar foto desde la cámara
  const capturarFoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const archivo = new File([blob], "foto-vehiculo.jpg", { type: "image/jpeg" });
      
      setImagenVehiculo(archivo);
      setImagenVehiculoURL(url);
      
      // Detener cámara
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
      setUsandoCamara(false);
      
      setMensaje("Foto capturada exitosamente ✅");
      setTimeout(() => setMensaje(""), 2000);
    }, "image/jpeg");
  };

  // Función para cancelar el uso de la cámara
  const cancelarCamara = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach((track) => track.stop());
    }
    setUsandoCamara(false);
  };

  // Función para continuar al siguiente paso
  const continuarAlSiguientePaso = () => {
    if (!imagenVehiculoURL) {
      setMensaje("Por favor carga o captura una imagen primero ❌");
      setTimeout(() => setMensaje(""), 3000);
      return;
    }
    setPaso(2);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img src="/logowp.PNG" className="h-12 w-auto" alt="Logo" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Visualizador de Rines</h1>
                <p className="text-sm text-gray-500">Paso {paso} de 4</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate("/rines")}
                className="inline-flex items-center gap-2 bg-slate-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>← Volver a Rines</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {mensaje && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg mb-6 shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              <span className="font-medium">{mensaje}</span>
            </div>
          </div>
        )}

        {/* Contenido del Paso 1: Captura/Upload de foto */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>📸</span>
              Paso 1: Foto del Vehículo
            </h2>
            <p className="text-gray-600 mb-8">
              {esMovil 
                ? "Toma una foto del vehículo o selecciona una de tu galería"
                : "Selecciona una imagen del vehículo desde tu computadora"}
            </p>

            {/* Mostrar cámara si está activa */}
            {usandoCamara && (
              <div className="mb-6">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full max-w-2xl mx-auto rounded-xl shadow-lg"
                />
                <div className="flex gap-4 mt-4 justify-center">
                  <button
                    onClick={capturarFoto}
                    className="bg-green-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all shadow-lg hover:shadow-xl"
                  >
                    📸 Capturar Foto
                  </button>
                  <button
                    onClick={cancelarCamara}
                    className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    ✖ Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Mostrar imagen seleccionada */}
            {imagenVehiculoURL && !usandoCamara && (
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200">
                  <img
                    src={imagenVehiculoURL}
                    alt="Vehículo"
                    className="w-full max-w-2xl mx-auto rounded-lg shadow-md"
                  />
                </div>
                <div className="flex gap-4 mt-4 justify-center">
                  <button
                    onClick={continuarAlSiguientePaso}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Continuar →
                  </button>
                  <button
                    onClick={() => {
                      setImagenVehiculo(null);
                      setImagenVehiculoURL(null);
                    }}
                    className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    Cambiar imagen
                  </button>
                </div>
              </div>
            )}

            {/* Botones de captura/upload */}
            {!imagenVehiculoURL && !usandoCamara && (
              <div className="space-y-6">
                {esMovil ? (
                  // Opciones para móvil
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={activarCamara}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-6 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl text-lg"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">📷</span>
                        <span>Tomar Foto</span>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => inputFileRef.current?.click()}
                      className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-6 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl text-lg"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <span className="text-4xl">🖼️</span>
                        <span>Subir desde Galería</span>
                      </div>
                    </button>
                  </div>
                ) : (
                  // Opción para PC (solo upload)
                  <div
                    onClick={() => inputFileRef.current?.click()}
                    className="border-4 border-dashed border-gray-300 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <span className="text-6xl">📁</span>
                      <p className="text-xl font-semibold text-gray-700">
                        Haz clic para seleccionar una imagen
                      </p>
                      <p className="text-sm text-gray-500">
                        O arrastra y suelta el archivo aquí
                      </p>
                    </div>
                  </div>
                )}

                {/* Input file oculto */}
                <input
                  ref={inputFileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleArchivoSeleccionado}
                  className="hidden"
                />
              </div>
            )}
          </div>
        )}

        {/* Pasos siguientes (por ahora vacíos) */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Paso 2: Seleccionar Rin
            </h2>
            <p className="text-gray-600">En desarrollo...</p>
            <button
              onClick={() => setPaso(1)}
              className="mt-4 bg-gray-400 text-white px-6 py-2 rounded-lg"
            >
              ← Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualizadorRines;