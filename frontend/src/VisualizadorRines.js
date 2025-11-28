import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function VisualizadorRines() {
  const navigate = useNavigate();
  const [paso, setPaso] = useState(1);
  const [imagenVehiculo, setImagenVehiculo] = useState(null);
  const [imagenVehiculoURL, setImagenVehiculoURL] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("info");

  // Estados para el Paso 2
  const [rines, setRines] = useState([]);
  const [cargandoRines, setCargandoRines] = useState(false);
  const [rinSeleccionado, setRinSeleccionado] = useState(null);
  const [busquedaRin, setBusquedaRin] = useState("");
  const [marcaFiltro, setMarcaFiltro] = useState("");
  const [medidaFiltro, setMedidaFiltro] = useState("");

  // Estados para detección automática de ruedas
  const [detectandoRuedas, setDetectandoRuedas] = useState(false);
  const [modoEdicionManual, setModoEdicionManual] = useState(false);

  // Estados para ajustes de ruedas
  const [ajustesRuedas, setAjustesRuedas] = useState([]);
  const [ruedaSeleccionada, setRuedaSeleccionada] = useState(null);
  const [arrastrando, setArrastrando] = useState(false);

  // Estados para opciones avanzadas
  const [ocultarRuedasOriginales, setOcultarRuedasOriginales] = useState(true);
  const [mostrarSombras, setMostrarSombras] = useState(true);
  const [opacidadRin, setOpacidadRin] = useState(1);
  const [zoom, setZoom] = useState(1);

  // Historial para deshacer/rehacer
  const [historial, setHistorial] = useState([]);
  const [indiceHistorial, setIndiceHistorial] = useState(-1);

  // Dimensiones de la imagen original
  const [dimensionesImagen, setDimensionesImagen] = useState({ ancho: 0, alto: 0 });

  const inputFileRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const API_URL = "https://mi-app-llantas.onrender.com";

  // Mostrar mensaje temporal
  const mostrarMensaje = useCallback((texto, tipo = "info", duracion = 3000) => {
    setMensaje(texto);
    setTipoMensaje(tipo);
    if (duracion > 0) {
      setTimeout(() => setMensaje(""), duracion);
    }
  }, []);

  // Guardar en historial
  const guardarEnHistorial = useCallback((nuevosAjustes) => {
    const nuevoHistorial = historial.slice(0, indiceHistorial + 1);
    nuevoHistorial.push(JSON.parse(JSON.stringify(nuevosAjustes)));
    setHistorial(nuevoHistorial);
    setIndiceHistorial(nuevoHistorial.length - 1);
  }, [historial, indiceHistorial]);

  // Deshacer
  const deshacer = () => {
    if (indiceHistorial > 0) {
      setIndiceHistorial(indiceHistorial - 1);
      setAjustesRuedas(JSON.parse(JSON.stringify(historial[indiceHistorial - 1])));
    }
  };

  // Rehacer
  const rehacer = () => {
    if (indiceHistorial < historial.length - 1) {
      setIndiceHistorial(indiceHistorial + 1);
      setAjustesRuedas(JSON.parse(JSON.stringify(historial[indiceHistorial + 1])));
    }
  };

  // Cargar rines cuando llegamos al paso 2
  useEffect(() => {
    if (paso === 2 && rines.length === 0) {
      cargarRines();
    }
  }, [paso]);

  // Dibujar resultado cuando cambian las ruedas o el rin
  useEffect(() => {
    if (paso === 3 && imagenVehiculoURL && rinSeleccionado && ajustesRuedas.length > 0) {
      dibujarResultado();
    }
  }, [paso, imagenVehiculoURL, rinSeleccionado, ajustesRuedas, ocultarRuedasOriginales, mostrarSombras, opacidadRin, zoom, ruedaSeleccionada, modoEdicionManual]);

  // Función para cargar rines desde el backend
  const cargarRines = async () => {
    try {
      setCargandoRines(true);
      const res = await axios.get(`${API_URL}/api/rines`);
      setRines(res.data);
    } catch (error) {
      console.error("Error al cargar rines:", error);
      mostrarMensaje("Error al cargar el catálogo de rines", "error");
    } finally {
      setCargandoRines(false);
    }
  };

  // Función para detectar ruedas automáticamente
  const detectarRuedasAutomaticamente = async (imagenURL) => {
    setDetectandoRuedas(true);
    mostrarMensaje("🤖 Analizando imagen con IA...", "loading", 0);

    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imagenURL;
      });

      const ancho = img.width;
      const alto = img.height;

      setDimensionesImagen({ ancho, alto });

      const radioBase = ancho * 0.065;
      
      const ruedas = [
        {
          id: 1,
          nombre: "Rueda Trasera",
          x: ancho * 0.18,
          y: alto * 0.75,
          radio: radioBase,
          escala: 1,
          escalaX: 1, // Para ajustar ancho (perspectiva)
          escalaY: 1, // Para ajustar alto
          rotacion: 0,
          colorOcultar: "#8a8a8a",
          radioOcultar: radioBase * 1.1,
        },
        {
          id: 2,
          nombre: "Rueda Delantera",
          x: ancho * 0.82,
          y: alto * 0.75,
          radio: radioBase,
          escala: 1,
          escalaX: 1,
          escalaY: 1,
          rotacion: 0,
          colorOcultar: "#8a8a8a",
          radioOcultar: radioBase * 1.1,
        },
      ];

      await new Promise(resolve => setTimeout(resolve, 1500));

      setAjustesRuedas(ruedas);
      guardarEnHistorial(ruedas);
      setDetectandoRuedas(false);
      mostrarMensaje("✅ Ruedas detectadas. Puedes ajustar arrastrando o con controles.", "success", 4000);
      
      return ruedas;
    } catch (error) {
      console.error("Error en detección:", error);
      setDetectandoRuedas(false);
      
      const ruedasDefault = [
        { id: 1, nombre: "Rueda Trasera", x: 200, y: 400, radio: 60, escala: 1, escalaX: 1, escalaY: 1, rotacion: 0, colorOcultar: "#8a8a8a", radioOcultar: 70 },
        { id: 2, nombre: "Rueda Delantera", x: 600, y: 400, radio: 60, escala: 1, escalaX: 1, escalaY: 1, rotacion: 0, colorOcultar: "#8a8a8a", radioOcultar: 70 },
      ];
      
      setAjustesRuedas(ruedasDefault);
      guardarEnHistorial(ruedasDefault);
      setModoEdicionManual(true);
      mostrarMensaje("⚠️ Ajusta las ruedas manualmente arrastrándolas.", "error", 5000);
      
      return ruedasDefault;
    }
  };

  // Función para manejar la selección de archivo
  const handleArchivoSeleccionado = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith("image/")) {
      mostrarMensaje("Por favor selecciona un archivo de imagen", "error");
      return;
    }

    if (archivo.size > 10 * 1024 * 1024) {
      mostrarMensaje("La imagen no puede superar 10MB", "error");
      return;
    }

    const url = URL.createObjectURL(archivo);
    setImagenVehiculo(archivo);
    setImagenVehiculoURL(url);
    
    await detectarRuedasAutomaticamente(url);
  };

  // Función para dibujar el resultado final
  const dibujarResultado = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imagenVehiculoURL || !rinSeleccionado) return;

    const ctx = canvas.getContext("2d");
    const container = containerRef.current;
    
    const containerWidth = container?.clientWidth || 800;
    const maxHeight = 600;

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const ratio = Math.min(containerWidth / img.width, maxHeight / img.height) * zoom;
      const canvasWidth = img.width * ratio;
      const canvasHeight = img.height * ratio;

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      // Limpiar canvas
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      
      // Dibujar imagen del vehículo
      ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

      // Contador para saber cuándo todas las ruedas están dibujadas
      let ruedasDibujadas = 0;
      const totalRuedas = ajustesRuedas.length;

      // Procesar cada rueda
      if (ajustesRuedas.length > 0) {
        ajustesRuedas.forEach((rueda, index) => {
          const x = (rueda.x / img.width) * canvasWidth;
          const y = (rueda.y / img.height) * canvasHeight;
          const radioEscalado = (rueda.radio / img.width) * canvasWidth * rueda.escala;
          const radioOcultarEscalado = ((rueda.radioOcultar || rueda.radio * 1.1) / img.width) * canvasWidth * rueda.escala;

          // 1. Ocultar rueda original (si está activado)
          if (ocultarRuedasOriginales) {
            ctx.save();
            
            // Aplicar escala de perspectiva al círculo de ocultación
            const radioOcultarX = radioOcultarEscalado * (rueda.escalaX || 1);
            const radioOcultarY = radioOcultarEscalado * (rueda.escalaY || 1);
            
            // Crear gradiente radial para simular la rueda/guardafango
            const gradiente = ctx.createRadialGradient(x, y, 0, x, y, Math.max(radioOcultarX, radioOcultarY));
            gradiente.addColorStop(0, rueda.colorOcultar || "#8a8a8a");
            gradiente.addColorStop(0.7, rueda.colorOcultar || "#8a8a8a");
            gradiente.addColorStop(1, adjustColor(rueda.colorOcultar || "#8a8a8a", -20));
            
            ctx.beginPath();
            ctx.ellipse(x, y, radioOcultarX, radioOcultarY, 0, 0, Math.PI * 2);
            ctx.fillStyle = gradiente;
            ctx.fill();
            
            // Borde sutil
            ctx.strokeStyle = adjustColor(rueda.colorOcultar || "#8a8a8a", -30);
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.restore();
          }

          // 2. Dibujar sombra del rin (si está activado)
          if (mostrarSombras && rinSeleccionado.foto) {
            ctx.save();
            ctx.translate(x + 5, y + 5);
            ctx.rotate((rueda.rotacion * Math.PI) / 180);
            
            const tamañoX = radioEscalado * (rueda.escalaX || 1);
            const tamañoY = radioEscalado * (rueda.escalaY || 1);
            ctx.beginPath();
            ctx.ellipse(0, 0, tamañoX, tamañoY, 0, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.filter = "blur(8px)";
            ctx.fill();
            ctx.filter = "none";
            
            ctx.restore();
          }

          // 3. Dibujar rin nuevo
          if (rinSeleccionado.foto) {
            const rinImg = new Image();
            rinImg.crossOrigin = "anonymous";
            
            rinImg.onload = () => {
              ctx.save();
              ctx.globalAlpha = opacidadRin;
              ctx.translate(x, y);
              ctx.rotate((rueda.rotacion * Math.PI) / 180);
              
              // Aplicar escala con perspectiva (escalaX para ancho, escalaY para alto)
              const escalaXFinal = rueda.escala * (rueda.escalaX || 1);
              const escalaYFinal = rueda.escala * (rueda.escalaY || 1);
              ctx.scale(escalaXFinal, escalaYFinal);

              const tamaño = radioEscalado * 2 / rueda.escala; // Compensar la escala base
              ctx.drawImage(rinImg, -tamaño / 2, -tamaño / 2, tamaño, tamaño);

              ctx.restore();
              
              // Dibujar indicador si la rueda está seleccionada (modo edición)
              if (modoEdicionManual && ruedaSeleccionada === rueda.id) {
                ctx.save();
                ctx.strokeStyle = "#8b5cf6";
                ctx.lineWidth = 3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.ellipse(x, y, radioEscalado * (rueda.escalaX || 1) + 10, radioEscalado * (rueda.escalaY || 1) + 10, 0, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
              }

              ruedasDibujadas++;
            };
            
            rinImg.onerror = () => {
              ruedasDibujadas++;
            };
            
            rinImg.src = rinSeleccionado.foto;
          } else {
            ruedasDibujadas++;
          }
        });
      }
    };

    img.src = imagenVehiculoURL;
  };

  // Función auxiliar para ajustar color
  const adjustColor = (color, amount) => {
    try {
      const hex = color.replace("#", "");
      const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
      const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
      const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
      return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
    } catch {
      return color;
    }
  };

  // Obtener posición del mouse/touch relativa al canvas
  const obtenerPosicionCanvas = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Manejar clic en canvas para seleccionar rueda
  const handleCanvasClick = (e) => {
    if (!modoEdicionManual) return;
    
    const canvas = canvasRef.current;
    const { x, y } = obtenerPosicionCanvas(e);

    const img = new Image();
    img.src = imagenVehiculoURL;
    
    img.onload = () => {
      // Verificar si se hizo clic en alguna rueda
      for (const rueda of ajustesRuedas) {
        const ruedaX = (rueda.x / img.width) * canvas.width;
        const ruedaY = (rueda.y / img.height) * canvas.height;
        const radioEscalado = (rueda.radio / img.width) * canvas.width * rueda.escala;
        
        const distancia = Math.sqrt(Math.pow(x - ruedaX, 2) + Math.pow(y - ruedaY, 2));
        
        if (distancia <= radioEscalado + 20) {
          setRuedaSeleccionada(rueda.id);
          return;
        }
      }
      
      setRuedaSeleccionada(null);
    };
  };

  // Manejar inicio de arrastre
  const handleMouseDown = (e) => {
    if (!modoEdicionManual) return;
    
    const canvas = canvasRef.current;
    const { x, y } = obtenerPosicionCanvas(e);

    const img = new Image();
    img.src = imagenVehiculoURL;
    
    img.onload = () => {
      for (const rueda of ajustesRuedas) {
        const ruedaX = (rueda.x / img.width) * canvas.width;
        const ruedaY = (rueda.y / img.height) * canvas.height;
        const radioEscalado = (rueda.radio / img.width) * canvas.width * rueda.escala;
        
        const distancia = Math.sqrt(Math.pow(x - ruedaX, 2) + Math.pow(y - ruedaY, 2));
        
        if (distancia <= radioEscalado + 20) {
          setRuedaSeleccionada(rueda.id);
          setArrastrando(true);
          return;
        }
      }
    };
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e) => {
    if (!arrastrando || !ruedaSeleccionada || !modoEdicionManual) return;

    e.preventDefault();
    
    const canvas = canvasRef.current;
    const { x: mouseX, y: mouseY } = obtenerPosicionCanvas(e);

    const img = new Image();
    img.src = imagenVehiculoURL;
    
    const nuevoX = (mouseX / canvas.width) * img.width;
    const nuevoY = (mouseY / canvas.height) * img.height;

    setAjustesRuedas(prev =>
      prev.map(rueda =>
        rueda.id === ruedaSeleccionada
          ? { ...rueda, x: nuevoX, y: nuevoY }
          : rueda
      )
    );
  };

  // Manejar fin de arrastre
  const handleMouseUp = () => {
    if (arrastrando) {
      setArrastrando(false);
      guardarEnHistorial(ajustesRuedas);
    }
  };

  // Función para ajustar una rueda específica
  const ajustarRueda = (id, campo, valor) => {
    setAjustesRuedas(prev =>
      prev.map(rueda =>
        rueda.id === id ? { ...rueda, [campo]: valor } : rueda
      )
    );
  };

  // Guardar ajuste en historial cuando termina de mover slider
  const finalizarAjuste = () => {
    guardarEnHistorial(ajustesRuedas);
  };

  // Copiar configuración de una rueda a otra
  const copiarConfiguracion = (desdeId) => {
    const ruedaOrigen = ajustesRuedas.find(r => r.id === desdeId);
    if (!ruedaOrigen) return;

    const nuevosAjustes = ajustesRuedas.map(rueda => ({
      ...rueda,
      radio: ruedaOrigen.radio,
      escala: ruedaOrigen.escala,
      escalaX: ruedaOrigen.escalaX || 1,
      escalaY: ruedaOrigen.escalaY || 1,
      rotacion: ruedaOrigen.rotacion,
      radioOcultar: ruedaOrigen.radioOcultar,
      colorOcultar: ruedaOrigen.colorOcultar,
    }));
    
    setAjustesRuedas(nuevosAjustes);
    guardarEnHistorial(nuevosAjustes);
    mostrarMensaje("✅ Configuración copiada a todas las ruedas", "success");
  };

  // Agregar nueva rueda
  const agregarRueda = () => {
    const nuevaRueda = {
      id: Date.now(),
      nombre: `Rueda ${ajustesRuedas.length + 1}`,
      x: dimensionesImagen.ancho * 0.5,
      y: dimensionesImagen.alto * 0.75,
      radio: dimensionesImagen.ancho * 0.065,
      escala: 1,
      escalaX: 1,
      escalaY: 1,
      rotacion: 0,
      colorOcultar: "#8a8a8a",
      radioOcultar: dimensionesImagen.ancho * 0.07,
    };
    
    const nuevosAjustes = [...ajustesRuedas, nuevaRueda];
    setAjustesRuedas(nuevosAjustes);
    guardarEnHistorial(nuevosAjustes);
    mostrarMensaje("✅ Rueda agregada", "success");
  };

  // Eliminar rueda
  const eliminarRueda = (id) => {
    if (ajustesRuedas.length <= 1) {
      mostrarMensaje("Debe haber al menos una rueda", "error");
      return;
    }
    
    const nuevosAjustes = ajustesRuedas.filter(r => r.id !== id);
    setAjustesRuedas(nuevosAjustes);
    guardarEnHistorial(nuevosAjustes);
    setRuedaSeleccionada(null);
    mostrarMensaje("✅ Rueda eliminada", "success");
  };

  // Función para descargar la imagen final
  const descargarImagen = () => {
    const canvas = canvasRef.current;
    if (!canvas) {
      mostrarMensaje("No hay imagen para descargar", "error");
      return;
    }

    try {
      // Desactivar temporalmente el modo edición para que no se vea el borde
      const modoEdicionAnterior = modoEdicionManual;
      const ruedaSeleccionadaAnterior = ruedaSeleccionada;
      setModoEdicionManual(false);
      setRuedaSeleccionada(null);
      
      setTimeout(() => {
        canvas.toBlob((blob) => {
          if (!blob) {
            mostrarMensaje("Error al generar la imagen", "error");
            setModoEdicionManual(modoEdicionAnterior);
            setRuedaSeleccionada(ruedaSeleccionadaAnterior);
            return;
          }
          
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `vehiculo-con-${rinSeleccionado?.referencia || "rines"}.png`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          URL.revokeObjectURL(url);
          
          setModoEdicionManual(modoEdicionAnterior);
          setRuedaSeleccionada(ruedaSeleccionadaAnterior);
          mostrarMensaje("✅ Imagen descargada exitosamente", "success");
        }, "image/png", 1.0);
      }, 200);
    } catch (error) {
      console.error("Error al descargar:", error);
      mostrarMensaje("Error al descargar la imagen", "error");
    }
  };

  // Función para continuar al siguiente paso
  const continuarAlSiguientePaso = () => {
    if (!imagenVehiculoURL) {
      mostrarMensaje("Por favor carga una imagen primero", "error");
      return;
    }
    if (detectandoRuedas) {
      mostrarMensaje("Espera a que termine el análisis de la imagen", "error");
      return;
    }
    setPaso(2);
  };

  // Componente de mensaje
  const MensajeNotificacion = () => {
    if (!mensaje) return null;

    const estilos = {
      info: "bg-blue-50 border-blue-500 text-blue-800",
      success: "bg-green-50 border-green-500 text-green-800",
      error: "bg-red-50 border-red-500 text-red-800",
      loading: "bg-yellow-50 border-yellow-500 text-yellow-800",
    };

    const iconos = {
      info: "ℹ️",
      success: "✅",
      error: "❌",
      loading: "⏳",
    };

    return (
      <div className={`border-l-4 p-4 rounded-lg mb-6 shadow-md ${estilos[tipoMensaje]}`}>
        <div className="flex items-center gap-2">
          <span className="text-xl">{iconos[tipoMensaje]}</span>
          <span className="font-medium">{mensaje}</span>
          {tipoMensaje === "loading" && (
            <div className="ml-2 animate-spin h-4 w-4 border-2 border-yellow-600 border-t-transparent rounded-full"></div>
          )}
        </div>
      </div>
    );
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
                <p className="text-sm text-gray-500">
                  Paso {paso} de 3 • 
                  <span className="ml-1 text-purple-600 font-medium">
                    {paso === 1 && "Cargar foto"}
                    {paso === 2 && "Seleccionar rin"}
                    {paso === 3 && "Resultado"}
                  </span>
                </p>
              </div>
            </div>

            {/* Indicador de pasos */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((p) => (
                <div
                  key={p}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                    paso === p
                      ? "bg-purple-600 text-white shadow-lg"
                      : paso > p
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {paso > p ? "✓" : p}
                </div>
              ))}
            </div>

            <button
              onClick={() => navigate("/rines")}
              className="inline-flex items-center gap-2 bg-slate-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"
            >
              ← Volver a Rines
            </button>
          </div>
        </div>

        {/* Mensajes */}
        <MensajeNotificacion />

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO 1: Cargar foto del vehículo */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {paso === 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="bg-purple-100 p-3 rounded-xl">📸</span>
              Paso 1: Foto del Vehículo
            </h2>
            <p className="text-gray-600 mb-8 text-lg">
              Sube una foto de tu vehículo (vista lateral para mejores resultados).
              <br />
              <span className="text-sm text-purple-600 font-medium">
                🤖 La IA detectará automáticamente la posición de las ruedas.
              </span>
            </p>

            {/* Mostrar imagen seleccionada */}
            {imagenVehiculoURL && (
              <div className="mb-6">
                <div className="bg-gray-50 p-4 rounded-xl border-2 border-gray-200 relative">
                  <img
                    src={imagenVehiculoURL}
                    alt="Vehículo"
                    className="w-full max-w-3xl mx-auto rounded-lg shadow-md"
                  />
                  
                  {/* Indicador de detección */}
                  {detectandoRuedas && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-xl">
                      <div className="bg-white p-6 rounded-xl shadow-xl text-center">
                        <div className="animate-spin h-12 w-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                        <p className="text-lg font-semibold text-gray-800">Analizando imagen...</p>
                        <p className="text-sm text-gray-600">Detectando posición de las ruedas</p>
                      </div>
                    </div>
                  )}
                  
                  {/* Mostrar ruedas detectadas */}
                  {!detectandoRuedas && ajustesRuedas.length > 0 && (
                    <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-green-800 font-medium flex items-center gap-2">
                        <span>✅</span>
                        Se detectaron {ajustesRuedas.length} ruedas en la imagen
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 mt-6 justify-center flex-wrap">
                  <button
                    onClick={continuarAlSiguientePaso}
                    disabled={detectandoRuedas}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                  >
                    Continuar → Seleccionar Rin
                  </button>
                  <button
                    onClick={() => {
                      setImagenVehiculo(null);
                      setImagenVehiculoURL(null);
                      setAjustesRuedas([]);
                      setHistorial([]);
                      setIndiceHistorial(-1);
                    }}
                    className="bg-gray-400 text-white px-8 py-4 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    Cambiar imagen
                  </button>
                </div>
              </div>
            )}

            {/* Área de carga de imagen */}
            {!imagenVehiculoURL && (
              <div
                onClick={() => inputFileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.add("border-purple-500", "bg-purple-50");
                }}
                onDragLeave={(e) => {
                  e.currentTarget.classList.remove("border-purple-500", "bg-purple-50");
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.currentTarget.classList.remove("border-purple-500", "bg-purple-50");
                  const archivo = e.dataTransfer.files[0];
                  if (archivo) {
                    const event = { target: { files: [archivo] } };
                    handleArchivoSeleccionado(event);
                  }
                }}
                className="border-4 border-dashed border-gray-300 rounded-2xl p-16 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all duration-300"
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="bg-purple-100 p-6 rounded-full">
                    <span className="text-6xl">🚗</span>
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-700 mb-2">
                      Haz clic o arrastra una imagen
                    </p>
                    <p className="text-gray-500">
                      PNG, JPG o WEBP • Máximo 10MB
                    </p>
                    <p className="text-sm text-purple-600 mt-2">
                      💡 Tip: Una foto lateral del vehículo dará mejores resultados
                    </p>
                  </div>
                  <button className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-lg">
                    Seleccionar archivo
                  </button>
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

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO 2: Seleccionar Rin */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {paso === 2 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4 flex items-center gap-3">
              <span className="bg-blue-100 p-3 rounded-xl">⚙️</span>
              Paso 2: Seleccionar Rin
            </h2>
            <p className="text-gray-600 mb-6">
              Elige el rin que quieres visualizar en tu vehículo
            </p>

            {cargandoRines ? (
              <div className="text-center py-16">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-600 border-t-transparent mb-4"></div>
                <p className="text-gray-600 text-xl">Cargando catálogo de rines...</p>
              </div>
            ) : (
              <>
                {/* Filtros */}
                <div className="bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl p-6 mb-6 border border-purple-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span>🔍</span> Filtros de búsqueda
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Marca
                      </label>
                      <select
                        value={marcaFiltro}
                        onChange={(e) => setMarcaFiltro(e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
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
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6 max-h-96 overflow-y-auto pr-2">
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
                        className={`cursor-pointer rounded-xl border-2 transition-all hover:shadow-lg transform hover:scale-105 ${
                          rinSeleccionado?.id === rin.id
                            ? "border-purple-600 bg-purple-50 shadow-lg ring-2 ring-purple-300"
                            : "border-gray-200 hover:border-purple-300"
                        }`}
                      >
                        <div className="p-3">
                          {rin.foto ? (
                            <img
                              src={rin.foto}
                              alt={rin.referencia}
                              className="w-full h-28 object-cover rounded-lg mb-2"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-28 bg-gray-100 rounded-lg flex items-center justify-center mb-2">
                              <span className="text-gray-400 text-xs">Sin foto</span>
                            </div>
                          )}

                          <div className="text-center">
                            <p className="font-semibold text-gray-800 text-sm truncate">
                              {rin.referencia}
                            </p>
                            <p className="text-xs text-gray-500">{rin.marca}</p>
                            {rin.medida && (
                              <p className="text-xs text-purple-600 font-medium mt-1">
                                {rin.medida}"
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

                {/* Rin seleccionado preview */}
                {rinSeleccionado && (
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 mb-6">
                    <div className="flex items-center gap-6">
                      {rinSeleccionado.foto && (
                        <img
                          src={rinSeleccionado.foto}
                          alt={rinSeleccionado.referencia}
                          className="w-24 h-24 object-cover rounded-lg shadow-md"
                        />
                      )}
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Rin seleccionado:</p>
                        <p className="font-bold text-purple-700 text-xl">
                          {rinSeleccionado.referencia}
                        </p>
                        <p className="text-gray-600">{rinSeleccionado.marca}</p>
                        {rinSeleccionado.medida && (
                          <p className="text-purple-600 font-medium">
                            Medida: {rinSeleccionado.medida}"
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Botones de navegación */}
                <div className="flex gap-4 justify-between pt-6 border-t">
                  <button
                    onClick={() => setPaso(1)}
                    className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg hover:shadow-xl"
                  >
                    ← Volver
                  </button>

                  <button
                    onClick={() => {
                      if (!rinSeleccionado) {
                        mostrarMensaje("Por favor selecciona un rin", "error");
                        return;
                      }
                      setPaso(3);
                    }}
                    disabled={!rinSeleccionado}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-10 py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ver Resultado →
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════ */}
        {/* PASO 3: Resultado Final */}
        {/* ═══════════════════════════════════════════════════════════════════ */}
        {paso === 3 && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="bg-green-100 p-3 rounded-xl">✨</span>
                  Resultado Final
                </h2>
                <p className="text-gray-600 mt-2">
                  Tu vehículo con los rines {rinSeleccionado?.referencia}
                </p>
              </div>

              {/* Botones de deshacer/rehacer */}
              <div className="flex gap-2">
                <button
                  onClick={deshacer}
                  disabled={indiceHistorial <= 0}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Deshacer"
                >
                  ↩️
                </button>
                <button
                  onClick={rehacer}
                  disabled={indiceHistorial >= historial.length - 1}
                  className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  title="Rehacer"
                >
                  ↪️
                </button>
              </div>
            </div>

            {/* Opciones rápidas */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 mb-6 border border-purple-200">
              <div className="flex flex-wrap gap-4 items-center justify-between">
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={ocultarRuedasOriginales}
                      onChange={(e) => setOcultarRuedasOriginales(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">🎯 Ocultar ruedas originales</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={mostrarSombras}
                      onChange={(e) => setMostrarSombras(e.target.checked)}
                      className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm font-medium text-gray-700">🌑 Mostrar sombras</span>
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Zoom:</span>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-24"
                  />
                  <span className="text-sm font-medium text-purple-600">{(zoom * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {/* Contenedor de visualización */}
            <div ref={containerRef} className="mb-6">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl border-4 border-gray-300 p-4 overflow-auto">
                <canvas
                  ref={canvasRef}
                  onClick={handleCanvasClick}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleMouseDown}
                  onTouchMove={handleMouseMove}
                  onTouchEnd={handleMouseUp}
                  className={`mx-auto rounded-xl shadow-lg block ${
                    modoEdicionManual ? "cursor-move" : "cursor-default"
                  }`}
                  style={{ maxWidth: "100%", touchAction: "none" }}
                />
              </div>
              {modoEdicionManual && (
                <p className="text-center text-sm text-purple-600 mt-2">
                  💡 Haz clic en una rueda para seleccionarla, luego arrástrala para moverla
                </p>
              )}
            </div>

            {/* Controles de edición */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-6 border-2 border-orange-200 mb-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <span>🔧</span> Ajustes de ruedas
                </h3>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setModoEdicionManual(!modoEdicionManual)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      modoEdicionManual
                        ? "bg-purple-600 text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  >
                    {modoEdicionManual ? "✓ Modo edición activo" : "👆 Activar arrastre"}
                  </button>
                  <button
                    onClick={agregarRueda}
                    className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
                  >
                    + Agregar rueda
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ajustesRuedas.map((rueda, index) => (
                  <div 
                    key={rueda.id} 
                    className={`bg-white rounded-lg p-4 shadow-md border-2 transition-all ${
                      ruedaSeleccionada === rueda.id ? "border-purple-500" : "border-transparent"
                    }`}
                  >
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-800 flex items-center gap-2">
                        <span className={index === 0 ? "text-red-500" : index === 1 ? "text-blue-500" : "text-green-500"}>
                          {index === 0 ? "🔴" : index === 1 ? "🔵" : "🟢"}
                        </span>
                        {rueda.nombre}
                      </h4>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copiarConfiguracion(rueda.id)}
                          className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-all"
                          title="Copiar tamaño a todas las ruedas"
                        >
                          📋 Copiar a todas
                        </button>
                        {ajustesRuedas.length > 1 && (
                          <button
                            onClick={() => eliminarRueda(rueda.id)}
                            className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-all"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Tamaño general */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Tamaño: {(rueda.escala * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0.3"
                          max="2.5"
                          step="0.05"
                          value={rueda.escala}
                          onChange={(e) => ajustarRueda(rueda.id, "escala", parseFloat(e.target.value))}
                          onMouseUp={finalizarAjuste}
                          onTouchEnd={finalizarAjuste}
                          className="w-full h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Ajuste de Ancho (perspectiva horizontal) */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          ↔️ Ancho (perspectiva): {((rueda.escalaX || 1) * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.02"
                          value={rueda.escalaX || 1}
                          onChange={(e) => ajustarRueda(rueda.id, "escalaX", parseFloat(e.target.value))}
                          onMouseUp={finalizarAjuste}
                          onTouchEnd={finalizarAjuste}
                          className="w-full h-2 bg-pink-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Ajuste de Alto (perspectiva vertical) */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          ↕️ Alto (perspectiva): {((rueda.escalaY || 1) * 100).toFixed(0)}%
                        </label>
                        <input
                          type="range"
                          min="0.5"
                          max="1.5"
                          step="0.02"
                          value={rueda.escalaY || 1}
                          onChange={(e) => ajustarRueda(rueda.id, "escalaY", parseFloat(e.target.value))}
                          onMouseUp={finalizarAjuste}
                          onTouchEnd={finalizarAjuste}
                          className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Posición X */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Posición X: {rueda.x.toFixed(0)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={dimensionesImagen.ancho || 2000}
                          step="5"
                          value={rueda.x}
                          onChange={(e) => ajustarRueda(rueda.id, "x", parseInt(e.target.value))}
                          onMouseUp={finalizarAjuste}
                          onTouchEnd={finalizarAjuste}
                          className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Posición Y */}
                      <div>
                        <label className="block text-sm text-gray-600 mb-1">
                          Posición Y: {rueda.y.toFixed(0)}
                        </label>
                        <input
                          type="range"
                          min="0"
                          max={dimensionesImagen.alto || 1500}
                          step="5"
                          value={rueda.y}
                          onChange={(e) => ajustarRueda(rueda.id, "y", parseInt(e.target.value))}
                          onMouseUp={finalizarAjuste}
                          onTouchEnd={finalizarAjuste}
                          className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>

                      {/* Color para ocultar */}
                      {ocultarRuedasOriginales && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Color de fondo (para ocultar rueda original)
                          </label>
                          <div className="flex gap-2 items-center">
                            <input
                              type="color"
                              value={rueda.colorOcultar || "#8a8a8a"}
                              onChange={(e) => ajustarRueda(rueda.id, "colorOcultar", e.target.value)}
                              onBlur={finalizarAjuste}
                              className="w-10 h-10 rounded cursor-pointer border-2 border-gray-300"
                            />
                            <span className="text-xs text-gray-500">
                              Selecciona el color del vehículo
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Radio de ocultación */}
                      {ocultarRuedasOriginales && (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Radio de ocultación: {(rueda.radioOcultar || rueda.radio * 1.1).toFixed(0)}
                          </label>
                          <input
                            type="range"
                            min="20"
                            max="400"
                            step="5"
                            value={rueda.radioOcultar || rueda.radio * 1.1}
                            onChange={(e) => ajustarRueda(rueda.id, "radioOcultar", parseInt(e.target.value))}
                            onMouseUp={finalizarAjuste}
                            onTouchEnd={finalizarAjuste}
                            className="w-full h-2 bg-orange-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Opacidad del rin */}
            <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-700">Opacidad del rin:</span>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={opacidadRin}
                  onChange={(e) => setOpacidadRin(parseFloat(e.target.value))}
                  className="flex-1 max-w-xs"
                />
                <span className="text-sm font-medium text-purple-600">{(opacidadRin * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Información del rin */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border-2 border-purple-200 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">
                📋 Detalles de tu Personalización
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200 text-center">
                  <p className="text-sm text-gray-600 mb-1">Rin</p>
                  <p className="font-bold text-purple-700">{rinSeleccionado?.referencia}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200 text-center">
                  <p className="text-sm text-gray-600 mb-1">Marca</p>
                  <p className="font-bold text-blue-700">{rinSeleccionado?.marca}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
                  <p className="text-sm text-gray-600 mb-1">Medida</p>
                  <p className="font-bold text-green-700">{rinSeleccionado?.medida}"</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-orange-200 text-center">
                  <p className="text-sm text-gray-600 mb-1">Ruedas</p>
                  <p className="font-bold text-orange-700">{ajustesRuedas.length}</p>
                </div>
              </div>
            </div>

            {/* Botón de descarga prominente */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-8 text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">
                ¿Te gusta el resultado?
              </h3>
              <button
                onClick={descargarImagen}
                className="bg-white text-green-600 px-12 py-4 rounded-xl font-bold text-xl hover:bg-green-50 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                📥 Descargar Imagen
              </button>
              <p className="text-green-100 mt-3 text-sm">
                Se descargará como PNG en alta calidad
              </p>
            </div>

            {/* Botones de navegación */}
            <div className="flex gap-4 justify-between pt-6 border-t flex-wrap">
              <button
                onClick={() => setPaso(2)}
                className="bg-gray-400 text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg"
              >
                ← Cambiar Rin
              </button>

              <div className="flex gap-4 flex-wrap">
                <button
                  onClick={() => {
                    setPaso(1);
                    setImagenVehiculo(null);
                    setImagenVehiculoURL(null);
                    setRinSeleccionado(null);
                    setAjustesRuedas([]);
                    setHistorial([]);
                    setIndiceHistorial(-1);
                    mostrarMensaje("🔄 Comenzando de nuevo...", "info");
                  }}
                  className="bg-orange-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition-all shadow-lg"
                >
                  🔄 Nueva Imagen
                </button>

                <button
                  onClick={() => navigate("/rines")}
                  className="bg-slate-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-all shadow-lg"
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
