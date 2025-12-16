import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function GestionPromociones() {
  const navigate = useNavigate();
  const [promociones, setPromociones] = useState([]);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actividad, setActividad] = useState([]);
  const [sqlGenerado, setSqlGenerado] = useState("");
  const [textoPromociones, setTextoPromociones] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("YOKOHAMA");

  const generarSQLManual = () => {
  setProcesando(true);
  setMensaje("🔄 Generando SQL...");
  setSqlGenerado("");

  try {
    const lineas = textoPromociones.split('\n').filter(l => l.trim());
    
    // Regex para detectar líneas
    const regex = /(\d{3}\/\d{2}\s*R\d{2}[A-Z]*)\s+([A-Z0-9\s\.]+?)\s+(\d+)\s+\$?([\d,\.]+)/i;
    
    let promociones = [];

    lineas.forEach(linea => {
      const match = linea.match(regex);
      if (match) {
        const referencia = match[1].trim().replace(/\s+/g, "");
        const diseno = match[2].trim();
        const cantidades = parseInt(match[3]);
        const precioTexto = match[4].replace(/[,$\.]/g, "");
        const precio = parseFloat(precioTexto);

        if (referencia && !isNaN(precio) && precio > 0) {
          promociones.push({ referencia, diseno, precio, cantidades });
        }
      }
    });

    if (promociones.length === 0) {
      setMensaje("⚠️ No se detectaron promociones válidas en el texto");
      setProcesando(false);
      return;
    }

    // Generar SQL
    const mesActual = new Date().toLocaleDateString("es-CO", {
      month: "long",
      year: "numeric",
    });

    let sqlScript = `-- Promociones de ${marcaSeleccionada} - ${mesActual}\n`;
    sqlScript += `-- Total: ${promociones.length} referencias\n\n`;
    sqlScript += `-- Desactivar promociones anteriores\n`;
    sqlScript += `UPDATE promociones SET activa=false WHERE marca='${marcaSeleccionada}' AND activa=true;\n\n`;
    sqlScript += `-- Insertar nuevas promociones\n`;
    sqlScript += `INSERT INTO promociones (marca, referencia, diseno, precio_promo, cantidades_disponibles, mes, activa) VALUES\n`;

    promociones.forEach((promo, index) => {
      const coma = index < promociones.length - 1 ? "," : ";";
      sqlScript += `('${marcaSeleccionada}', '${promo.referencia}', '${promo.diseno}', ${promo.precio}, ${promo.cantidades}, '${mesActual}', true)${coma}\n`;
    });

    setSqlGenerado(sqlScript);
    setMensaje(`✅ ${promociones.length} promociones detectadas de ${marcaSeleccionada}`);
  } catch (err) {
    console.error("Error generando SQL:", err);
    setMensaje("❌ Error generando SQL: " + err.message);
  } finally {
    setProcesando(false);
  }
};

  const API_URL = "https://mi-app-llantas.onrender.com";

  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/promociones`);
      setPromociones(data);
      agregarLog(`📊 ${data.length} promociones cargadas`);
    } catch (err) {
      console.error("Error cargando promociones:", err);
      setMensaje("❌ Error cargando promociones");
    } finally {
      setCargando(false);
    }
  };

  const procesarPDF = async () => {
    if (!archivoSeleccionado) {
      setMensaje("⚠️ Selecciona un archivo PDF primero");
      return;
    }

    setProcesando(true);
    setMensaje("📄 Procesando PDF...");
    setSqlGenerado("");

    try {
      const formData = new FormData();
      formData.append("pdf", archivoSeleccionado);

      const { data } = await axios.post(
        `${API_URL}/api/procesar-promociones`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (data.esImagen) {
        setMensaje("⚠️ " + data.mensaje);
        agregarLog("⚠️ PDF es imagen - usar OCR");
        return;
      }

      if (data.success) {
        setMensaje(
          `✅ ${data.totalPromociones} promociones detectadas de ${data.marca}`
        );
        setSqlGenerado(data.sqlScript);
        agregarLog(
          `✅ SQL generado: ${data.totalPromociones} promos de ${data.marca}`
        );
      }
    } catch (err) {
      console.error("Error procesando PDF:", err);
      setMensaje(
        "❌ Error procesando PDF: " +
          (err.response?.data?.detalle || err.message)
      );
      agregarLog(`❌ Error procesando PDF`);
    } finally {
      setProcesando(false);
    }
  };

  const copiarSQL = () => {
    navigator.clipboard.writeText(sqlGenerado);
    setMensaje("✅ SQL copiado al portapapeles");
    agregarLog("📋 SQL copiado al portapapeles");
  };

  const desactivarPromocion = async (id) => {
    if (!window.confirm("¿Desactivar esta promoción?")) return;

    try {
      await axios.post(`${API_URL}/api/desactivar-promocion`, { id });
      setMensaje("✅ Promoción desactivada");
      agregarLog(`🔴 Promoción ID ${id} desactivada`);
      cargarPromociones();
    } catch (err) {
      console.error("Error desactivando promoción:", err);
      setMensaje("❌ Error desactivando promoción");
    }
  };

  const limpiarInactivas = async () => {
    if (!window.confirm("¿Eliminar TODAS las promociones inactivas?")) return;

    try {
      await axios.post(`${API_URL}/api/limpiar-promociones-inactivas`);
      setMensaje("✅ Promociones inactivas eliminadas");
      agregarLog(`🗑️ Promociones inactivas eliminadas`);
      cargarPromociones();
    } catch (err) {
      console.error("Error limpiando promociones:", err);
      setMensaje("❌ Error limpiando promociones");
    }
  };

  const agregarLog = (texto) => {
    const hora = new Date().toLocaleTimeString("es-CO");
    setActividad((prev) => [`[${hora}] ${texto}`, ...prev].slice(0, 10));
  };

  // Agrupar promociones por marca
  const promocionesPorMarca = promociones.reduce((acc, promo) => {
    if (!acc[promo.marca]) {
      acc[promo.marca] = [];
    }
    acc[promo.marca].push(promo);
    return acc;
  }, {});

  const totalActivas = promociones.filter((p) => p.activa).length;
  const totalInactivas = promociones.filter((p) => !p.activa).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <img src="/logowp.PNG" className="h-12 w-auto" alt="Logo" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  🎉 Gestión de Promociones
                </h1>
                <p className="text-sm text-gray-600">
                  Genera SQL desde PDF y gestiona promociones
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate("/")}
              className="bg-slate-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-600 transition-all shadow-md hover:shadow-lg"
            >
              ← Volver
            </button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Promociones Activas
                </p>
                <p className="text-4xl font-bold text-green-600">
                  {totalActivas}
                </p>
              </div>
              <div className="text-5xl">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">
                  Promociones Inactivas
                </p>
                <p className="text-4xl font-bold text-gray-600">
                  {totalInactivas}
                </p>
              </div>
              <div className="text-5xl">⏸️</div>
            </div>
          </div>
        </div>

        {/* Generador de SQL */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Generar SQL para Promociones
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Pega aquí el texto extraído del PDF:
              </label>
              <textarea
                value={textoPromociones}
                onChange={(e) => setTextoPromociones(e.target.value)}
                placeholder="Ejemplo:
265/60R18  G015  62  649999
215/55R17  ES32  25  484999
205/55R16  ES32  534  299999"
                className="w-full h-64 p-4 border-2 border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={procesando}
              />
              <p className="text-sm text-gray-500 mt-1">
                Pega las líneas del PDF (referencia, diseño, cantidad, precio)
              </p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Marca:
              </label>
              <select
                value={marcaSeleccionada}
                onChange={(e) => setMarcaSeleccionada(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="YOKOHAMA">YOKOHAMA</option>
                <option value="PIRELLI">PIRELLI</option>
                <option value="GOODYEAR">GOODYEAR</option>
                <option value="FEDERAL">FEDERAL</option>
                <option value="NITTO">NITTO</option>
                <option value="MOMO">MOMO</option>
                <option value="ALLIANCE">ALLIANCE</option>
                <option value="VENOM">VENOM</option>
                <option value="GENERAL">GENERAL</option>
              </select>
            </div>

            <button
              onClick={generarSQLManual}
              disabled={procesando || !textoPromociones.trim()}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg ${
                procesando || !textoPromociones.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              }`}
            >
              {procesando ? "⏳ Generando..." : "🔄 Generar SQL"}
            </button>

            {mensaje && (
              <div
                className={`p-4 rounded-lg ${
                  mensaje.includes("✅")
                    ? "bg-green-50 border border-green-200 text-green-800"
                    : mensaje.includes("⚠️")
                    ? "bg-yellow-50 border border-yellow-200 text-yellow-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <p className="font-medium">{mensaje}</p>
              </div>
            )}

            {sqlGenerado && (
              <div className="mt-4 space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-green-800 font-bold mb-2">
                    ✅ SQL Generado - Listo para Supabase
                  </p>
                  <p className="text-sm text-green-700">
                    Copia este código y pégalo en Supabase SQL Editor
                  </p>
                </div>

                <div className="relative">
                  <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs max-h-96 overflow-y-auto border-2 border-gray-700 font-mono">
                    {sqlGenerado}
                  </pre>
                  <button
                    onClick={copiarSQL}
                    className="absolute top-2 right-2 bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-600 transition-all shadow-md"
                  >
                    📋 Copiar SQL
                  </button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 font-bold mb-2">
                    📝 Instrucciones:
                  </p>
                  <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                    <li>Click en "📋 Copiar SQL"</li>
                    <li>Ve a Supabase → SQL Editor</li>
                    <li>Pega el código</li>
                    <li>Click en "Run"</li>
                    <li>Recarga esta página para ver las promociones</li>
                    <li>¡Las promociones aparecerán en el Visor de Stock!</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Promociones */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📦 Promociones Activas
            </h2>
            {totalInactivas > 0 && (
              <button
                onClick={limpiarInactivas}
                className="bg-red-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-600 transition-all shadow-md hover:shadow-lg text-sm"
              >
                🗑️ Limpiar Inactivas ({totalInactivas})
              </button>
            )}
          </div>

          {cargando ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-700 mb-4"></div>
              <p className="text-gray-600">Cargando promociones...</p>
            </div>
          ) : promociones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No hay promociones cargadas
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Sube un PDF para generar el SQL
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.keys(promocionesPorMarca)
                .sort()
                .map((marca) => {
                  const promosActivas = promocionesPorMarca[marca].filter(
                    (p) => p.activa
                  );
                  const promosInactivas = promocionesPorMarca[marca].filter(
                    (p) => !p.activa
                  );

                  return (
                    <div
                      key={marca}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
                        <h3 className="text-lg font-bold">
                          {marca} ({promosActivas.length} activas)
                        </h3>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b">
                            <tr>
                              <th className="p-3 text-left text-xs font-bold text-gray-700">
                                Referencia
                              </th>
                              <th className="p-3 text-left text-xs font-bold text-gray-700">
                                Diseño
                              </th>
                              <th className="p-3 text-left text-xs font-bold text-gray-700">
                                Precio Promo
                              </th>
                              <th className="p-3 text-left text-xs font-bold text-gray-700">
                                Stock Promo
                              </th>
                              <th className="p-3 text-left text-xs font-bold text-gray-700">
                                Mes
                              </th>
                              <th className="p-3 text-left text-xs font-bold text-gray-700">
                                Estado
                              </th>
                              <th className="p-3 text-center text-xs font-bold text-gray-700">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {promocionesPorMarca[marca].map((promo, idx) => (
                              <tr
                                key={promo.id}
                                className={`${
                                  idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                } ${!promo.activa ? "opacity-50" : ""}`}
                              >
                                <td className="p-3 text-sm font-semibold text-gray-800">
                                  {promo.referencia}
                                </td>
                                <td className="p-3 text-sm text-gray-600">
                                  {promo.diseno || "—"}
                                </td>
                                <td className="p-3 text-sm font-bold text-green-600">
                                  $
                                  {Number(promo.precio_promo).toLocaleString(
                                    "es-CO"
                                  )}
                                </td>
                                <td className="p-3 text-sm text-gray-600">
                                  {promo.cantidades_disponibles || 0} unidades
                                </td>
                                <td className="p-3 text-sm text-gray-600">
                                  {promo.mes}
                                </td>
                                <td className="p-3 text-sm">
                                  {promo.activa ? (
                                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                      ✅ Activa
                                    </span>
                                  ) : (
                                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs font-bold">
                                      ⏸️ Inactiva
                                    </span>
                                  )}
                                </td>
                                <td className="p-3 text-center">
                                  {promo.activa && (
                                    <button
                                      onClick={() =>
                                        desactivarPromocion(promo.id)
                                      }
                                      className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition-all"
                                    >
                                      Desactivar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default GestionPromociones;
