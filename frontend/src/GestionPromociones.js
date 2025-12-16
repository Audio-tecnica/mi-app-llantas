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

  const procesarExcel = async () => {
    if (!archivoSeleccionado) {
      setMensaje("⚠️ Selecciona un archivo Excel primero");
      return;
    }

    setProcesando(true);
    setMensaje("📊 Procesando Excel...");

    try {
      const formData = new FormData();
      formData.append("file", archivoSeleccionado);

      const { data } = await axios.post(
        `${API_URL}/api/procesar-promociones`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setMensaje(
        `✅ ${data.promocionesAgregadas} promociones procesadas correctamente (${data.marca} - ${data.mes})`
      );
      
      agregarLog(
        `✅ Procesado: ${data.promocionesAgregadas} promos de ${data.marca}`
      );

      setArchivoSeleccionado(null);
      cargarPromociones();
    } catch (err) {
      console.error("Error procesando Excel:", err);
      setMensaje("❌ Error procesando Excel: " + (err.response?.data?.detalle || err.message));
      agregarLog(`❌ Error procesando Excel`);
    } finally {
      setProcesando(false);
    }
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
                  Carga y administra las promociones mensuales
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
                <p className="text-4xl font-bold text-green-600">{totalActivas}</p>
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
                <p className="text-4xl font-bold text-gray-600">{totalInactivas}</p>
              </div>
              <div className="text-5xl">⏸️</div>
            </div>
          </div>
        </div>

        {/* Subir Excel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            📊 Cargar Promociones desde Excel
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Archivo Excel:
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none p-2"
                disabled={procesando}
              />
              <p className="text-sm text-gray-500 mt-1">
                Selecciona un archivo Excel (.xlsx) con las promociones
              </p>
              <p className="text-xs text-blue-600 mt-2">
                💡 Formato: marca | referencia | diseno | precio_promo | cantidad
              </p>
            </div>

            {archivoSeleccionado && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📄 Archivo seleccionado: <strong>{archivoSeleccionado.name}</strong>
                </p>
              </div>
            )}

            <button
              onClick={procesarExcel}
              disabled={procesando || !archivoSeleccionado}
              className={`w-full py-3 px-6 rounded-lg font-bold text-white transition-all shadow-md hover:shadow-lg ${
                procesando || !archivoSeleccionado
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
              }`}
            >
              {procesando ? "⏳ Procesando..." : "📊 Procesar y Cargar Promociones"}
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
          </div>
        </div>

        {/* Actividad reciente */}
        {actividad.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">
              📋 Actividad Reciente
            </h3>
            <div className="space-y-2">
              {actividad.map((log, idx) => (
                <div
                  key={idx}
                  className="text-sm text-gray-600 bg-gray-50 p-2 rounded border-l-2 border-blue-500"
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lista de Promociones */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              📦 Promociones Cargadas
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
                Sube un archivo Excel para comenzar
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
                    <div key={marca} className="border border-gray-200 rounded-lg overflow-hidden">
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
                                  ${Number(promo.precio_promo).toLocaleString("es-CO")}
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
                                      onClick={() => desactivarPromocion(promo.id)}
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