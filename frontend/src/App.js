import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

  // 🆕 Estados para log de actividades
  const [mostrarLogModal, setMostrarLogModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [cargandoLogs, setCargandoLogs] = useState(false);
  const [busquedaLog, setBusquedaLog] = useState("");
  const [filtroTipoLog, setFiltroTipoLog] = useState("");

  // 🔥 VARIABLE CRÍTICA QUE FALTABA
  const [llantaOriginalEdicion, setLlantaOriginalEdicion] = useState(null);

  const navigate = useNavigate();

  const [busquedasRecientes, setBusquedasRecientes] = useState(() => {
    const guardadas = localStorage.getItem("busquedasRecientes");
    return guardadas ? JSON.parse(guardadas) : [];
  });

  // 🔒 Verificación de sesión
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

  // 📦 Cargar llantas
  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/llantas")
      .then((res) => setLlantas(res.data))
      .catch(() => setMensaje("Error al cargar llantas ❌"))
      .finally(() => setCargando(false));
  }, []);

  // 🆕 Función para registrar actividad
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

  // 🆕 Función para abrir log con contraseña
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

  // 🆕 Función para cargar logs
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

  // 📋 Filtros y marcas
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

  // 🆕 Filtrar logs
  const logsFiltrados = logs.filter((log) => {
    const coincideBusqueda =
      log.detalles?.toLowerCase().includes(busquedaLog.toLowerCase()) ||
      log.tipo?.toLowerCase().includes(busquedaLog.toLowerCase());
    const coincideTipo = !filtroTipoLog || log.tipo === filtroTipoLog;
    return coincideBusqueda && coincideTipo;
  });

  // 🔃 Ordenar columnas
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

  // 🔥 FUNCIÓN QUE FALTABA - actualizar campos en modo edición
  const actualizarCampo = (id, campo, valor) => {
    setLlantas(
      llantas.map((ll) =>
        ll.id === id ? { ...ll, [campo]: valor } : ll
      )
    );
  };

  // 🔥 FUNCIÓN PARA GUARDAR COMENTARIO
  const guardarComentario = async (llanta, texto) => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-llanta",
        {
          ...llanta,
          comentario: texto,
        }
      );

      // Registrar actividad
      await registrarActividad(
        "COMENTARIO",
        `${llanta.referencia}: ${texto ? 'Comentario agregado/editado' : 'Comentario eliminado'}`
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

  // ✅ Funciones CRUD
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

  // 🔥 FUNCIÓN PARA INICIAR EDICIÓN (GUARDANDO ESTADO ORIGINAL)
  const iniciarEdicion = (id) => {
    const llanta = llantas.find((l) => l.id === id);
    if (llanta) {
      // Guardar copia profunda del estado original
      setLlantaOriginalEdicion(JSON.parse(JSON.stringify(llanta)));
      setModoEdicion(id);
      console.log("✅ Modo edición iniciado. Original guardado:", llanta);
    }
  };

  // ✅ HANDLEGUARDAR CORREGIDO
  const handleGuardar = async (llanta) => {
    try {
      console.log("=== INICIO GUARDAR ===");
      console.log("Llanta a guardar:", llanta);
      console.log("Llanta original guardada:", llantaOriginalEdicion);

      if (!llantaOriginalEdicion) {
        setMensaje("Error: No se encontró la llanta original ❌");
        return;
      }

      const cambios = [];

      // Comparar cada campo
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

      console.log("🔍 Cambios detectados:", cambios);

      // Guardar en BD
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-llanta",
        llanta
      );

      // Registrar actividad solo si hubo cambios
      if (cambios.length > 0) {
        await registrarActividad(
          "EDICIÓN",
          `Llanta ${llanta.referencia}: ${cambios.join(", ")}`
        );
        console.log("✅ Cambios registrados en log");
      } else {
        console.log("ℹ️ No hubo cambios para registrar");
      }

      // Recargar
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

  // 🧩 Render principal
  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Encabezado */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <img src="/logowp.PNG" className="h-13 w-48" alt="Logo" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800"
          >
            Agregar llanta
          </button>
          <button
            onClick={handleEliminarMultiples}
            disabled={seleccionadas.length === 0}
            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Eliminar seleccionados
          </button>

          <button
            onClick={abrirLogActividades}
            className="bg-indigo-600 text-white px-3 py-1.5 rounded text-sm hover:bg-indigo-700 font-semibold"
            title="Ver historial de cambios"
          >
            📋 Historial
          </button>

          <button
            onClick={() => {
              localStorage.removeItem("acceso");
              window.location.href = "/login";
            }}
            className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600"
          >
            Cerrar sesión
          </button>
          <button
            onClick={() => window.open("/lista_llantar.pdf", "_blank")}
            className="bg-blue-500 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-600"
          >
            Lista llantar
          </button>
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="text-center text-blue-700 font-semibold mb-4 bg-blue-50 p-3 rounded-lg">
          ❗{mensaje}
        </div>
      )}

      {/* Contenido principal */}
      {cargando ? (
        <div className="text-center py-10 text-gray-500">
          ⏳ Cargando llantas...
        </div>
      ) : (
        <>
          <div className="flex space-x-3 mb-4">
            <button
              onClick={() => {
                setBusqueda("");
                setMarcaSeleccionada("");
              }}
              className="bg-orange-600 text-white px-2 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Limpiar filtros
            </button>

            <button
              onClick={() => navigate("/tapetes")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Ir a Tapetes
            </button>

            <button
              onClick={() => navigate("/rines")}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
            >
              Ir a Rines
            </button>
          </div>

          <div className="text-sm text-gray-700 mb-2">
            Mostrando {filtradas.length} resultados
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Ingrese su búsqueda
            </h2>

            <input
              type="text"
              placeholder="Buscar referencia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && busqueda.trim() !== "") {
                  let nuevas = [
                    busqueda,
                    ...busquedasRecientes.filter((v) => v !== busqueda),
                  ];
                  if (nuevas.length > 5) nuevas = nuevas.slice(0, 5);
                  setBusquedasRecientes(nuevas);
                  localStorage.setItem(
                    "busquedasRecientes",
                    JSON.stringify(nuevas)
                  );
                  setBusqueda("");
                }
              }}
              className="w-full p-3 border-2 border-orange-500 rounded-3xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition ease-in-out duration-500"
            />

            <label className="block text-sm font-medium text-gray-600 mb-2 mt-4">
              Marca
            </label>
            <select
              value={marcaSeleccionada}
              onChange={(e) => setMarcaSeleccionada(e.target.value)}
              className="w-full p-4 border-2 border-orange-300 rounded-xl shadow-sm focus:ring-2 focus:ring-orange-400 outline-none transition ease-in-out duration-300"
            >
              <option value="">Todas las marcas</option>
              {marcasUnicas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {busquedasRecientes.length > 0 && (
              <div className="mt-4">
                <span className="text-sm text-gray-600 mr-2">
                  Búsquedas recientes:
                </span>
                <div className="flex flex-wrap gap-2 mt-1">
                  {busquedasRecientes.map((b, i) => (
                    <button
                      key={i}
                      onClick={() => setBusqueda(b)}
                      className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm hover:bg-orange-500 hover:text-white transition-colors duration-300"
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tabla */}
            <div className="overflow-auto mt-6">
              <table className="w-full border text-sm">
                <thead className="bg-gradient-to-r from-gray-400 to-orange-300 text-black">
                  <tr>
                    <th className="p-2"></th>
                    <th
                      onClick={() => ordenarPor("referencia")}
                      className="cursor-pointer p-2 hover:bg-orange-400 transition-colors"
                    >
                      Referencia ↕
                    </th>
                    <th className="p-2">Búsqueda</th>
                    <th
                      onClick={() => ordenarPor("marca")}
                      className="cursor-pointer p-2 hover:bg-orange-400 transition-colors"
                    >
                      Marca ↕
                    </th>
                    <th
                      onClick={() => ordenarPor("proveedor")}
                      className="cursor-pointer p-2 hover:bg-orange-400 transition-colors"
                    >
                      Proveedor ↕
                    </th>
                    <th
                      onClick={() => ordenarPor("costo_empresa")}
                      className="cursor-pointer p-2 hover:bg-orange-400 transition-colors"
                    >
                      Costo ↕
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMostrarCosto(!mostrarCosto);
                        }}
                        className="ml-2 text-gray-700 hover:text-black"
                      >
                        {mostrarCosto ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </th>
                    <th
                      onClick={() => ordenarPor("precio_cliente")}
                      className="cursor-pointer p-2 hover:bg-orange-400 transition-colors"
                    >
                      Precio ↕
                    </th>
                    <th
                      onClick={() => ordenarPor("stock")}
                      className="cursor-pointer p-2 hover:bg-orange-400 transition-colors"
                    >
                      Stock ↕
                    </th>
                    <th className="p-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((ll) => (
                    <tr
                      key={ll.id}
                      className="text-center border-t even:bg-gray-50 hover:bg-blue-50 transition-colors"
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(ll.id)}
                          onChange={() => toggleSeleccion(ll.id)}
                          className="cursor-pointer"
                        />
                      </td>
                      {modoEdicion === ll.id ? (
                        <>
                          <td>
                            <input
                              value={ll.referencia}
                              onChange={(e) =>
                                actualizarCampo(
                                  ll.id,
                                  "referencia",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded text-sm p-1 focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td>{/* Vacío en modo edición */}</td>
                          <td>
                            <input
                              value={ll.marca}
                              onChange={(e) =>
                                actualizarCampo(ll.id, "marca", e.target.value)
                              }
                              className="w-full border rounded text-sm p-1 focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td>
                            <input
                              value={ll.proveedor}
                              onChange={(e) =>
                                actualizarCampo(
                                  ll.id,
                                  "proveedor",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded text-sm p-1 focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td>
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
                              className="w-full border rounded text-sm p-1 focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td>
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
                              className="w-full border rounded text-sm p-1 focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={ll.stock}
                              onChange={(e) =>
                                actualizarCampo(ll.id, "stock", e.target.value)
                              }
                              className="w-full border rounded text-sm p-1 focus:ring-2 focus:ring-blue-400"
                            />
                          </td>
                          <td className="flex gap-1 justify-center flex-col items-center p-2">
                            <button
                              onClick={() =>
                                actualizarCampo(
                                  ll.id,
                                  "consignacion",
                                  !ll.consignacion
                                )
                              }
                              className={`px-3 py-1 text-xs rounded mb-2 font-semibold transition-colors ${
                                ll.consignacion
                                  ? "bg-red-500 text-white hover:bg-red-600"
                                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                              }`}
                            >
                              {ll.consignacion
                                ? "✓ Consignación"
                                : "Marcar Consignación"}
                            </button>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleGuardar(ll)}
                                className="bg-blue-500 text-white px-3 py-1 text-xs rounded hover:bg-blue-600 transition-colors"
                              >
                                💾 Guardar
                              </button>
                              <button
                                onClick={() => {
                                  setModoEdicion(null);
                                  setLlantaOriginalEdicion(null);
                                  // Recargar datos originales
                                  axios
                                    .get("https://mi-app-llantas.onrender.com/api/llantas")
                                    .then((res) => setLlantas(res.data));
                                }}
                                className="bg-gray-300 text-black px-3 py-1 text-xs rounded hover:bg-gray-400 transition-colors"
                              >
                                ✖ Cancelar
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-1">
                              <span className="font-medium">
                                {ll.referencia}
                              </span>

                              {ll.comentario && (
                                <button
                                  type="button"
                                  onClick={() => setComentarioModal(ll)}
                                  className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-colors text-xs"
                                  title="Ver comentario"
                                >
                                  💬
                                </button>
                              )}

                              {ll.consignacion && (
                                <div
                                  className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center"
                                  title="En consignación"
                                >
                                  <span className="text-white font-bold text-[10px]">
                                    C
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-2">
                            <div className="flex gap-1 justify-center items-center">
                              <button
                                onClick={() =>
                                  window.open(
                                    `https://www.llantar.com.co/search?q=${encodeURIComponent(
                                      ll.referencia
                                    )}`,
                                    "_blank"
                                  )
                                }
                                className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs transition-colors"
                              >
                                Llantar
                              </button>
                              <button
                                onClick={() => abrirComparador(ll.referencia)}
                                className="bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700 text-xs transition-colors"
                              >
                                Comparar
                              </button>
                            </div>
                          </td>

                          <td>{ll.marca}</td>
                          <td>{ll.proveedor}</td>
                          <td className="text-blue-600 font-semibold">
                            {mostrarCosto
                              ? `${ll.costo_empresa.toLocaleString()}`
                              : "•••••"}
                          </td>
                          <td className="text-green-600 font-semibold">
                            ${ll.precio_cliente.toLocaleString()}
                          </td>
                          <td className={ll.stock === 0 ? "text-red-600 font-bold" : "font-semibold"}>
                            {ll.stock === 0 ? "❌ Sin stock" : ll.stock}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1 justify-center items-center">
                              <button
                                onClick={() => iniciarEdicion(ll.id)}
                                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded transition-colors"
                                title="Editar"
                              >
                                ✏️
                              </button>

                              <button
                                onClick={async () => {
                                  const texto = prompt(
                                    "Escribe un comentario para esta llanta:",
                                    ll.comentario || ""
                                  );
                                  if (texto !== null) {
                                    await guardarComentario(ll, texto);
                                  }
                                }}
                                className="bg-yellow-500 text-white px-2 py-1 text-xs rounded hover:bg-yellow-600 transition-colors"
                              >
                                💬
                              </button>

                              <button
                                onClick={() => handleEliminar(ll.id)}
                                className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded transition-colors"
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

      {/* Modal agregar llanta */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar nueva llanta</h2>
            {[
              "referencia",
              "marca",
              "proveedor",
              "costo_empresa",
              "precio_cliente",
              "stock",
            ].map((campo) => (
              <input
                key={campo}
                placeholder={campo.replace("_", " ")}
                value={nuevoItem[campo]}
                onChange={(e) =>
                  setNuevoItem({ ...nuevoItem, [campo]: e.target.value })
                }
                className="w-full mb-3 p-2 border rounded focus:ring-2 focus:ring-blue-400 outline-none"
              />
            ))}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleAgregar}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA VER COMENTARIOS */}
      {comentarioModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setComentarioModal(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Comentario</h3>
                <p className="text-sm text-gray-500">
                  Ref: {comentarioModal.referencia}
                </p>
              </div>
              <button
                onClick={() => setComentarioModal(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-800 whitespace-pre-wrap break-words">
                {comentarioModal.comentario}
              </p>
            </div>

            <div className="flex gap-2">
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
                className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 font-medium transition-colors"
              >
                Editar
              </button>
              <button
                onClick={() => setComentarioModal(null)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 MODAL DE LOG DE ACTIVIDADES */}
      {mostrarLogModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setMostrarLogModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">
                    📋 Historial de Actividades
                  </h2>
                  <p className="text-indigo-100 text-sm mt-1">
                    Registro completo de cambios en el inventario
                  </p>
                </div>
                <button
                  onClick={() => setMostrarLogModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
                >
                  <span className="text-3xl leading-none">×</span>
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <input
                    type="text"
                    placeholder="Buscar en historial..."
                    value={busquedaLog}
                    onChange={(e) => setBusquedaLog(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
                  />
                </div>
                <div className="min-w-[200px]">
                  <select
                    value={filtroTipoLog}
                    onChange={(e) => setFiltroTipoLog(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-400 outline-none"
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
                <button
                  onClick={() => {
                    setBusquedaLog("");
                    setFiltroTipoLog("");
                  }}
                  className="bg-orange-500 text-white px-6 py-3 rounded-lg hover:bg-orange-600 font-semibold transition-colors"
                >
                  Limpiar
                </button>
              </div>

              <div className="mt-3 text-sm text-gray-600">
                Mostrando {logsFiltrados.length} de {logs.length} registros
              </div>
            </div>

            {/* Contenido del log */}
            <div
              className="p-6 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 280px)" }}
            >
              {cargandoLogs ? (
                <div className="text-center py-10 text-gray-500">
                  ⏳ Cargando historial...
                </div>
              ) : logsFiltrados.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-lg">No hay registros que mostrar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logsFiltrados.map((log, index) => {
                    const fecha = new Date(log.fecha);
                    const esHoy =
                      fecha.toDateString() === new Date().toDateString();

                    // Colores según tipo de actividad
                    let colorClase = "bg-blue-50 border-blue-200";
                    let iconoTipo = "📝";

                    if (log.tipo === "NUEVA LLANTA") {
                      colorClase = "bg-green-50 border-green-200";
                      iconoTipo = "➕";
                    } else if (
                      log.tipo === "ELIMINACIÓN" ||
                      log.tipo === "ELIMINACIÓN MÚLTIPLE"
                    ) {
                      colorClase = "bg-red-50 border-red-200";
                      iconoTipo = "🗑️";
                    } else if (log.tipo === "EDICIÓN") {
                      colorClase = "bg-yellow-50 border-yellow-200";
                      iconoTipo = "✏️";
                    } else if (log.tipo === "COMENTARIO") {
                      colorClase = "bg-purple-50 border-purple-200";
                      iconoTipo = "💬";
                    }

                    return (
                      <div
                        key={log.id || index}
                        className={`${colorClase} border-l-4 p-4 rounded-lg transition-all hover:shadow-md`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{iconoTipo}</span>
                              <span className="font-bold text-gray-800">
                                {log.tipo}
                              </span>
                              {esHoy && (
                                <span className="bg-indigo-500 text-white text-xs px-2 py-1 rounded-full">
                                  HOY
                                </span>
                              )}
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed">
                              {log.detalles}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500 ml-4">
                            <div className="font-semibold">
                              {fecha.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })}
                            </div>
                            <div className="text-gray-400">
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

            {/* Footer del modal */}
            <div className="bg-gray-100 p-4 border-t flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total de actividades registradas:{" "}
                <span className="font-bold">{logs.length}</span>
              </div>
              <button
                onClick={() => setMostrarLogModal(false)}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 font-semibold transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
