import React, { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import { supabase } from "./supabaseClient";

function App() {
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(true);
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(null);
  const [nuevoItem, setNuevoItem] = useState({
    referencia: "",
    marca: "",
    proveedor: "",
    costo_empresa: "",
    precio_cliente: "",
    stock: "",
  });
  const [mostrarModal, setMostrarModal] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [busquedasRecientes, setBusquedasRecientes] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase.from("llantas").select("*");
      if (error) console.error(error);
      else setLlantas(data || []);
      setCargando(false);
    };
    fetchData();

    const recientes = JSON.parse(localStorage.getItem("busquedasRecientes")) || [];
    setBusquedasRecientes(recientes);
  }, []);

  const filtradas = llantas.filter((l) => {
    const coincideBusqueda = l.referencia?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || l.marca === marcaSeleccionada;
    return coincideBusqueda && coincideMarca;
  });

  const marcasUnicas = [...new Set(llantas.map((l) => l.marca).filter(Boolean))];

  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEliminar = async (id) => {
    await supabase.from("llantas").delete().eq("id", id);
    setLlantas(llantas.filter((l) => l.id !== id));
  };

  const handleEliminarMultiples = async () => {
    await supabase.from("llantas").delete().in("id", seleccionadas);
    setLlantas(llantas.filter((l) => !seleccionadas.includes(l.id)));
    setSeleccionadas([]);
  };

  const actualizarCampo = (id, campo, valor) => {
    setLlantas((prev) =>
      prev.map((l) => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  const handleGuardar = async (ll) => {
    await supabase.from("llantas").update(ll).eq("id", ll.id);
    setModoEdicion(null);
    setMensaje("✅ Cambios guardados correctamente");
    setTimeout(() => setMensaje(""), 2000);
  };

  const handleAgregar = async () => {
    const { data } = await supabase.from("llantas").insert([nuevoItem]).select();
    setLlantas([...llantas, data[0]]);
    setMostrarModal(false);
    setNuevoItem({
      referencia: "",
      marca: "",
      proveedor: "",
      costo_empresa: "",
      precio_cliente: "",
      stock: "",
    });
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <img src="/logowp.PNG" className="h-13 w-48" alt="Logo" />
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800"
          >
            Agregar ítem
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
          <button
            onClick={() => window.open("/lista_llantar.pdf", "_blank")}
            className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600"
          >
            Lista llantar
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
          ⏳ Cargando llantas...
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-700 mb-2">
            Mostrando {filtradas.length} resultados
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-xl border mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Ingrese su búsqueda
            </h2>

            {/* --- BUSCADOR Y BÚSQUEDAS RECIENTES --- */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar referencia..."
                value={busqueda}
                onChange={(e) => {
                  const valor = e.target.value;
                  setBusqueda(valor);

                  if (valor.length > 2) {
                    const recientes =
                      JSON.parse(localStorage.getItem("busquedasRecientes")) ||
                      [];
                    if (!recientes.includes(valor)) {
                      const nuevas = [valor, ...recientes].slice(0, 5);
                      localStorage.setItem(
                        "busquedasRecientes",
                        JSON.stringify(nuevas)
                      );
                      setBusquedasRecientes(nuevas);
                    }
                  }
                }}
                className="w-full p-2 border rounded"
              />

              {busquedasRecientes.length > 0 && (
                <div className="mt-2 text-sm text-gray-700">
                  <p className="font-semibold mb-1">Búsquedas recientes:</p>
                  <div className="flex flex-wrap gap-2">
                    {busquedasRecientes.map((b, i) => (
                      <button
                        key={i}
                        onClick={() => setBusqueda(b)}
                        className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded"
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  Marca
                </label>
                <select
                  value={marcaSeleccionada}
                  onChange={(e) => setMarcaSeleccionada(e.target.value)}
                  className="w-full p-4 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition ease-in-out duration-300"
                >
                  <option value="">Todas las marcas</option>
                  {marcasUnicas.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={() => {
                    setBusqueda("");
                    setMarcaSeleccionada("");
                  }}
                  className="px-8 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 focus:ring-2 focus:ring-orange-400 transition ease-in-out duration-300"
                >
                  Limpiar filtros
                </button>
              </div>
            </div>
            {/* --- FIN BUSCADOR --- */}

            <div className="flex-3 overflow-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gradient-to-r from-gray-400 to-orange-300 text-black">
                  <tr>
                    <th></th>
                    <th className="p-2">Referencia</th>
                    <th>Marca</th>
                    <th>Proveedor</th>
                    <th>Costo</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filtradas.map((ll) => (
                    <tr
                      key={ll.id}
                      className={`text-center border-t even:bg-gray-50 ${
                        ll.stock % 2 !== 0 ? "bg-red-100" : ""
                      }`}
                    >
                      <td className="p-1">
                        <input
                          type="checkbox"
                          checked={seleccionadas.includes(ll.id)}
                          onChange={() => toggleSeleccion(ll.id)}
                        />
                      </td>
                      <td className="p-1 flex items-center justify-center gap-2">
                        <span>{ll.referencia}</span>
                        <button
                          onClick={() =>
                            window.open(
                              `https://www.llantar.com.co/collections/llantas?q=${encodeURIComponent(
                                ll.referencia
                              )}`,
                              "_blank"
                            )
                          }
                          className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs"
                        >
                          Ver
                        </button>
                      </td>
                      <td>{ll.marca}</td>
                      <td>{ll.proveedor}</td>
                      <td className="text-blue-600">
                        {mostrarCosto
                          ? `$${ll.costo_empresa.toLocaleString()}`
                          : "•••••"}
                      </td>
                      <td className="text-green-600">
                        ${ll.precio_cliente.toLocaleString()}
                      </td>
                      <td
                        className={
                          ll.stock === 0 ? "text-red-600" : "text-black"
                        }
                      >
                        {ll.stock === 0 ? "Sin stock" : ll.stock}
                      </td>
                      <td className="flex gap-1 justify-center">
                        <button
                          onClick={() => setModoEdicion(ll.id)}
                          className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(ll.id)}
                          className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;

