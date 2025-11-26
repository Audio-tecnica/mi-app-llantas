import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
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

  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/rines")
      .then((res) => setRines(res.data))
      .catch(() => setMensaje("Error al cargar rines ❌"))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(rines.map((r) => r.marca))];
  const medidasDisponibles = ["15", "16", "17", "18", "20"];

  // Extraer submedidas únicas según la medida seleccionada
  const submedidasDisponibles = medidaSeleccionada
    ? [
        ...new Set(
          rines
            .filter((r) => r.medida?.toString().startsWith(medidaSeleccionada))
            .map((r) => {
              // Buscar el segundo patrón numérico después de las pulgadas
              // Por ejemplo: de "17X8 6X139" extraer "6X139"
              // o de "17X9 5X114.3" extraer "5X114.3"
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

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar los rines seleccionados?")) return;
    try {
      for (let id of seleccionadas) {
        await axios.post(
          "https://mi-app-llantas.onrender.com/api/eliminar-rin",
          { id }
        );
      }
      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/rines"
      );
      setRines(data);
      setSeleccionadas([]);
      setMensaje("Rines eliminados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const guardarComentario = async (rin, texto) => {
    try {
      await axios.post("https://mi-app-llantas.onrender.com/api/editar-rin", {
        ...rin,
        comentario: texto,
      });

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/rines"
      );
      setRines(data);
      setMensaje("Comentario guardado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("Error guardando comentario:", error);
      setMensaje("Error al guardar comentario ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

const handleGuardar = async (rin) => {
  try {
    const rinFormateado = {
      id: rin.id,
      marca: rin.marca || "",
      referencia: rin.referencia || "",
      proveedor: rin.proveedor || "",
      medida: rin.medida || "",
      costo: parseFloat(rin.costo) || 0,
      precio: parseFloat(rin.precio) || 0,
      stock: parseInt(rin.stock) || 0,
      remision: rin.remision === true,
      comentario: rin.comentario || ""
    };

    await axios.post("https://mi-app-llantas.onrender.com/api/editar-rin", rinFormateado);

    alert("Cambios guardados correctamente ✅");
    fetchRines(); // vuelve a cargar y mantiene los datos
  } catch (error) {
    console.error(error);
    alert("Error al guardar ❌");
  }
};


  const handleAgregar = async () => {
    if (!nuevoItem.referencia || !nuevoItem.marca || !nuevoItem.medida) {
      setMensaje("Referencia, marca y medida son obligatorias ❌");
      return;
    }

    try {
      const nuevoRinFormateado = {
        referencia: nuevoItem.referencia.trim(),
        marca: nuevoItem.marca.trim(),
        proveedor: nuevoItem.proveedor?.trim() || "",
        medida: nuevoItem.medida.trim(),
        costo: Number(nuevoItem.costo) || 0,
        precio: Number(nuevoItem.precio) || 0,
        stock: Number(nuevoItem.stock) || 0,
      };

      await axios.post(
        "https://mi-app-llantas.onrender.com/api/agregar-rin",
        nuevoRinFormateado
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/rines"
      );

      setRines(data);
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

      setMensaje("Rin agregado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (e) {
      console.error("❌ Error al agregar rin:", e.response?.data || e);
      setMensaje("Error al agregar ❌");
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
        "https://mi-app-llantas.onrender.com/api/rines/subir-foto",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 30000,
        }
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
      await axios.post("https://mi-app-llantas.onrender.com/api/eliminar-rin", {
        id,
      });
      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/rines"
      );
      setRines(data);
      setMensaje("Rin eliminado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <img src="/logowp.PNG" className="h-12 w-auto" alt="Logo" />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMostrarModal(true)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span className="text-lg">+</span>
                Agregar rin
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
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => {
                  setBusqueda("");
                  setMarcaSeleccionada("");
                  setMedidaSeleccionada("");
                  setSubmedidaSeleccionada("");
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
                onClick={() => navigate("/tapetes")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-slate-700 to-slate-800 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:from-slate-800 hover:to-slate-900 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <span>🏠</span>
                Tapetes
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-md px-4 py-2 mb-4 inline-block">
              <span className="text-sm text-gray-600">
                📊 Mostrando{" "}
                <span className="font-bold text-slate-700">
                  {filtradas.length}
                </span>{" "}
                resultados
              </span>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span>🔍</span>
                Búsqueda de Rines
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Medida
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setMedidaSeleccionada("");
                        setSubmedidaSeleccionada("");
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        medidaSeleccionada === ""
                          ? "bg-slate-700 text-white shadow-lg"
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
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          medidaSeleccionada === medida
                            ? "bg-blue-600 text-white shadow-lg"
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Submedida
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setSubmedidaSeleccionada("")}
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                          submedidaSeleccionada === ""
                            ? "bg-slate-700 text-white shadow-lg"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        Todas
                      </button>
                      {submedidasDisponibles.map((submedida) => (
                        <button
                          key={submedida}
                          onClick={() => setSubmedidaSeleccionada(submedida)}
                          className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                            submedidaSeleccionada === submedida
                              ? "bg-green-600 text-white shadow-lg"
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

              <div className="overflow-x-auto mt-6 rounded-xl border border-gray-200">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-700 to-slate-800 text-white">
                    <tr>
                      <th className="p-3 text-left">
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
                          className="cursor-pointer w-4 h-4"
                        />
                      </th>
                      <th className="p-3 text-center min-w-40">Foto</th>
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
                        onClick={() => ordenarPor("medida")}
                        className="cursor-pointer p-3 text-left hover:bg-slate-600 transition-colors"
                      >
                        Medida
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
                    {filtradas.map((r, idx) => (
                      <tr
                        key={r.id}
                        className={`${
                          idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors`}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={seleccionadas.includes(r.id)}
                            onChange={() => toggleSeleccion(r.id)}
                            className="cursor-pointer w-4 h-4"
                          />
                        </td>

                        {modoEdicion === r.id ? (
                          <>
                            <td className="p-3 text-center">
                              {r.foto ? (
                                <img
                                  src={r.foto}
                                  alt={r.referencia}
                                  className="w-20 h-24 sm:w-16 sm:h-16 object-cover rounded-lg shadow-md mx-auto border-2 border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-24 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border-2 border-gray-200">
                                  <span className="text-gray-400 text-xs">
                                    Sin foto
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
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                value={r.marca}
                                onChange={(e) =>
                                  actualizarCampo(r.id, "marca", e.target.value)
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={r.costo}
                                onChange={(e) =>
                                  actualizarCampo(r.id, "costo", e.target.value)
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
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
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={r.stock}
                                onChange={(e) =>
                                  actualizarCampo(r.id, "stock", e.target.value)
                                }
                                className="w-full border-2 border-blue-300 rounded-lg text-sm p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                              />
                            </td>
                            <td className="p-3">
                              <div className="flex flex-col gap-2 items-center">
                                <button
                                  onClick={() =>
                                    actualizarCampo(
                                      r.id,
                                      "remision",
                                      !r.remision
                                    )
                                  }
                                  className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all ${
                                    r.remision
                                      ? "bg-red-500 text-white hover:bg-red-600 shadow-md"
                                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                                  }`}
                                >
                                  {r.remision
                                    ? "✓ Remisión"
                                    : "Marcar Remisión"}
                                </button>
                                <button
                                  onClick={() => handleGuardar(r)}
                                  className="bg-green-500 text-white px-4 py-2 text-xs rounded-lg hover:bg-green-600 transition-all shadow-md font-medium"
                                >
                                  💾 Guardar
                                </button>

                                <button
                                  onClick={() => setModoEdicion(null)}
                                  className="bg-gray-400 text-white px-4 py-2 text-xs rounded-lg hover:bg-gray-500 transition-all shadow-md font-medium"
                                >
                                  ✖ Cancelar
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-center">
                              {r.foto ? (
                                <img
                                  src={r.foto}
                                  alt={r.referencia}
                                  onClick={() => setFotoModal(r.foto)}
                                  className="w-20 h-24 sm:w-16 sm:h-16 object-cover rounded-lg cursor-pointer hover:scale-110 transition-transform shadow-md mx-auto border-2 border-gray-200"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="w-20 h-24 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto border-2 border-gray-200">
                                  <span className="text-gray-400 text-xs">
                                    Sin foto
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">
                                  {r.referencia}
                                </span>
                                {r.comentario && (
                                  <button
                                    type="button"
                                    onClick={() => setComentarioModal(r)}
                                    className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white hover:bg-blue-600 transition-all shadow-sm hover:shadow-md"
                                    title="Ver comentario"
                                  >
                                    💬
                                  </button>
                                )}
                                {r.remision && (
                                  <div
                                    className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center shadow-sm"
                                    title="En remisión"
                                  >
                                    <span className="text-white font-bold text-xs">
                                      R
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="p-3 text-gray-700">{r.marca}</td>
                            <td className="p-3 text-gray-700">
                              {r.medida || "—"}
                            </td>
                            <td className="p-3 text-gray-700">
                              {r.proveedor || "—"}
                            </td>
                            <td className="p-3 text-right text-blue-600 font-semibold">
                              {mostrarCosto
                                ? `$${Number(r.costo).toLocaleString("es-CO")}`
                                : "•••••"}
                            </td>
                            <td className="p-3 text-right text-green-600 font-semibold">
                              ${Number(r.precio || 0).toLocaleString("es-CO")}
                            </td>
                            <td
                              className={`p-3 text-center font-semibold ${
                                r.stock === 0 ? "text-red-600" : "text-gray-700"
                              }`}
                            >
                              {r.stock === 0 ? (
                                <span className="inline-flex items-center gap-1 bg-red-100 px-2 py-1 rounded-full text-xs">
                                  ❌
                                </span>
                              ) : (
                                r.stock
                              )}
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2 justify-center items-center">
                                <button
                                  onClick={() => setModoEdicion(r.id)}
                                  className="bg-slate-200 hover:bg-slate-300 px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={async () => {
                                    const texto = prompt(
                                      "Escribe un comentario para este rin:",
                                      r.comentario || ""
                                    );
                                    if (texto !== null) {
                                      await guardarComentario(r, texto);
                                    }
                                  }}
                                  className="bg-yellow-500 text-white px-3 py-1.5 text-sm rounded-lg hover:bg-yellow-600 transition-all shadow-sm hover:shadow-md"
                                  title="Comentario"
                                >
                                  💬
                                </button>
                                <button
                                  onClick={() => setSubirFotoId(r.id)}
                                  className="bg-green-500 text-white hover:bg-green-600 px-3 py-1.5 text-sm rounded-lg transition-all shadow-sm hover:shadow-md"
                                  title="Subir foto"
                                >
                                  📷
                                </button>
                                <button
                                  onClick={() => handleEliminar(r.id)}
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

        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>➕</span>Agregar Nuevo Rin
              </h2>
              <div className="space-y-4">
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

        {subirFotoId && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md transform transition-all">
              <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                <span>📷</span>Subir Foto del Rin
              </h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Seleccionar imagen
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setArchivoFoto(e.target.files[0])}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                />
                {archivoFoto && (
                  <p className="mt-3 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    ✓ Archivo seleccionado:{" "}
                    <span className="font-semibold">{archivoFoto.name}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleSubirFoto(subirFotoId)}
                  disabled={subiendoFoto || !archivoFoto}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {subiendoFoto ? "Subiendo..." : "Subir foto"}
                </button>
                <button
                  onClick={() => {
                    setSubirFotoId(null);
                    setArchivoFoto(null);
                  }}
                  disabled={subiendoFoto}
                  className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {fotoModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
            onClick={() => setFotoModal(null)}
          >
            <div
              className="relative max-w-4xl max-h-screen bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold flex items-center gap-3">
                    <span>📷</span>
                    Vista de Imagen
                  </h3>
                  <button
                    onClick={() => setFotoModal(null)}
                    className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-3 transition-all w-12 h-12 flex items-center justify-center text-3xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 bg-gray-50">
                <img
                  src={fotoModal}
                  alt="Foto del rin"
                  className="max-w-full max-h-[70vh] rounded-xl shadow-2xl object-contain mx-auto"
                  onError={(e) => {
                    e.target.src = "/placeholder-image.png";
                    e.target.alt = "Error al cargar imagen";
                  }}
                />
              </div>
              {comentarioModal && (
                <div
                  className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm"
                  onClick={() => setComentarioModal(null)}
                >
                  <div
                    className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-lg transform transition-all"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                          <span>💬</span>
                          Comentario
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Ref: {comentarioModal.referencia}
                        </p>
                      </div>
                      <button
                        onClick={() => setComentarioModal(null)}
                        className="text-gray-400 hover:text-gray-600 text-4xl leading-none hover:bg-gray-100 w-10 h-10 rounded-full transition-all"
                      >
                        ×
                      </button>
                    </div>

                    <div className="bg-gray-50 p-6 rounded-xl mb-6 border-2 border-gray-100">
                      <p className="text-gray-800 whitespace-pre-wrap break-words leading-relaxed">
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
                            await guardarComentario(
                              comentarioModal,
                              nuevoTexto
                            );
                            setComentarioModal(null);
                          }
                        }}
                        className="flex-1 bg-yellow-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-yellow-600 transition-all shadow-lg hover:shadow-xl"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setComentarioModal(null)}
                        className="flex-1 bg-gray-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-600 transition-all shadow-lg hover:shadow-xl"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-gray-100 p-6 border-t flex justify-end">
                <button
                  onClick={() => setFotoModal(null)}
                  className="bg-slate-600 text-white px-8 py-3 rounded-xl hover:bg-slate-700 font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Rines;
