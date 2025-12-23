import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./index.css";

function Carpas() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const navigate = useNavigate();
  const [carpas, setCarpas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [busquedaVehiculo, setBusquedaVehiculo] = useState("");
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
  const [carpaOriginalEdicion, setCarpaOriginalEdicion] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [costosVisibles, setCostosVisibles] = useState({});

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
      .get(`${API_URL}/api/carpas`)
      .then((res) => setCarpas(res.data))
      .catch(() => setMensaje("Error al cargar carpas ❌"))
      .finally(() => setCargando(false));
  }, []);


  const filtradas = carpas.filter((c) => {
    // Si el item está en modo edición, siempre mostrarlo
    if (modoEdicion === c.id) {
      return true;
    }

    const coincideBusqueda = c.referencia
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideVehiculo =
      !busquedaVehiculo ||
      c.marca?.toLowerCase().includes(busquedaVehiculo.toLowerCase());

    return coincideBusqueda && coincideVehiculo;
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

  const iniciarEdicion = (id) => {
    const carpa = carpas.find((c) => c.id === id);
    if (carpa) {
      setCarpaOriginalEdicion(JSON.parse(JSON.stringify(carpa)));
      setModoEdicion(id);
    }
  };

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

      const { data } = await axios.get(`${API_URL}/api/carpas`);
      setCarpas(data);

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
              onClick={() => navigate("/llantas")}
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
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-700 transition-all text-sm"
            >
              <span>🏕️</span>
              <span>Carpas</span>
            </button>

            <button
              onClick={() => navigate("/tiros-arrastre")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
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
              Inventario de Carpas
            </h1>

            <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {filtradas.length}
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
                  <div className="text-slate-500 text-xs mt-1">
                    Total Carpas
                  </div>
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
                    {filtradas.filter((c) => c.stock === 0).length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Sin Stock</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {marcasUnicas.length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Descripción</div>
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
                    setBusquedaVehiculo("");
                  }}
                  className="flex items-center justify-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-all text-xs"
                >
                  <span>🔄</span>
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Panel de búsqueda */}
              <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Referencia
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar referencia..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      🚗 Buscar Vehículo
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: FORD, NISSAN, RANGER, HILUX..."
                      value={busquedaVehiculo}
                      onChange={(e) => setBusquedaVehiculo(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tabla - Vista de tarjetas en móvil */}
              <div className="space-y-3">
                {/* Vista móvil - tarjetas 2x2 */}
                <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
                  {filtradas.map((c) => (
                    <div
                      key={c.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 relative"
                    >
                      {/* Header con checkbox y referencia */}
                      <div className="flex items-start gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(c.id)}
                          onChange={() => toggleSeleccion(c.id)}
                          className="cursor-pointer mt-0.5 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-800 text-sm leading-tight">
                            <span className="truncate">{c.referencia}</span>
                          </div>
                          <div className="text-xs text-gray-600 truncate font-medium mt-0.5">
                            {c.marca}
                          </div>
                        </div>
                      </div>

                      {/* Info grid */}
                      <div className="space-y-1 text-xs mb-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">
                            Proveedor:
                          </span>
                          <span className="font-semibold truncate ml-2 max-w-[55%] text-right text-slate-800">
                            {c.proveedor || "—"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">
                            Stock:
                          </span>
                          <span
                            className={`font-bold text-sm ${
                              c.stock === 0 ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {c.stock === 0 ? "Sin stock" : c.stock}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">
                            Precio:
                          </span>
                          <span className="font-bold text-sm text-green-600">
                            ${Number(c.precio || 0).toLocaleString("es-CO")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-500 font-medium">
                            Costo:
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-blue-600">
                              {costosVisibles[c.id]
                                ? `$${Number(c.costo).toLocaleString("es-CO")}`
                                : "•••"}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCostosVisibles((prev) => ({
                                  ...prev,
                                  [c.id]: !prev[c.id],
                                }));
                              }}
                              className="p-1 hover:bg-gray-100 rounded transition-all"
                              title={
                                costosVisibles[c.id]
                                  ? "Ocultar costo"
                                  : "Mostrar costo"
                              }
                            >
                              {costosVisibles[c.id] ? (
                                <EyeOff size={14} className="text-gray-600" />
                              ) : (
                                <Eye size={14} className="text-gray-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Botones compactos */}
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          onClick={() => iniciarEdicion(c.id)}
                          className="bg-slate-100 hover:bg-slate-200 px-2 py-1 text-[10px] rounded transition-all"
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(c.id)}
                          className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 text-[10px] rounded transition-all"
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
                                  setSeleccionadas(filtradas.map((c) => c.id));
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
                            Descripción
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
                        {filtradas.map((c, idx) => (
                          <tr
                            key={c.id}
                            className={`${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                            } hover:bg-blue-50`}
                          >
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={seleccionadas.includes(c.id)}
                                onChange={() => toggleSeleccion(c.id)}
                                className="cursor-pointer"
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
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    value={c.marca}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        c.id,
                                        "marca",
                                        e.target.value
                                      )
                                    }
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
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
                                    className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                  />
                                </td>
                                <td className="p-2">
                                  <input
                                    type="number"
                                    value={c.costo}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        c.id,
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
                                    value={c.precio}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        c.id,
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
                                    value={c.stock}
                                    onChange={(e) =>
                                      actualizarCampo(
                                        c.id,
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
                                      onClick={() => handleGuardar(c)}
                                      className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                                    >
                                      💾
                                    </button>
                                    <button
                                      onClick={() => {
                                        setModoEdicion(null);
                                        setCarpaOriginalEdicion(null);
                                        axios
                                          .get(`${API_URL}/api/carpas`)
                                          .then((res) => setCarpas(res.data));
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
                                    {c.referencia}
                                  </span>
                                </td>
                                <td className="p-2">{c.marca}</td>
                                <td className="p-2">{c.proveedor || "—"}</td>
                                <td className="p-2 text-right text-blue-600 font-semibold">
                                  {mostrarCosto
                                    ? `$${Number(c.costo).toLocaleString(
                                        "es-CO"
                                      )}`
                                    : "•••"}
                                </td>
                                <td className="p-2 text-right text-green-600 font-semibold">
                                  $
                                  {Number(c.precio || 0).toLocaleString(
                                    "es-CO"
                                  )}
                                </td>
                                <td
                                  className={`p-2 text-center font-semibold ${
                                    c.stock === 0
                                      ? "text-red-600"
                                      : "text-gray-700"
                                  }`}
                                >
                                  {c.stock === 0 ? "❌" : c.stock}
                                </td>
                                <td className="p-2">
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => iniciarEdicion(c.id)}
                                      className="bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs rounded"
                                    >
                                      ✏️
                                    </button>
                                    <button
                                      onClick={() => handleEliminar(c.id)}
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
              ➕ Agregar Carpa
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

export default Carpas;
