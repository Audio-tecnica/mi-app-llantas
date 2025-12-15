import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ChevronUp, ChevronDown, ChevronRight } from "lucide-react";
import "./index.css";

function VisorStock() {
  const navigate = useNavigate();
  const [llantas, setLlantas] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ordenPor, setOrdenPor] = useState("referencia");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [dimensionesExpandidas, setDimensionesExpandidas] = useState({});

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

  // Función para extraer el rin de la referencia (última parte después de R)
  const extraerRin = (referencia) => {
    const match = referencia?.match(/R(\d+)/i);
    return match ? match[1] : "Otros";
  };

  // Agrupar por dimensión de rin
  const agruparPorRin = () => {
    const grupos = {};
    llantasFiltradas.forEach((llanta) => {
      const rin = extraerRin(llanta.referencia);
      if (!grupos[rin]) {
        grupos[rin] = [];
      }
      grupos[rin].push(llanta);
    });

    // Ordenar cada grupo
    Object.keys(grupos).forEach((rin) => {
      grupos[rin].sort((a, b) => {
        if (ordenPor === "referencia") {
          return ordenAsc
            ? a.referencia.localeCompare(b.referencia)
            : b.referencia.localeCompare(a.referencia);
        } else if (ordenPor === "proveedor") {
          return ordenAsc
            ? (a.proveedor || "").localeCompare(b.proveedor || "")
            : (b.proveedor || "").localeCompare(a.proveedor || "");
        } else if (ordenPor === "stock") {
          return ordenAsc ? a.stock - b.stock : b.stock - a.stock;
        }
        return 0;
      });
    });

    return grupos;
  };

  const gruposPorRin = agruparPorRin();
  const rinesOrdenados = Object.keys(gruposPorRin).sort((a, b) => {
    if (a === "Otros") return 1;
    if (b === "Otros") return -1;
    return parseInt(a) - parseInt(b);
  });

  const toggleDimension = (rin) => {
    setDimensionesExpandidas((prev) => ({
      ...prev,
      [rin]: !prev[rin],
    }));
  };

  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSeleccionTodos = (llantas) => {
    const ids = llantas.map((l) => l.id);
    const todosMarcados = ids.every((id) => seleccionadas.includes(id));

    if (todosMarcados) {
      setSeleccionadas((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSeleccionadas((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const totalUnidades = llantasFiltradas.reduce((sum, l) => sum + (l.stock || 0), 0);
  const totalReferencias = llantasFiltradas.length;
  const stockImpares = llantasFiltradas.filter((l) => l.stock > 0 && l.stock % 2 !== 0).length;
  const stockCriticos = llantasFiltradas.filter((l) => l.stock > 0 && l.stock <= 3).length;

  const handleOrdenar = (campo) => {
    if (ordenPor === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  };

  const copiarSeleccion = () => {
    if (seleccionadas.length === 0) {
      alert("⚠️ Selecciona al menos una llanta");
      return;
    }

    const llantasSeleccionadas = llantas.filter((l) => seleccionadas.includes(l.id));

    let texto = `📋 PEDIDO - ${marcaSeleccionada.toUpperCase()}\n`;
    texto += `Fecha: ${new Date().toLocaleDateString("es-CO")}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    llantasSeleccionadas.forEach((l) => {
      texto += `• ${l.referencia} - Stock actual: ${l.stock}\n`;
    });

    texto += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `Total: ${llantasSeleccionadas.length} referencias seleccionadas`;

    navigator.clipboard.writeText(texto);

    // Abrir WhatsApp
    const mensajeEncoded = encodeURIComponent(texto);
    window.open(`https://wa.me/?text=${mensajeEncoded}`, "_blank");
  };

  const EncabezadoOrdenable = ({ campo, children }) => (
    <th
      onClick={() => handleOrdenar(campo)}
      className="p-2 text-left text-xs font-bold text-gray-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        {children}
        {ordenPor === campo && (
          <span className="text-slate-600">
            {ordenAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <img src="/logowp.PNG" className="h-10 w-auto" alt="Logo" />
              <h1 className="text-xl font-bold text-gray-800">📊 Visor de Stock</h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copiarSeleccion}
                disabled={seleccionadas.length === 0}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📱 Enviar ({seleccionadas.length})
              </button>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
            <p className="text-gray-600 text-base">Cargando inventario...</p>
          </div>
        ) : (
          <>
            {/* Selector de Marca */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                🏷️ Seleccionar Marca:
              </label>
              <select
                value={marcaSeleccionada}
                onChange={(e) => {
                  setMarcaSeleccionada(e.target.value);
                  setSeleccionadas([]);
                  setDimensionesExpandidas({});
                }}
                className="w-full px-4 py-3 text-xl font-bold border-2 border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
              >
                {marcasUnicas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            {/* Estadísticas Compactas */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-blue-500">
                <div className="text-2xl font-bold text-blue-600">{totalReferencias}</div>
                <div className="text-xs text-gray-600 font-medium">Referencias</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-green-500">
                <div className="text-2xl font-bold text-green-600">{totalUnidades}</div>
                <div className="text-xs text-gray-600 font-medium">Unidades</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-yellow-500">
                <div className="text-2xl font-bold text-yellow-600">{stockImpares}</div>
                <div className="text-xs text-gray-600 font-medium">⚠️ Impares</div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-red-500">
                <div className="text-2xl font-bold text-red-600">{stockCriticos}</div>
                <div className="text-xs text-gray-600 font-medium">🔴 Críticos</div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="bg-white rounded-lg shadow-md p-3 mb-4">
              <div className="flex flex-wrap gap-4 items-center text-xs">
                <span className="font-bold text-gray-700">📌 Leyenda:</span>
                <span className="flex items-center gap-1">
                  <span className="text-lg">❌</span>
                  <span className="font-medium text-gray-700">Agotado</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-lg">🔴</span>
                  <span className="font-medium text-gray-700">Crítico (≤3)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium text-gray-700">Impar</span>
                </span>
              </div>
            </div>

            {/* Grupos por Dimensión */}
            <div className="space-y-3">
              {rinesOrdenados.map((rin) => {
                const llantasGrupo = gruposPorRin[rin];
                const estaExpandido = dimensionesExpandidas[rin];
                const totalGrupo = llantasGrupo.reduce((sum, l) => sum + (l.stock || 0), 0);
                const criticosGrupo = llantasGrupo.filter((l) => l.stock > 0 && l.stock <= 3).length;
                const imparesGrupo = llantasGrupo.filter((l) => l.stock > 0 && l.stock % 2 !== 0).length;

                return (
                  <div key={rin} className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {/* Header del grupo */}
                    <div
                      onClick={() => toggleDimension(rin)}
                      className="bg-gradient-to-r from-slate-600 to-slate-700 p-3 cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
                    >
                      <div className="flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                          <ChevronRight
                            size={20}
                            className={`transition-transform ${
                              estaExpandido ? "rotate-90" : ""
                            }`}
                          />
                          <span className="text-lg font-bold">
                            Rin {rin}" ({llantasGrupo.length})
                          </span>
                          <span className="text-sm opacity-90">
                            {totalGrupo} unidades
                          </span>
                          {imparesGrupo > 0 && (
                            <span className="bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                              ⚠️ {imparesGrupo}
                            </span>
                          )}
                          {criticosGrupo > 0 && (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                              🔴 {criticosGrupo}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSeleccionTodos(llantasGrupo);
                          }}
                          className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg text-xs font-bold transition-all"
                        >
                          {llantasGrupo.every((l) => seleccionadas.includes(l.id))
                            ? "Deseleccionar"
                            : "Seleccionar Todos"}
                        </button>
                      </div>
                    </div>

                    {/* Tabla del grupo */}
                    {estaExpandido && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <th className="p-2 text-left w-10">
                                <input
                                  type="checkbox"
                                  onChange={() => toggleSeleccionTodos(llantasGrupo)}
                                  checked={llantasGrupo.every((l) =>
                                    seleccionadas.includes(l.id)
                                  )}
                                  className="cursor-pointer w-3 h-3"
                                />
                              </th>
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
                          <tbody className="divide-y divide-gray-100">
                            {llantasGrupo.map((llanta, idx) => {
                              const esImpar = llanta.stock > 0 && llanta.stock % 2 !== 0;
                              const esCritico = llanta.stock > 0 && llanta.stock <= 3;
                              const estaAgotado = llanta.stock === 0;

                              return (
                                <tr
                                  key={llanta.id}
                                  className={`${
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  } hover:bg-blue-50 transition-colors ${
                                    seleccionadas.includes(llanta.id) ? "bg-blue-100" : ""
                                  }`}
                                >
                                  <td className="p-2">
                                    <input
                                      type="checkbox"
                                      checked={seleccionadas.includes(llanta.id)}
                                      onChange={() => toggleSeleccion(llanta.id)}
                                      className="cursor-pointer w-3 h-3"
                                    />
                                  </td>
                                  <td className="p-2">
                                    <span className="text-sm font-semibold text-gray-800">
                                      {llanta.referencia}
                                    </span>
                                  </td>
                                  <td className="p-2">
                                    <span className="text-xs text-gray-600">
                                      {llanta.proveedor || "—"}
                                    </span>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      {estaAgotado ? (
                                        <span className="text-xl font-bold text-red-600 flex items-center gap-1">
                                          ❌
                                        </span>
                                      ) : esCritico && esImpar ? (
                                        <span className="text-xl font-bold text-red-600 flex items-center gap-1">
                                          {llanta.stock} 🔴⚠️
                                        </span>
                                      ) : esCritico ? (
                                        <span className="text-xl font-bold text-red-600 flex items-center gap-1">
                                          {llanta.stock} 🔴
                                        </span>
                                      ) : esImpar ? (
                                        <span className="text-xl font-bold text-yellow-600 flex items-center gap-1">
                                          {llanta.stock} ⚠️
                                        </span>
                                      ) : (
                                        <span className="text-xl font-bold text-green-600">
                                          {llanta.stock}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default VisorStock;

