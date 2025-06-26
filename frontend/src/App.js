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
  const [seleccionadas, setSeleccionadas] = useState([]);

  // Expiración automática de sesión
  useEffect(() => {
    const acceso = localStorage.getItem('acceso');
    const timestamp = localStorage.getItem('timestamp');
    const maxTiempo = 15 * 60 * 1000;

    if (!acceso || !timestamp || Date.now() - parseInt(timestamp) > maxTiempo) {
      localStorage.removeItem('acceso');
      localStorage.removeItem('timestamp');
      window.location.href = '/login';
    }

    localStorage.setItem('timestamp', Date.now());

    const timer = setTimeout(() => {
      localStorage.removeItem('acceso');
      localStorage.removeItem('timestamp');
      window.location.href = '/login';
    }, maxTiempo);

    return () => clearTimeout(timer);
  }, []);

  // Cargar llantas desde API
  useEffect(() => {
    axios.get('https://mi-app-llantas.onrender.com/api/llantas')
      .then(res => setLlantas(res.data))
      .catch(() => setMensaje('Error al cargar llantas ❌'))
      .finally(() => setCargando(false));
  }, []);

  // Opciones únicas para filtros
  const marcasUnicas = [...new Set(llantas
    .filter(l =>
      l.referencia?.toLowerCase().includes(busqueda.toLowerCase()) &&
      (!ancho || l.referencia.includes(ancho)) &&
      (!perfil || l.referencia.includes(perfil)) &&
      (!rin || l.referencia.includes(rin))
    )
    .map(l => l.marca)
  )];

  const anchos = [], perfiles = [], rines = [];
  llantas.forEach(l => {
    const partes = l.referencia?.split(/[ /R]/).filter(Boolean);
    if (partes?.length >= 3) {
      if (!anchos.includes(partes[0])) anchos.push(partes[0]);
      if (!perfiles.includes(partes[1])) perfiles.push(partes[1]);
      if (!rines.includes(partes[2])) rines.push(partes[2]);
    }
  });

  // Filtrado
  const filtradas = llantas.filter(l =>
    l.referencia?.toLowerCase().includes(busqueda.toLowerCase()) &&
    (!marcaSeleccionada || l.marca === marcaSeleccionada) &&
    (!ancho || l.referencia.includes(ancho)) &&
    (!perfil || l.referencia.includes(perfil)) &&
    (!rin || l.referencia.includes(rin))
  );

  // Ordenamiento
  const ordenarPor = (campo) => {
    const asc = orden.campo === campo ? !orden.asc : true;
    const ordenadas = [...filtradas].sort((a, b) => {
      if (typeof a[campo] === 'number') {
        return asc ? a[campo] - b[campo] : b[campo] - a[campo];
      } else {
        return asc
          ? a[campo]?.toString().localeCompare(b[campo]?.toString())
          : b[campo]?.toString().localeCompare(a[campo]?.toString());
      }
    });
    setLlantas(ordenadas);
    setOrden({ campo, asc });
  };

  const toggleSeleccion = (id) => {
    setSeleccionadas(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm('¿Eliminar los ítems seleccionados?')) return;
    try {
      for (let id of seleccionadas) {
        await axios.post('https://mi-app-llantas.onrender.com/api/eliminar-llanta', { id });
      }
      const { data } = await axios.get('https://mi-app-llantas.onrender.com/api/llantas');
      setLlantas(data);
      setSeleccionadas([]);
      setMensaje('Ítems eliminados ✅');
      setTimeout(() => setMensaje(''), 2000);
    } catch {
      setMensaje('Error al eliminar ❌');
      setTimeout(() => setMensaje(''), 2000);
    }
  };

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
    {/* Cabecera */}
    <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
      <h1 className="text-2xl font-bold">🛞 Llantas Audio Tecnica</h1>
      <div className="flex flex-wrap gap-2">
        <Link to="/subir" className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700">Subir archivo</Link>
        <button onClick={() => setMostrarModal(true)} className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800">Agregar ítem</button>
        <button onClick={handleEliminarMultiples} disabled={seleccionadas.length === 0} className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700">Eliminar seleccionados</button>
        <button onClick={() => { localStorage.removeItem('acceso'); window.location.href = '/login'; }} className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600">Cerrar sesión</button>
      </div>
    </div>

    {mensaje && <div className="text-center text-blue-700 font-semibold mb-4">❗{mensaje}</div>}
    <div className="text-sm text-gray-700 mb-4">Mostrando {filtradas.length} resultados</div>

    {/* Filtros y tabla */}
    <div className="flex flex-col md:flex-row gap-6">
      {/* Filtros */}
      <div className="bg-white p-4 rounded shadow-md border md:w-1/4">
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
        <button onClick={() => { setBusqueda(''); setMarcaSeleccionada(''); setAncho(''); setPerfil(''); setRin(''); }} className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-sm text-black py-1 rounded">Limpiar filtros</button>
      </div>

      {/* Tabla */}
      <div className="md:w-3/4 overflow-x-auto">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border"></th>
              <th className="p-2 border">Referencia</th>
              <th className="p-2 border">Marca</th>
              <th className="p-2 border">Proveedor</th>
              <th className="p-2 border">Costo</th>
              <th className="p-2 border">Precio</th>
              <th className="p-2 border">Stock</th>
              <th className="p-2 border">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.map(ll => (
              <tr key={ll.id} className={`text-center border-t even:bg-gray-50 ${ll.stock % 2 !== 0 ? 'bg-red-100' : ''}`}>
                <td className="p-1"><input type="checkbox" checked={seleccionadas.includes(ll.id)} onChange={() => toggleSeleccion(ll.id)} /></td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
}

export default App;


























