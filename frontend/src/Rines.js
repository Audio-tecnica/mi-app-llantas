import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Rines() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const navigate = useNavigate();
  const [rines, setRines] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [medidaSeleccionada, setMedidaSeleccionada] = useState("");
  const [submedidaSeleccionada, setSubmedidaSeleccionada] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoItem, setNuevoItem] = useState({
    referencia: "",
    marca: "",
    proveedor: "",
    medida: "",
    costo: "",
    precio: "",
    stock: "",
  });
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState({ campo: "", asc: true });
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [fotoModal, setFotoModal] = useState(null);
  const [subirFotoId, setSubirFotoId] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [comentarioModal, setComentarioModal] = useState(null);
  const [rinOriginalEdicion, setRinOriginalEdicion] = useState(null);
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
    cargarRines();
  }, []);

  const cargarRines = async () => {
    try {
      setCargando(true);
      const res = await axios.get(`${API_URL}/api/rines`);
      setRines(res.data);
    } catch (error) {
      console.error("Error al cargar rines:", error);
      setMensaje("Error al cargar rines ❌");
    } finally {
      setCargando(false);
    }
  };

  const marcasUnicas = [...new Set(rines.map((r) => r.marca))];
  const medidasDisponibles = ["15", "16", "17", "18", "20"];

  const submedidasDisponibles = medidaSeleccionada
    ? [
        ...new Set(
          rines
            .filter((r) => r.medida?.toString().startsWith(medidaSeleccionada))
            .map((r) => {
              const medidaStr = r.medida?.toString() || "";
              const match = medidaStr.match(/\s+(\d+X\d+(?:\.\d+)?)/i);
              return match ? match[1].toUpperCase() : null;
            })
            .filter(Boolean)
        ),
      ].sort()
    : [];

  const filtradas = rines.filter((r) => {
    const coincideBusqueda = r.referencia
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || r.marca === marcaSeleccionada;
    const coincideMedida =
      !medidaSeleccionada ||
      r.medida?.toString().startsWith(medidaSeleccionada);
    const coincideSubmedida =
      !submedidaSeleccionada ||
      r.medida?.toUpperCase().includes(submedidaSeleccionada);
    return (
      coincideBusqueda && coincideMarca && coincideMedida && coincideSubmedida
    );
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
    setRines(ordenadas);
    setOrden({ campo, asc });
  };

  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleAgregar = async () => {
    try {
      const { referencia, marca, proveedor, medida, costo, precio, stock } =
        nuevoItem;

      if (!referencia || !marca) {
        setMensaje("Referencia y marca son obligatorios ❌");
        setTimeout(() => setMensaje(""), 2000);
        return;
      }

      const nuevoRin = {
        referencia: referencia.trim(),
        marca: marca.trim(),
        proveedor: proveedor?.trim() || "",
        medida: medida?.trim() || "",
        costo: Number(costo) || 0,
        precio: Number(precio) || 0,
        stock: Number(stock) || 0,
        remision: false,
        comentario: "",
      };

      await axios.post(`${API_URL}/api/agregar-rin`, nuevoRin);

      await registrarActividad(
        "NUEVO RIN",
        `Se agregó: ${nuevoRin.referencia} - ${nuevoRin.marca} (Stock: ${nuevoRin.stock})`
      );

      await cargarRines();

      setMostrarModal(false);
      setNuevoItem({
        referencia: "",
        marca: "",
        proveedor: "",
        medida: "",
        costo: "",
        precio: "",
        stock: "",
      });
      setMensaje("Rin agregado exitosamente ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("❌ Error al agregar:", error);
      setMensaje("Error al agregar rin ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar los rines seleccionados?")) return;
    try {
      const referencias = rines
        .filter((r) => seleccionadas.includes(r.id))
        .map((r) => r.referencia)
        .join(", ");

      for (let id of seleccionadas) {
        await axios.post(`${API_URL}/api/eliminar-rin`, { id });
      }

      await registrarActividad(
        "ELIMINACIÓN MÚLTIPLE RINES",
        `Se eliminaron ${seleccionadas.length} rines: ${referencias}`
      );

      await cargarRines();
      setSeleccionadas([]);
      setMensaje("Rines eliminados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const iniciarEdicion = (id) => {
    const rin = rines.find((r) => r.id === id);
    if (rin) {
      setRinOriginalEdicion(JSON.parse(JSON.stringify(rin)));
      setModoEdicion(id);
    }
  };

  const guardarComentario = async (rin, texto) => {
    try {
      const rinFormateado = {
        id: rin.id,
        referencia: rin.referencia?.trim() || "",
        marca: rin.marca?.trim() || "",
        proveedor: rin.proveedor?.trim() || "",
        medida: rin.medida?.toString().trim() || "",
        costo: Number(rin.costo) || 0,
        precio: Number(rin.precio) || 0,
        stock: Number(rin.stock) || 0,
        remision: Boolean(rin.remision),
        comentario: texto?.trim() || "",
      };

      const response = await axios.post(
        `${API_URL}/api/editar-rin`,
        rinFormateado
      );

      await registrarActividad(
        "COMENTARIO RIN",
        `${rin.referencia}: ${
          texto ? "Comentario agregado/editado" : "Comentario eliminado"
        }`
      );

      setRines((prev) =>
        prev.map((r) => (r.id === rin.id ? { ...r, ...response.data } : r))
      );

      setComentarioModal(null);
      setMensaje("Comentario guardado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("❌ Error guardando comentario:", error);
      setMensaje("Error al guardar comentario ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleGuardar = async (rin) => {
    try {
      if (!rinOriginalEdicion) {
        setMensaje("Error: No se encontró el rin original ❌");
        return;
      }

      const cambios = [];

      if (String(rinOriginalEdicion.referencia) !== String(rin.referencia)) {
        cambios.push(
          `Referencia: ${rinOriginalEdicion.referencia} → ${rin.referencia}`
        );
      }
      if (String(rinOriginalEdicion.marca) !== String(rin.marca)) {
        cambios.push(`Marca: ${rinOriginalEdicion.marca} → ${rin.marca}`);
      }
      if (
        String(rinOriginalEdicion.medida || "") !== String(rin.medida || "")
      ) {
        cambios.push(
          `Medida: ${rinOriginalEdicion.medida || "vacío"} → ${
            rin.medida || "vacío"
          }`
        );
      }
      if (
        String(rinOriginalEdicion.proveedor || "") !==
        String(rin.proveedor || "")
      ) {
        cambios.push(
          `Proveedor: ${rinOriginalEdicion.proveedor || "vacío"} → ${
            rin.proveedor || "vacío"
          }`
        );
      }
      if (Number(rinOriginalEdicion.costo) !== Number(rin.costo)) {
        cambios.push(
          `Costo: $${Number(rinOriginalEdicion.costo).toLocaleString(
            "es-CO"
          )} → $${Number(rin.costo).toLocaleString("es-CO")}`
        );
      }
      if (Number(rinOriginalEdicion.precio) !== Number(rin.precio)) {
        cambios.push(
          `Precio: $${Number(rinOriginalEdicion.precio).toLocaleString(
            "es-CO"
          )} → $${Number(rin.precio).toLocaleString("es-CO")}`
        );
      }
      if (Number(rinOriginalEdicion.stock) !== Number(rin.stock)) {
        cambios.push(`Stock: ${rinOriginalEdicion.stock} → ${rin.stock}`);
      }
      if (Boolean(rinOriginalEdicion.remision) !== Boolean(rin.remision)) {
        cambios.push(
          `Remisión: ${rinOriginalEdicion.remision ? "Sí" : "No"} → ${
            rin.remision ? "Sí" : "No"
          }`
        );
      }

      const rinFormateado = {
        id: rin.id,
        referencia: rin.referencia?.trim() || "",
        marca: rin.marca?.trim() || "",
        proveedor: rin.proveedor?.trim() || "",
        medida: rin.medida?.toString().trim() || "",
        costo: Number(rin.costo) || 0,
        precio: Number(rin.precio) || 0,
        stock: Number(rin.stock) || 0,
        remision: Boolean(rin.remision),
        comentario: rin.comentario?.trim() || "",
      };

      const response = await axios.post(
        `${API_URL}/api/editar-rin`,
        rinFormateado
      );

      if (cambios.length > 0) {
        await registrarActividad(
          "EDICIÓN RIN",
          `Rin ${rin.referencia}: ${cambios.join(", ")}`
        );
      }

      setRines((prev) =>
        prev.map((r) => (r.id === rin.id ? { ...r, ...response.data } : r))
      );

      setModoEdicion(null);
      setRinOriginalEdicion(null);
      setMensaje("Cambios guardados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("❌ Error al guardar:", error);
      setMensaje("Error al guardar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setRines((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              [campo]: campo === "remision" ? Boolean(valor) : valor,
            }
          : r
      )
    );
  };

  const handleSubirFoto = async (id) => {
    if (!archivoFoto) {
      setMensaje("Selecciona un archivo primero ❌");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    if (!archivoFoto.type.startsWith("image/")) {
      setMensaje("Solo se permiten archivos de imagen ❌");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    if (archivoFoto.size > 5 * 1024 * 1024) {
      setMensaje("La imagen no puede superar 5MB ❌");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    setSubiendoFoto(true);
    setMensaje("Subiendo foto... ⏳");

    try {
      const formData = new FormData();
      formData.append("foto", archivoFoto);
      formData.append("id", id);

      const { data } = await axios.post(
        `${API_URL}/api/rines/subir-foto`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        }
      );

      const rin = rines.find((r) => r.id === id);
      await registrarActividad(
        "FOTO RIN",
        `Se subió foto para: ${rin?.referencia || "Rin ID " + id}`
      );

      setRines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, foto: data.foto } : r))
      );
      setArchivoFoto(null);
      setSubirFotoId(null);
      setMensaje("Foto subida exitosamente ✅");
      setTimeout(() => setMensaje(""), 3000);
    } catch (e) {
      console.error("❌ Error completo:", e);

      let mensajeError = "Error al subir foto ❌";
      if (e.response?.data?.error) {
        mensajeError = `Error: ${e.response.data.error}`;
      } else if (e.code === "ECONNABORTED") {
        mensajeError = "Tiempo de espera agotado. La imagen es muy grande ❌";
      }

      setMensaje(mensajeError);
      setTimeout(() => setMensaje(""), 4000);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este rin?")) return;
    try {
      const rin = rines.find((r) => r.id === id);

      await axios.post(`${API_URL}/api/eliminar-rin`, { id });

      await registrarActividad(
        "ELIMINACIÓN RIN",
        `Se eliminó: ${rin?.referencia} - ${rin?.marca}`
      );

      await cargarRines();
      setMensaje("Rin eliminado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
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
            <img src="/logowp.PNG" className="h-10 w-auto" alt="Logo" />
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
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-700 transition-all text-sm"
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
              Inventario de Rines
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
                  <div className="text-slate-500 text-xs mt-1">
                    Total Rines
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
                    {filtradas.filter((r) => r.stock === 0).length}
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
                    setMedidaSeleccionada("");
                    setSubmedidaSeleccionada("");
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

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      Medida
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setMedidaSeleccionada("");
                          setSubmedidaSeleccionada("");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          medidaSeleccionada === ""
                            ? "bg-slate-700 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Todas
                      </button>
                      {medidasDisponibles.map((medida) => (
                        <button
                          key={medida}
                          onClick={() => {
                            setMedidaSeleccionada(medida);
                            setSubmedidaSeleccionada("");
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            medidaSeleccionada === medida
                              ? "bg-blue-600 text-white"
                              : "bg-blue-50 text-blue-700 hover:bg-blue-100"
                          }`}
                        >
                          {medida}"
                        </button>
                      ))}
                    </div>
                  </div>

                  {medidaSeleccionada && submedidasDisponibles.length > 0 && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">
                        Submedida
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => setSubmedidaSeleccionada("")}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            submedidaSeleccionada === ""
                              ? "bg-slate-700 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Todas
                        </button>
                        {submedidasDisponibles.map((submedida) => (
                          <button
                            key={submedida}
                            onClick={() =>
                              setSubmedidaSeleccionada(submedida)
                            }
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              submedidaSeleccionada === submedida
                                ? "bg-green-600 text-white"
                                : "bg-green-50 text-green-700 hover:bg-green-100"
                            }`}
                          >
                            {submedida}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Vista móvil - tarjetas */}
              <div className="lg:hidden space-y-3">
                {filtradas.map((r) => (
                  <div
                    key={r.id}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <input
                        type="checkbox"
                        checked={seleccionadas.includes(r.id)}
                        onChange={() => toggleSeleccion(r.id)}
                        className="cursor-pointer mt-1"
                      />
                      
                      {/* Foto */}
                      {r.foto ? (
                        <img
                          src={r.foto}
                          alt={r.referencia}
                          onClick={() => setFotoModal(r.foto)}
                          className="w-16 h-16 object-cover rounded-lg cursor-pointer border"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                          <span className="text-gray-400 text-xs">Sin foto</span>
                        </div>
                      )}

                      <div className="flex-1">
                        <div className="font-bold text-slate-800 flex items-center gap-2">
                          {r.referencia}
                          {r.comentario && (
                            <button
                              onClick={() => setComentarioModal(r)}
                              className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs"
                            >
                              💬
                            </button>
                          )}
                          {r.remision && (
                            <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                              R
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{r.marca}</div>
                        {r.medida && (
                          <div className="text-xs text-gray-500 mt-1">
                            Medida: {r.medida}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <span className="text-gray-500 text-xs">
                          Proveedor:
                        </span>
                        <div className="font-medium">{r.proveedor || "—"}</div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Stock:</span>
                        <div
                          className={`font-bold ${
                            r.stock === 0 ? "text-red-600" : "text-green-600"
                          }`}
                        >
                          {r.stock === 0 ? "Sin stock" : r.stock}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs">Precio:</span>
                        <div className="font-medium text-green-600">
                          ${Number(r.precio || 0).toLocaleString("es-CO")}
                        </div>
                      </div>
                      {mostrarCosto && (
                        <div>
                          <span className="text-gray-500 text-xs">Costo:</span>
                          <div className="font-medium text-blue-600">
                            ${Number(r.costo).toLocaleString("es-CO")}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => iniciarEdicion(r.id)}
                        className="bg-slate-100 hover:bg-slate-200 px-3 py-1.5 text-xs rounded transition-all"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => setSubirFotoId(r.id)}
                        className="bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1.5 text-xs rounded transition-all"
                      >
                        📷 Foto
                      </button>
                      <button
                        onClick={async () => {
                          const texto = prompt(
                            "Comentario:",
                            r.comentario || ""
                          );
                          if (texto !== null) {
                            await guardarComentario(r, texto);
                          }
                        }}
                        className="bg-yellow-100 hover:bg-yellow-200 px-3 py-1.5 text-xs rounded transition-all"
                      >
                        💬
                      </button>
                      <button
                        onClick={() => handleEliminar(r.id)}
                        className="bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 text-xs rounded transition-all"
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
                                setSeleccionadas(filtradas.map((r) => r.id));
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
                        <th className="p-2 text-center">Foto</th>
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
                          onClick={() => ordenarPor("medida")}
                          className="cursor-pointer p-2 text-left hover:bg-slate-600"
                        >
                          Medida
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
                      {filtradas.map((r, idx) => (
                        <tr
                          key={r.id}
                          className={`${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50`}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={seleccionadas.includes(r.id)}
                              onChange={() => toggleSeleccion(r.id)}
                              className="cursor-pointer"
                            />
                          </td>
                          {modoEdicion === r.id ? (
                            <>
                              {/* Modo edición para desktop - similar al código original pero más compacto */}
                              <td className="p-2 text-center">
                                {r.foto ? (
                                  <img
                                    src={r.foto}
                                    alt={r.referencia}
                                    className="w-12 h-12 object-cover rounded-lg mx-auto border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border">
                                    <span className="text-gray-400 text-xs">
                                      —
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                <input
                                  value={r.referencia}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      r.id,
                                      "referencia",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={r.marca}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      r.id,
                                      "marca",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={r.medida}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      r.id,
                                      "medida",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={r.proveedor}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      r.id,
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
                                  value={r.costo}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      r.id,
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
                                  value={r.precio}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      r.id,
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
                                  value={r.stock}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      r.id,
                                      "stock",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() =>
                                      actualizarCampo(
                                        r.id,
                                        "remision",
                                        !r.remision
                                      )
                                    }
                                    className={`px-2 py-1 text-xs rounded ${
                                      r.remision
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {r.remision ? "✓ Remisión" : "Marcar"}
                                  </button>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleGuardar(r)}
                                      className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                                    >
                                      💾
                                    </button>
                                    <button
                                      onClick={() => {
                                        setModoEdicion(null);
                                        setRinOriginalEdicion(null);
                                        cargarRines();
                                      }}
                                      className="bg-gray-400 text-white px-2 py-1 text-xs rounded hover:bg-gray-500"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2 text-center">
                                {r.foto ? (
                                  <img
                                    src={r.foto}
                                    alt={r.referencia}
                                    onClick={() => setFotoModal(r.foto)}
                                    className="w-12 h-12 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform mx-auto border"
                                  />
                                ) : (
                                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border">
                                    <span className="text-gray-400 text-xs">
                                      —
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {r.referencia}
                                  </span>
                                  {r.comentario && (
                                    <button
                                      onClick={() => setComentarioModal(r)}
                                      className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs"
                                    >
                                      💬
                                    </button>
                                  )}
                                  {r.remision && (
                                    <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                      R
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-2">{r.marca}</td>
                              <td className="p-2">{r.medida || "—"}</td>
                              <td className="p-2">{r.proveedor || "—"}</td>
                              <td className="p-2 text-right text-blue-600 font-semibold">
                                {mostrarCosto
                                  ? `$${Number(r.costo).toLocaleString(
                                      "es-CO"
                                    )}`
                                  : "•••"}
                              </td>
                              <td className="p-2 text-right text-green-600 font-semibold">
                                ${Number(r.precio || 0).toLocaleString(
                                  "es-CO"
                                )}
                              </td>
                              <td
                                className={`p-2 text-center font-semibold ${
                                  r.stock === 0
                                    ? "text-red-600"
                                    : "text-gray-700"
                                }`}
                              >
                                {r.stock === 0 ? "❌" : r.stock}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => iniciarEdicion(r.id)}
                                    className="bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs rounded"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const texto = prompt(
                                        "Comentario:",
                                        r.comentario || ""
                                      );
                                      if (texto !== null) {
                                        await guardarComentario(r, texto);
                                      }
                                    }}
                                    className="bg-yellow-100 hover:bg-yellow-200 px-2 py-1 text-xs rounded"
                                  >
                                    💬
                                  </button>
                                  <button
                                    onClick={() => setSubirFotoId(r.id)}
                                    className="bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 text-xs rounded"
                                  >
                                    📷
                                  </button>
                                  <button
                                    onClick={() => handleEliminar(r.id)}
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
            </>
          )}
        </main>
      </div>

      {/* Modales (mantener los mismos modales del código original) */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              ➕ Agregar Nuevo Rin
            </h2>
            <div className="space-y-3">
              {[
                { key: "referencia", label: "Referencia" },
                { key: "marca", label: "Marca" },
                { key: "medida", label: "Medida" },
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

      {subirFotoId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              📷 Subir Foto del Rin
            </h2>
            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-700 mb-2">
                Seleccionar imagen
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setArchivoFoto(e.target.files[0])}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg file:mr-4 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-slate-100 file:text-slate-700"
              />
              {archivoFoto && (
                <p className="mt-2 text-xs text-gray-600">
                  ✓ Archivo: {archivoFoto.name}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleSubirFoto(subirFotoId)}
                disabled={subiendoFoto || !archivoFoto}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {subiendoFoto ? "Subiendo..." : "Subir"}
              </button>
              <button
                onClick={() => {
                  setSubirFotoId(null);
                  setArchivoFoto(null);
                }}
                disabled={subiendoFoto}
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {fotoModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoModal(null)}
        >
          <div
            className="relative max-w-4xl max-h-screen bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-4 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold">📷 Vista de Imagen</h3>
              <button
                onClick={() => setFotoModal(null)}
                className="text-white text-2xl hover:bg-slate-700 rounded-full w-8 h-8"
              >
                ×
              </button>
            </div>
            <div className="p-4 bg-gray-50">
              <img
                src={fotoModal}
                alt="Foto del rin"
                className="max-w-full max-h-[70vh] rounded-lg object-contain mx-auto"
              />
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
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  💬 Comentario
                </h3>
                <p className="text-xs text-gray-500 mt-1">
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
              <p className="text-gray-800 whitespace-pre-wrap text-sm">
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
                  }
                }}
                className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600"
              >
                Editar
              </button>
              <button
                onClick={() => setComentarioModal(null)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600"
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

export default Rines; 
