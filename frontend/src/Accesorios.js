import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Accesorios() {
  const [accesorios, setAccesorios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoAccesorio, setNuevoAccesorio] = useState({
    nombre: "",
    categoria: "",
    costo: "",
    precio: "",
    stock: "",
  });
  const [editandoId, setEditandoId] = useState(null);
  const navigate = useNavigate();

  // 🔹 Cargar accesorios desde el backend
  useEffect(() => {
    fetch("/api/accesorios")
      .then((res) => res.json())
      .then((data) => setAccesorios(data))
      .catch((err) => console.error("Error cargando accesorios:", err));
  }, []);

  // 🔍 Filtrar por nombre o categoría
  const accesoriosFiltrados = accesorios.filter(
    (a) =>
      a.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
      a.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  // 🟢 Agregar nuevo accesorio
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
      setMostrarModal(false);
      setNuevoAccesorio({ nombre: "", categoria: "", costo: "", precio: "", stock: "" });
    } else {
      alert("Error al guardar el accesorio");
    }
  };

  // ✏️ Guardar edición
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
    } else {
      alert("Error al actualizar accesorio");
    }
  };

  // ❌ Eliminar accesorio
  const eliminarAccesorio = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este accesorio?")) return;
    const res = await fetch(`/api/accesorios/${id}`, { method: "DELETE" });
    if (res.ok) setAccesorios(accesorios.filter((a) => a.id !== id));
  };

  // ✍️ Manejar cambios de campos editables
  const manejarCambio = (id, campo, valor) => {
    setAccesorios(accesorios.map((a) => (a.id === id ? { ...a, [campo]: valor } : a)));
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* 🔹 Panel lateral */}
      <div className="w-64 bg-white shadow-md p-4">
        <button
          onClick={() => navigate("/")}
          className="w-full bg-gray-700 text-white py-2 rounded-lg mb-4 hover:bg-gray-600"
        >
          ← Volver a Llantas
        </button>

        <h2 className="text-xl font-bold mb-3 text-gray-700">Filtros</h2>
        <input
          type="text"
          placeholder="Buscar por nombre o categoría..."
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="w-full p-2 border rounded-lg mb-4"
        />

        <button
          onClick={() => setMostrarModal(true)}
          className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-500"
        >
          ➕ Agregar Item
        </button>
      </div>

      {/* 🔹 Tabla principal */}
      <div className="flex-1 p-6">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Tapetes</h1>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="w-full border-collapse">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-3 text-left">Nombre</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Costo</th>
                <th className="p-3 text-left">Precio</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {accesoriosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6 text-gray-500">
                    No hay accesorios registrados
                  </td>
                </tr>
              ) : (
                accesoriosFiltrados.map((a) => (
                  <tr key={a.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      {editandoId === a.id ? (
                        <input
                          value={a.nombre}
                          onChange={(e) => manejarCambio(a.id, "nombre", e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      ) : (
                        a.nombre
                      )}
                    </td>

                    <td className="p-3">
                      {editandoId === a.id ? (
                        <input
                          value={a.categoria}
                          onChange={(e) => manejarCambio(a.id, "categoria", e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      ) : (
                        a.categoria
                      )}
                    </td>

                    <td className="p-3 text-blue-600 font-semibold">
                      {editandoId === a.id ? (
                        <input
                          type="number"
                          value={a.costo}
                          onChange={(e) => manejarCambio(a.id, "costo", e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      ) : (
                        `$${a.costo}`
                      )}
                    </td>

                    <td className="p-3 text-green-600 font-semibold">
                      {editandoId === a.id ? (
                        <input
                          type="number"
                          value={a.precio}
                          onChange={(e) => manejarCambio(a.id, "precio", e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      ) : (
                        `$${a.precio}`
                      )}
                    </td>

                    <td className="p-3">
                      {editandoId === a.id ? (
                        <input
                          type="number"
                          value={a.stock}
                          onChange={(e) => manejarCambio(a.id, "stock", e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      ) : (
                        a.stock
                      )}
                    </td>

                    <td className="p-3 text-center space-x-2">
                      {editandoId === a.id ? (
                        <button
                          onClick={() => guardarEdicion(a.id)}
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
                        >
                          💾
                        </button>
                      ) : (
                        <button
                          onClick={() => setEditandoId(a.id)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-400"
                        >
                          ✏️
                        </button>
                      )}
                      <button
                        onClick={() => eliminarAccesorio(a.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-500"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 🔹 Modal para agregar accesorio */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Agregar Accesorio</h2>

            <input
              type="text"
              placeholder="Nombre"
              value={nuevoAccesorio.nombre}
              onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, nombre: e.target.value })}
              className="border p-2 w-full mb-2 rounded"
            />
            <input
              type="text"
              placeholder="Categoría"
              value={nuevoAccesorio.categoria}
              onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, categoria: e.target.value })}
              className="border p-2 w-full mb-2 rounded"
            />
            <input
              type="number"
              placeholder="Costo"
              value={nuevoAccesorio.costo}
              onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, costo: e.target.value })}
              className="border p-2 w-full mb-2 rounded"
            />
            <input
              type="number"
              placeholder="Precio"
              value={nuevoAccesorio.precio}
              onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, precio: e.target.value })}
              className="border p-2 w-full mb-2 rounded"
            />
            <input
              type="number"
              placeholder="Stock"
              value={nuevoAccesorio.stock}
              onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, stock: e.target.value })}
              className="border p-2 w-full mb-4 rounded"
            />

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="bg-gray-400 text-white px-3 py-1 rounded hover:bg-gray-500"
              >
                Cancelar
              </button>
              <button
                onClick={agregarAccesorio}
                className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Accesorios;

