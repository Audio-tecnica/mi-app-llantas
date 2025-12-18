import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ComparadorLlantas from "./ComparadorLlantas";

function App() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [ancho, setAncho] = useState("");
  const [perfil, setPerfil] = useState("");
  const [rin, setRin] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [comparadorAbierto, setComparadorAbierto] = useState(false);
  const [referenciaSeleccionada, setReferenciaSeleccionada] = useState("");
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
  const [menuAbierto, setMenuAbierto] = useState(false);

  const navigate = useNavigate();

  const [busquedasRecientes, setBusquedasRecientes] = useState(() => {
    const guardadas = localStorage.getItem("busquedasRecientes");
    return guardadas ? JSON.parse(guardadas) : [];
  });

  useEffect(() => {
    const acceso = localStorage.getItem("acceso");
    const timestamp = localStorage.getItem("timestamp");
    const maxTiempo = 60 * 60 * 1000;

    if (!acceso || !timestamp || Date.now() - parseInt(timestamp) > maxTiempo) {
      localStorage.removeItem("acceso");
      localStorage.removeItem("timestamp");
      window.location.href = "/login";
      return;
    }

    localStorage.setItem("timestamp", Date.now());

    const timer = setTimeout(() => {
      localStorage.removeItem("acceso");
      localStorage.removeItem("timestamp");
      window.location.href = "/login";
    }, maxTiempo);

    return () => clearTimeout(timer);
  }, []);

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
    const password = prompt(
      "Ingrese la contraseña para ver el log de actividades:"
    );

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
      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/logs"
      );
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
      referencia +
        " site:llantar.com.co OR site:virtualllantas.com OR site:tullanta.com"
    )}`;
    window.open(url, "_blank");
  };

  const marcasUnicas = [...new Set(llantas.map((l) => l.marca))];

  const filtradas = llantas.filter((l) => {
    const coincideBusqueda = l.referencia
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || l.marca === marcaSeleccionada;
    const coincideAncho = !ancho || l.referencia.includes(ancho);
    const coincidePerfil = !perfil || l.referencia.includes(perfil);
    const coincideRin = !rin || l.referencia.includes(rin);
    return (
      coincideBusqueda &&
      coincideMarca &&
      coincideAncho &&
      coincidePerfil &&
      coincideRin
    );
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
    setLlantas(
      llantas.map((ll) => (ll.id === id ? { ...ll, [campo]: valor } : ll))
    );
  };

  const guardarComentario = async (llanta, texto) => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-llanta",
        {
          ...llanta,
          comentario: texto,
        }
      );

      await registrarActividad(
        "COMENTARIO",
        `${llanta.referencia}: ${
          texto ? "Comentario agregado/editado" : "Comentario eliminado"
        }`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
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
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar los ítems seleccionados?")) return;
    try {
      const referencias = llantas
        .filter((l) => seleccionadas.includes(l.id))
        .map((l) => l.referencia)
        .join(", ");

      for (let id of seleccionadas) {
        await axios.post(
          "https://mi-app-llantas.onrender.com/api/eliminar-llanta",
          { id }
        );
      }

      await registrarActividad(
        "ELIMINACIÓN MÚLTIPLE",
        `Se eliminaron ${seleccionadas.length} llantas: ${referencias}`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
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

      if (
        String(llantaOriginalEdicion.referencia) !== String(llanta.referencia)
      ) {
        cambios.push(
          `Referencia: ${llantaOriginalEdicion.referencia} → ${llanta.referencia}`
        );
      }

      if (String(llantaOriginalEdicion.marca) !== String(llanta.marca)) {
        cambios.push(`Marca: ${llantaOriginalEdicion.marca} → ${llanta.marca}`);
      }

      if (
        String(llantaOriginalEdicion.proveedor) !== String(llanta.proveedor)
      ) {
        cambios.push(
          `Proveedor: ${llantaOriginalEdicion.proveedor} → ${llanta.proveedor}`
        );
      }

      if (
        Number(llantaOriginalEdicion.costo_empresa) !==
        Number(llanta.costo_empresa)
      ) {
        cambios.push(
          `Costo: ${llantaOriginalEdicion.costo_empresa} → ${llanta.costo_empresa}`
        );
      }

      if (
        Number(llantaOriginalEdicion.precio_cliente) !==
        Number(llanta.precio_cliente)
      ) {
        cambios.push(
          `Precio: ${llantaOriginalEdicion.precio_cliente} → ${llanta.precio_cliente}`
        );
      }

      if (Number(llantaOriginalEdicion.stock) !== Number(llanta.stock)) {
        cambios.push(`Stock: ${llantaOriginalEdicion.stock} → ${llanta.stock}`);
      }

      if (!!llantaOriginalEdicion.consignacion !== !!llanta.consignacion) {
        cambios.push(
          `Consignación: ${
            llantaOriginalEdicion.consignacion ? "Sí" : "No"
          } → ${llanta.consignacion ? "Sí" : "No"}`
        );
      }

      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-llanta",
        llanta
      );

      if (cambios.length > 0) {
        await registrarActividad(
          "EDICIÓN",
          `Llanta ${llanta.referencia}: ${cambios.join(", ")}`
        );
      }

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
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
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/agregar-llanta",
        nuevoItem
      );

      await registrarActividad(
        "NUEVA LLANTA",
        `Se agregó: ${nuevoItem.referencia} - ${nuevoItem.marca} (Stock: ${nuevoItem.stock})`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
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

      await axios.post(
        "https://mi-app-llantas.onrender.com/api/eliminar-llanta",
        { id }
      );

      await registrarActividad(
        "ELIMINACIÓN",
        `Se eliminó: ${llanta.referencia} - ${llanta.marca}`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
      setLlantas(data);
      setMensaje("Llanta eliminada ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-gradient-to-b from-slate-800 to-slate-900 text-white transition-all duration-300 z-50 ${
          menuAbierto ? "w-64" : "w-0 lg:w-64"
        } overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <img src="/logowp.PNG" className="h-10 w-auto" alt="Logo" />
            <button
              onClick={() => setMenuAbierto(false)}
              className="lg:hidden text-white hover:bg-slate-700 p-2 rounded"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Principal
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all"
            >
              <span className="text-xl">🏠</span>
              <span className="font-medium">Dashboard</span>
            </button>

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3 mt-6">
              Categorías
            </div>

            <button
              onClick={() => navigate("/tapetes")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all"
            >
              <span className="text-xl">🚗</span>
              <span>Tapetes</span>
            </button>

            <button
              onClick={() => navigate("/rines")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all"
            >
              <span className="text-xl">⚙️</span>
              <span>Rines</span>
            </button>

            <button
              onClick={() => navigate("/carpas")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all"
            >
              <span className="text-xl">🏕️</span>
              <span>Carpas</span>
            </button>

            <button
              onClick={() => navigate("/tiros-arrastre")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all"
            >
              <span className="text-xl">🔗</span>
              <span>Tiros de Arrastre</span>
            </button>

            <button
              onClick={() => navigate("/sonido")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all"
            >
              <span className="text-xl">🔊</span>
              <span>Sonido</span>
            </button>

            <button
              onClick={() => navigate("/luces")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-700 transition-all"
            >
              <span className="text-xl">💡</span>
              <span>Luces</span>
            </button>

            <div className="border-t border-slate-700 my-4"></div>

            <button
              onClick={() => {
                localStorage.removeItem("acceso");
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-all"
            >
              <span className="text-xl">🚪</span>
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
        <header className="bg-white shadow-md px-4 py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMenuAbierto(true)}
              className="lg:hidden text-slate-800 hover:bg-slate-100 p-2 rounded"
            >
              <Menu size={24} />
            </button>
            
            <h1 className="text-xl font-bold text-slate-800">
              Inventario de Llantas
            </h1>

            <div className="text-sm text-slate-600">
              {filtradas.length} resultados
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4 lg:p-6">
          {/* Mensajes */}
          {mensaje && (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-4 rounded-lg mb-6 shadow-md animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                <span className="font-medium">{mensaje}</span>
              </div>
            </div>
          )}

          {cargando ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
              <p className="text-gray-600 text-lg">Cargando inventario...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold">{filtradas.length}</div>
                  <div className="text-teal-100 text-sm mt-1">Total Llantas</div>
                </div>

                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold">{seleccionadas.length}</div>
                  <div className="text-yellow-100 text-sm mt-1">Seleccionadas</div>
                </div>

                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold">
                    {filtradas.filter((l) => l.stock === 0).length}
                  </div>
                  <div className="text-red-100 text-sm mt-1">Sin Stock</div>
                </div>

                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                  <div className="text-3xl font-bold">{marcasUnicas.length}</div>
                  <div className="text-green-100 text-sm mt-1">Marcas</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                <button
                  onClick={() => setMostrarModal(true)}
                  className="flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 transition-all shadow-md"
                >
                  <span>+</span>
                  <span className="text-sm font-medium">Agregar</span>
                </button>

                <button
                  onClick={handleEliminarMultiples}
                  disabled={seleccionadas.length === 0}
                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
                >
                  <span>🗑️</span>
                  <span className="text-sm font-medium">Eliminar</span>
                </button>

                <button
                  onClick={abrirLogActividades}
                  className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-3 rounded-lg hover:bg-slate-900 transition-all shadow-md"
                >
                  <span>📋</span>
                  <span className="text-sm font-medium">Historial</span>
                </button>

                <button
                  onClick={() => window.open("/lista_llantar.pdf", "_blank")}
                  className="flex items-center justify-center gap-2 bg-slate-700 text-white px-4 py-3 rounded-lg hover:bg-slate-800 transition-all shadow-md"
                >
                  <span>📄</span>
                  <span className="text-sm font-medium">Lista</span>
                </button>

                <button
                  onClick={() => setMostrarComparador(true)}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md"
                >
                  <span>📊</span>
                  <span className="text-sm font-medium">Comparar</span>
                </button>

                <button
                  onClick={() => navigate("/visor-stock")}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-all shadow-md"
                >
                  <span>📈</span>
                  <span className="text-sm font-medium">Visor Stock</span>
                </button>

                <button
                  onClick={() => navigate("/promociones")}
                  className="flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 transition-all shadow-md"
                >
                  <span>🎉</span>
                  <span className="text-sm font-medium">Promos</span>
                </button>

                <button
                  onClick={() => {
                    setBusqueda("");
                    setMarcaSeleccionada("");
                  }}
                  className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition-all shadow-md"
                >
                  <span>🔄</span>
                  <span className="text-sm font-medium">Limpiar</span>
                </button>
              </div>

              {/* Panel de búsqueda */}
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <span>🔍</span>
                  Búsqueda de Inventario
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Referencia
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar por referencia..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marca
                    </label>
                    <select
                      value={marcaSeleccionada}
                      onChange={(e) => setMarcaSeleccionada(e.target.value)}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
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
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700 text-white">
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
                            checked={
                              seleccionadas.length === filtradas.length &&
                              filtradas.length > 0
                            }
                            className="cursor-pointer w-4 h-4"
                          />
                        </th>
                        <th
                          onClick={() => ordenarPor("referencia")}
                          className="cursor-pointer p-3 text-left hover:bg-slate-600"
                        >
                          Referencia
                        </th>
                        <th className="p-3 text-center">Búsqueda</th>
                        <th
                          onClick={() => ordenarPor("marca")}
                          className="cursor-pointer p-3 text-left hover:bg-slate-600"
                        >
                          Marca
                        </th>
                        <th
                          onClick={() => ordenarPor("proveedor")}
                          className="cursor-pointer p-3 text-left hover:bg-slate-600"
                        >
                          Proveedor
                        </th>
                        <th
                          onClick={() => ordenarPor("costo_empresa")}
                          className="cursor-pointer p-3 text-right hover:bg-slate-600"
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
                          onClick={() => ordenarPor("precio_cliente")}
                          className="cursor-pointer p-3 text-right hover:bg-slate-600"
                        >
                          Precio
                        </th>
                        <th
                          onClick={() => ordenarPor("stock")}
                          className="cursor-pointer p-3 text-center hover:bg-slate-600"
                        >
                          Stock
                        </th>
                        <th className="p-3 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filtradas.map((ll, idx) => (
                        <tr
                          key={ll.id}
                          className={`${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50`}
                        >
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
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "referencia",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded-lg text-sm p-2"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://www.llantar.com.co/search?q=${encodeURIComponent(
                                          ll.referencia
                                        )}`,
                                        "_blank"
                                      )
                                    }
                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 text-xs"
                                  >
                                    Llantar
                                  </button>
                                </div>
                              </td>
                              <td className="p-2">
                                <input
                                  value={ll.marca}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "marca",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded-lg text-sm p-2"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={ll.proveedor}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "proveedor",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded-lg text-sm p-2"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={ll.costo_empresa}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "costo_empresa",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded-lg text-sm p-2"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={ll.precio_cliente}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "precio_cliente",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded-lg text-sm p-2"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={ll.stock}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "stock",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded-lg text-sm p-2"
                                />
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col gap-2 items-center">
                                  <button
                                    onClick={() =>
                                      actualizarCampo(
                                        ll.id,
                                        "consignacion",
                                        !ll.consignacion
                                      )
                                    }
                                    className={`px-3 py-1.5 text-xs rounded-lg font-semibold ${
                                      ll.consignacion
                                        ? "bg-red-500 text-white hover:bg-red-600"
                                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                    }`}
                                  >
                                    {ll.consignacion
                                      ? "✓ Consignación"
                                      : "Marcar"}
                                  </button>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleGuardar(ll)}
                                      className="bg-green-500 text-white px-4 py-2 text-xs rounded-lg hover:bg-green-600"
                                    >
                                      💾
                                    </button>
                                    <button
                                      onClick={() => {
                                        setModoEdicion(null);
                                        setLlantaOriginalEdicion(null);
                                        axios
                                          .get(
                                            "https://mi-app-llantas.onrender.com/api/llantas"
                                          )
                                          .then((res) => setLlantas(res.data));
                                      }}
                                      className="bg-gray-400 text-white px-4 py-2 text-xs rounded-lg hover:bg-gray-500"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-800">
                                    {ll.referencia}
                                  </span>
                                  {ll.comentario && (
                                    <button
                                      onClick={() => setComentarioModal(ll)}
                                      className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600"
                                    >
                                      💬
                                    </button>
                                  )}
                                  {ll.consignacion && (
                                    <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
                                      <span className="text-white font-bold text-xs">
                                        C
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://www.llantar.com.co/search?q=${encodeURIComponent(
                                          ll.referencia
                                        )}`,
                                        "_blank"
                                      )
                                    }
                                    className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 text-xs"
                                  >
                                    Llantar
                                  </button>
                                  <button
                                    onClick={() =>
                                      abrirComparador(ll.referencia)
                                    }
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700 text-xs"
                                  >
                                    Comparar
                                  </button>
                                </div>
                              </td>
                              <td className="p-3 text-gray-700">{ll.marca}</td>
                              <td className="p-3 text-gray-700">
                                {ll.proveedor}
                              </td>
                              <td className="p-3 text-right text-blue-600 font-semibold">
                                {mostrarCosto
                                  ? `$${(
                                      ll.costo_empresa || 0
                                    ).toLocaleString()}`
                                  : "•••••"}
                              </td>
                              <td className="p-3 text-right text-green-600 font-semibold">
                                ${ll.precio_cliente.toLocaleString()}
                              </td>
                              <td
                                className={`p-3 text-center font-semibold ${
                                  ll.stock === 0
                                    ? "text-red-600"
                                    : "text-gray-700"
                                }`}
                              >
                                {ll.stock === 0 ? (
                                  <span className="inline-flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full text-xs">
                                    ❌
                                  </span>
                                ) : (
                                  ll.stock
                                )}
                              </td>
                              <td className="p-3">
                                <div className="flex gap-2 justify-center">
                                  <button
                                    onClick={() => iniciarEdicion(ll.id)}
                                    className="bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-sm rounded-lg"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const texto = prompt(
                                        "Escribe un comentario:",
                                        ll.comentario || ""
                                      );
                                      if (texto !== null) {
                                        await guardarComentario(ll, texto);
                                      }
                                    }}
                                    className="bg-yellow-500 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-yellow-600"
                                  >
                                    💬
                                  </button>
                                  <button
                                    onClick={() => handleEliminar(ll.id)}
                                    className="bg-red-500 text-white hover:bg-red-600 px-3 py-1.5 text-sm rounded-lg"
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
        </main>
      </div>

      {/* Modales (mantener los mismos) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              ➕ Agregar Nueva Llanta
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAgregar}
                className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {comentarioModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setComentarioModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800">
                  💬 Comentario
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Ref: {comentarioModal.referencia}
                </p>
              </div>
              <button
                onClick={() => setComentarioModal(null)}
                className="text-gray-400 hover:text-gray-600 text-4xl"
              >
                ×
              </button>
            </div>
            <div className="bg-gray-50 p-6 rounded-xl mb-6">
              <p className="text-gray-800 whitespace-pre-wrap">
                {comentarioModal.comentario}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  const nuevoTexto = prompt(
                    "Editar comentario:",
                    comentarioModal.comentario
                  );
                  if (nuevoTexto !== null) {
                    await guardarComentario(comentarioModal, nuevoTexto);
                    setComentarioModal(null);
                  }
                }}
                className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-yellow-600"
              >
                Editar
              </button>
              <button
                onClick={() => setComentarioModal(null)}
                className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarLogModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setMostrarLogModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-8 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold">📋 Historial de Actividades</h2>
                  <p className="text-slate-200 text-sm mt-2">
                    Registro completo de cambios
                  </p>
                </div>
                <button
                  onClick={() => setMostrarLogModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-3 text-3xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 border-b">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="🔍 Buscar en historial..."
                    value={busquedaLog}
                    onChange={(e) => setBusquedaLog(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                  />
                </div>
                <div className="min-w-[200px]">
                  <select
                    value={filtroTipoLog}
                    onChange={(e) => setFiltroTipoLog(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 outline-none"
                  >
                    <option value="">Todos los tipos</option>
                    <option value="NUEVA LLANTA">Nueva Llanta</option>
                    <option value="EDICIÓN">Edición</option>
                    <option value="ELIMINACIÓN">Eliminación</option>
                    <option value="ELIMINACIÓN MÚLTIPLE">
                      Eliminación Múltiple
                    </option>
                    <option value="COMENTARIO">Comentario</option>
                  </select>
                </div>
              </div>
            </div>

            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 280px)" }}
            >
              {cargandoLogs ? (
                <div className="text-center py-16">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
                  <p className="text-gray-600">Cargando...</p>
                </div>
              ) : logsFiltrados.length === 0 ? (
                <div className="text-center py-16 text-gray-500">
                  <div className="text-7xl mb-6">📭</div>
                  <p className="text-xl font-semibold">No hay registros</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logsFiltrados.map((log, index) => {
                    const fecha = new Date(log.fecha);
                    let colorClase = "bg-blue-50 border-blue-300";
                    let iconoTipo = "📝";

                    if (log.tipo === "NUEVA LLANTA") {
                      colorClase = "bg-green-50 border-green-300";
                      iconoTipo = "➕";
                    } else if (
                      log.tipo === "ELIMINACIÓN" ||
                      log.tipo === "ELIMINACIÓN MÚLTIPLE"
                    ) {
                      colorClase = "bg-red-50 border-red-300";
                      iconoTipo = "🗑️";
                    } else if (log.tipo === "EDICIÓN") {
                      colorClase = "bg-yellow-50 border-yellow-300";
                      iconoTipo = "✏️";
                    } else if (log.tipo === "COMENTARIO") {
                      colorClase = "bg-purple-50 border-purple-300";
                      iconoTipo = "💬";
                    }

                    return (
                      <div
                        key={log.id || index}
                        className={`${colorClase} border-l-4 p-5 rounded-xl`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="text-2xl">{iconoTipo}</span>
                              <span className="font-bold text-gray-800">
                                {log.tipo}
                              </span>
                            </div>
                            <p className="text-gray-700">{log.detalles}</p>
                          </div>
                          <div className="text-right text-xs text-gray-500 ml-6 bg-white px-3 py-2 rounded-lg">
                            <div className="font-semibold">
                              {fecha.toLocaleDateString("es-CO")}
                            </div>
                            <div className="mt-1">
                              {fecha.toLocaleTimeString("es-CO", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mostrarComparador && (
        <ComparadorLlantas
          llantas={llantas}
          onClose={() => setMostrarComparador(false)}
        />
      )}
    </div>
  );
}

export default App;
