import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown } from "lucide-react";
import "./index.css";

function VisorStock() {
  const navigate = useNavigate();
  const [llantas, setLlantas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ordenPor, setOrdenPor] = useState("referencia");
  const [ordenAsc, setOrdenAsc] = useState(true);

  const API_URL = "https://mi-app-llantas.onrender.com";

  useEffect(() => {
    axios
      .get(`${API_URL}/api/llantas`)
      .then((res) => {
        setLlantas(res.data);
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

  // Función para ordenar
  const handleOrdenar = (campo) => {
    if (ordenPor === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  };

  // Aplicar ordenamiento
  llantasFiltradas.sort((a, b) => {
    let valorA, valorB;

    if (ordenPor === "referencia") {
      valorA = a.referencia || "";
      valorB = b.referencia || "";
      return ordenAsc
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA);
    } else if (ordenPor === "proveedor") {
      valorA = a.proveedor || "";
      valorB = b.proveedor || "";
      return ordenAsc
        ? valorA.localeCompare(valorB)
        : valorB.localeCompare(valorA);
    } else if (ordenPor === "stock") {
      valorA = a.stock || 0;
      valorB = b.stock || 0;
      return ordenAsc ? valorA - valorB : valorB - valorA;
    }
    return 0;
  });

  const totalUnidades = llantasFiltradas.reduce((sum, l) => sum + (l.stock || 0), 0);
  const totalReferencias = llantasFiltradas.length;

  // Calcular estadísticas
  const stockImpares = llantasFiltradas.filter((l) => l.stock > 0 && l.stock % 2 !== 0).length;
  const stockCriticos = llantasFiltradas.filter((l) => l.stock > 0 && l.stock <= 3).length;
  const stockAgotados = llantasFiltradas.filter((l) => l.stock === 0).length;

  const copiarTexto = () => {
    let texto = `📋 STOCK ${marcaSeleccionada.toUpperCase()}\n`;
    texto += `Fecha: ${new Date().toLocaleDateString("es-CO")}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    llantasFiltradas.forEach((l) => {
      const alerta = l.stock === 0 ? " ❌" : l.stock <= 3 ? " 🔴" : "";
      const impar = l.stock > 0 && l.stock % 2 !== 0 ? " ⚠️" : "";
      texto += `${l.referencia}: ${l.stock} unidades${impar}${alerta}\n`;
    });

    texto += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `Total: ${totalUnidades} unidades en ${totalReferencias} referencias\n`;
    texto += `⚠️ Impares: ${stockImpares} | 🔴 Críticos: ${stockCriticos} | ❌ Agotados: ${stockAgotados}`;

    navigator.clipboard.writeText(texto);
    alert("✅ Copiado al portapapeles");
  };

  const exportarExcel = () => {
    let csv = "Referencia,Proveedor,Stock,Alertas\n";
    llantasFiltradas.forEach((l) => {
      const alertas = [];
      if (l.stock === 0) alertas.push("AGOTADO");
      else if (l.stock <= 3) alertas.push("CRÍTICO");
      if (l.stock > 0 && l.stock % 2 !== 0) alertas.push("IMPAR");
      csv += `${l.referencia},${l.proveedor || ""},${l.stock},"${alertas.join(" + ")}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `stock_${marcaSeleccionada}_${new Date().toLocaleDateString("es-CO")}.csv`;
    a.click();
  };

  // Componente para encabezados ordenables
  const EncabezadoOrdenable = ({ campo, children }) => (
    <th
      onClick={() => handleOrdenar(campo)}
      className="p-4 text-left text-lg font-bold text-gray-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
    >
      <div className="flex items-center gap-2">
        {children}
        {ordenPor === campo && (
          <span className="text-slate-600">
            {ordenAsc ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        )}
      </div>
    </th>
  );

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
            {/* Selector de Marca */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <label className="block text-lg font-bold text-gray-800 mb-3">
                🏷️ Seleccionar Marca:
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

            {/* Estadísticas Compactas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-blue-500">
                <div className="text-3xl font-bold text-blue-600">{totalReferencias}</div>
                <div className="text-sm text-gray-600 font-medium">Referencias</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{totalUnidades}</div>
                <div className="text-sm text-gray-600 font-medium">Unidades Totales</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-yellow-500">
                <div className="text-3xl font-bold text-yellow-600">{stockImpares}</div>
                <div className="text-sm text-gray-600 font-medium">⚠️ Stock Impar</div>
              </div>
              <div className="bg-white rounded-xl shadow-md p-4 border-l-4 border-red-500">
                <div className="text-3xl font-bold text-red-600">{stockCriticos}</div>
                <div className="text-sm text-gray-600 font-medium">🔴 Stock Crítico</div>
              </div>
            </div>

            {/* Resumen con Botón Copiar */}
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 rounded-2xl shadow-lg p-6 mb-6 text-white">
              <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">{marcaSeleccionada}</h2>
                  <p className="text-lg opacity-90">
                    {totalReferencias} referencias • {totalUnidades} unidades
                    {stockImpares > 0 && ` • ⚠️ ${stockImpares} impares`}
                    {stockCriticos > 0 && ` • 🔴 ${stockCriticos} críticos`}
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

            {/* Leyenda Simple */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex flex-wrap gap-6 items-center text-sm">
                <span className="font-bold text-gray-700 text-base">📌 Leyenda:</span>
                <span className="flex items-center gap-2">
                  <span className="text-2xl">❌</span>
                  <span className="font-medium text-gray-700">Agotado</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-2xl">🔴</span>
                  <span className="font-medium text-gray-700">Stock Crítico (≤3 unidades)</span>
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-2xl">⚠️</span>
                  <span className="font-medium text-gray-700">Stock Impar</span>
                </span>
              </div>
            </div>

            {/* Tabla Simplificada */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 border-b-2 border-slate-300">
                    <tr>
                      <EncabezadoOrdenable campo="referencia">
                        Referencia
                      </EncabezadoOrdenable>
                      <EncabezadoOrdenable campo="proveedor">
                        Proveedor
                      </EncabezadoOrdenable>
                      <EncabezadoOrdenable campo="stock">
                        Stock
                      </EncabezadoOrdenable>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {llantasFiltradas.length === 0 ? (
                      <tr>
                        <td colSpan="3" className="p-8 text-center text-gray-500 text-lg">
                          No hay productos para esta marca
                        </td>
                      </tr>
                    ) : (
                      llantasFiltradas.map((llanta, idx) => {
                        const esImpar = llanta.stock > 0 && llanta.stock % 2 !== 0;
                        const esCritico = llanta.stock > 0 && llanta.stock <= 3;
                        const estaAgotado = llanta.stock === 0;

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
                              <div className="flex items-center gap-3">
                                {/* Stock con alertas integradas */}
                                {estaAgotado ? (
                                  <span className="text-3xl font-bold text-red-600 flex items-center gap-2">
                                    {llanta.stock} ❌
                                  </span>
                                ) : esCritico && esImpar ? (
                                  <span className="text-3xl font-bold text-red-600 flex items-center gap-2">
                                    {llanta.stock} 🔴⚠️
                                  </span>
                                ) : esCritico ? (
                                  <span className="text-3xl font-bold text-red-600 flex items-center gap-2">
                                    {llanta.stock} 🔴
                                  </span>
                                ) : esImpar ? (
                                  <span className="text-3xl font-bold text-yellow-600 flex items-center gap-2">
                                    {llanta.stock} ⚠️
                                  </span>
                                ) : (
                                  <span className="text-3xl font-bold text-green-600 flex items-center gap-2">
                                    {llanta.stock}
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
          </>
        )}
      </div>
    </div>
  );
}

export default VisorStock;
