import React, { useState, useEffect } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";

export default function Accesorios() {
  const [accesorios, setAccesorios] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevo, setNuevo] = useState({ nombre: "", categoria: "", costo: "", precio: "", stock: "" });

  useEffect(() => {
    obtenerAccesorios();
  }, []);

  const obtenerAccesorios = async () => {
    try {
      const res = await fetch("https://mi-app-llantas.onrender.com/accesorios");
      const data = await res.json();
      setAccesorios(data);
    } catch (error) {
      console.error("Error al obtener accesorios", error);
    }
  };

  const agregarAccesorio = async () => {
    try {
      const res = await fetch("https://mi-app-llantas.onrender.com/accesorios/agregar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevo),
      });

      if (res.ok) {
        setMostrarModal(false);
        obtenerAccesorios();
        alert("✅ Accesorio agregado correctamente");
      } else {
        alert("❌ Error al guardar el accesorio");
      }
    } catch (error) {
      alert("Error al conectar con el servidor");
    }
  };

  const accesoriosFiltrados = accesorios.filter(
    (a) =>
      a.nombre?.toLowerCase().includes(filtro.toLowerCase()) ||
      a.categoria?.toLowerCase().includes(filtro.toLowerCase())
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md p-4 flex flex-col">
        <button
          onClick={() => (window.location.href = "/")}
          className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-semibold mb-4"
        >
          <ArrowLeft size={18} /> Volver a Llantas
        </button>

        <input
          type="text"
          placeholder="Buscar por nombre o categoría"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border rounded-md p-2 mb-4 w-full"
        />

        <button
          onClick={() => setMostrarModal(true)}
          className="bg-green-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
        >
          <Plus size={18} /> Agregar accesorio
        </button>
      </div>

      {/* Tabla */}
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Gestión de Accesorios</h1>
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full text-left">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-3">Nombre</th>
                <th className="p-3">Categoría</th>
                <th className="p-3 text-blue-600">Costo</th>
                <th className="p-3 text-green-600">Precio</th>
                <th className="p-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {accesoriosFiltrados.length > 0 ? (
                accesoriosFiltrados.map((a, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3">{a.nombre}</td>
                    <td className="p-3">{a.categoria}</td>
                    <td className="p-3 text-blue-600 font-semibold">${a.costo}</td>
                    <td className="p-3 text-green-600 font-semibold">${a.precio}</td>
                    <td className="p-3">{a.stock}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center p-4 text-gray-500">
                    No hay accesorios registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 relative">
            <button
              onClick={() => setMostrarModal(false)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold mb-4">Agregar Accesorio</h2>

            <input
              type="text"
              placeholder="Nombre"
              className="border p-2 mb-3 rounded-md w-full"
              value={nuevo.nombre}
              onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            />
            <input
              type="text"
              placeholder="Categoría"
              className="border p-2 mb-3 rounded-md w-full"
              value={nuevo.categoria}
              onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}
            />
            <input
              type="number"
              placeholder="Costo"
              className="border p-2 mb-3 rounded-md w-full"
              value={nuevo.costo}
              onChange={(e) => setNuevo({ ...nuevo, costo: e.target.value })}
            />
            <input
              type="number"
              placeholder="Precio"
              className="border p-2 mb-3 rounded-md w-full"
              value={nuevo.precio}
              onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
            />
            <input
              type="number"
              placeholder="Stock"
              className="border p-2 mb-3 rounded-md w-full"
              value={nuevo.stock}
              onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setMostrarModal(false)}
                className="px-3 py-2 bg-gray-300 rounded-md hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={agregarAccesorio}
                className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
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












