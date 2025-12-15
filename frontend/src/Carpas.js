import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./index.css";

function Carpas() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const navigate = useNavigate();
  const [carpas, setCarpas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoItem, setNuevoItem] = useState({
    referencia: "",
    marca: "",
    proveedor: "",
    costo: "",
    precio: "",
    stock: "",
  });
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState({ campo: "", asc: true });
  const [seleccionadas, setSeleccionadas] = useState([]);

  // ✅ Estado para guardar valores originales antes de editar
  const [carpaOriginalEdicion, setCarpaOriginalEdicion] = useState(null);

  const API_URL = "https://mi-app-llantas.onrender.com";

  // ✅ Función para registrar actividad en el historial
  const registrarActividad = async (tipo, detalles) => {
    try {
      await axios.post(`${API_URL}/api/log-actividad`, {
        tipo,
        detalles,
        fecha: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error registrando actividad:", error);
    }
  };

  // 📦 Cargar carpas
  useEffect(() => {
    axios
      .get(`${API_URL}/api/carpas`)
      .then((res) => setCarpas(res.data))
      .catch(() => setMensaje("Error al cargar carpas ❌"))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(carpas.map((c) => c.marca))];

  const filtradas = carpas.filter((c) => {
    const coincideBusqueda = c.referencia
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || c.marca === marcaSeleccionada;
    return coincideBusqueda && coincideMarca;
  });

  const ordenarPor = (campo) => {
    const asc = orden.campo === campo ? !orden.asc : true;
    const ordenadas = [...filtradas].sort((a, b) => {
      if (typeof a[campo] === "number") {
        return asc ? a[campo] - b[campo] : b[campo] - a[campo];
      } else {
        return asc
          ? a[campo]?.toString().localeCompare(b[campo]?.toString())
          : b[campo]?.toString().localeCompare(a[campo]?.toString());
      }
    });
    setCarpas(ordenadas);
    setOrden({ campo, asc });
  };

  // ✅ CRUD
  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar las carpas seleccionadas?")) return;
    try {
      const referencias = carpas
        .filter((c) => seleccionadas.includes(c.id))
        .map((c) => c.referencia)
        .join(", ");

      for (let id of seleccionadas) {
        await axios.post(`${API_URL}/api/eliminar-carpa`, { id });
      }

      await registrarActividad(
        "ELIMINACIÓN MÚLTIPLE CARPAS",
        `Se eliminaron ${seleccionadas.length} carpas: ${referencias}`
      );

      const { data } = await axios.get(`${API_URL}/api/carpas`);
      setCarpas(data);
      setSeleccionadas([]);
      setMensaje("Carpas eliminadas ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  // ✅ Función para iniciar edición guardando valores originales
  const iniciarEdicion = (id) => {
    const carpa = carpas.find((c) => c.id === id);
    if (carpa) {
      setCarpaOriginalEdicion(JSON.parse(JSON.stringify(carpa)));
      setModoEdicion(id);
    }
  };

  // ✅ Función guardar con detalle de cambios
  const handleGuardar = async (carpa) => {
    try {
      if (!carpaOriginalEdicion) {
        setMensaje("Error: No se encontró la carpa original ❌");
        return;
      }

      const cambios = [];

      if (
        String(carpaOriginalEdicion.referencia) !== String(carpa.referencia)
      ) {
        cambios.push(
          `Referencia: ${carpaOriginalEdicion.referencia} → ${carpa.referencia}`
        );
      }
      if (String(carpaOriginalEdicion.marca) !== String(carpa.marca)) {
        cambios.push(`Marca: ${carpaOriginalEdicion.marca} → ${carpa.marca}`);
      }
      if (
        String(carpaOriginalEdicion.proveedor || "") !==
        String(carpa.proveedor || "")
      ) {
        cambios.push(
          `Proveedor: ${carpaOriginalEdicion.proveedor || "vacío"} → ${
            carpa.proveedor || "vacío"
          }`
        );
      }
      if (Number(carpaOriginalEdicion.costo) !== Number(carpa.costo)) {
        cambios.push(
          `Costo: $${Number(carpaOriginalEdicion.costo).toLocaleString(
            "es-CO"
          )} → $${Number(carpa.costo).toLocaleString("es-CO")}`
        );
      }
      if (Number(carpaOriginalEdicion.precio) !== Number(carpa.precio)) {
        cambios.push(
          `Precio: $${Number(carpaOriginalEdicion.precio).toLocaleString(
            "es-CO"
          )} → $${Number(carpa.precio).toLocaleString("es-CO")}`
        );
      }
      if (Number(carpaOriginalEdicion.stock) !== Number(carpa.stock)) {
        cambios.push(`Stock: ${carpaOriginalEdicion.stock} → ${carpa.stock}`);
      }

      await axios.post(`${API_URL}/api/editar-carpa`, carpa);

      if (cambios.length > 0) {
        await registrarActividad(
          "EDICIÓN CARPA",
          `Carpa ${carpa.referencia}: ${cambios.join(", ")}`
        );
      }

      setMensaje("Cambios guardados ✅");
      setModoEdicion(null);
      setCarpaOriginalEdicion(null);
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al guardar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta carpa?")) return;
    try {
      const carpa = carpas.find((c) => c.id === id);

      await axios.post(`${API_URL}/api/eliminar-carpa`, { id });

      await registrarActividad(
        "ELIMINACIÓN CARPA",
        `Se eliminó: ${carpa.referencia} - ${carpa.marca}`
      );

      setCarpas((prev) => prev.filter((c) => c.id !== id));
      setMensaje("Carpa eliminada ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleAgregar = async () => {
    try {
      const nuevaCarpaFormateada = {
        marca: nuevoItem.marca,
        referencia: nuevoItem.referencia,
        proveedor: nuevoItem.proveedor || "",
        costo: parseFloat(nuevoItem.costo) || 0,
        precio: parseFloat(nuevoItem.precio) || 0,
        stock: parseInt(nuevoItem.stock) || 0,
      };

      await axios.post(`${API_URL}/api/agregar-carpa`, nuevaCarpaFormateada);

      await registrarActividad(
        "NUEVA CARPA",
        `Se agregó: ${nuevoItem.referencia} - ${nuevoItem.marca} (Stock: ${nuevoItem.stock})`
      );

      const { data } = await axios.get(`${API_URL}/api/carpas`);
      setCarpas(data);
      setMostrarModal(false);
      setNuevoItem({
        referencia: "",
        marca: "",
        proveedor: "",
        costo: "",
        precio: "",
        stock: "",
      });
      setMensaje("Carpa agregada ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (e) {
      console.error("❌ Error al agregar carpa:", e);
      setMensaje("Error al agregar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setCarpas((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [campo]: valor } : c))
    );
  };

  // 🧩 Render
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header Profesional con sombra y mejor espaciado */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <img src="/logowp.PNG" className="h-12 w-auto" alt="Logo" />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMostrarModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="text-lg">+</span>
                Agregar carpa
              </button>

              <button
                onClick={handleEliminarMultiples}
                disabled={seleccionadas.length === 0}
                className="inline-flex items-center gap-2 bg-slate-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg disabled:shadow-none"
              >
                <span>🗑️</span>
                Eliminar ({seleccionadas.length})
              </button>

              <button
                onClick={() => {
                  localStorage.removeItem("acceso");
                  window.location.href = "/login";
                }}
                className="inline-flex items-center gap-2 bg-slate-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>🚪</span>
                Salir
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes con mejor diseño */}
        {mensaje && (
          <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg mb-6 shadow-md animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              <span className="font-medium">{mensaje}</span>
            </div>
          </div>
        )}

        {/* Contenido principal */}
        {cargando ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
            <p className="text-gray-600 text-lg">Cargando inventario...</p>
          </div>
        ) : (
          <>
            {/* Botones de navegación mejorados */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => {
                  setBusqueda("");
                  setMarcaSeleccionada("");
                }}
                className="inline-flex items-center gap-2 bg-white text-slate-700 px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-all duration-200 shadow-md hover:shadow-lg border border-slate-200"
              >
                <span>🔄</span>
                Limpiar filtros
              </button>

              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>🚗</span>
                Llantas
              </button>

              <button
                onClick={() => navigate("/rines")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>⚙️</span>
                Rines
              </button>

              <button
                onClick={() => navigate("/tapetes")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>🧵</span>
                Tapetes
              </button>
              
              <button
                onClick={() => navigate("/tiros-arrastre")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>🔗</span>
                Tiros
              </button>
            </div>

            {/* Contador de resultados */}
            <div className="bg-white rounded-lg shadow-md px-4 py-2 mb-4 inline-block">
              <span className="text-sm text-gray-600">
                📊 Mostrando{" "}
                <span className="font-bold text-slate-700">
                  {filtradas.length}
                </span>{" "}
                resultados
              </span>
            </div>

            {/* Panel de búsqueda mejorado */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>🏕️</span>
                Búsqueda de Carpas
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Referencia
                  </label>
                  <input
                    type="text"
                    placeholder="Buscar por referencia..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <select
                    value={marcaSeleccionada}
                    onChange={(e) => setMarcaSeleccionada(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
                  >
                    <option value="">Todas las marcas</option>
                    {marcasUnicas.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tabla mejorada */}
              <div className="overflow-x-auto mt-6 rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                    <tr>
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSeleccionadas(filtradas.map((c) => c.id));
                            } else {
                              setSeleccionadas([]);
                            }
                          }}
                          checked={
                            seleccionadas.length === filtradas.length &&
                            filtradas.length > 0
                          }
                          className="cursor-pointer w-4 h-4"
                        />
                      </th>
                      <th
                        onClick={() => ordenarPor("referencia")}
                        className="cursor-pointer p-3 text-left hover:bg-slate-600 transition-colors"
                      >
                        Referencia
                      </th>
                      <th
                        onClick={() => ordenarPor("marca")}
                        className="cursor-pointer p-3 text-left hover:bg-slate-600 transition-colors"
                      >
                        Marca
                      </th>
                      <th
                        onClick={() => ordenarPor("proveedor")}
                        className="cursor-pointer p-3 text-left hover:bg-slate-600 transition-colors"
                      >
                        Proveedor
                      </th>
                      <th
                        onClick={() => ordenarPor("costo")}
                        className="cursor-pointer p-3 text-right hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center justify-end gap-2">
                          Costo
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMostrarCosto(!mostrarCosto);
                            }}
                            className="hover:bg-slate-700 p-1 rounded"
                          >
                            {mostrarCosto ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </th>
                      <th
                        onClick={() => ordenarPor("precio")}
                        className="cursor-pointer p-3 text-right hover:bg-slate-600 transition-colors"
                      >
                        Precio
                      </th>
                      <th
                        onClick={() => ordenarPor("stock")}
                        className="cursor-pointer p-3 text-center hover:bg-slate-600 transition-colors"
                      >
                        Stock
                      </th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtradas.map((c, idx) => (
                      <tr
                        key={c.id}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={seleccionadas.includes(c.id)}
                            onChange={() => toggleSeleccion(c.id)}
                            className="cursor-pointer w-4 h-4"
                          />
                        </td>

                        {modoEdicion === c.id ? (
                          <>
                            <td className="p-2">
                              <input
                                value={c.referencia}
                                onChange={(e) =>
                                  actualizarCampo(
                                    c.id,
                                    "referencia",
                                    e.target.value
                                  )
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={c.marca}
                                onChange={(e) =>
                                  actualizarCampo(c.id, "marca", e.target.value)
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={c.proveedor}
                                onChange={(e) =>
                                  actualizarCampo(
                                    c.id,
                                    "proveedor",
                                    e.target.value
                                  )
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={c.costo}
                                onChange={(e) =>
                                  actualizarCampo(c.id, "costo", e.target.value)
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={c.precio}
                                onChange={(e) =>
                                  actualizarCampo(
                                    c.id,
                                    "precio",
                                    e.target.value
                                  )
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={c.stock}
                                onChange={(e) =>
                                  actualizarCampo(c.id, "stock", e.target.value)
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-2 items-center">
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleGuardar(c)}
                                    className="bg-green-500 text-white px-4 py-2 text-xs rounded-lg hover:bg-green-600 transition-all shadow-md font-medium"
                                  >
                                    💾 Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setModoEdicion(null);
                                      setCarpaOriginalEdicion(null);
                                      // Recargar datos para descartar cambios
                                      axios
                                        .get(`${API_URL}/api/carpas`)
                                        .then((res) => setCarpas(res.data));
                                    }}
                                    className="bg-gray-400 text-white px-4 py-2 text-xs rounded-lg hover:bg-gray-500 transition-all shadow-md font-medium"
                                  >
                                    ✖ Cancelar
                                  </button>
                                </div>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3">
                              <span className="font-semibold text-gray-800">
                                {c.referencia}
                              </span>
                            </td>
                            <td className="p-3 text-gray-700">{c.marca}</td>
                            <td className="p-3 text-gray-700">
                              {c.proveedor || "—"}
                            </td>
                            <td className="p-3 text-right text-blue-600 font-semibold">
                              {mostrarCosto
                                ? `$${Number(c.costo).toLocaleString("es-CO")}`
                                : "•••••"}
                            </td>
                            <td className="p-3 text-right text-green-600 font-semibold">
                              ${Number(c.precio || 0).toLocaleString("es-CO")}
                            </td>
                            <td
                              className={`p-3 text-center font-semibold ${
                                c.stock === 0 ? "text-red-600" : "text-gray-700"
                              }`}
                            >
                              {c.stock === 0 ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full text-xs">
                                  ❌
                                </span>
                              ) : (
                                c.stock
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center items-center">
                                <button
                                  onClick={() => iniciarEdicion(c.id)}
                                  className="bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleEliminar(c.id)}
                                  className="bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="Eliminar"
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal agregar carpa */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>➕</span>
                Agregar Nueva Carpa
              </h2>
              <div className="space-y-4">
                {[
                  { key: "referencia", label: "Referencia" },
                  { key: "marca", label: "Marca" },
                  { key: "proveedor", label: "Proveedor" },
                  { key: "costo", label: "Costo" },
                  { key: "precio", label: "Precio" },
                  { key: "stock", label: "Stock" },
                ].map((campo) => (
                  <div key={campo.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {campo.label}
                    </label>
                    <input
                      placeholder={`Ingrese ${campo.label.toLowerCase()}`}
                      value={nuevoItem[campo.key]}
                      onChange={(e) =>
                        setNuevoItem({
                          ...nuevoItem,
                          [campo.key]: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all"
                    />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleAgregar}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
                >
                  Guardar
                </button>
                <button
                  onClick={() => setMostrarModal(false)}
                  className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg hover:shadow-xl"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Carpas;
