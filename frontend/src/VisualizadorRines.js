import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function VisualizadorRines() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1); // 1: Captura, 2: Selección, 3: Edición, 4: Resultado
  const [imagenVehiculo, setImagenVehiculo] = useState(null);
  const [imagenVehiculoURL, setImagenVehiculoURL] = useState(null);
  const [mensaje, setMensaje] = useState("");
  
  // Estados para el Paso 2
  const [rines, setRines] = useState([]);
  const [cargandoRines, setCargandoRines] = useState(false);
  const [rinSeleccionado, setRinSeleccionado] = useState(null);
  const [busquedaRin, setBusquedaRin] = useState("");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [medidaFiltro, setMedidaFiltro] = useState("");
  
  const inputFileRef = useRef(null);
  const videoRef = useRef(null);
  const [usandoCamara, setUsandoCamara] = useState(false);

  // Detectar si es dispositivo móvil
  const esMovil = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  const API_URL = "https://mi-app-llantas.onrender.com";

  // Cargar rines cuando llegamos al paso 2
  useEffect(() => {
    if (paso === 2 && rines.length === 0) {
      cargarRines();
    }
  }, [paso]);

  // Función para cargar rines desde el backend
  const cargarRines = async () => {
    try {
      setCargandoRines(true);
      const res = await axios.get(`${API_URL}/api/rines`);
      setRines(res.data);
    } catch (error) {
      console.error("Error al cargar rines:", error);
      setMensaje("Error al cargar el catálogo de rines ❌");
      setTimeout(() => setMensaje(""), 3000);
    } finally {
      setCargandoRines(false);
    }
  };

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

        {/* Paso 2: Seleccionar Rin */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⚙️</span>
              Paso 2: Seleccionar Rin
            </h2>
            <p className="text-gray-600 mb-6">
              Selecciona el rin que quieres visualizar en el vehículo
            </p>

            {cargandoRines ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
                <p className="text-gray-600 text-lg">Cargando catálogo de rines...</p>
              </div>
            ) : (
              <>
                {/* Filtros */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros de búsqueda</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Buscar por referencia
                      </label>
                      <input
                        type="text"
                        placeholder="Escribe la referencia..."
                        value={busquedaRin}
                        onChange={(e) => setBusquedaRin(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marca
                      </label>
                      <select
                        value={marcaFiltro}
                        onChange={(e) => setMarcaFiltro(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      >
                        <option value="">Todas las marcas</option>
                        {[...new Set(rines.map((r) => r.marca))].map((marca) => (
                          <option key={marca} value={marca}>
                            {marca}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Medida
                      </label>
                      <select
                        value={medidaFiltro}
                        onChange={(e) => setMedidaFiltro(e.target.value)}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                      >
                        <option value="">Todas las medidas</option>
                        {["15", "16", "17", "18", "20"].map((medida) => (
                          <option key={medida} value={medida}>
                            {medida}"
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setBusquedaRin("");
                      setMarcaFiltro("");
                      setMedidaFiltro("");
                    }}
                    className="mt-4 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition-all"
                  >
                    🔄 Limpiar filtros
                  </button>
                </div>

                {/* Grid de rines */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                  {rines
                    .filter((r) => {
                      const coincideReferencia = r.referencia
                        ?.toLowerCase()
                        .includes(busquedaRin.toLowerCase());
                      const coincideMarca = !marcaFiltro || r.marca === marcaFiltro;
                      const coincideMedida =
                        !medidaFiltro || r.medida?.toString().startsWith(medidaFiltro);
                      return coincideReferencia && coincideMarca && coincideMedida;
                    })
                    .map((rin) => (
                      <div
                        key={rin.id}
                        onClick={() => setRinSeleccionado(rin)}
                        className={`cursor-pointer rounded-xl border-2 transition-all hover:shadow-lg ${
                          rinSeleccionado?.id === rin.id
                            ? "border-purple-600 bg-purple-50 shadow-lg"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="p-4">
                          {rin.foto ? (
                            <img
                              src={rin.foto}
                              alt={rin.referencia}
                              className="w-full h-32 object-cover rounded-lg mb-3"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-3">
                              <span className="text-gray-400 text-xs">Sin foto</span>
                            </div>
                          )}

                          <div className="text-center">
                            <p className="font-semibold text-gray-800 text-sm mb-1">
                              {rin.referencia}
                            </p>
                            <p className="text-xs text-gray-500">{rin.marca}</p>
                            {rin.medida && (
                              <p className="text-xs text-purple-600 font-medium mt-1">
                                {rin.medida}
                              </p>
                            )}
                          </div>

                          {rinSeleccionado?.id === rin.id && (
                            <div className="mt-2 text-center">
                              <span className="inline-block bg-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                                ✓ Seleccionado
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Botones de navegación */}
                <div className="flex gap-4 justify-between items-center pt-6 border-t">
                  <button
                    onClick={() => setPaso(1)}
                    className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    ← Volver
                  </button>

                  {rinSeleccionado && (
                    <div className="flex-1 bg-purple-50 rounded-xl p-4 mx-4 border-2 border-purple-200">
                      <p className="text-sm text-gray-600 mb-1">Rin seleccionado:</p>
                      <p className="font-bold text-purple-700 text-lg">
                        {rinSeleccionado.referencia} - {rinSeleccionado.marca}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!rinSeleccionado) {
                        setMensaje("Por favor selecciona un rin ❌");
                        setTimeout(() => setMensaje(""), 3000);
                        return;
                      }
                      setPaso(3);
                    }}
                    disabled={!rinSeleccionado}
                    className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Continuar →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Paso 3: Edición (por ahora vacío) */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Paso 3: Ajustar Visualización
            </h2>
            <p className="text-gray-600">En desarrollo...</p>
            <button
              onClick={() => setPaso(2)}
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