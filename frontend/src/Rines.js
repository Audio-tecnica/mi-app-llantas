
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./index.css";

function Rines() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const navigate = useNavigate();
  const [rines, setRines] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [medidaSeleccionada, setMedidaSeleccionada] = useState("");
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

  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/rines")
      .then((res) => setRines(res.data))
      .catch(() => setMensaje("Error al cargar rines ❌"))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(rines.map((r) => r.marca))];
  const medidasDisponibles = ['15', '16', '17', '18', '20'];

  const filtradas = rines.filter((r) => {
    const coincideBusqueda = r.referencia?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || r.marca === marcaSeleccionada;
    const coincideMedida = !medidaSeleccionada || r.medida?.toString().startsWith(medidaSeleccionada);
    return coincideBusqueda && coincideMarca && coincideMedida;
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
        await axios.post("https://mi-app-llantas.onrender.com/api/eliminar-rin", { id });
      }
      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/rines");
      setRines(data);
      setSeleccionadas([]);
      setMensaje("Rines eliminados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleGuardar = async (rin) => {
    try {
      await axios.post("https://mi-app-llantas.onrender.com/api/editar-rin", rin);
      setMensaje("Cambios guardados ✅");
      setModoEdicion(null);
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al guardar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar este rin?")) return;
    try {
      await axios.post("https://mi-app-llantas.onrender.com/api/eliminar-rin", { id });
      setRines((prev) => prev.filter((r) => r.id !== id));
      setMensaje("Rin eliminado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleAgregar = async () => {
    try {
      const nuevoRinFormateado = {
        marca: nuevoItem.marca,
        referencia: nuevoItem.referencia,
        proveedor: nuevoItem.proveedor || "",
        medida: nuevoItem.medida || "",
        costo: parseFloat(nuevoItem.costo) || 0,
        precio: parseFloat(nuevoItem.precio) || 0,
        stock: parseInt(nuevoItem.stock) || 0,
      };
      await axios.post("https://mi-app-llantas.onrender.com/api/agregar-rin", nuevoRinFormateado);
      const { data } = await axios.get("https://mi-app-llantas.onrender.com/api/rines");
      setRines(data);
      setMostrarModal(false);
      setNuevoItem({ referencia: "", marca: "", proveedor: "", medida: "", costo: "", precio: "", stock: "" });
      setMensaje("Rin agregado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (e) {
      console.error("❌ Error al agregar rin:", e);
      setMensaje("Error al agregar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setRines((prev) => prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r)));
  };

  const handleSubirFoto = async (id) => {
    if (!archivoFoto) {
      setMensaje("Selecciona un archivo primero ❌");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }
    if (!archivoFoto.type.startsWith('image/')) {
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
      const { data } = await axios.post("https://mi-app-llantas.onrender.com/api/rines/subir-foto", formData, { 
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000
      });
      setRines((prev) => prev.map((r) => (r.id === id ? { ...r, foto: data.foto } : r)));
      setArchivoFoto(null);
      setSubirFotoId(null);
      setMensaje("Foto subida exitosamente ✅");
      setTimeout(() => setMensaje(""), 3000);
    } catch (e) {
      console.error("❌ Error:", e);
      let mensajeError = "Error al subir foto ❌";
      if (e.response?.data?.error) {
        mensajeError = `Error: ${e.response.data.error}`;
      } else if (e.code === 'ECONNABORTED') {
        mensajeError = "Tiempo de espera agotado. La imagen es muy grande ❌";
      }
      setMensaje(mensajeError);
      setTimeout(() => setMensaje(""), 4000);
    } finally {
      setSubiendoFoto(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-2 sm:p-4">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-6 gap-3">
        <img src="/logowp.PNG" className="h-10 sm:h-13 w-36 sm:w-48" alt="Logo" />
        <div className="flex flex-wrap gap-2 justify-center">
          <button onClick={() => setMostrarModal(true)} className="bg-gray-700 text-white px-3 py-1.5 rounded text-xs sm:text-sm hover:bg-gray-800">
            + Rin
          </button>
          <button onClick={handleEliminarMultiples} disabled={seleccionadas.length === 0} className="bg-red-600 text-white px-3 py-1.5 rounded text-xs sm:text-sm hover:bg-red-700 disabled:opacity-50">
            Eliminar ({seleccionadas.length})
          </button>
          <button onClick={() => { localStorage.removeItem("acceso"); window.location.href = "/login"; }} className="bg-red-500 text-white px-3 py-1.5 rounded text-xs sm:text-sm hover:bg-red-600">
            Salir
          </button>
        </div>
      </div>

      {mensaje && <div className="text-center text-blue-700 font-semibold mb-4 text-sm">◉{mensaje}</div>}

      {cargando ? (
        <div className="text-center py-10 text-gray-500">⏳ Cargando rines...</div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            <button onClick={() => { setBusqueda(""); setMarcaSeleccionada(""); setMedidaSeleccionada(""); }} className="bg-orange-600 text-white px-3 py-2 rounded-lg hover:bg-orange-700 transition text-xs sm:text-sm">
              Limpiar
            </button>
            <button onClick={() => navigate("/")} className="bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition text-xs sm:text-sm">
              Llantas
            </button>
            <button onClick={() => navigate("/tapetes")} className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition text-xs sm:text-sm">
              Tapetes
            </button>
          </div>

          <div className="text-xs sm:text-sm text-gray-700 mb-2">{filtradas.length} resultado{filtradas.length !== 1 ? 's' : ''}</div>

          <div className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl shadow-xl border mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Buscar rin</h2>

            <input type="text" placeholder="Buscar referencia..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="w-full p-2 sm:p-3 border-2 border-gray-500 rounded-2xl sm:rounded-3xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition text-sm sm:text-base" />

            <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-2 mt-4">Marca</label>
            <select value={marcaSeleccionada} onChange={(e) => setMarcaSeleccionada(e.target.value)} className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-gray-400 outline-none transition text-sm sm:text-base">
              <option value="">Todas las marcas</option>
              {marcasUnicas.map((m) => (<option key={m} value={m}>{m}</option>))}
            </select>

            <label className="block text-xs sm:text-sm font-medium text-gray-600 mb-2 mt-4 sm:mt-6">Medida</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setMedidaSeleccionada("")} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${medidaSeleccionada === "" ? "bg-gray-700 text-white shadow-lg" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}>
                Todas
              </button>
              {medidasDisponibles.map((medida) => (
                <button key={medida} onClick={() => setMedidaSeleccionada(medida)} className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold transition-all text-xs sm:text-sm ${medidaSeleccionada === medida ? "bg-blue-600 text-white shadow-lg" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                  {medida}"
                </button>
              ))}
            </div>

            {/* Vista Desktop - Tabla */}
            <div className="hidden md:block overflow-auto mt-6">
              <table className="w-full border text-sm">
                <thead className="bg-gradient-to-r from-gray-500 to-gray-300 text-black">
                  <tr>
                    <th className="p-2"></th>
                    <th onClick={() => ordenarPor("referencia")} className="cursor-pointer p-2">Referencia</th>
                    <th className="p-2">Foto</th>
                    <th onClick={() => ordenarPor("marca")} className="cursor-pointer p-2">Marca</th>
                    <th onClick={() => ordenarPor("medida")} className="cursor-pointer p-2">Medida</th>
                    <th onClick={() => ordenarPor("proveedor")} className="cursor-pointer p-2">Proveedor</th>
                    <th onClick={() => ordenarPor("costo")} className="cursor-pointer p-2">
                      Costo
                      <button onClick={(e) => { e.stopPropagation(); setMostrarCosto(!mostrarCosto); }} className="ml-2 text-white-600">
                        {mostrarCosto ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </th>
                    <th onClick={() => ordenarPor("precio")} className="cursor-pointer p-2">Precio</th>
                    <th onClick={() => ordenarPor("stock")} className="cursor-pointer p-2">Stock</th>
                    <th className="p-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((r) => (
                    <tr key={r.id} className="text-center border-t even:bg-gray-50">
                      <td><input type="checkbox" checked={seleccionadas.includes(r.id)} onChange={() => toggleSeleccion(r.id)} /></td>
                      {modoEdicion === r.id ? (
                        <>
                          <td><input value={r.referencia} onChange={(e) => actualizarCampo(r.id, "referencia", e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                          <td></td>
                          <td><input value={r.marca} onChange={(e) => actualizarCampo(r.id, "marca", e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                          <td><input value={r.medida} onChange={(e) => actualizarCampo(r.id, "medida", e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                          <td><input value={r.proveedor} onChange={(e) => actualizarCampo(r.id, "proveedor", e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                          <td><input type="number" value={r.costo} onChange={(e) => actualizarCampo(r.id, "costo", e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                          <td><input type="number" value={r.precio} onChange={(e) => actualizarCampo(r.id, "precio", e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                          <td><input type="number" value={r.stock} onChange={(e) => actualizarCampo(r.id, "stock", e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                          <td className="flex gap-1 justify-center">
                            <button onClick={() => handleGuardar(r)} className="bg-blue-500 text-white px-2 py-1 text-xs rounded">Guardar</button>
                            <button onClick={() => setModoEdicion(null)} className="bg-gray-300 text-black px-2 py-1 text-xs rounded">Cancelar</button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2">{r.referencia}</td>
                          <td className="p-2">{r.foto && <button onClick={() => setFotoModal(r.foto)} className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 text-xs whitespace-nowrap">📷 Ver</button>}</td>
                          <td>{r.marca}</td>
                          <td>{r.medida || "—"}</td>
                          <td>{r.proveedor || "—"}</td>
                          <td className="text-blue-600">{mostrarCosto ? `$${Number(r.costo).toLocaleString("es-CO", { minimumFractionDigits: 0 })}` : "•••••"}</td>
                          <td className="text-green-600">{r.precio !== undefined && r.precio !== null ? `$${Number(r.precio).toLocaleString("es-CO", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : "$0"}</td>
                          <td className={r.stock === 0 ? "text-red-600" : ""}>{r.stock === 0 ? "Sin stock" : r.stock}</td>
                          <td className="p-2">
                            <div className="flex gap-1 justify-center flex-wrap">
                              <button onClick={() => setModoEdicion(r.id)} className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded whitespace-nowrap">Editar</button>
                              <button onClick={() => handleEliminar(r.id)} className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded whitespace-nowrap">Eliminar</button>
                              <button onClick={() => setSubirFotoId(r.id)} className="bg-green-500 text-white hover:bg-green-600 px-2 py-1 text-xs rounded whitespace-nowrap">📷 Foto</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Vista Móvil - Lista estructurada */}
            <div className="md:hidden mt-4 space-y-3">
              <div className="flex justify-end mb-2">
                <button onClick={() => setMostrarCosto(!mostrarCosto)} className="flex items-center gap-2 bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs">
                  {mostrarCosto ? <><EyeOff size={14} /> Ocultar costos</> : <><Eye size={14} /> Ver costos</>}
                </button>
              </div>

              {filtradas.map((r) => (
                <div key={r.id} className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-gray-500 to-gray-300 px-3 py-2.5 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" checked={seleccionadas.includes(r.id)} onChange={() => toggleSeleccion(r.id)} className="w-4 h-4" />
                      <span className="font-bold text-sm">{r.referencia}</span>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${r.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {r.stock === 0 ? 'Sin stock' : `Stock: ${r.stock}`}
                    </span>
                  </div>

                  {modoEdicion === r.id ? (
                    <div className="p-3 space-y-2 bg-gray-50">
                      <input placeholder="Referencia" value={r.referencia} onChange={(e) => actualizarCampo(r.id, "referencia", e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                      <input placeholder="Marca" value={r.marca} onChange={(e) => actualizarCampo(r.id, "marca", e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                      <input placeholder="Medida" value={r.medida} onChange={(e) => actualizarCampo(r.id, "medida", e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                      <input placeholder="Proveedor" value={r.proveedor} onChange={(e) => actualizarCampo(r.id, "proveedor", e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                      <input type="number" placeholder="Costo" value={r.costo} onChange={(e) => actualizarCampo(r.id, "costo", e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                      <input type="number" placeholder="Precio" value={r.precio} onChange={(e) => actualizarCampo(r.id, "precio", e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                      <input type="number" placeholder="Stock" value={r.stock} onChange={(e) => actualizarCampo(r.id, "stock", e.target.value)} className="w-full border rounded-lg p-2 text-sm" />
                      <div className="flex gap-2 pt-2">
                        <button onClick={() => handleGuardar(r)} className="flex-1 bg-blue-500 text-white px-3 py-2.5 text-sm rounded-lg font-medium">Guardar</button>
                        <button onClick={() => setModoEdicion(null)} className="flex-1 bg-gray-300 text-black px-3 py-2.5 text-sm rounded-lg font-medium">Cancelar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs mb-3">
                        <div><span className="text-gray-500 font-medium">Marca:</span><span className="ml-1.5 font-semibold text-gray-800">{r.marca}</span></div>
                        <div><span className="text-gray-500 font-medium">Medida:</span><span className="ml-1.5 font-semibold text-gray-800">{r.medida || "—"}</span></div>
                        <div><span className="text-gray-500 font-medium">Proveedor:</span><span className="ml-1.5 font-semibold text-gray-800">{r.proveedor || "—"}</span></div>
                        <div><span className="text-gray-500 font-medium">Costo:</span><span className="ml-1.5 font-semibold text-blue-600">{mostrarCosto ? `$${Number(r.costo).toLocaleString("es-CO", { minimumFractionDigits: 0 })}` : "•••••"}</span></div>
                        <div className="col-span-2"><span className="text-gray-500 font-medium">Precio:</span><span className="ml-1.5 font-bold text-green-600 text-sm">{r.precio !== undefined && r.precio !== null ? `$${Number(r.precio).toLocaleString("es-CO", { minimumFractionDigits: 0 })}` : "$0"}</span></div>
                      </div>

                      <div className="border-t pt-3 flex flex-wrap gap-2">
                        {r.foto && (
                          <button onClick={() => setFotoModal(r.foto)} className="flex-1 min-w-[100px] bg-purple-500 text-white px-3 py-2 rounded-lg hover:bg-purple-600 text-xs font-medium">
                            📷 Ver foto
                          </button>
                        )}
                        <button onClick={() => setModoEdicion(r.id)} className="flex-1 min-w-[100px] bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-2 rounded-lg text-xs font-medium">
                          ✏️ Editar
                        </button>
                        <button onClick={() => setSubirFotoId(r.id)} className="flex-1 min-w-[100px] bg-green-500 text-white hover:bg-green-600 px-3 py-2 rounded-lg text-xs font-medium">
                          📷 Subir
                        </button>
                        <button onClick={() => handleEliminar(r.id)} className="flex-1 min-w-[100px] bg-red-500 text-white hover:bg-red-600 px-3 py-2 rounded-lg text-xs font-medium">
                          🗑️ Eliminar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal agregar rin */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Agregar nuevo rin</h2>
            {["referencia", "marca", "medida", "proveedor", "costo", "precio", "stock"].map((campo) => (
              <input key={campo} placeholder={campo.replace("_", " ").toUpperCase()} value={nuevoItem[campo]} onChange={(e) => setNuevoItem({ ...nuevoItem, [campo]: e.target.value })} className="w-full mb-3 p-2 border rounded" />
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={handleAgregar} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Guardar</button>
              <button onClick={() => setMostrarModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal subir foto */}
      {subirFotoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">📷 Subir foto del rin</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecciona una imagen (máximo 5MB)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      setMensaje("La imagen no puede superar 5MB ❌");
                      setTimeout(() => setMensaje(""), 3000);
                      e.target.value = '';
                      return;
                    }
                    setArchivoFoto(file);
                  }
                }}
                className="w-full p-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                disabled={subiendoFoto}
              />
              
              {archivoFoto && (
                <div className="mt-2 text-sm text-green-600">
                  ✓ Archivo seleccionado: {archivoFoto.name}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleSubirFoto(subirFotoId)}
                disabled={!archivoFoto || subiendoFoto}
                className={`px-4 py-2 rounded font-medium ${
                  !archivoFoto || subiendoFoto
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {subiendoFoto ? '⏳ Subiendo...' : '📤 Subir foto'}
              </button>
              <button
                onClick={() => {
                  setSubirFotoId(null);
                  setArchivoFoto(null);
                }}
                disabled={subiendoFoto}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500 disabled:opacity-50"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver foto */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setFotoModal(null)}
        >
          <div className="relative max-w-4xl max-h-screen">
            <img
              src={fotoModal}
              alt="Foto del rin"
              className="max-w-full max-h-screen rounded-lg shadow-2xl object-contain"
              onError={(e) => {
                e.target.src = '/placeholder-image.png';
                e.target.alt = 'Error al cargar imagen';
              }}
            />
            <button
              onClick={() => setFotoModal(null)}
              className="absolute top-4 right-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-bold shadow-lg"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Rines;
