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
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoItem, setNuevoItem] = useState({ referencia: '', marca: '', proveedor: '', costo_empresa: '', precio_cliente: '', stock: '' });
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState({ campo: '', asc: true });

  useEffect(() => {
    axios.get('https://mi-app-llantas.onrender.com/api/llantas')
      .then(res => setLlantas(res.data))
      .catch(() => setMensaje('Error al cargar llantas ❌'))
      .finally(() => setCargando(false));
  }, []);

  const marcasUnicas = [...new Set(llantas.map(l => l.marca))];
  const anchos = [], perfiles = [], rines = [];
  llantas.forEach(l => {
    const partes = l.referencia?.split(/[ /R]/).filter(Boolean);
    if (partes?.length >= 3) {
      if (!anchos.includes(partes[0])) anchos.push(partes[0]);
      if (!perfiles.includes(partes[1])) perfiles.push(partes[1]);
      if (!rines.includes(partes[2])) rines.push(partes[2]);
    }
  });

  const ordenarPor = (campo) => {
    const asc = orden.campo === campo ? !orden.asc : true;
    const copia = [...llantas];
    copia.sort((a, b) => {
      if (typeof a[campo] === 'number') {
        return asc ? a[campo] - b[campo] : b[campo] - a[campo];
      } else {
        return asc
          ? (a[campo] || '').localeCompare(b[campo] || '')
          : (b[campo] || '').localeCompare(a[campo] || '');
      }
    });
    setLlantas(copia);
    setOrden({ campo, asc });
  };

  const filtradas = llantas.filter(l =>
    l.referencia?.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!marcaSeleccionada || l.marca === marcaSeleccionada) &&
    (!ancho || l.referencia.includes(ancho)) &&
    (!perfil || l.referencia.includes(perfil)) &&
    (!rin || l.referencia.includes(rin))
  );

  const handleGuardar = async (llanta) => {
    try {
      await axios.post('https://mi-app-llantas.onrender.com/api/editar-llanta', llanta);
      setMensaje('Cambios guardados ✅');
      setModoEdicion(null);
      setTimeout(() => setMensaje(''), 2000);
    } catch {
      setMensaje('Error al guardar ❌');
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta llanta?')) return;
    try {
      await axios.post('https://mi-app-llantas.onrender.com/api/eliminar-llanta', { id });
      setLlantas(prev => prev.filter(l => l.id !== id));
      setMensaje('Llanta eliminada ✅');
      setTimeout(() => setMensaje(''), 2000);
    } catch {
      setMensaje('Error al eliminar ❌');
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  const handleAgregar = async () => {
    try {
      await axios.post('https://mi-app-llantas.onrender.com/api/agregar-llanta', nuevoItem);
      const { data } = await axios.get('https://mi-app-llantas.onrender.com/api/llantas');
      setLlantas(data);
      setMostrarModal(false);
      setNuevoItem({ referencia: '', marca: '', proveedor: '', costo_empresa: '', precio_cliente: '', stock: '' });
      setMensaje('Llanta agregada ✅');
      setTimeout(() => setMensaje(''), 2000);
    } catch {
      setMensaje('Error al agregar ❌');
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setLlantas(prev => prev.map(l => (l.id === id ? { ...l, [campo]: valor } : l)));
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🛞 Llantas Audio Tecnica</h1>
        <div className="flex gap-2">
          <Link to="/subir" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Subir archivo</Link>
          <button onClick={() => setMostrarModal(true)} className="bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-800">Agregar ítem</button>
          <button onClick={() => { localStorage.removeItem('acceso'); window.location.href = '/login'; }} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Cerrar sesión</button>
        </div>
      </div>

      {mensaje && <div className="text-center text-blue-700 font-semibold mb-4">❗{mensaje}</div>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-4 rounded shadow-md border md:col-span-1">
          <h2 className="text-lg font-semibold mb-3">Filtros</h2>
          <input type="text" placeholder="Buscar referencia..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full mb-3 p-2 border rounded" />
          <label className="block text-sm mb-1">Marca</label>
          <select value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)} className="w-full mb-3 p-2 border rounded">
            <option value="">Todas</option>
            {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
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
          <button onClick={() => { setBusqueda(''); setMarcaSeleccionada(''); setAncho(''); setPerfil(''); setRin(''); }} className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-sm text-black py-1 rounded">Limpiar filtros</button>
        </div>

        <div className="md:col-span-3">
          {cargando ? <div className="text-center py-10 text-gray-500">⏳ Cargando llantas...</div> : (
            <table className="w-full border text-sm">
              <thead className="bg-gray-100">
                <tr>
                  {['referencia', 'marca', 'proveedor', 'costo_empresa', 'precio_cliente', 'stock'].map(campo => (
                    <th key={campo} className="p-2 border cursor-pointer" onClick={() => ordenarPor(campo)}>
                      {campo.charAt(0).toUpperCase() + campo.slice(1).replace('_', ' ')} {orden.campo === campo ? (orden.asc ? '↑' : '↓') : ''}
                    </th>
                  ))}
                  <th className="p-2 border">Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map(ll => (
                  <tr key={ll.id} className="text-center border-t">
                    {modoEdicion === ll.id ? (
                      <>
                        <td className="p-1"><input value={ll.referencia} onChange={e => actualizarCampo(ll.id, 'referencia', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                        <td className="p-1"><input value={ll.marca} onChange={e => actualizarCampo(ll.id, 'marca', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                        <td className="p-1"><input value={ll.proveedor} onChange={e => actualizarCampo(ll.id, 'proveedor', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                        <td className="p-1"><input type="number" value={ll.costo_empresa} onChange={e => actualizarCampo(ll.id, 'costo_empresa', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                        <td className="p-1"><input type="number" value={ll.precio_cliente} onChange={e => actualizarCampo(ll.id, 'precio_cliente', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                        <td className="p-1"><input type="number" value={ll.stock} onChange={e => actualizarCampo(ll.id, 'stock', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                        <td className="p-1 flex gap-1 justify-center">
                          <button onClick={() => handleGuardar(ll)} className="bg-blue-500 text-white px-2 py-1 text-xs rounded">Guardar</button>
                          <button onClick={() => setModoEdicion(null)} className="bg-gray-300 text-black px-2 py-1 text-xs rounded">Cancelar</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">{ll.referencia}</td>
                        <td className="p-2">{ll.marca}</td>
                        <td className="p-2">{ll.proveedor}</td>
                        <td className="p-2 text-blue-600">${ll.costo_empresa.toLocaleString()}</td>
                        <td className="p-2 text-green-600">${ll.precio_cliente.toLocaleString()}</td>
                        <td className={`p-2 ${ll.stock === 0 ? 'text-red-600' : ''}`}>{ll.stock === 0 ? 'Sin stock' : ll.stock}</td>
                        <td className="p-2 flex gap-1 justify-center">
                          <button onClick={() => setModoEdicion(ll.id)} className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded">Editar</button>
                          <button onClick={() => handleEliminar(ll.id)} className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded">Eliminar</button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Agregar nueva llanta</h2>
            {['referencia', 'marca', 'proveedor', 'costo_empresa', 'precio_cliente', 'stock'].map(campo => (
              <input
                key={campo}
                placeholder={campo.replace('_', ' ')}
                value={nuevoItem[campo]}
                onChange={e => setNuevoItem({ ...nuevoItem, [campo]: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
              />
            ))}
            <div className="flex justify-end gap-2">
              <button onClick={handleAgregar} className="bg-blue-600 text-white px-4 py-2 rounded">Guardar</button>
              <button onClick={() => setMostrarModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
























