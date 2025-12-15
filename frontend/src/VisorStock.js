import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./index.css";

function VisorStock() {
  const navigate = useNavigate();
  const [llantas, setLlantas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);

  const API_URL = "https://mi-app-llantas.onrender.com";

  useEffect(() => {
    axios
      .get(`${API_URL}/api/llantas`)
      .then((res) => {
        setLlantas(res.data);
        // Auto-seleccionar la primera marca
        const marcas = [...new Set(res.data.map((l) => l.marca))].sort();
        if (marcas.length > 0) {
          setMarcaSeleccionada(marcas[0]);
        }
      })
      .catch((err) => console.error("Error:", err))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(llantas.map((l) => l.marca))].sort();
  const llantasFiltradas = llantas.filter((l) => l.marca === marcaSeleccionada);
  const totalUnidades = llantasFiltradas.reduce((sum, l) => sum + (l.stock || 0), 0);

  const copiarTexto = () => {
    let texto = `📋 STOCK ${marcaSeleccionada.toUpperCase()}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    llantasFiltradas.forEach((l) => {
      const alerta = l.stock === 0 ? " ❌" : l.stock <= 3 ? " ⚠️" : "";
      texto += `${l.referencia}: ${l.stock} unidades${alerta}\n`;
    });
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `TOTAL: ${totalUnidades} llantas`;

    navigator.clipboard.writeText(texto);
    alert("✅ Copiado al portapapeles");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <img src="/logowp.PNG" className="h-12 w-auto" alt="Logo" />
              <h1 className="text-2xl font-bold text-gray-800">
                📊 Visor Rápido de Stock
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 bg-slate-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando inventario...</p>
          </div>
        ) : (
          <>
            {/* Selector de Marca - GRANDE Y VISIBLE */}
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
              <label className="block text-xl font-bold text-gray-800 mb-4">
                Seleccionar Marca:
              </label>
              <select
                value={marcaSeleccionada}
                onChange={(e) => setMarcaSeleccionada(e.target.value)}
                className="w-full px-6 py-4 text-2xl font-bold border-4 border-slate-300 rounded-xl shadow-lg focus:ring-4 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200 bg-slate-50"
              >
                {marcasUnicas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            {/* Resumen */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl shadow-lg p-6 mb-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{marcaSeleccionada}</h2>
                  <p className="text-xl opacity-90">
                    {llantasFiltradas.length} referencias • {totalUnidades} unidades totales
                  </p>
                </div>
                <button
                  onClick={copiarTexto}
                  className="bg-white text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl"
                >
                  📋 Copiar
                </button>
              </div>
            </div>

            {/* Tabla Simple y Limpia */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2 border-slate-300">
                    <tr>
                      <th className="p-4 text-left text-lg font-bold text-gray-700">
                        Referencia
                      </th>
                      <th className="p-4 text-left text-lg font-bold text-gray-700">
                        Proveedor
                      </th>
                      <th className="p-4 text-center text-lg font-bold text-gray-700">
                        Stock
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {llantasFiltradas.map((llanta, idx) => (
                      <tr
                        key={llanta.id}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="p-4">
                          <span className="text-xl font-semibold text-gray-800">
                            {llanta.referencia}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="text-lg text-gray-600">
                            {llanta.proveedor || "—"}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex justify-center">
                            {llanta.stock === 0 ? (
                              <span className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-6 py-3 rounded-full text-xl font-bold">
                                ❌ AGOTADO
                              </span>
                            ) : llanta.stock <= 3 ? (
                              <span className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-700 px-6 py-3 rounded-full text-xl font-bold">
                                ⚠️ {llanta.stock}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full text-xl font-bold">
                                ✅ {llanta.stock}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Productos Críticos si existen */}
            {llantasFiltradas.filter((l) => l.stock <= 3).length > 0 && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mt-6">
                <h3 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
                  ⚠️ Productos con Stock Crítico
                </h3>
                <div className="space-y-2">
                  {llantasFiltradas
                    .filter((l) => l.stock <= 3)
                    .map((l) => (
                      <div key={l.id} className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-red-700">
                          {l.referencia}
                        </span>
                        <span className="text-lg font-bold text-red-900">
                          {l.stock === 0 ? "AGOTADO" : `${l.stock} unidades`}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default VisorStock;