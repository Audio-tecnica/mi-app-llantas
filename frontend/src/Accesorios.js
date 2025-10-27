import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function Accesorios() {
  const [accesorios, setAccesorios] = useState([]);
  const [nuevoAccesorio, setNuevoAccesorio] = useState({
    nombre: "",
    categoria: "",
    costo: "",
    precio: "",
    stock: ""
  });
  const [editandoId, setEditandoId] = useState(null);
  const [filtro, setFiltro] = useState("");
  const navigate = useNavigate();

  const API_URL = "https://mi-app-llantas.onrender.com/api/accesorios";

  // 🔹 Cargar accesorios desde el backend
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setAccesorios(data))
      .catch(() => alert("⚠️ No hay conexión con el servidor o la red"));
  }, []);

  // 🔹 Guardar nuevo accesorio
  const agregarAccesorio = async () => {
    const { nombre, categoria, costo, precio, stock } = nuevoAccesorio;
    if (!nombre || !categoria || !costo || !precio || !stock) {
      alert("Por favor completa todos los campos");
      return;
    }

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nuevoAccesorio),
    });

    if (res.ok) {
      const data = await res.json();
      setAccesorios([data, ...accesorios]);
      setNuevoAccesorio({ nombre: "", categoria: "", costo: "", precio: "", stock: "" });
    } else {
      alert("Error al guardar el accesorio");
    }
  };

  // ✏️ Guardar edición
  const guardarEdicion = async (id) => {
    const accesorio = accesorios.find(a => a.id === id);
    const res = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accesorio),
    });

    if (res.ok) {
      const data = await res.json();
      setAccesorios(accesorios.map(a => a.id === id ? data : a));
      setEditandoId(null);
    } else {
      alert("Error al actualizar accesorio");
    }
  };

  // ❌ Eliminar accesorio
  const eliminarAccesorio = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar este accesorio?")) return;
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (res.ok) setAccesorios(accesorios.filter(a => a.id !== id));
  };

  // ✍️ Manejar cambios de campos editables
  const manejarCambio = (id, campo, valor) => {
    setAccesorios(accesorios.map(a => (a.id === id ? { ...a, [campo]: valor } : a)));
  };

  // 🔍 Filtro rápido por nombre o categoría
  const accesoriosFiltrados = accesorios.filter(a =>
    a.nombre.toLowerCase().includes(filtro.toLowerCase()) ||
    a.categoria.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* 🔙 Botón para volver */}
      <button
        onClick={() => navigate("/")}
        className="mb-4 bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        ← Volver a Llantas
      </button>

      <h1 className="text-3xl font-bold mb-6 text-gray-800">Gestión de Accesorios</h1>

      {/* 🔎 Filtro de búsqueda */}
      <input
        type="text"
        placeholder="Buscar por nombre o categoría..."
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
        className="mb-4 border p-2 rounded w-full md:w-1/3"
      />

      {/* 🧾 Formulario para agregar */}
      <div className="grid grid-cols-5 gap-2 mb-4">
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
          className="border p-2 rounded"
        />
      </div>

      <button
        onClick={agregarAccesorio}
        className="mb-6 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
      >
        ➕ Agregar accesorio
      </button>

      {/* 📋 Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-300 rounded-lg bg-white shadow-md">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="border p-2">ID</th>
              <th className="border p-2">Nombre</th>
              <th className="border p-2">Categoría</th>
              <th className="border p-2">Costo</th>
              <th className="border p-2">Precio</th>
              <th className="border p-2">Stock</th>
              <th className="border p-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {accesoriosFiltrados.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No hay accesorios registrados
                </td>
              </tr>
            ) : (
              accesoriosFiltrados.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="border p-2 text-center">{a.id}</td>

                  {/* Campos editables */}
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

                  {/* Botones */}
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
    </div>
  );
}

export default Accesorios;



