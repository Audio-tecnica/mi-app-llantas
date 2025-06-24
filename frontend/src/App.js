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

  useEffect(() => {
    axios.get('https://mi-app-llantas.onrender.com/api/llantas')
      .then(res => setLlantas(res.data))
      .catch(() => setMensaje('Error al cargar llantas ❌'));
  }, []);

  const marcasUnicas = [...new Set(llantas.map(l => l.marca))];
  const anchos = [];
  const perfiles = [];
  const rines = [];

  llantas.forEach(l => {
    const partes = l.referencia.split(/[ /R]/).filter(Boolean);
    if (partes.length >= 3) {
      if (!anchos.includes(partes[0])) anchos.push(partes[0]);
      if (!perfiles.includes(partes[1])) perfiles.push(partes[1]);
      if (!rines.includes(partes[2])) rines.push(partes[2]);
    }
  });

  const filtradas = llantas.filter(l =>
    l.referencia.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!marcaSeleccionada || l.marca === marcaSeleccionada) &&
    (!ancho || l.referencia.includes(ancho)) &&
    (!perfil || l.referencia.includes(perfil)) &&
    (!rin || l.referencia.includes(rin))
  );

const guardarEdicion = async (item) => {
  try {
    const res = await axios.post('https://mi-app-llantas.onrender.com/api/actualizar-stock', {
      id: item.id,
      stock: parseInt(item.stock),
      referencia: item.referencia,
      marca: item.marca,
      proveedor: item.proveedor,
      costo_empresa: parseInt(item.costo_empresa),
      precio_cliente: parseInt(item.precio_cliente)
    });

    if (res.status === 200) {
      setMensaje('Cambios guardados ✅');
      setModoEdicion(null);
    } else {
      throw new Error('Error inesperado');
    }
  } catch (e) {
    console.error(e);
    setMensaje('Error al guardar ❌');
  } finally {
    setTimeout(() => setMensaje(''), 2500);
  }
};


  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛞 Llantas Audio Tecnica</h1>
        <div className="flex gap-2">
          <Link to="/subir" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Subir archivo
          </Link>
          <button
            onClick={() => {
              localStorage.removeItem('acceso');
              window.location.href = '/login';
            }}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
            Cerrar sesión
          </button>
        </div>
      </div>

      {mensaje && <div className="text-green-600 mb-4">{mensaje}</div>}

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-4 rounded shadow-md border md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Filtros</h2>
          <input
            type="text"
            placeholder="Buscar referencia..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="w-full mb-3 p-2 border rounded"
          />
          <label className="block text-sm mb-1">Marca</label>
          <select value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todas</option>
            {marcasUnicas.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
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
          <button
            onClick={() => {
              setBusqueda('');
              setMarcaSeleccionada('');
              setAncho('');
              setPerfil('');
              setRin('');
            }}
            className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-sm text-black py-1 rounded"
          >
            Limpiar filtros
          </button>
        </div>

        {/* Tabla */}
        <div className="md:col-span-3 overflow-x-auto">
          <table className="w-full border text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">Referencia</th>
                <th className="p-2 border">Marca</th>
                <th className="p-2 border">Proveedor</th>
                <th className="p-2 border">Costo Empresa</th>
                <th className="p-2 border">Precio Cliente</th>
                <th className="p-2 border">Stock</th>
                <th className="p-2 border">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((ll, index) => (
                <tr key={index} className="border-t text-center">
                  <td className="p-2">
                    {modoEdicion === ll.id ? (
                      <input value={ll.referencia} onChange={(e) => {
                        const nuevas = [...llantas];
                        nuevas[index].referencia = e.target.value;
                        setLlantas(nuevas);
                      }} className="w-full border px-1" />
                    ) : ll.referencia}
                  </td>
                  <td className="p-2">
                    {modoEdicion === ll.id ? (
                      <input value={ll.marca} onChange={(e) => {
                        const nuevas = [...llantas];
                        nuevas[index].marca = e.target.value;
                        setLlantas(nuevas);
                      }} className="w-full border px-1" />
                    ) : ll.marca}
                  </td>
                  <td className="p-2">
                    {modoEdicion === ll.id ? (
                      <input value={ll.proveedor} onChange={(e) => {
                        const nuevas = [...llantas];
                        nuevas[index].proveedor = e.target.value;
                        setLlantas(nuevas);
                      }} className="w-full border px-1" />
                    ) : ll.proveedor}
                  </td>
                  <td className="p-2 text-blue-600">
                    {modoEdicion === ll.id ? (
                      <input type="number" value={ll.costo_empresa} onChange={(e) => {
                        const nuevas = [...llantas];
                        nuevas[index].costo_empresa = e.target.value;
                        setLlantas(nuevas);
                      }} className="w-full border px-1" />
                    ) : `$${ll.costo_empresa.toLocaleString()}`}
                  </td>
                  <td className="p-2 text-green-600 font-semibold">
                    {modoEdicion === ll.id ? (
                      <input type="number" value={ll.precio_cliente} onChange={(e) => {
                        const nuevas = [...llantas];
                        nuevas[index].precio_cliente = e.target.value;
                        setLlantas(nuevas);
                      }} className="w-full border px-1" />
                    ) : `$${ll.precio_cliente.toLocaleString()}`}
                  </td>
                  <td className={`p-2 ${ll.stock == 0 ? 'text-red-600' : ''}`}>
                    {modoEdicion === ll.id ? (
                      <input type="number" value={ll.stock} onChange={(e) => {
                        const nuevas = [...llantas];
                        nuevas[index].stock = e.target.value;
                        setLlantas(nuevas);
                      }} className="w-full border px-1" />
                    ) : ll.stock}
                  </td>
                  <td className="p-2">
                    {modoEdicion === ll.id ? (
                      <button onClick={() => guardarEdicion(ll)} className="bg-green-600 text-white px-2 rounded text-sm">Guardar</button>
                    ) : (
                      <button onClick={() => setModoEdicion(ll.id)} className="bg-blue-500 text-white px-2 rounded text-sm">Editar</button>
                    )}
                  </td>
                </tr>
              ))}

              {/* Fila para agregar nuevo ítem */}
              <tr className="border-t text-center">
                <td className="p-2"><input placeholder="Referencia" className="w-full border px-1"
                  value={nuevoItem?.referencia || ''} onChange={(e) => setNuevoItem({ ...nuevoItem, referencia: e.target.value })} /></td>
                <td className="p-2"><input placeholder="Marca" className="w-full border px-1"
                  value={nuevoItem?.marca || ''} onChange={(e) => setNuevoItem({ ...nuevoItem, marca: e.target.value })} /></td>
                <td className="p-2"><input placeholder="Proveedor" className="w-full border px-1"
                  value={nuevoItem?.proveedor || ''} onChange={(e) => setNuevoItem({ ...nuevoItem, proveedor: e.target.value })} /></td>
                <td className="p-2"><input type="number" placeholder="Costo" className="w-full border px-1"
                  value={nuevoItem?.costo_empresa || ''} onChange={(e) => setNuevoItem({ ...nuevoItem, costo_empresa: e.target.value })} /></td>
                <td className="p-2"><input type="number" placeholder="Precio" className="w-full border px-1"
                  value={nuevoItem?.precio_cliente || ''} onChange={(e) => setNuevoItem({ ...nuevoItem, precio_cliente: e.target.value })} /></td>
                <td className="p-2"><input type="number" placeholder="Stock" className="w-full border px-1"
                  value={nuevoItem?.stock || ''} onChange={(e) => setNuevoItem({ ...nuevoItem, stock: e.target.value })} /></td>
                <td className="p-2">
                  <button onClick={agregarItem} className="bg-green-700 text-white px-2 py-1 rounded text-sm">Agregar</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;










