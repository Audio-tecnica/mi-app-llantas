import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./index.css";

function TirosArrastre() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const navigate = useNavigate();
  const [tiros, setTiros] = useState([]);
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
  const [tiroOriginalEdicion, setTiroOriginalEdicion] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const API_URL = "https://mi-app-llantas.onrender.com";

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

  useEffect(() => {
    axios
      .get(`${API_URL}/api/tiros-arrastre`)
      .then((res) => setTiros(res.data))
      .catch(() => setMensaje("Error al cargar tiros de arrastre ❌"))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(tiros.map((t) => t.marca))];

  const filtradas = tirosArrastre.filter((t) => {
    // Si el tiro está en modo edición, siempre mostrarlo
    if (modoEdicion === t.id) {
      return true;
    }

    const coincideBusqueda = t.referencia
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || t.marca === marcaSeleccionada;
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
    setTiros(ordenadas);
    setOrden({ campo, asc });
  };

  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar los tiros de arrastre seleccionados?"))
      return;
    try {
      const referencias = tiros
        .filter((t) => seleccionadas.includes(t.id))
        .map((t) => t.referencia)
        .join(", ");

      for (let id of seleccionadas) {
        await axios.post(`${API_URL}/api/eliminar-tiro-arrastre`, { id });
      }

      await registrarActividad(
        "ELIMINACIÓN MÚLTIPLE TIROS ARRASTRE",
        `Se eliminaron ${seleccionadas.length} tiros: ${referencias}`
      );

      const { data } = await axios.get(`${API_URL}/api/tiros-arrastre`);
      setTiros(data);
      setSeleccionadas([]);
      setMensaje("Tiros de arrastre eliminados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const iniciarEdicion = (id) => {
    const tiro = tiros.find((t) => t.id === id);
    if (tiro) {
      setTiroOriginalEdicion(JSON.parse(JSON.stringify(tiro)));
      setModoEdicion(id);
    }
  };

  const handleGuardar = async (tiro) => {
    try {
      if (!tiroOriginalEdicion) {
        setMensaje("Error: No se encontró el tiro original ❌");
        return;
      }

      const cambios = [];

      if (String(tiroOriginalEdicion.referencia) !== String(tiro.referencia)) {
        cambios.push(
          `Referencia: ${tiroOriginalEdicion.referencia} → ${tiro.referencia}`
        );
      }
      if (String(tiroOriginalEdicion.marca) !== String(tiro.marca)) {
        cambios.push(`Marca: ${tiroOriginalEdicion.marca} → ${tiro.marca}`);
      }
      if (
        String(tiroOriginalEdicion.proveedor || "") !==
        String(tiro.proveedor || "")
      ) {
        cambios.push(
          `Proveedor: ${tiroOriginalEdicion.proveedor || "vacío"} → ${
            tiro.proveedor || "vacío"
          }`
        );
      }
      if (Number(tiroOriginalEdicion.costo) !== Number(tiro.costo)) {
        cambios.push(
          `Costo: $${Number(tiroOriginalEdicion.costo).toLocaleString(
            "es-CO"
          )} → $${Number(tiro.costo).toLocaleString("es-CO")}`
        );
      }
      if (Number(tiroOriginalEdicion.precio) !== Number(tiro.precio)) {
        cambios.push(
          `Precio: $${Number(tiroOriginalEdicion.precio).toLocaleString(
            "es-CO"
          )} → $${Number(tiro.precio).toLocaleString("es-CO")}`
        );
      }
      if (Number(tiroOriginalEdicion.stock) !== Number(tiro.stock)) {
        cambios.push(`Stock: ${tiroOriginalEdicion.stock} → ${tiro.stock}`);
      }

      await axios.post(`${API_URL}/api/editar-tiro-arrastre`, tiro);

      if (cambios.length > 0) {
        await registrarActividad(
          "EDICIÓN TIRO ARRASTRE",
          `Tiro ${tiro.referencia}: ${cambios.join(", ")}`
        );
      }

      const { data } = await axios.get(`${API_URL}/api/tiros-arrastre`);
      setTiros(data);

      setMensaje("Cambios guardados ✅");
      setModoEdicion(null);
      setTiroOriginalEdicion(null);
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al guardar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este tiro de arrastre?")) return;
    try {
      const tiro = tiros.find((t) => t.id === id);

      await axios.post(`${API_URL}/api/eliminar-tiro-arrastre`, { id });

      await registrarActividad(
        "ELIMINACIÓN TIRO ARRASTRE",
        `Se eliminó: ${tiro.referencia} - ${tiro.marca}`
      );

      setTiros((prev) => prev.filter((t) => t.id !== id));
      setMensaje("Tiro de arrastre eliminado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleAgregar = async () => {
    try {
      const nuevoTiroFormateado = {
        marca: nuevoItem.marca,
        referencia: nuevoItem.referencia,
        proveedor: nuevoItem.proveedor || "",
        costo: parseFloat(nuevoItem.costo) || 0,
        precio: parseFloat(nuevoItem.precio) || 0,
        stock: parseInt(nuevoItem.stock) || 0,
      };

      await axios.post(
        `${API_URL}/api/agregar-tiro-arrastre`,
        nuevoTiroFormateado
      );

      await registrarActividad(
        "NUEVO TIRO ARRASTRE",
        `Se agregó: ${nuevoItem.referencia} - ${nuevoItem.marca} (Stock: ${nuevoItem.stock})`
      );

      const { data } = await axios.get(`${API_URL}/api/tiros-arrastre`);
      setTiros(data);
      setMostrarModal(false);
      setNuevoItem({
        referencia: "",
        marca: "",
        proveedor: "",
        costo: "",
        precio: "",
        stock: "",
      });
      setMensaje("Tiro de arrastre agregado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (e) {
      console.error("❌ Error al agregar tiro de arrastre:", e);
      setMensaje("Error al agregar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setTiros((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t))
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-slate-800 text-white transition-all duration-300 z-50 ${
          menuAbierto ? "w-64" : "w-0 lg:w-64"
        } overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <img src="/logowp.PNG" className="h-16 w-auto" alt="Logo" />
            <button
              onClick={() => setMenuAbierto(false)}
              className="lg:hidden text-white hover:bg-slate-700 p-2 rounded"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Principal
            </div>

            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🏠</span>
              <span>Llantas</span>
            </button>

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3 mt-6">
              Categorías
            </div>

            <button
              onClick={() => navigate("/tapetes")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🚗</span>
              <span>Tapetes</span>
            </button>

            <button
              onClick={() => navigate("/rines")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>⚙️</span>
              <span>Rines</span>
            </button>

            <button
              onClick={() => navigate("/carpas")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🏕️</span>
              <span>Carpas</span>
            </button>

            <button
              onClick={() => navigate("/tiros-arrastre")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-700 transition-all text-sm"
            >
              <span>🔗</span>
              <span>Tiros</span>
            </button>

            <button
              onClick={() => navigate("/sonido")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🔊</span>
              <span>Sonido</span>
            </button>

            <button
              onClick={() => navigate("/luces")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>💡</span>
              <span>Luces</span>
            </button>

            <div className="border-t border-slate-700 my-4"></div>

            <button
              onClick={() => {
                localStorage.removeItem("acceso");
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-600 transition-all text-sm"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMenuAbierto(true)}
              className="lg:hidden text-slate-800 hover:bg-slate-100 p-2 rounded"
            >
              <Menu size={24} />
            </button>

            <h1 className="text-lg font-bold text-slate-800">
              Inventario de Tiros de Arrastre
            </h1>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setMostrarCosto(!mostrarCosto)}
                className="lg:hidden bg-slate-100 hover:bg-slate-200 p-2 rounded transition-all"
                title={mostrarCosto ? "Ocultar costos" : "Mostrar costos"}
              >
                {mostrarCosto ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>

              <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {filtradas.length}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4">
          {/* Mensajes */}
          {mensaje && (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-3 rounded-lg mb-4">
              <span className="text-sm font-medium">{mensaje}</span>
            </div>
          )}

          {cargando ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
              <p className="text-gray-600">Cargando inventario...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {filtradas.length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Total Tiros</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {seleccionadas.length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Seleccionadas
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {filtradas.filter((t) => t.stock === 0).length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Sin Stock</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {marcasUnicas.length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Marcas</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <button
                  onClick={() => setMostrarModal(true)}
                  className="flex items-center justify-center gap-1 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-all text-xs"
                >
                  <span>+</span>
                  <span>Agregar</span>
                </button>

                <button
                  onClick={handleEliminarMultiples}
                  disabled={seleccionadas.length === 0}
                  className="flex items-center justify-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                >
                  <span>🗑️</span>
                  <span>Eliminar</span>
                </button>

                <button
                  onClick={() => {
                    setBusqueda("");
                    setMarcaSeleccionada("");
                  }}
                  className="flex items-center justify-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-all text-xs"
                >
                  <span>🔄</span>
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Panel de búsqueda */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Referencia
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Marca
                    </label>
                    <select
                      value={marcaSeleccionada}
                      onChange={(e) => setMarcaSeleccionada(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                    >
                      <option value="">Todas</option>
                      {marcasUnicas.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla - Vista de tarjetas en móvil */}
              <div className="space-y-3">
                {/* Vista móvil - tarjetas */}
                <div className="lg:hidden space-y-3">
                  {filtradas.map((t) => (
                    <div
                      key={t.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={seleccionadas.includes(t.id)}
                            onChange={() => toggleSeleccion(t.id)}
                            className="cursor-pointer"
                          />
                          <div>
                            <div className="font-bold text-slate-800">
                              {t.referencia}
                            </div>
                            <div className="text-xs text-gray-500">
                              {t.marca}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                        <div>
                          <span className="text-gray-500 text-xs">
                            Proveedor:
                          </span>
                          <div className="font-medium">
                            {t.proveedor || "—"}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Stock:</span>
                          <div
                            className={`font-bold ${
                              t.stock === 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {t.stock === 0 ? "Sin stock" : t.stock}
                          </div>
                        </div>
                        <div>
                          <span className="text-gray-500 text-xs">Precio:</span>
                          <div className="font-medium text-green-600">
                            ${Number(t.precio || 0).toLocaleString("es-CO")}
                          </div>
                        </div>
                        {mostrarCosto && (
                          <div>
                            <span className="text-gray-500 text-xs">
                              Costo:
                            </span>
                            <div className="font-medium text-blue-600">
                              ${Number(t.costo).toLocaleString("es-CO")}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => iniciarEdicion(t.id)}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs rounded transition-all"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(t.id)}
                          className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 text-xs rounded transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Vista desktop - tabla */}
                <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-700 text-white">
                        <tr>
                          <th className="p-2 text-left">
                            <input
                              type="checkbox"
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSeleccionadas(filtradas.map((t) => t.id));
                                } else {
                                  setSeleccionadas([]);
                                }
                              }}
                              checked={
                                seleccionadas.length === filtradas.length &&
                                filtradas.length > 0
                              }
                              className="cursor-pointer"
                            />
                          </th>
                          <th
                            onClick={() => ordenarPor("referencia")}
                            className="cursor-pointer p-2 text-left hover:bg-slate-600"
                          >
                            Referencia
                          </th>
                          <th
                            onClick={() => ordenarPor("marca")}
                            className="cursor-pointer p-2 text-left hover:bg-slate-600"
                          >
                            Marca
                          </th>
                          <th
                            onClick={() => ordenarPor("proveedor")}
                            className="cursor-pointer p-2 text-left hover:bg-slate-600"
                          >
                            Proveedor
                          </th>
                          <th
                            onClick={() => ordenarPor("costo")}
                            className="cursor-pointer p-2 text-right hover:bg-slate-600"
                          >
                            <div className="flex items-center justify-end gap-2">
                              Costo
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMostrarCosto(!mostrarCosto);
                                }}
                                className="hover:bg-slate-600 p-1 rounded"
                              >
                                {mostrarCosto ? (
                                  <EyeOff size={14} />
                                ) : (
                                  <Eye size={14} />
                                )}
                              </button>
                            </div>
                          </th>
                          <th
                            onClick={() => ordenarPor("precio")}
                            className="cursor-pointer p-2 text-right hover:bg-slate-600"
                          >
                            Precio
                          </th>
                          <th
                            onClick={() => ordenarPor("stock")}
                            className="cursor-pointer p-2 text-center hover:bg-slate-600"
                          >
                            Stock
                          </th>
                          <th className="p-2 text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {filtradas.map((t, idx) => (
                          <tr
                            key={t.id}
                            className={`${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50`}
                          >
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={seleccionadas.includes(t.id)}
                                onChange={() => toggleSeleccion(t.id)}
                                className="cursor-pointer"
                              />
                            </td>
                            {modoEdicion === t.id ? (
                              <>
                                <td className="p-2">
                                  <input
                                    value={t.referencia}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        t.id,
                                        "referencia",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    value={t.marca}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        t.id,
                                        "marca",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    value={t.proveedor}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        t.id,
                                        "proveedor",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={t.costo}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        t.id,
                                        "costo",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={t.precio}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        t.id,
                                        "precio",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={t.stock}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        t.id,
                                        "stock",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleGuardar(t)}
                                      className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                                    >
                                      💾
                                    </button>
                                    <button
                                      onClick={() => {
                                        setModoEdicion(null);
                                        setTiroOriginalEdicion(null);
                                        axios
                                          .get(`${API_URL}/api/tiros-arrastre`)
                                          .then((res) => setTiros(res.data));
                                      }}
                                      className="bg-gray-400 text-white px-2 py-1 text-xs rounded hover:bg-gray-500"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="p-2">
                                  <span className="font-semibold">
                                    {t.referencia}
                                  </span>
                                </td>
                                <td className="p-2">{t.marca}</td>
                                <td className="p-2">{t.proveedor || "—"}</td>
                                <td className="p-2 text-right text-blue-600 font-semibold">
                                  {mostrarCosto
                                    ? `$${Number(t.costo).toLocaleString(
                                        "es-CO"
                                      )}`
                                    : "•••"}
                                </td>
                                <td className="p-2 text-right text-green-600 font-semibold">
                                  $
                                  {Number(t.precio || 0).toLocaleString(
                                    "es-CO"
                                  )}
                                </td>
                                <td
                                  className={`p-2 text-center font-semibold ${
                                    t.stock === 0
                                      ? "text-red-600"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {t.stock === 0 ? "❌" : t.stock}
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => iniciarEdicion(t.id)}
                                      className="bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs rounded"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleEliminar(t.id)}
                                      className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 text-xs rounded"
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
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal agregar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              ➕ Agregar Nuevo Tiro
            </h2>
            <div className="space-y-3">
              {[
                { key: "referencia", label: "Referencia" },
                { key: "marca", label: "Marca" },
                { key: "proveedor", label: "Proveedor" },
                { key: "costo", label: "Costo" },
                { key: "precio", label: "Precio" },
                { key: "stock", label: "Stock" },
              ].map((campo) => (
                <div key={campo.key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
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
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAgregar}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TirosArrastre;
