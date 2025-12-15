import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Upload, Trash2, Eye, EyeOff } from "lucide-react";
import "./index.css";

function GestionPromociones() {
  const navigate = useNavigate();
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [procesando, setProcesando] = useState(false);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  const API_URL = "https://mi-app-llantas.onrender.com";

  // Cargar promociones actuales
  useEffect(() => {
    cargarPromociones();
  }, []);

  const cargarPromociones = async () => {
    setCargando(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/promociones`);
      setPromociones(data);
    } catch (error) {
      console.error("Error cargando promociones:", error);
      setMensaje("Error al cargar promociones ❌");
    } finally {
      setCargando(false);
    }
  };

  const handleArchivoSeleccionado = (e) => {
    const archivo = e.target.files[0];
    if (archivo && archivo.type === "application/pdf") {
      setArchivoSeleccionado(archivo);
      setMensaje("");
    } else {
      setMensaje("⚠️ Solo se permiten archivos PDF");
      setArchivoSeleccionado(null);
    }
  };

  const procesarPDF = async () => {
    if (!archivoSeleccionado) {
      setMensaje("⚠️ Selecciona un archivo PDF primero");
      return;
    }

    setProcesando(true);
    setMensaje("📄 Procesando PDF...");

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

      setMensaje(
        `✅ ${data.promocionesAgregadas} promociones procesadas correctamente`
      );
      setArchivoSeleccionado(null);
      cargarPromociones();

      // Registrar actividad
      await axios.post(`${API_URL}/api/log-actividad`, {
        tipo: "CARGA DE PROMOCIONES",
        detalles: `Se cargaron ${data.promocionesAgregadas} promociones del PDF`,
        fecha: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error procesando PDF:", error);
      setMensaje(
        "❌ Error al procesar el PDF. Verifica el formato del archivo."
      );
    } finally {
      setProcesando(false);
    }
  };

  const desactivarPromocion = async (id) => {
    if (!window.confirm("¿Desactivar esta promoción?")) return;

    try {
      await axios.post(`${API_URL}/api/desactivar-promocion`, { id });
      setMensaje("✅ Promoción desactivada");
      cargarPromociones();
    } catch (error) {
      console.error("Error:", error);
      setMensaje("❌ Error al desactivar promoción");
    }
  };

  const limpiarPromocionesInactivas = async () => {
    if (
      !window.confirm(
        "¿Eliminar todas las promociones inactivas de la base de datos?"
      )
    )
      return;

    try {
      await axios.post(`${API_URL}/api/limpiar-promociones-inactivas`);
      setMensaje("✅ Promociones inactivas eliminadas");
      cargarPromociones();
    } catch (error) {
      console.error("Error:", error);
      setMensaje("❌ Error al limpiar promociones");
    }
  };

  const promocionesActivas = promociones.filter((p) => p.activa);
  const promocionesInactivas = promociones.filter((p) => !p.activa);

  // Agrupar por marca
  const promocionesPorMarca = promocionesActivas.reduce((acc, promo) => {
    if (!acc[promo.marca]) {
      acc[promo.marca] = [];
    }
    acc[promo.marca].push(promo);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <img src="/logowp.PNG" className="h-10 w-auto" alt="Logo" />
              <h1 className="text-xl font-bold text-gray-800">
                🎉 Gestión de Promociones
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>

        {/* Mensaje */}
        {mensaje && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg mb-4 shadow-md">
            <div className="flex items-center gap-2">
              <span className="text-lg">ℹ️</span>
              <span className="font-medium">{mensaje}</span>
            </div>
          </div>
        )}

        {cargando ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
            <p className="text-gray-600 text-base">Cargando promociones...</p>
          </div>
        ) : (
          <>
            {/* Panel de Carga */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Upload size={24} />
                Cargar Promociones desde PDF
              </h2>

              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleArchivoSeleccionado}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex flex-col items-center"
                  >
                    <Upload size={48} className="text-gray-400 mb-2" />
                    <span className="text-sm font-medium text-gray-700">
                      {archivoSeleccionado
                        ? archivoSeleccionado.name
                        : "Click para seleccionar PDF"}
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Formato: PDF de promociones del proveedor
                    </span>
                  </label>
                </div>

                <button
                  onClick={procesarPDF}
                  disabled={!archivoSeleccionado || procesando}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {procesando ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Upload size={20} />
                      Procesar y Cargar Promociones
                    </>
                  )}
                </button>

                <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800 font-medium">
                    📌 Instrucciones:
                  </p>
                  <ul className="text-xs text-yellow-700 mt-2 space-y-1 list-disc list-inside">
                    <li>Sube el PDF de promociones de Llantas & Tires</li>
                    <li>
                      El sistema detectará automáticamente las referencias y
                      precios
                    </li>
                    <li>Las promociones se activarán inmediatamente</li>
                    <li>
                      Aparecerán con badge "🎉 PROMO" en el visor de stock
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">
                  {promocionesActivas.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Promociones Activas
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-gray-500">
                <div className="text-3xl font-bold text-gray-600">
                  {promocionesInactivas.length}
                </div>
                <div className="text-sm text-gray-600 font-medium">
                  Promociones Inactivas
                </div>
              </div>
            </div>

            {/* Lista de Promociones Activas por Marca */}
            {Object.keys(promocionesPorMarca).length > 0 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-800">
                    🎯 Promociones Activas
                  </h2>
                  {promocionesInactivas.length > 0 && (
                    <button
                      onClick={limpiarPromocionesInactivas}
                      className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-all flex items-center gap-2"
                    >
                      <Trash2 size={16} />
                      Limpiar Inactivas ({promocionesInactivas.length})
                    </button>
                  )}
                </div>

                {Object.entries(promocionesPorMarca).map(([marca, promos]) => (
                  <div
                    key={marca}
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-green-600 to-green-700 p-4 text-white">
                      <h3 className="text-lg font-bold">
                        {marca} ({promos.length} promociones)
                      </h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-100 border-b">
                          <tr>
                            <th className="p-3 text-left text-xs font-bold text-gray-700">
                              Referencia
                            </th>
                            <th className="p-3 text-left text-xs font-bold text-gray-700">
                              Diseño
                            </th>
                            <th className="p-3 text-right text-xs font-bold text-gray-700">
                              Precio Promo
                            </th>
                            <th className="p-3 text-center text-xs font-bold text-gray-700">
                              Stock Promo
                            </th>
                            <th className="p-3 text-center text-xs font-bold text-gray-700">
                              Mes
                            </th>
                            <th className="p-3 text-center text-xs font-bold text-gray-700">
                              Acción
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {promos.map((promo, idx) => (
                            <tr
                              key={promo.id}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }
                            >
                              <td className="p-3">
                                <span className="font-semibold text-gray-800">
                                  {promo.referencia}
                                </span>
                              </td>
                              <td className="p-3 text-gray-600">
                                {promo.diseno || "—"}
                              </td>
                              <td className="p-3 text-right">
                                <span className="text-green-600 font-bold text-base">
                                  $
                                  {Number(promo.precio_promo).toLocaleString(
                                    "es-CO"
                                  )}
                                </span>
                              </td>
                              <td className="p-3 text-center text-gray-700 font-semibold">
                                {promo.cantidades_disponibles || 0}
                              </td>
                              <td className="p-3 text-center text-xs text-gray-600">
                                {promo.mes}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => desactivarPromocion(promo.id)}
                                  className="bg-red-100 text-red-600 hover:bg-red-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                                >
                                  Desactivar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {promocionesActivas.length === 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No hay promociones activas
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Sube un PDF para cargar promociones
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default GestionPromociones;