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

  // Estados para el Paso 3
  const [escala, setEscala] = useState(1);
  const [rotacion, setRotacion] = useState(0);
  const [posicionDelantera, setPosicionDelantera] = useState({ x: 0, y: 0 });
  const [posicionTrasera, setPosicionTrasera] = useState({ x: 0, y: 0 });
  const [mostrandoControles, setMostrandoControles] = useState("delantera");

  const inputFileRef = useRef(null);
  const videoRef = useRef(null);
  const [usandoCamara, setUsandoCamara] = useState(false);
  const canvasDelRef = useRef(null);
  const canvasTrasRef = useRef(null);

  // Dibujar rines en canvas cuando cambia algo
  useEffect(() => {
    if (paso === 3 && imagenVehiculoURL && rinSeleccionado) {
      const posicion =
        mostrandoControles === "delantera"
          ? posicionDelantera
          : posicionTrasera;
      dibujarRin(
        mostrandoControles === "delantera"
          ? canvasDelRef.current
          : canvasTrasRef.current,
        imagenVehiculoURL,
        rinSeleccionado.foto,
        posicion,
        escala,
        rotacion
      );
    }
  }, [
    paso,
    escala,
    rotacion,
    posicionDelantera,
    posicionTrasera,
    mostrandoControles,
    imagenVehiculoURL,
    rinSeleccionado,
  ]);

  // Redibujar cuando llegamos al paso 4
  useEffect(() => {
    if (paso === 4 && imagenVehiculoURL && rinSeleccionado) {
      setTimeout(() => {
        dibujarRin(
          canvasDelRef.current,
          imagenVehiculoURL,
          rinSeleccionado.foto,
          posicionDelantera,
          escala,
          rotacion
        );
        dibujarRin(
          canvasTrasRef.current,
          imagenVehiculoURL,
          rinSeleccionado.foto,
          posicionTrasera,
          escala,
          rotacion
        );
      }, 100);
    }
  }, [paso]);

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
      const archivo = new File([blob], "foto-vehiculo.jpg", {
        type: "image/jpeg",
      });

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

  // Reemplaza la función dibujarRin por esta:
  const dibujarRin = (
    canvas,
    imagenVehiculo,
    fotoRin,
    posicion,
    escala,
    rotacion
  ) => {
    if (!canvas || !imagenVehiculo) return;

    const ctx = canvas.getContext("2d");

    // Establecer tamaño del canvas (importante para que funcione bien)
    const ancho = canvas.clientWidth || canvas.width || 400;
    const alto = canvas.clientHeight || canvas.height || 320;

    canvas.width = ancho;
    canvas.height = alto;

    // Dibujar imagen del vehículo
    const img = new Image();
    img.onload = () => {
      // Calcular escalado manteniendo proporción
      const ratio = Math.min(ancho / img.width, alto / img.height);
      const imgAncho = img.width * ratio;
      const imgAlto = img.height * ratio;
      const imgX = (ancho - imgAncho) / 2;
      const imgY = (alto - imgAlto) / 2;

      // Limpiar canvas
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, ancho, alto);

      // Dibujar imagen del vehículo
      ctx.drawImage(img, imgX, imgY, imgAncho, imgAlto);

      // Dibujar rin si existe
      if (fotoRin) {
        const rinImg = new Image();
        rinImg.onload = () => {
          ctx.save();

          // Calcular posición del rin (centrado)
          const rinX = ancho / 2 + posicion.x;
          const rinY = alto / 2 + posicion.y;

          // Aplicar transformaciones
          ctx.translate(rinX, rinY);
          ctx.rotate((rotacion * Math.PI) / 180);
          ctx.scale(escala, escala);

          // Dibujar rin centrado
          ctx.drawImage(
            rinImg,
            -rinImg.width / 2,
            -rinImg.height / 2,
            rinImg.width,
            rinImg.height
          );

          ctx.restore();
        };
        rinImg.onerror = () => {
          console.error("Error al cargar imagen del rin:", fotoRin);
        };
        rinImg.src = fotoRin;
      }
    };
    img.onerror = () => {
      console.error("Error al cargar imagen del vehículo");
    };
    img.src = imagenVehiculo;
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
                <h1 className="text-2xl font-bold text-gray-800">
                  Visualizador de Rines
                </h1>
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
                <p className="text-gray-600 text-lg">
                  Cargando catálogo de rines...
                </p>
              </div>
            ) : (
              <>
                {/* Filtros */}
                <div className="bg-gray-50 rounded-xl p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Filtros de búsqueda
                  </h3>
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
                        {[...new Set(rines.map((r) => r.marca))].map(
                          (marca) => (
                            <option key={marca} value={marca}>
                              {marca}
                            </option>
                          )
                        )}
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
                      const coincideMarca =
                        !marcaFiltro || r.marca === marcaFiltro;
                      const coincideMedida =
                        !medidaFiltro ||
                        r.medida?.toString().startsWith(medidaFiltro);
                      return (
                        coincideReferencia && coincideMarca && coincideMedida
                      );
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
                              <span className="text-gray-400 text-xs">
                                Sin foto
                              </span>
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
                      <p className="text-sm text-gray-600 mb-1">
                        Rin seleccionado:
                      </p>
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

        {/* Paso 3: Edición */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🎨</span>
              Paso 3: Ajustar Visualización
            </h2>
            <p className="text-gray-600 mb-6">
              Personaliza cómo se ve el rin en tu vehículo
            </p>

            {/* Tabs para seleccionar rueda */}
            <div className="flex gap-4 mb-6 border-b-2 border-gray-200">
              <button
                onClick={() => setMostrandoControles("delantera")}
                className={`py-3 px-6 font-semibold transition-all ${
                  mostrandoControles === "delantera"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                🔴 Rueda Delantera
              </button>
              <button
                onClick={() => setMostrandoControles("trasera")}
                className={`py-3 px-6 font-semibold transition-all ${
                  mostrandoControles === "trasera"
                    ? "text-purple-600 border-b-2 border-purple-600"
                    : "text-gray-600 hover:text-gray-800"
                }`}
              >
                🔵 Rueda Trasera
              </button>
            </div>

            {/* Grid: Canvas + Controles */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Canvas - Visualización */}
              <div className="lg:col-span-2">
                <div className="bg-gray-100 rounded-xl border-2 border-gray-300 overflow-hidden">
                  <canvas
                    ref={
                      mostrandoControles === "delantera"
                        ? canvasDelRef
                        : canvasTrasRef
                    }
                    className="w-full h-96 block"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Usa los controles de la derecha para ajustar el rin
                </p>
              </div>

              {/* Controles */}
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200">
                <h3 className="text-lg font-bold text-gray-800 mb-6">
                  {mostrandoControles === "delantera"
                    ? "🔴 Delantera"
                    : "🔵 Trasera"}
                </h3>

                {/* Tamaño */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Tamaño
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0.5"
                      max="3"
                      step="0.1"
                      value={escala}
                      onChange={(e) => setEscala(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-purple-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-bold text-purple-600 w-12 text-right">
                      {(escala * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Rotación */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Rotación
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="360"
                      step="5"
                      value={rotacion}
                      onChange={(e) => setRotacion(parseInt(e.target.value))}
                      className="flex-1 h-2 bg-blue-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-bold text-blue-600 w-12 text-right">
                      {rotacion}°
                    </span>
                  </div>
                </div>

                {/* Posición X */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Posición Horizontal
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="5"
                      value={
                        mostrandoControles === "delantera"
                          ? posicionDelantera.x
                          : posicionTrasera.x
                      }
                      onChange={(e) => {
                        const valor = parseInt(e.target.value);
                        if (mostrandoControles === "delantera") {
                          setPosicionDelantera({
                            ...posicionDelantera,
                            x: valor,
                          });
                        } else {
                          setPosicionTrasera({ ...posicionTrasera, x: valor });
                        }
                      }}
                      className="flex-1 h-2 bg-green-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-bold text-green-600 w-12 text-right">
                      {mostrandoControles === "delantera"
                        ? posicionDelantera.x
                        : posicionTrasera.x}
                    </span>
                  </div>
                </div>

                {/* Posición Y */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Posición Vertical
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="-150"
                      max="150"
                      step="5"
                      value={
                        mostrandoControles === "delantera"
                          ? posicionDelantera.y
                          : posicionTrasera.y
                      }
                      onChange={(e) => {
                        const valor = parseInt(e.target.value);
                        if (mostrandoControles === "delantera") {
                          setPosicionDelantera({
                            ...posicionDelantera,
                            y: valor,
                          });
                        } else {
                          setPosicionTrasera({ ...posicionTrasera, y: valor });
                        }
                      }}
                      className="flex-1 h-2 bg-orange-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-bold text-orange-600 w-12 text-right">
                      {mostrandoControles === "delantera"
                        ? posicionDelantera.y
                        : posicionTrasera.y}
                    </span>
                  </div>
                </div>

                {/* Botón Reset */}
                <button
                  onClick={() => {
                    if (mostrandoControles === "delantera") {
                      setPosicionDelantera({ x: 0, y: 0 });
                    } else {
                      setPosicionTrasera({ x: 0, y: 0 });
                    }
                    setEscala(1);
                    setRotacion(0);
                  }}
                  className="w-full bg-gray-400 text-white py-2 rounded-lg font-semibold hover:bg-gray-500 transition-all"
                >
                  ↺ Resetear
                </button>
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-4 justify-between pt-6 border-t">
              <button
                onClick={() => setPaso(2)}
                className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg"
              >
                ← Volver
              </button>
              <button
                onClick={() => setPaso(4)}
                className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
              >
                Ver Resultado →
              </button>
            </div>
          </div>
        )}
        {/* Paso 4: Resultado Final */}
        {paso === 4 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>✨</span>
              Paso 4: Resultado Final
            </h2>
            <p className="text-gray-600 mb-8">
              Aquí está tu vehículo con los rines personalizados
            </p>

            {/* Contenedor de visualización */}
            <div className="mb-8">
              <div className="bg-gray-100 rounded-2xl border-4 border-gray-300 p-8 overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Rueda Delantera */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🔴</span> Rueda Delantera
                    </h3>
                    <div className="bg-white rounded-xl border-2 border-gray-200 w-full">
                      <canvas
                        ref={canvasDelRef}
                        width={400}
                        height={320}
                        className="w-full h-80 block rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Rueda Trasera */}
                  <div className="flex flex-col items-center">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <span>🔵</span> Rueda Trasera
                    </h3>
                    <div className="bg-white rounded-xl border-2 border-gray-200 w-full">
                      <canvas
                        ref={canvasTrasRef}
                        width={400}
                        height={320}
                        className="w-full h-80 block rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información del rin seleccionado */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📋 Detalles de tu Personalización
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-1">Rin Seleccionado</p>
                  <p className="font-bold text-purple-700">
                    {rinSeleccionado?.referencia}
                  </p>
                  <p className="text-xs text-gray-500">
                    {rinSeleccionado?.marca}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-1">Medida</p>
                  <p className="font-bold text-blue-700">
                    {rinSeleccionado?.medida}"
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-green-200">
                  <p className="text-sm text-gray-600 mb-1">Tamaño Aplicado</p>
                  <p className="font-bold text-green-700">
                    {(escala * 100).toFixed(0)}%
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-orange-200">
                  <p className="text-sm text-gray-600 mb-1">Rotación</p>
                  <p className="font-bold text-orange-700">{rotacion}°</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                💾 Descargar y Compartir
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  onClick={() => {
                    const canvas = canvasDelRef.current;
                    if (canvas) {
                      try {
                        canvas.toBlob((blob) => {
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `rueda-delantera-${
                            rinSeleccionado?.referencia || "rin"
                          }.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        });
                        setMensaje("✅ Rueda delantera descargada");
                        setTimeout(() => setMensaje(""), 3000);
                      } catch (error) {
                        console.error("Error al descargar:", error);
                        setMensaje("❌ Error al descargar la imagen");
                        setTimeout(() => setMensaje(""), 3000);
                      }
                    }
                  }}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  📥 Descargar Delantera
                </button>

                <button
                  onClick={() => {
                    const canvas = canvasTrasRef.current;
                    if (canvas) {
                      try {
                        canvas.toBlob((blob) => {
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `rueda-trasera-${
                            rinSeleccionado?.referencia || "rin"
                          }.png`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                          URL.revokeObjectURL(url);
                        });
                        setMensaje("✅ Rueda trasera descargada");
                        setTimeout(() => setMensaje(""), 3000);
                      } catch (error) {
                        console.error("Error al descargar:", error);
                        setMensaje("❌ Error al descargar la imagen");
                        setTimeout(() => setMensaje(""), 3000);
                      }
                    }
                  }}
                  className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
                >
                  📥 Descargar Trasera
                </button>

                <button
                  onClick={() => {
                    setMensaje(
                      "💡 Tip: Descarga ambas imágenes individualmente"
                    );
                    setTimeout(() => setMensaje(""), 4000);
                  }}
                  className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
                >
                  📥 Descargar Todo
                </button>
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-4 justify-between pt-6 border-t mt-8 flex-wrap">
              <button
                onClick={() => setPaso(3)}
                className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg"
              >
                ← Volver a Ajustes
              </button>

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setPaso(1);
                    setImagenVehiculo(null);
                    setImagenVehiculoURL(null);
                    setRinSeleccionado(null);
                    setEscala(1);
                    setRotacion(0);
                    setPosicionDelantera({ x: 0, y: 0 });
                    setPosicionTrasera({ x: 0, y: 0 });
                    setMensaje("🔄 Comenzando de nuevo...");
                    setTimeout(() => setMensaje(""), 2000);
                  }}
                  className="bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg"
                >
                  🔄 Comenzar de Nuevo
                </button>

                <button
                  onClick={() => navigate("/rines")}
                  className="bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg"
                >
                  ← Volver a Rines
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisualizadorRines;
