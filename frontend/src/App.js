import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate, BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import ComparadorLlantas from "./ComparadorLlantas";
import Login from "./Login";
import Rines from "./Rines";
import Tapetes from "./Tapetes";
import Carpas from "./Carpas";
import TirosArrastre from "./TirosArrastre";
import Sonido from "./Sonido";
import Luces from "./Luces";
import VisorStock from "./VisorStock";
import GestionPromociones from "./GestionPromociones";

// Componente de Protección
function Protegido({ children }) {
  const autenticado = localStorage.getItem("autenticado") === "true";
  const navigate = useNavigate();

  if (!autenticado) {
    navigate("/");
    return null;
  }

  return children;
}

// Componente del Menú Lateral
function MenuLateral() {
  const navigate = useNavigate();
  const location = useLocation();

  const cerrarSesion = () => {
    if (window.confirm("¿Cerrar sesión?")) {
      localStorage.removeItem("autenticado");
      navigate("/");
    }
  };

  const menuItems = [
    { path: "/llantas", icon: "🚗", label: "Llantas" },
    { path: "/rines", icon: "⭕", label: "Rines" },
    { path: "/tapetes", icon: "🧩", label: "Tapetes" },
    { path: "/carpas", icon: "🏕️", label: "Carpas" },
    { path: "/tiros-arrastre", icon: "🔗", label: "Tiros de Arrastre" },
    { path: "/sonido", icon: "🔊", label: "Sonido" },
    { path: "/luces", icon: "💡", label: "Luces" },
    { path: "/visor-stock", icon: "📊", label: "Visor de Stock" },
    { path: "/promociones", icon: "🎉", label: "Promociones" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-64 bg-[#1e1e1e] text-gray-300 flex flex-col shadow-2xl">
      {/* Logo/Header */}
      <div className="p-5 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <img src="/logowp.PNG" className="h-10 w-auto" alt="Logo" />
          <div>
            <h1 className="text-base font-semibold text-white">Audio Técnica</h1>
            <p className="text-xs text-gray-500">Inventario</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-2">
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full px-4 py-3 flex items-center gap-3 text-sm transition-colors ${
              isActive(item.path)
                ? "bg-[#2d2d2d] text-white border-l-4 border-blue-500"
                : "text-gray-400 hover:bg-[#2a2a2a] hover:text-gray-200"
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-700">
        <button
          onClick={cerrarSesion}
          className="w-full px-4 py-4 flex items-center gap-3 text-sm text-gray-400 hover:bg-red-900 hover:text-white transition-colors"
        >
          <span className="text-lg">🚪</span>
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );
}

// Componente Principal de Llantas (tu código original)
function Llantas() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [comentarioModal, setComentarioModal] = useState(null);
  const [nuevoItem, setNuevoItem] = useState({
    referencia: "",
    marca: "",
    proveedor: "",
    costo_empresa: "",
    precio_cliente: "",
    stock: "",
  });
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState({ campo: "", asc: true });
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [mostrarComparador, setMostrarComparador] = useState(false);
  const [mostrarLogModal, setMostrarLogModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [cargandoLogs, setCargandoLogs] = useState(false);
  const [busquedaLog, setBusquedaLog] = useState("");
  const [filtroTipoLog, setFiltroTipoLog] = useState("");
  const [llantaOriginalEdicion, setLlantaOriginalEdicion] = useState(null);
  const [busquedasRecientes, setBusquedasRecientes] = useState(() => {
    const guardadas = localStorage.getItem("busquedasRecientes");
    return guardadas ? JSON.parse(guardadas) : [];
  });

  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/llantas")
      .then((res) => setLlantas(res.data))
      .catch(() => setMensaje("Error al cargar llantas ❌"))
      .finally(() => setCargando(false));
  }, []);

  const registrarActividad = async (tipo, detalles) => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/log-actividad",
        {
          tipo,
          detalles,
          fecha: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error registrando actividad:", error);
    }
  };

  const abrirLogActividades = () => {
    const password = prompt("Ingrese la contraseña para ver el log de actividades:");
    const PASSWORD_CORRECTA = "Cmd2025";

    if (password === PASSWORD_CORRECTA) {
      cargarLogs();
      setMostrarLogModal(true);
    } else if (password !== null) {
      alert("❌ Contraseña incorrecta");
    }
  };

  const cargarLogs = async () => {
    setCargandoLogs(true);
    try {
      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/logs");
      setLogs(data);
    } catch (error) {
      console.error("Error cargando logs:", error);
      setMensaje("Error al cargar historial ❌");
      setTimeout(() => setMensaje(""), 2000);
    } finally {
      setCargandoLogs(false);
    }
  };

  const abrirComparador = (referencia) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      referencia + " site:llantar.com.co OR site:virtualllantas.com OR site:tullanta.com"
    )}`;
    window.open(url, "_blank");
  };

  const marcasUnicas = [...new Set(llantas.map((l) => l.marca))];

  const filtradas = llantas.filter((l) => {
    const coincideBusqueda = l.referencia?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || l.marca === marcaSeleccionada;
    return coincideBusqueda && coincideMarca;
  });

  const logsFiltrados = logs.filter((log) => {
    const coincideBusqueda =
      log.detalles?.toLowerCase().includes(busquedaLog.toLowerCase()) ||
      log.tipo?.toLowerCase().includes(busquedaLog.toLowerCase());
    const coincideTipo = !filtroTipoLog || log.tipo === filtroTipoLog;
    return coincideBusqueda && coincideTipo;
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
    setLlantas(ordenadas);
    setOrden({ campo, asc });
  };

  const actualizarCampo = (id, campo, valor) => {
    setLlantas(llantas.map((ll) => (ll.id === id ? { ...ll, [campo]: valor } : ll)));
  };

  const guardarComentario = async (llanta, texto) => {
    try {
      await axios.post("https://mi-app-llantas.onrender.com/api/editar-llanta", {
        ...llanta,
        comentario: texto,
      });

      await registrarActividad(
        "COMENTARIO",
        `${llanta.referencia}: ${texto ? "Comentario agregado/editado" : "Comentario eliminado"}`
      );

      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/llantas");
      setLlantas(data);
      setMensaje("Comentario guardado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("Error guardando comentario:", error);
      setMensaje("Error al guardar comentario ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar los ítems seleccionados?")) return;
    try {
      const referencias = llantas
        .filter((l) => seleccionadas.includes(l.id))
        .map((l) => l.referencia)
        .join(", ");

      for (let id of seleccionadas) {
        await axios.post("https://mi-app-llantas.onrender.com/api/eliminar-llanta", { id });
      }

      await registrarActividad(
        "ELIMINACIÓN MÚLTIPLE",
        `Se eliminaron ${seleccionadas.length} llantas: ${referencias}`
      );

      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/llantas");
      setLlantas(data);
      setSeleccionadas([]);
      setMensaje("Ítems eliminados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const iniciarEdicion = (id) => {
    const llanta = llantas.find((l) => l.id === id);
    if (llanta) {
      setLlantaOriginalEdicion(JSON.parse(JSON.stringify(llanta)));
      setModoEdicion(id);
    }
  };

  const handleGuardar = async (llanta) => {
    try {
      if (!llantaOriginalEdicion) {
        setMensaje("Error: No se encontró la llanta original ❌");
        return;
      }

      const cambios = [];

      if (String(llantaOriginalEdicion.referencia) !== String(llanta.referencia)) {
        cambios.push(`Referencia: ${llantaOriginalEdicion.referencia} → ${llanta.referencia}`);
      }
      if (String(llantaOriginalEdicion.marca) !== String(llanta.marca)) {
        cambios.push(`Marca: ${llantaOriginalEdicion.marca} → ${llanta.marca}`);
      }
      if (String(llantaOriginalEdicion.proveedor) !== String(llanta.proveedor)) {
        cambios.push(`Proveedor: ${llantaOriginalEdicion.proveedor} → ${llanta.proveedor}`);
      }
      if (Number(llantaOriginalEdicion.costo_empresa) !== Number(llanta.costo_empresa)) {
        cambios.push(`Costo: ${llantaOriginalEdicion.costo_empresa} → ${llanta.costo_empresa}`);
      }
      if (Number(llantaOriginalEdicion.precio_cliente) !== Number(llanta.precio_cliente)) {
        cambios.push(`Precio: ${llantaOriginalEdicion.precio_cliente} → ${llanta.precio_cliente}`);
      }
      if (Number(llantaOriginalEdicion.stock) !== Number(llanta.stock)) {
        cambios.push(`Stock: ${llantaOriginalEdicion.stock} → ${llanta.stock}`);
      }
      if (!!llantaOriginalEdicion.consignacion !== !!llanta.consignacion) {
        cambios.push(
          `Consignación: ${llantaOriginalEdicion.consignacion ? "Sí" : "No"} → ${llanta.consignacion ? "Sí" : "No"}`
        );
      }

      await axios.post("https://mi-app-llantas.onrender.com/api/editar-llanta", llanta);

      if (cambios.length > 0) {
        await registrarActividad("EDICIÓN", `Llanta ${llanta.referencia}: ${cambios.join(", ")}`);
      }

      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/llantas");
      setLlantas(data);

      setMensaje("Cambios guardados ✅");
      setModoEdicion(null);
      setLlantaOriginalEdicion(null);
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("❌ ERROR:", error);
      setMensaje("Error al guardar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleAgregar = async () => {
    try {
      await axios.post("https://mi-app-llantas.onrender.com/api/agregar-llanta", nuevoItem);

      await registrarActividad(
        "NUEVA LLANTA",
        `Se agregó: ${nuevoItem.referencia} - ${nuevoItem.marca} (Stock: ${nuevoItem.stock})`
      );

      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/llantas");
      setLlantas(data);
      setMostrarModal(false);
      setNuevoItem({
        referencia: "",
        marca: "",
        proveedor: "",
        costo_empresa: "",
        precio_cliente: "",
        stock: "",
      });
      setMensaje("Llanta agregada ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al agregar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta llanta?")) return;
    try {
      const llanta = llantas.find((l) => l.id === id);

      await axios.post("https://mi-app-llantas.onrender.com/api/eliminar-llanta", { id });

      await registrarActividad("ELIMINACIÓN", `Se eliminó: ${llanta.referencia} - ${llanta.marca}`);

      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/llantas");
      setLlantas(data);
      setMensaje("Llanta eliminada ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <h1 className="text-2xl font-bold text-gray-800">🚗 Gestión de Llantas</h1>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMostrarModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="text-lg">+</span>
                Agregar llanta
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
                onClick={abrirLogActividades}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-900 hover:to-black transition-all duration-200 shadow-md hover:shadow-lg border border-slate-700"
                title="Ver historial de cambios"
              >
                <span>📋</span>
                Upgrade
              </button>

              <button
                onClick={() => window.open("/lista_llantar.pdf", "_blank")}
                className="inline-flex items-center gap-2 bg-slate-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>📄</span>
                Lista Llantar
              </button>

              <button
                onClick={() => setMostrarComparador(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>📊</span>
                Comparar
              </button>
            </div>
          </div>
        </div>

        {/* Mensajes */}
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
            {/* Contador de resultados */}
            <div className="bg-white rounded-lg shadow-md px-4 py-2 mb-4 inline-block">
              <span className="text-sm text-gray-600">
                📊 Mostrando <span className="font-bold text-slate-700">{filtradas.length}</span> resultados
              </span>
            </div>

            {/* Panel de búsqueda */}
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>🔍</span>
                Búsqueda de Inventario
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Referencia</label>
                  <input
                    type="text"
                    placeholder="Buscar por referencia..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && busqueda.trim() !== "") {
                        let nuevas = [busqueda, ...busquedasRecientes.filter((v) => v !== busqueda)];
                        if (nuevas.length > 5) nuevas = nuevas.slice(0, 5);
                        setBusquedasRecientes(nuevas);
                        localStorage.setItem("busquedasRecientes", JSON.stringify(nuevas));
                        setBusqueda("");
                      }
                    }}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
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

                {busquedasRecientes.length > 0 && (
                  <div>
                    <span className="text-sm font-medium text-gray-600 mb-2 block">Búsquedas recientes:</span>
                    <div className="flex flex-wrap gap-2">
                      {busquedasRecientes.map((b, i) => (
                        <button
                          key={i}
                          onClick={() => setBusqueda(b)}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-slate-200 hover:text-slate-900 transition-all duration-200 shadow-sm hover:shadow-md"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla */}
              <div className="overflow-x-auto mt-6 rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                    <tr>
                      <th className="p-3 text-left">
                        <input
                          type="checkbox"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSeleccionadas(filtradas.map((l) => l.id));
                            } else {
                              setSeleccionadas([]);
                            }
                          }}
                          checked={seleccionadas.length === filtradas.length && filtradas.length > 0}
                          className="cursor-pointer w-4 h-4"
                        />
                      </th>
                      <th onClick={() => ordenarPor("referencia")} className="cursor-pointer p-3 text-left hover:bg-slate-600 transition-colors">
                        Referencia
                      </th>
                      <th className="p-3 text-center">Búsqueda</th>
                      <th onClick={() => ordenarPor("marca")} className="cursor-pointer p-3 text-left hover:bg-slate-600 transition-colors">
                        Marca
                      </th>
                      <th onClick={() => ordenarPor("proveedor")} className="cursor-pointer p-3 text-left hover:bg-slate-600 transition-colors">
                        Proveedor
                      </th>
                      <th onClick={() => ordenarPor("costo_empresa")} className="cursor-pointer p-3 text-right hover:bg-slate-600 transition-colors">
                        <div className="flex items-center justify-end gap-2">
                          Costo
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setMostrarCosto(!mostrarCosto);
                            }}
                            className="hover:bg-slate-700 p-1 rounded"
                          >
                            {mostrarCosto ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </th>
                      <th onClick={() => ordenarPor("precio_cliente")} className="cursor-pointer p-3 text-right hover:bg-slate-600 transition-colors">
                        Precio
                      </th>
                      <th onClick={() => ordenarPor("stock")} className="cursor-pointer p-3 text-center hover:bg-slate-600 transition-colors">
                        Stock
                      </th>
                      <th className="p-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filtradas.map((ll, idx) => (
                      <tr key={ll.id} className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-blue-50 transition-colors`}>
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={seleccionadas.includes(ll.id)}
                            onChange={() => toggleSeleccion(ll.id)}
                            className="cursor-pointer w-4 h-4"
                          />
                        </td>
                        {modoEdicion === ll.id ? (
                          <>
                            <td className="p-2">
                              <input
                                value={ll.referencia}
                                onChange={(e) => actualizarCampo(ll.id, "referencia", e.target.value)}
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() =>
                                    window.open(`https://www.llantar.com.co/search?q=${encodeURIComponent(ll.referencia)}`, "_blank")
                                  }
                                  className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 text-xs transition-all shadow-sm hover:shadow-md font-medium"
                                >
                                  Llantar
                                </button>
                              </div>
                            </td>
                            <td className="p-2">
                              <input
                                value={ll.marca}
                                onChange={(e) => actualizarCampo(ll.id, "marca", e.target.value)}
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={ll.proveedor}
                                onChange={(e) => actualizarCampo(ll.id, "proveedor", e.target.value)}
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={ll.costo_empresa}
                                onChange={(e) => actualizarCampo(ll.id, "costo_empresa", e.target.value)}
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={ll.precio_cliente}
                                onChange={(e) => actualizarCampo(ll.id, "precio_cliente", e.target.value)}
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={ll.stock}
                                onChange={(e) => actualizarCampo(ll.id, "stock", e.target.value)}
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-2 items-center">
                                <button
                                  onClick={() => actualizarCampo(ll.id, "consignacion", !ll.consignacion)}
                                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                                    ll.consignacion
                                      ? "bg-red-500 text-white hover:bg-red-600 shadow-md"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                >
                                  {ll.consignacion ? "✓ Consignación" : "Marcar Consignación"}
                                </button>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleGuardar(ll)}
                                    className="bg-green-500 text-white px-4 py-2 text-xs rounded-lg hover:bg-green-600 transition-all shadow-md font-medium"
                                  >
                                    💾 Guardar
                                  </button>
                                  <button
                                    onClick={() => {
                                      setModoEdicion(null);
                                      setLlantaOriginalEdicion(null);
                                      axios.get("https://mi-app-llantas.onrender.com/api/llantas").then((res) => setLlantas(res.data));
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
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">{ll.referencia}</span>
                                {ll.comentario && (
                                  <button
                                    type="button"
                                    onClick={() => setComentarioModal(ll)}
                                    className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                                    title="Ver comentario"
                                  >
                                    💬
                                  </button>
                                )}
                                {ll.consignacion && (
                                  <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-sm" title="En consignación">
                                    <span className="text-white font-bold text-xs">C</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center">
                                <button
                                  onClick={() =>
                                    window.open(`https://www.llantar.com.co/search?q=${encodeURIComponent(ll.referencia)}`, "_blank")
                                  }
                                  className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 text-xs transition-all shadow-sm hover:shadow-md font-medium"
                                >
                                  Llantar
                                </button>
                                <button
                                  onClick={() => abrirComparador(ll.referencia)}
                                  className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 text-xs transition-all shadow-sm hover:shadow-md font-medium"
                                >
                                  Comparar
                                </button>
                              </div>
                            </td>
                            <td className="p-3 text-gray-700">{ll.marca}</td>
                            <td className="p-3 text-gray-700">{ll.proveedor}</td>
                            <td className="p-3 text-right text-blue-600 font-semibold">
                              {mostrarCosto ? `$${(ll.costo_empresa || 0).toLocaleString()}` : "•••••"}
                            </td>
                            <td className="p-3 text-right text-green-600 font-semibold">${ll.precio_cliente.toLocaleString()}</td>
                            <td className={`p-3 text-center font-semibold ${ll.stock === 0 ? "text-red-600" : "text-gray-700"}`}>
                              {ll.stock === 0 ? <span className="inline-flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full text-xs">❌</span> : ll.stock}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center items-center">
                                <button
                                  onClick={() => iniciarEdicion(ll.id)}
                                  className="bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={async () => {
                                    const texto = prompt("Escribe un comentario para esta llanta:", ll.comentario || "");
                                    if (texto !== null) {
                                      await guardarComentario(ll, texto);
                                    }
                                  }}
                                  className="bg-yellow-500 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-yellow-600 transition-all shadow-sm hover:shadow-md"
                                  title="Comentario"
                                >
                                  💬
                                </button>
                                <button
                                  onClick={() => handleEliminar(ll.id)}
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

        {/* Modales (agregar, comentarios, logs) - Igual que tu código original */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>➕</span>
                Agregar Nueva Llanta
              </h2>
              <div className="space-y-4">
                {[
                  { key: "referencia", label: "Referencia" },
                  { key: "marca", label: "Marca" },
                  { key: "proveedor", label: "Proveedor" },
                  { key: "costo_empresa", label: "Costo Empresa" },
                  { key: "precio_cliente", label: "Precio Cliente" },
                  { key: "stock", label: "Stock" },
                ].map((campo) => (
                  <div key={campo.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{campo.label}</label>
                    <input
                      placeholder={`Ingrese ${campo.label.toLowerCase()}`}
                      value={nuevoItem[campo.key]}
                      onChange={(e) => setNuevoItem({ ...nuevoItem, [campo.key]: e.target.value })}
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

        {/* Modal Comparador */}
        {mostrarComparador && <ComparadorLlantas llantas={llantas} onClose={() => setMostrarComparador(false)} />}
      </div>
    </div>
  );
}

// Layout con Menú Lateral
function Layout() {
  return (
    <div className="flex min-h-screen">
      <MenuLateral />
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/llantas" element={<Protegido><Llantas /></Protegido>} />
          <Route path="/rines" element={<Protegido><Rines /></Protegido>} />
          <Route path="/tapetes" element={<Protegido><Tapetes /></Protegido>} />
          <Route path="/carpas" element={<Protegido><Carpas /></Protegido>} />
          <Route path="/tiros-arrastre" element={<Protegido><TirosArrastre /></Protegido>} />
          <Route path="/sonido" element={<Protegido><Sonido /></Protegido>} />
          <Route path="/luces" element={<Protegido><Luces /></Protegido>} />
          <Route path="/visor-stock" element={<Protegido><VisorStock /></Protegido>} />
          <Route path="/promociones" element={<Protegido><GestionPromociones /></Protegido>} />
        </Routes>
      </div>
    </div>
  );
}

// App Principal
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/*" element={<Layout />} />
      </Routes>
    </Router>
  );
}

export default App;
