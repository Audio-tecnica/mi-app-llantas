import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Accesorios() {
  const navigate = useNavigate();
  const [accesorios, setAccesorios] = useState([]);
  const [filtros, setFiltros] = useState({ categoria: "", nombre: "" });
  const [editandoId, setEditandoId] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoAccesorio, setNuevoAccesorio] = useState({
    nombre: "",
    categoria: "",
    costo: "",
    precio: "",
    stock: "",
  });

  // 🔹 Cargar accesorios
  useEffect(() => {
    fetch("/api/accesorios")
      .then((res) => res.json())
      .then((data) => setAccesorios(data))
      .catch((err) => console.error("Error cargando accesorios:", err));
  }, []);

  // 🔹 Agregar accesorio
  const agregarAccesorio = async () => {
    const { nombre, categoria, costo, precio, stock } = nuevoAccesorio;
    if (!nombre || !categoria || !costo || !precio || !stock) {
      alert("Por favor completa todos los campos");
      return;
    }

    const res = await fetch("/api/accesorios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoAccesorio),
    });

    if (res.ok) {
      const data = await res.json();
      setAccesorios([data, ...accesorios]);
      setNuevoAccesorio({ nombre: "", categoria: "", costo: "", precio: "", stock: "" });
      setMostrarModal(false);
      setMensaje("✅ Accesorio agregado correctamente");
      setTimeout(() => setMensaje(""), 2500);
    } else {
      alert("Error al guardar el accesorio");
    }
  };

  // 🔹 Guardar edición
  const guardarEdicion = async (id) => {
    const accesorio = accesorios.find((a) => a.id === id);
    const res = await fetch(`/api/accesorios/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accesorio),
    });

    if (res.ok) {
      const data = await res.json();
      setAccesorios(accesorios.map((a) => (a.id === id ? data : a)));
      setEditandoId(null);
      setMensaje("✅ Cambios guardados correctamente");
      setTimeout(() => setMensaje(""), 2500);
    } else {
      alert("Error al actualizar accesorio");
    }
  };

  // 🔹 Eliminar accesorio
  const eliminarAccesorio = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este accesorio?")) return;
    const res = await fetch(`/api/accesorios/${id}`, { method: "DELETE" });
    if (res.ok) {
      setAccesorios(accesorios.filter((a) => a.id !== id));
      setMensaje("🗑️ Accesorio eliminado");
      setTimeout(() => setMensaje(""), 2500);
    }
  };

  // 🔹 Manejar cambios de edición
  const manejarCambio = (id, campo, valor) => {
    setAccesorios(accesorios.map((a) => (a.id === id ? { ...a, [campo]: valor } : a)));
  };

  // 🔹 Filtrar accesorios
  const accesoriosFiltrados = accesorios.filter(
    (a) =>
      a.nombre.toLowerCase().includes(filtros.nombre.toLowerCase()) &&
      a.categoria.toLowerCase().includes(filtros.categoria.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-gray-100 to-orange-100">
      {/* 🔸 Panel lateral de filtros */}
      <div className="w-64 bg-white shadow-md p-4 border-r">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Filtros</h2>
        <input
          type="text"
          placeholder="Buscar por nombre"
          value={filtros.nombre}
          onChange={(e) => setFiltros({ ...filtros, nombre: e.target.value })}
          className="border w-full p-2 mb-2 rounded"
        />
        <input
          type="text"
          placeholder="Categoría"
          value={filtros.categoria}
          onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
          className="border w-full p-2 mb-2 rounded"
        />
        <button
          onClick={() => setFiltros({ nombre: "", categoria: "" })}
          className="bg-gray-200 hover:bg-gray-300 text-sm w-full py-2 rounded"
        >
          Limpiar filtros
        </button>
        <button
          onClick={() => navigate("/")}
          className="bg-gray-700 hover:bg-gray-600 text-white text-sm w-full mt-3 py-2 rounded"
        >
          ← Volver a Llantas
        </button>
      </div>

      {/* 🔸 Sección principal */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Gestión de Accesorios</h1>
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded shadow-md transition"
          >
            ➕ Agregar accesorio
          </button>
        </div>

        {/* 🟢 Mensaje de confirmación */}
        {mensaje && (
          <div className="mb-4 p-3 bg-green-100 text-green-800 rounded shadow-sm">
            {mensaje}
          </div>
        )}

        {/* 📋 Tabla */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                <th className="p-2 border">Nombre</th>
                <th className="p-2 border">Categoría</th>
                <th className="p-2 border">Costo</th>
                <th className="p-2 border">Precio</th>
                <th className="p-2 border">Stock</th>
                <th className="p-2 border text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accesoriosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center p-4 text-gray-500">
                    No hay accesorios registrados
                  </td>
                </tr>
              ) : (
                accesoriosFiltrados.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="border p-2">
                      {editandoId === a.id ? (
                        <input
                          value={a.nombre}
                          onChange={(e) => manejarCambio(a.id, "nombre", e.target.value)}
                          className="border rounded p-1 w-full"
                        />
                      ) : (
                        a.nombre
                      )}
                    </td>
                    <td className="border p-2">
                      {editandoId === a.id ? (
                        <input
                          value={a.categoria}
                          onChange={(e) => manejarCambio(a.id, "categoria", e.target.value)}
                          className="border rounded p-1 w-full"
                        />
                      ) : (
                        a.categoria
                      )}
                    </td>
                    <td className="border p-2 text-blue-600 font-medium">
                      {editandoId === a.id ? (
                        <input
                          type="number"
                          value={a.costo}
                          onChange={(e) => manejarCambio(a.id, "costo", e.target.value)}
                          className="border rounded p-1 w-full"
                        />
                      ) : (
                        `$${a.costo}`
                      )}
                    </td>
                    <td className="border p-2 text-green-600 font-medium">
                      {editandoId === a.id ? (
                        <input
                          type="number"
                          value={a.precio}
                          onChange={(e) => manejarCambio(a.id, "precio", e.target.value)}
                          className="border rounded p-1 w-full"
                        />
                      ) : (
                        `$${a.precio}`
                      )}
                    </td>
                    <td className="border p-2">
                      {editandoId === a.id ? (
                        <input
                          type="number"
                          value={a.stock}
                          onChange={(e) => manejarCambio(a.id, "stock", e.target.value)}
                          className="border rounded p-1 w-full"
                        />
                      ) : (
                        a.stock
                      )}
                    </td>
                    <td className="border p-2 text-center space-x-2">
                      {editandoId === a.id ? (
                        <button
                          onClick={() => guardarEdicion(a.id)}
                          className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-500"
                        >
                          💾 Guardar
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditandoId(a.id)}
                          className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-400"
                        >
                          ✏️ Editar
                        </button>
                      )}
                      <button
                        onClick={() => eliminarAccesorio(a.id)}
                        className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-500"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 🪟 Modal para agregar accesorio */}
        {mostrarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
              <h2 className="text-xl font-semibold mb-4 text-gray-700">Agregar nuevo accesorio</h2>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nuevoAccesorio.nombre}
                  onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, nombre: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="text"
                  placeholder="Categoría"
                  value={nuevoAccesorio.categoria}
                  onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, categoria: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Costo"
                  value={nuevoAccesorio.costo}
                  onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, costo: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Precio"
                  value={nuevoAccesorio.precio}
                  onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, precio: e.target.value })}
                  className="border p-2 rounded"
                />
                <input
                  type="number"
                  placeholder="Stock"
                  value={nuevoAccesorio.stock}
                  onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, stock: e.target.value })}
                  className="border p-2 rounded col-span-2"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setMostrarModal(false)}
                  className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded"
                >
                  Cancelar
                </button>
                <button
                  onClick={agregarAccesorio}
                  className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Accesorios;
