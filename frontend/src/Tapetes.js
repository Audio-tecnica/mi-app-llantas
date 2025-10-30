import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import "./index.css";

function Tapetes() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const navigate = useNavigate();
  const [tapetes, setTapetes] = useState([]);
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

  // 📦 Cargar tapetes
  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/tapetes")
      .then((res) => setTapetes(res.data))
      .catch(() => setMensaje("Error al cargar tapetes ❌"))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(tapetes.map((t) => t.marca))];

  const filtradas = tapetes.filter((t) => {
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
    setTapetes(ordenadas);
    setOrden({ campo, asc });
  };

  // ✅ CRUD
  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar los tapetes seleccionados?")) return;
    try {
      for (let id of seleccionadas) {
        await axios.post(
          "https://mi-app-llantas.onrender.com/api/eliminar-tapete",
          { id }
        );
      }
      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/tapetes"
      );
      setTapetes(data);
      setSeleccionadas([]);
      setMensaje("Tapetes eliminados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleGuardar = async (tapete) => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-tapete",
        tapete
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
    if (!window.confirm("¿Eliminar este tapete?")) return;
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/eliminar-tapete",
        { id }
      );
      setTapetes((prev) => prev.filter((t) => t.id !== id));
      setMensaje("Tapete eliminado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleAgregar = async () => {
    try {
      const nuevoTapeteFormateado = {
        marca: nuevoItem.marca,
        referencia: nuevoItem.referencia,
        tipo: nuevoItem.proveedor || "",
        costo: parseFloat(nuevoItem.costo) || 0,
        precio: parseFloat(nuevoItem.precio) || 0,
        stock: parseInt(nuevoItem.stock) || 0,
      };

      await axios.post(
        "https://mi-app-llantas.onrender.com/api/agregar-tapete",
        nuevoTapeteFormateado
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/tapetes"
      );
      setTapetes(data);
      setMostrarModal(false);
      setNuevoItem({
        referencia: "",
        marca: "",
        proveedor: "",
        costo: "",
        precio: "",
        stock: "",
      });
      setMensaje("Tapete agregado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (e) {
      console.error("❌ Error al agregar tapete:", e);
      setMensaje("Error al agregar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setTapetes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t))
    );
  };

  // 🧩 Render
  return (
<<<<<<< HEAD
    <div className="max-w-7xl mx-auto p-4 min-h-screen bg-gradient-to-b from-gray-200 to-blue-100">
=======
    <div className="max-w-7x2 mx-auto p-5 min-h-screen bg-gradient-to-b from-gray-300 to-orange-600">
>>>>>>> pruebas
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <img src="/logowp.PNG" className="h-13 w-48" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800"
          >
            Agregar tapete
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

      {mensaje && (
        <div className="text-center text-blue-700 font-semibold mb-4">
          ❗{mensaje}
        </div>
      )}

      {cargando ? (
        <div className="text-center py-10 text-gray-500">
          ⏳ Cargando tapetes...
        </div>
      ) : (
        <>
          <div className="flex items-center gap-3 mt-2 mb-3">
            <button
              onClick={() => {
                setBusqueda("");
                setMarcaSeleccionada("");
              }}
              className="px-3 py-1 bg-orange-600 text-white rounded-xl hover:bg-orange-700"
            >
              Limpiar filtros
            </button>

            <button
              onClick={() => navigate("/")}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-lg shadow"
            >
              Volver a Llantas
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Buscar tapete
            </h2>

            <input
              type="text"
              placeholder="Buscar referencia..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
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

            <div className="overflow-auto mt-6">
              <table className="w-full border text-sm">
                <thead className="bg-gradient-to-r from-gray-400 to-blue-300 text-black">
                  <tr>
                    <th></th>
                    <th onClick={() => ordenarPor("referencia")}>Referencia</th>
                    <th onClick={() => ordenarPor("marca")}>Marca</th>
                    <th onClick={() => ordenarPor("tipo")}>Proveedor</th>
                    <th
                      className="cursor-pointer"
                      onClick={() => setMostrarCosto(!mostrarCosto)}
                    >
                      Costo{" "}
                      {mostrarCosto ? (
                        <EyeOff className="inline w-4 h-4" />
                      ) : (
                        <Eye className="inline w-4 h-4" />
                      )}
                    </th>
                    <th onClick={() => ordenarPor("precio")}>Precio</th>
                    <th onClick={() => ordenarPor("stock")}>Stock</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((t) => (
                    <tr
                      key={t.id}
                      className="text-center border-t even:bg-gray-50"
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(t.id)}
                          onChange={() => toggleSeleccion(t.id)}
                        />
                      </td>

                      {modoEdicion === t.id ? (
                        <>
                          {[
                            "referencia",
                            "marca",
                            "tipo",
                            "costo",
                            "precio",
                            "stock",
                          ].map((campo) => (
                            <td key={campo}>
                              <input
                                value={t[campo]}
                                onChange={(e) =>
                                  actualizarCampo(t.id, campo, e.target.value)
                                }
                                className="w-full border rounded text-sm p-1"
                              />
                            </td>
                          ))}
                          <td className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleGuardar(t)}
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
                          <td>{t.referencia}</td>
                          <td>{t.marca}</td>
                          <td>{t.tipo || "—"}</td>
                          <td className="text-blue-600 font-semibold">
                            {mostrarCosto
                              ? `$${Number(t.costo).toLocaleString("es-CO", {
                                  minimumFractionDigits: 0,
                                })}`
                              : "•••••"}
                          </td>
                          <td className="text-green-600 font-semibold">
                            {t.precio !== undefined && t.precio !== null
                              ? `$${Number(t.precio).toLocaleString("es-CO", {
                                  minimumFractionDigits: 0,
                                  maximumFractionDigits: 0,
                                })}`
                              : "$0"}
                          </td>

                          <td className={t.stock === 0 ? "text-red-600" : ""}>
                            {t.stock === 0 ? "Sin stock" : t.stock}
                          </td>
                          <td className="flex gap-1 justify-center">
                            <button
                              onClick={() => setModoEdicion(t.id)}
                              className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => handleEliminar(t.id)}
                              className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded"
                            >
                              Eliminar
                            </button>
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

      {/* Modal agregar tapete */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar nuevo tapete</h2>
            {[
              "referencia",
              "marca",
              "proveedor",
              "costo",
              "precio",
              "stock",
            ].map((campo) => (
              <input
                key={campo}
                placeholder={campo.replace("_", " ")}
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
    </div>
  );
}

export default Tapetes;
