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
  
  // Estados para fotos
  const [fotoModal, setFotoModal] = useState(null);
  const [subirFotoId, setSubirFotoId] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [subiendoFoto, setSubiendoFoto] = useState(false); // 🆕 Estado de carga

  // 📦 Cargar rines
  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/rines")
      .then((res) => setRines(res.data))
      .catch(() => setMensaje("Error al cargar rines ❌"))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(rines.map((r) => r.marca))];
  
  // Medidas disponibles
  const medidasDisponibles = ['15', '16', '17', '18', '20'];

  const filtradas = rines.filter((r) => {
    const coincideBusqueda = r.referencia
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || r.marca === marcaSeleccionada;
    
    const coincideMedida = !medidaSeleccionada || 
      r.medida?.toString().startsWith(medidaSeleccionada);
    
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

  // ✅ CRUD
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

  const handleGuardar = async (rin) => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-rin",
        rin
      );
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
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/eliminar-rin",
        { id }
      );
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
      console.error("❌ Error al agregar rin:", e);
      setMensaje("Error al agregar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setRines((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [campo]: valor } : r))
    );
  };

  // 🆕 Función CORREGIDA para subir foto a Cloudinary
  const handleSubirFoto = async (id) => {
    if (!archivoFoto) {
      setMensaje("Selecciona un archivo primero ❌");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    // Validar que sea una imagen
    if (!archivoFoto.type.startsWith('image/')) {
      setMensaje("Solo se permiten archivos de imagen ❌");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    // Validar tamaño (máximo 5MB)
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

      console.log("📤 Enviando foto al servidor...");

      const { data } = await axios.post(
        "https://mi-app-llantas.onrender.com/api/rines/subir-foto",
        formData,
        { 
          headers: { 
            "Content-Type": "multipart/form-data" 
          },
          timeout: 30000 // 30 segundos de timeout
        }
      );

      console.log("✅ Respuesta del servidor:", data);

      // Actualizar el estado local con la nueva URL de Cloudinary
      setRines((prev) =>
        prev.map((r) => (r.id === id ? { ...r, foto: data.foto } : r))
      );

      setArchivoFoto(null);
      setSubirFotoId(null);
      setMensaje("Foto subida exitosamente ✅");
      setTimeout(() => setMensaje(""), 3000);
    } catch (e) {
      console.error("❌ Error completo:", e);
      console.error("❌ Respuesta del servidor:", e.response?.data);
      
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

  // 🧩 Render
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
            Agregar rin
          </button>
          <button
            onClick={handleEliminarMultiples}
            disabled={seleccionadas.length === 0}
            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700 disabled:opacity-50"
          >
            Eliminar seleccionados
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
        </div>
      </div>

      {/* Mensajes */}
      {mensaje && (
        <div className="text-center text-blue-700 font-semibold mb-4">
          ◉{mensaje}
        </div>
      )}

      {/* Contenido principal */}
      {cargando ? (
        <div className="text-center py-10 text-gray-500">
          ⏳ Cargando rines...
        </div>
      ) : (
        <>
          <div className="flex space-x-3 flex-wrap">
            <button
              onClick={() => {
                setBusqueda("");
                setMarcaSeleccionada("");
                setMedidaSeleccionada("");
              }}
              className="bg-orange-600 text-white px-2 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Limpiar filtros
            </button>

            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Volver a Llantas
            </button>

            <button
              onClick={() => navigate("/tapetes")}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
            >
              Ir a Tapetes
            </button>
          </div>

          <div className="text-sm text-gray-700 mb-2 mt-4">
            Mostrando {filtradas.length} resultados
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Buscar rin
            </h2>

            <input
              type="text"
              placeholder="Buscar referencia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full p-3 border-2 border-gray-500 rounded-3xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition ease-in-out duration-500"
            />

            <label className="block text-sm font-medium text-gray-600 mb-2 mt-4">
              Marca
            </label>
            <select
              value={marcaSeleccionada}
              onChange={(e) => setMarcaSeleccionada(e.target.value)}
              className="w-full p-4 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-gray-400 outline-none transition ease-in-out duration-300"
            >
              <option value="">Todas las marcas</option>
              {marcasUnicas.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Filtro por medida con botones */}
            <label className="block text-sm font-medium text-gray-600 mb-2 mt-6">
              Medida
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setMedidaSeleccionada("")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                  medidaSeleccionada === ""
                    ? "bg-gray-700 text-white shadow-lg"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Todas
              </button>
              {medidasDisponibles.map((medida) => (
                <button
                  key={medida}
                  onClick={() => setMedidaSeleccionada(medida)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                    medidaSeleccionada === medida
                      ? "bg-blue-600 text-white shadow-lg"
                      : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  }`}
                >
                  {medida}"
                </button>
              ))}
            </div>

            {/* Tabla */}
            <div className="overflow-auto mt-6">
              <table className="w-full border text-sm">
                <thead className="bg-gradient-to-r from-gray-500 to-gray-300 text-black">
                  <tr>
                    <th></th>
                    <th
                      onClick={() => ordenarPor("referencia")}
                      className="cursor-pointer p-2"
                    >
                      Referencia
                    </th>
                    <th
                      onClick={() => ordenarPor("marca")}
                      className="cursor-pointer p-2"
                    >
                      Marca
                    </th>
                    <th
                      onClick={() => ordenarPor("medida")}
                      className="cursor-pointer p-2"
                    >
                      Medida
                    </th>
                    <th
                      onClick={() => ordenarPor("proveedor")}
                      className="cursor-pointer p-2"
                    >
                      Proveedor
                    </th>
                    <th
                      onClick={() => ordenarPor("costo")}
                      className="cursor-pointer p-2"
                    >
                      Costo
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMostrarCosto(!mostrarCosto);
                        }}
                        className="ml-2 text-white-600"
                      >
                        {mostrarCosto ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </th>
                    <th
                      onClick={() => ordenarPor("precio")}
                      className="cursor-pointer p-2"
                    >
                      Precio
                    </th>
                    <th
                      onClick={() => ordenarPor("stock")}
                      className="cursor-pointer p-2"
                    >
                      Stock
                    </th>
                    <th className="p-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((r) => (
                    <tr
                      key={r.id}
                      className="text-center border-t even:bg-gray-50"
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(r.id)}
                          onChange={() => toggleSeleccion(r.id)}
                        />
                      </td>

                      {modoEdicion === r.id ? (
                        <>
                          <td>
                            <input
                              value={r.referencia}
                              onChange={(e) =>
                                actualizarCampo(
                                  r.id,
                                  "referencia",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded text-sm p-1"
                            />
                          </td>
                          <td>
                            <input
                              value={r.marca}
                              onChange={(e) =>
                                actualizarCampo(r.id, "marca", e.target.value)
                              }
                              className="w-full border rounded text-sm p-1"
                            />
                          </td>
                          <td>
                            <input
                              value={r.medida}
                              onChange={(e) =>
                                actualizarCampo(r.id, "medida", e.target.value)
                              }
                              className="w-full border rounded text-sm p-1"
                            />
                          </td>
                          <td>
                            <input
                              value={r.proveedor}
                              onChange={(e) =>
                                actualizarCampo(
                                  r.id,
                                  "proveedor",
                                  e.target.value
                                )
                              }
                              className="w-full border rounded text-sm p-1"
                            />
                          </td>
                          <td>
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
                              className="w-full border rounded text-sm p-1"
                            />
                          </td>
                          <td>
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
                              className="w-full border rounded text-sm p-1"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={r.stock}
                              onChange={(e) =>
                                actualizarCampo(r.id, "stock", e.target.value)
                              }
                              className="w-full border rounded text-sm p-1"
                            />
                          </td>
                          <td className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleGuardar(r)}
                              className="bg-blue-500 text-white px-2 py-1 text-xs rounded"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setModoEdicion(null)}
                              className="bg-gray-300 text-black px-2 py-1 text-xs rounded"
                            >
                              Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-2">
                            <div className="flex items-center justify-center gap-2 flex-wrap">
                              <span>{r.referencia}</span>
                              {r.foto && (
                                <button
                                  onClick={() => setFotoModal(r.foto)}
                                  className="bg-purple-500 text-white px-2 py-1 rounded hover:bg-purple-600 text-xs whitespace-nowrap"
                                >
                                  📷 Ver foto
                                </button>
                              )}
                            </div>
                          </td>
                          <td>{r.marca}</td>
                          <td>{r.medida || "—"}</td>
                          <td>{r.proveedor || "—"}</td>
                          <td className="text-blue-600">
                            {mostrarCosto
                              ? `$${Number(r.costo).toLocaleString("es-CO", {
                                  minimumFractionDigits: 0,
                                })}`
                              : "•••••"}
                          </td>
                          <td className="text-green-600">
                            {r.precio !== undefined && r.precio !== null
                              ? `$${Number(r.precio).toLocaleString("es-CO", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}`
                              : "$0"}
                          </td>
                          <td className={r.stock === 0 ? "text-red-600" : ""}>
                            {r.stock === 0 ? "Sin stock" : r.stock}
                          </td>
                          <td className="p-2">
                            <div className="flex gap-1 justify-center flex-wrap">
                              <button
                                onClick={() => setModoEdicion(r.id)}
                                className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded whitespace-nowrap"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleEliminar(r.id)}
                                className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded whitespace-nowrap"
                              >
                                Eliminar
                              </button>
                              <button
                                onClick={() => setSubirFotoId(r.id)}
                                className="bg-green-500 text-white hover:bg-green-600 px-2 py-1 text-xs rounded whitespace-nowrap"
                              >
                                📷 Foto
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

      {/* Modal agregar rin */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar nuevo rin</h2>
            {[
              "referencia",
              "marca",
              "medida",
              "proveedor",
              "costo",
              "precio",
              "stock",
            ].map((campo) => (
              <input
                key={campo}
                placeholder={campo.replace("_", " ").toUpperCase()}
                value={nuevoItem[campo]}
                onChange={(e) =>
                  setNuevoItem({ ...nuevoItem, [campo]: e.target.value })
                }
                className="w-full mb-3 p-2 border rounded"
              />
            ))}
            <div className="flex justify-end gap-2">
              <button
                onClick={handleAgregar}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal subir foto - MEJORADO */}
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

      {/* Modal ver foto - MEJORADO */}
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
                e.target.src = '/placeholder-image.png'; // Imagen de respaldo
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
