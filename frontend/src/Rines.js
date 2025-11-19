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
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(null);
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

  // Para modales de fotos
  const [fotoModal, setFotoModal] = useState(null);
  const [subirFotoId, setSubirFotoId] = useState(null);
  const [archivoFoto, setArchivoFoto] = useState(null);

  // Cargar rines
  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/rines")
      .then((res) => setRines(res.data))
      .catch(() => setMensaje("Error al cargar rines ❌"))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(rines.map((r) => r.marca))];

  const filtradas = rines.filter((r) => {
    const coincideBusqueda = r.referencia
      ?.toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || r.marca === marcaSeleccionada;
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
    setRines(ordenadas);
    setOrden({ campo, asc });
  };

  // CRUD
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
      await axios.post("https://mi-app-llantas.onrender.com/api/eliminar-rin", {
        id,
      });
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

  // Subir foto
  const handleSubirFoto = async (id) => {
    if (!archivoFoto) {
      setMensaje("Selecciona un archivo primero ❌");
      setTimeout(() => setMensaje(""), 2000);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("foto", archivoFoto);
      formData.append("id", id);

      const { data } = await axios.post(
        "https://mi-app-llantas.onrender.com/api/rines/subir-foto",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      setRines((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, foto: data.foto } : r
        )
      );

      setArchivoFoto(null);
      setSubirFotoId(null);
      setMensaje("Foto subida ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (e) {
      console.error("Error al subir foto:", e);
      setMensaje("Error al subir foto ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  // Render
  return (
    <div className="max-w-7xl mx-auto p-5 min-h-screen bg-gradient-to-b from-gray-200 to-gray-600">
      {/* Header */}
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
            className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700"
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

      {/* Buscador y filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        <input
          type="text"
          placeholder="Buscar por referencia..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="border px-2 py-1 rounded flex-grow min-w-[150px]"
        />
        <select
          value={marcaSeleccionada}
          onChange={(e) => setMarcaSeleccionada(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          <option value="">Todas las marcas</option>
          {marcasUnicas.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {mensaje && (
        <div className="text-center text-blue-700 font-semibold mb-4">
          ◉{mensaje}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-10 text-gray-500">
          ⏳ Cargando rines...
        </div>
      ) : (
        <div className="bg-white p-6 rounded-3xl shadow-xl border mb-6 overflow-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gradient-to-r from-gray-500 to-gray-300 text-black">
              <tr>
                <th></th>
                <th>Referencia</th>
                <th onClick={() => ordenarPor("marca")} className="cursor-pointer p-2">
                  Marca
                </th>
                <th onClick={() => ordenarPor("medida")} className="cursor-pointer p-2">
                  Medida
                </th>
                <th onClick={() => ordenarPor("proveedor")} className="cursor-pointer p-2">
                  Proveedor
                </th>
                <th className="cursor-pointer p-2">
                  Costo{" "}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMostrarCosto(!mostrarCosto);
                    }}
                    className="ml-2"
                  >
                    {mostrarCosto ? <EyeOff className="inline w-4 h-4" /> : <Eye className="inline w-4 h-4" />}
                  </button>
                </th>
                <th onClick={() => ordenarPor("precio")} className="cursor-pointer p-2">
                  Precio
                </th>
                <th onClick={() => ordenarPor("stock")} className="cursor-pointer p-2">
                  Stock
                </th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((r) => (
                <tr key={r.id} className="text-center border-t even:bg-gray-50">
                  <td>
                    <input
                      type="checkbox"
                      checked={seleccionadas.includes(r.id)}
                      onChange={() => toggleSeleccion(r.id)}
                    />
                  </td>
                  {modoEdicion === r.id ? (
                    <>
                      {["referencia","marca","medida","proveedor","costo","precio","stock"].map((campo) => (
                        <td key={campo}>
                          <input
                            value={r[campo]}
                            onChange={(e) => actualizarCampo(r.id, campo, e.target.value)}
                            className="w-full border rounded text-sm p-1"
                          />
                        </td>
                      ))}
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
                      <td>
                        {r.referencia}
                        {r.foto && (
                          <button
                            onClick={() => setFotoModal(r.foto)}
                            className="ml-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          >
                            Ver foto
                          </button>
                        )}
                      </td>
                      <td>{r.marca}</td>
                      <td>{r.medida || "—"}</td>
                      <td>{r.proveedor || "—"}</td>
                      <td className="text-blue-600">
                        {mostrarCosto ? `$${Number(r.costo).toLocaleString("es-CO")}` : "•••••"}
                      </td>
                      <td className="text-green-600">
                        {r.precio !== undefined && r.precio !== null
                          ? `$${Number(r.precio).toLocaleString("es-CO")}`
                          : "$0"}
                      </td>
                      <td className={r.stock === 0 ? "text-red-600" : ""}>
                        {r.stock === 0 ? "Sin stock" : r.stock}
                      </td>
                      <td className="flex gap-1 justify-center flex-wrap">
                        <button
                          onClick={() => setModoEdicion(r.id)}
                          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(r.id)}
                          className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded"
                        >
                          Eliminar
                        </button>
                        <button
                          onClick={() => setSubirFotoId(r.id)}
                          className="bg-green-500 text-white hover:bg-green-600 px-2 py-1 text-xs rounded"
                        >
                          Agregar foto
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal agregar rin */}
      {nuevoItem && (
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${mostrarModal ? "" : "hidden"}`}
        >
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar nuevo rin</h2>
            {["referencia","marca","medida","proveedor","costo","precio","stock"].map((campo) => (
              <input
                key={campo}
                placeholder={campo.replace("_"," ")}
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
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal subir foto */}
      {subirFotoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-sm">
            <h2 className="text-lg font-bold mb-4">Subir foto del rin</h2>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setArchivoFoto(e.target.files[0])}
              className="mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => handleSubirFoto(subirFotoId)}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Subir
              </button>
              <button
                onClick={() => setSubirFotoId(null)}
                className="bg-gray-400 text-white px-4 py-2 rounded"
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
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setFotoModal(null)}
        >
          <img
            src={`https://mi-app-llantas.onrender.com/files/${fotoModal}`}
            alt="Rin"
            className="max-w-full max-h-full object-contain"
          />
        </div>
      )}
    </div>
  );
}

export default Rines;








