import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Accesorios() {
  const [accesorios, setAccesorios] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoAccesorio, setNuevoAccesorio] = useState({
    nombre: "",
    categoria: "",
    costo: "",
    precio: "",
    stock: ""
  });
  const [editandoId, setEditandoId] = useState(null);
  const navigate = useNavigate();

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

  // ✍️ Manejar cambios en campos editables
  const manejarCambio = (id, campo, valor) => {
    setAccesorios(accesorios.map((a) => (a.id === id ? { ...a, [campo]: valor } : a)));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 🔙 Volver */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        ← Volver a Llantas
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Gestión de Accesorios</h1>

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 shadow"
        >
          ➕ Agregar accesorio
        </button>
      </div>

      {/* 📋 Tabla */}
      <div className="overflow-x-auto shadow rounded-lg bg-white">
        <table className="w-full border border-gray-300">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border p-2">Nombre</th>
              <th className="border p-2">Categoría</th>
              <th className="border p-2">Costo</th>
              <th className="border p-2">Precio</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accesorios.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  No hay accesorios registrados
                </td>
              </tr>
            ) : (
              accesorios.map((a) => (
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

                  <td className="border p-2 text-center">
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

      {/* 🪟 Modal agregar accesorio */}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-gray-700">Agregar nuevo accesorio</h2>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="Nombre"
                value={nuevoAccesorio.nombre}
                onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, nombre: e.target.value })}
                className="border p-2 rounded w-full"
              />
              <input
                type="text"
                placeholder="Categoría"
                value={nuevoAccesorio.categoria}
                onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, categoria: e.target.value })}
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                placeholder="Costo"
                value={nuevoAccesorio.costo}
                onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, costo: e.target.value })}
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                placeholder="Precio"
                value={nuevoAccesorio.precio}
                onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, precio: e.target.value })}
                className="border p-2 rounded w-full"
              />
              <input
                type="number"
                placeholder="Stock"
                value={nuevoAccesorio.stock}
                onChange={(e) => setNuevoAccesorio({ ...nuevoAccesorio, stock: e.target.value })}
                className="border p-2 rounded w-full"
              />
            </div>

            <div className="flex justify-end mt-4 space-x-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={agregarAccesorio}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
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
