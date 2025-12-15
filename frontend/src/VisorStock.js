import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./index.css";

function VisorStock() {
  const navigate = useNavigate();
  const [llantas, setLlantas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ordenPor, setOrdenPor] = useState("referencia-asc"); // referencia-asc, referencia-desc, stock-asc, stock-desc
  const [filtroStock, setFiltroStock] = useState("todos"); // todos, pares, impares, criticos, agotados

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

  // Filtrar por marca
  let llantasFiltradas = llantas.filter((l) => l.marca === marcaSeleccionada);

  // Aplicar filtro de stock (pares/impares/críticos/agotados)
  if (filtroStock === "pares") {
    llantasFiltradas = llantasFiltradas.filter((l) => l.stock % 2 === 0);
  } else if (filtroStock === "impares") {
    llantasFiltradas = llantasFiltradas.filter((l) => l.stock % 2 !== 0 && l.stock > 0);
  } else if (filtroStock === "criticos") {
    llantasFiltradas = llantasFiltradas.filter((l) => l.stock > 0 && l.stock <= 3);
  } else if (filtroStock === "agotados") {
    llantasFiltradas = llantasFiltradas.filter((l) => l.stock === 0);
  }

  // Ordenar
  if (ordenPor === "referencia-asc") {
    llantasFiltradas.sort((a, b) => a.referencia.localeCompare(b.referencia));
  } else if (ordenPor === "referencia-desc") {
    llantasFiltradas.sort((a, b) => b.referencia.localeCompare(a.referencia));
  } else if (ordenPor === "stock-asc") {
    llantasFiltradas.sort((a, b) => a.stock - b.stock);
  } else if (ordenPor === "stock-desc") {
    llantasFiltradas.sort((a, b) => b.stock - a.stock);
  }

  const totalUnidades = llantasFiltradas.reduce((sum, l) => sum + (l.stock || 0), 0);
  const totalReferencias = llantasFiltradas.length;

  // Calcular estadísticas adicionales
  const stockPares = llantas.filter((l) => l.marca === marcaSeleccionada && l.stock % 2 === 0 && l.stock > 0).length;
  const stockImpares = llantas.filter((l) => l.marca === marcaSeleccionada && l.stock % 2 !== 0 && l.stock > 0).length;
  const stockCriticos = llantas.filter((l) => l.marca === marcaSeleccionada && l.stock > 0 && l.stock <= 3).length;
  const stockAgotados = llantas.filter((l) => l.marca === marcaSeleccionada && l.stock === 0).length;

  const copiarTexto = () => {
    let texto = `📋 STOCK ${marcaSeleccionada.toUpperCase()}\n`;
    texto += `Fecha: ${new Date().toLocaleDateString("es-CO")}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    llantasFiltradas.forEach((l) => {
      const alerta = l.stock === 0 ? " ❌" : l.stock <= 3 ? " ⚠️" : "";
      const parImpar = l.stock > 0 ? (l.stock % 2 === 0 ? " [PAR]" : " [IMPAR]") : "";
      texto += `${l.referencia}: ${l.stock} unidades${parImpar}${alerta}\n`;
    });
    
    texto += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `Total Referencias: ${totalReferencias}\n`;
    texto += `Total Unidades: ${totalUnidades}\n`;
    texto += `Stock Pares: ${stockPares}\n`;
    texto += `Stock Impares: ${stockImpares}\n`;
    texto += `Críticos (≤3): ${stockCriticos}\n`;
    texto += `Agotados: ${stockAgotados}`;

    navigator.clipboard.writeText(texto);
    alert("✅ Copiado al portapapeles");
  };

  const exportarExcel = () => {
    // Crear CSV simple
    let csv = "Referencia,Proveedor,Stock,Tipo\n";
    llantasFiltradas.forEach((l) => {
      const tipo = l.stock === 0 ? "AGOTADO" : l.stock <= 3 ? "CRÍTICO" : "OK";
      const parImpar = l.stock > 0 ? (l.stock % 2 === 0 ? "PAR" : "IMPAR") : "";
      csv += `${l.referencia},${l.proveedor || ""},${l.stock},${tipo} ${parImpar}\n`;
    });

    // Descargar
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_${marcaSeleccionada}_${new Date().toLocaleDateString("es-CO")}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
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
                onClick={exportarExcel}
                className="inline-flex items-center gap-2 bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-green-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                📥 Excel
              </button>
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
            {/* Panel de Control */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Selector de Marca */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🏷️ Marca:
                  </label>
                  <select
                    value={marcaSeleccionada}
                    onChange={(e) => setMarcaSeleccionada(e.target.value)}
                    className="w-full px-4 py-3 text-lg font-bold border-2 border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
                  >
                    {marcasUnicas.map((marca) => (
                      <option key={marca} value={marca}>
                        {marca}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Ordenar Por */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    📊 Ordenar por:
                  </label>
                  <select
                    value={ordenPor}
                    onChange={(e) => setOrdenPor(e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
                  >
                    <option value="referencia-asc">Referencia (A → Z)</option>
                    <option value="referencia-desc">Referencia (Z → A)</option>
                    <option value="stock-asc">Stock (Menor → Mayor)</option>
                    <option value="stock-desc">Stock (Mayor → Menor)</option>
                  </select>
                </div>

                {/* Filtro de Stock */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    🔍 Filtrar por:
                  </label>
                  <select
                    value={filtroStock}
                    onChange={(e) => setFiltroStock(e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
                  >
                    <option value="todos">Todos</option>
                    <option value="pares">Solo Pares</option>
                    <option value="impares">Solo Impares ⚠️</option>
                    <option value="criticos">Stock Crítico (≤3)</option>
                    <option value="agotados">Agotados</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Estadísticas Rápidas */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{totalReferencias}</div>
                <div className="text-sm text-gray-600 font-medium">Referencias</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{totalUnidades}</div>
                <div className="text-sm text-gray-600 font-medium">Unidades</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-emerald-600">{stockPares}</div>
                <div className="text-sm text-gray-600 font-medium">Pares</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-orange-600">{stockImpares}</div>
                <div className="text-sm text-gray-600 font-medium">Impares</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600">{stockCriticos}</div>
                <div className="text-sm text-gray-600 font-medium">Críticos</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 text-center">
                <div className="text-3xl font-bold text-red-600">{stockAgotados}</div>
                <div className="text-sm text-gray-600 font-medium">Agotados</div>
              </div>
            </div>

            {/* Resumen con Botón Copiar */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl shadow-lg p-6 mb-6 text-white">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{marcaSeleccionada}</h2>
                  <p className="text-xl opacity-90">
                    Mostrando {totalReferencias} referencias • {totalUnidades} unidades
                  </p>
                </div>
                <button
                  onClick={copiarTexto}
                  className="bg-white text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  📋 Copiar Lista
                </button>
              </div>
            </div>

            {/* Tabla Mejorada */}
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
                      <th className="p-4 text-center text-lg font-bold text-gray-700">
                        Tipo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {llantasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="p-8 text-center text-gray-500 text-lg">
                          No hay productos con estos filtros
                        </td>
                      </tr>
                    ) : (
                      llantasFiltradas.map((llanta, idx) => {
                        const esPar = llanta.stock > 0 && llanta.stock % 2 === 0;
                        const esImpar = llanta.stock > 0 && llanta.stock % 2 !== 0;

                        return (
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
                            <td className="p-4">
                              <div className="flex justify-center">
                                {llanta.stock === 0 ? (
                                  <span className="text-gray-400">—</span>
                                ) : esPar ? (
                                  <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold">
                                    ✓ PAR
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-bold">
                                    ⚠️ IMPAR
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Alertas de Stock Impar */}
            {stockImpares > 0 && filtroStock === "todos" && (
              <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-6 mt-6">
                <h3 className="text-xl font-bold text-orange-800 mb-3 flex items-center gap-2">
                  ⚠️ Stock Impar Detectado ({stockImpares} referencias)
                </h3>
                <p className="text-orange-700 mb-3">
                  Las siguientes referencias tienen cantidades impares. Considera completar a números pares:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {llantas
                    .filter((l) => l.marca === marcaSeleccionada && l.stock % 2 !== 0 && l.stock > 0)
                    .map((l) => (
                      <div
                        key={l.id}
                        className="bg-white rounded-lg p-3 shadow-sm border border-orange-200"
                      >
                        <div className="font-semibold text-gray-800">{l.referencia}</div>
                        <div className="text-orange-600 font-bold">{l.stock} unidades</div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Productos Críticos */}
            {stockCriticos > 0 && filtroStock === "todos" && (
              <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6 mt-6">
                <h3 className="text-xl font-bold text-red-800 mb-3 flex items-center gap-2">
                  🚨 Stock Crítico ({stockCriticos} referencias)
                </h3>
                <p className="text-red-700 mb-3">
                  Estas referencias tienen 3 o menos unidades. ¡Considera hacer pedido urgente!
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {llantas
                    .filter((l) => l.marca === marcaSeleccionada && l.stock > 0 && l.stock <= 3)
                    .map((l) => (
                      <div
                        key={l.id}
                        className="bg-white rounded-lg p-3 shadow-sm border border-red-200"
                      >
                        <div className="font-semibold text-gray-800">{l.referencia}</div>
                        <div className="text-red-600 font-bold">{l.stock} unidades</div>
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
