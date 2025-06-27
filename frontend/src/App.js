// src/App.js
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './index.css';

function App() {
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [ancho, setAncho] = useState('');
  const [perfil, setPerfil] = useState('');
  const [rin, setRin] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(null);
  const [nuevoItem, setNuevoItem] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarLlantas();
  }, []);

  const cargarLlantas = async () => {
    try {
      const res = await axios.get('https://mi-app-llantas.onrender.com/api/llantas');
      setLlantas(res.data);
    } catch {
      setMensaje('Error al cargar llantas ❌');
    } finally {
      setCargando(false);
    }
  };

  const marcasUnicas = [...new Set(llantas.map(l => l.marca))];
  const anchos = [];
  const perfiles = [];
  const rines = [];

  llantas.forEach(l => {
    const partes = l.referencia?.split(/[ /R]/).filter(Boolean);
    if (partes?.length >= 3) {
      if (!anchos.includes(partes[0])) anchos.push(partes[0]);
      if (!perfiles.includes(partes[1])) perfiles.push(partes[1]);
      if (!rines.includes(partes[2])) rines.push(partes[2]);
    }
  });

  const filtradas = llantas.filter(l =>
    l.referencia?.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!marcaSeleccionada || l.marca === marcaSeleccionada) &&
    (!ancho || l.referencia.includes(ancho)) &&
    (!perfil || l.referencia.includes(perfil)) &&
    (!rin || l.referencia.includes(rin))
  );

  const actualizarCampo = (id, campo, valor) => {
    setLlantas(prev =>
      prev.map(l => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  const handleGuardar = async (llanta) => {
    try {
      await axios.post('https://mi-app-llantas.onrender.com/api/editar-llanta', llanta);
      setMensaje('Cambios guardados ✅');
      setModoEdicion(null);
    } catch {
      setMensaje('Error al guardar ❌');
    } finally {
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await axios.delete(`https://mi-app-llantas.onrender.com/api/eliminar-llanta/${id}`);
      setLlantas(llantas.filter(l => l.id !== id));
      setMensaje('Llantas eliminada ✅');
    } catch {
      setMensaje('Error al eliminar ❌');
    } finally {
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  const handleAgregar = async () => {
    if (!nuevoItem) return;
    try {
      await axios.post('https://mi-app-llantas.onrender.com/api/agregar-llanta', nuevoItem);
      setNuevoItem(null);
      cargarLlantas();
      setMensaje('Llanta agregada ✅');
    } catch {
      setMensaje('Error al agregar ❌');
    } finally {
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛞 Llantas Audio Tecnica</h1>
        <div className="flex gap-2">
          <Link to="/subir" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Subir archivo</Link>
          <button
            onClick={() => {
              localStorage.removeItem('acceso');
              window.location.href = '/login';
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {mensaje && <div className="mb-4 text-center text-white bg-black rounded p-2">{mensaje}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Filtros */}
        <div className="bg-white p-4 rounded shadow-md border">
          <h2 className="text-lg font-semibold mb-3">Filtros</h2>
          <input type="text" placeholder="Buscar referencia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full mb-3 p-2 border rounded" />
          <label className="block text-sm mb-1">Marca</label>
          <select value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todas</option>
            {marcasUnicas.map(m => <option key={m}>{m}</option>)}
          </select>

          <label className="block text-sm mb-1">Ancho</label>
          <select value={ancho} onChange={e => setAncho(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todos</option>
            {anchos.map(a => <option key={a}>{a}</option>)}
          </select>

          <label className="block text-sm mb-1">Perfil</label>
          <select value={perfil} onChange={e => setPerfil(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todos</option>
            {perfiles.map(p => <option key={p}>{p}</option>)}
          </select>

          <label className="block text-sm mb-1">Rin</label>
          <select value={rin} onChange={e => setRin(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todos</option>
            {rines.map(r => <option key={r}>{r}</option>)}
          </select>

          <button onClick={() => {
            setBusqueda('');
            setMarcaSeleccionada('');
            setAncho('');
            setPerfil('');
            setRin('');
          }} className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-sm text-black py-1 rounded">Limpiar filtros</button>
        </div>

        {/* Tabla */}
        <div className="md:col-span-3 overflow-x-auto">
          {cargando ? (
            <div className="text-center text-gray-500">⏳ Cargando llantas...</div>
          ) : (
            <table className="w-full border text-sm bg-white">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Referencia</th>
                  <th className="p-2 border">Marca</th>
                  <th className="p-2 border">Proveedor</th>
                  <th className="p-2 border">Costo</th>
                  <th className="p-2 border">Precio</th>
                  <th className="p-2 border">Stock</th>
                  <th className="p-2 border">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((ll, idx) => (
                  <tr key={ll.id} className="text-center border-t">
                    <td className="p-1 border">
                      {modoEdicion === ll.id ? (
                        <input value={ll.referencia} onChange={(e) => actualizarCampo(ll.id, 'referencia', e.target.value)} className="border px-1 w-full" />
                      ) : ll.referencia}
                    </td>
                    <td className="p-1 border">
                      {modoEdicion === ll.id ? (
                        <input value={ll.marca} onChange={(e) => actualizarCampo(ll.id, 'marca', e.target.value)} className="border px-1 w-full" />
                      ) : ll.marca}
                    </td>
                    <td className="p-1 border">
                      {modoEdicion === ll.id ? (
                        <input value={ll.proveedor} onChange={(e) => actualizarCampo(ll.id, 'proveedor', e.target.value)} className="border px-1 w-full" />
                      ) : ll.proveedor}
                    </td>
                    <td className="p-1 border text-blue-600">
                      {modoEdicion === ll.id ? (
                        <input type="number" value={ll.costo_empresa} onChange={(e) => actualizarCampo(ll.id, 'costo_empresa', e.target.value)} className="border px-1 w-full" />
                      ) : `$${ll.costo_empresa.toLocaleString()}`}
                    </td>
                    <td className="p-1 border text-green-600 font-semibold">
                      {modoEdicion === ll.id ? (
                        <input type="number" value={ll.precio_cliente} onChange={(e) => actualizarCampo(ll.id, 'precio_cliente', e.target.value)} className="border px-1 w-full" />
                      ) : `$${ll.precio_cliente.toLocaleString()}`}
                    </td>
                    <td className={`p-1 border ${ll.stock === 0 ? 'text-red-600' : ''}`}>
                      {modoEdicion === ll.id ? (
                        <input type="number" value={ll.stock} onChange={(e) => actualizarCampo(ll.id, 'stock', e.target.value)} className="border px-1 w-full" />
                      ) : ll.stock === 0 ? 'Sin stock' : ll.stock}
                    </td>
                    <td className="p-1 border">
                      {modoEdicion === ll.id ? (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => handleGuardar(ll)} className="bg-green-600 text-white px-2 py-0.5 rounded text-xs">Guardar</button>
                          <button onClick={() => setModoEdicion(null)} className="bg-gray-400 text-white px-2 py-0.5 rounded text-xs">Cancelar</button>
                        </div>
                      ) : (
                        <div className="flex justify-center gap-1">
                          <button onClick={() => setModoEdicion(ll.id)} className="bg-yellow-500 text-white px-2 py-0.5 rounded text-xs">Editar</button>
                          <button onClick={() => handleEliminar(ll.id)} className="bg-red-600 text-white px-2 py-0.5 rounded text-xs">Eliminar</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                <tr className="bg-gray-100">
                  <td className="p-1 border" colSpan="7">
                    <div className="flex justify-center gap-2 items-center">
                      <input placeholder="Referencia" className="border px-1" onChange={e => setNuevoItem(i => ({ ...i, referencia: e.target.value }))} />
                      <input placeholder="Marca" className="border px-1" onChange={e => setNuevoItem(i => ({ ...i, marca: e.target.value }))} />
                      <input placeholder="Proveedor" className="border px-1" onChange={e => setNuevoItem(i => ({ ...i, proveedor: e.target.value }))} />
                      <input type="number" placeholder="Costo" className="border px-1" onChange={e => setNuevoItem(i => ({ ...i, costo_empresa: e.target.value }))} />
                      <input type="number" placeholder="Precio" className="border px-1" onChange={e => setNuevoItem(i => ({ ...i, precio_cliente: e.target.value }))} />
                      <input type="number" placeholder="Stock" className="border px-1" onChange={e => setNuevoItem(i => ({ ...i, stock: e.target.value }))} />
                      <button onClick={handleAgregar} className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs">Agregar</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 

          































