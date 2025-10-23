import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Eye, EyeOff } from "lucide-react";
import './index.css';

function App() {
  const [mostrarCosto, setMostrarCosto] = useState(false);
  const [llantas, setLlantas] = useState([]);
  const [busquedasRecientes, setBusquedasRecientes] = useState(
     JSON.parse(localStorage.getItem('busquedasRecientes')) || []);
  const [busqueda, setBusqueda] = useState('');
  const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
  const [ancho, setAncho] = useState('');
  const [perfil, setPerfil] = useState('');
  const [rin, setRin] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [modoEdicion, setModoEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [nuevoItem, setNuevoItem] = useState({
    referencia: '',
    marca: '',
    proveedor: '',
    costo_empresa: '',
    precio_cliente: '',
    stock: ''
  }); 
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState({ campo: '', asc: true });
  const [seleccionadas, setSeleccionadas] = useState([]);

  useEffect(() => {
    const acceso = localStorage.getItem('acceso');
    const timestamp = localStorage.getItem('timestamp');
    const maxTiempo = 60 * 60 * 1000;

    useEffect(() => {
     const recientes = JSON.parse(localStorage.getItem('busquedasRecientes') || '[]');
     setBusquedasRecientes(recientes);
    }, []);

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

  useEffect(() => {
    axios.get('https://mi-app-llantas.onrender.com/api/llantas')
      .then(res => setLlantas(res.data))
      .catch(() => setMensaje('Error al cargar llantas ❌'))
      .finally(() => setCargando(false));
  }, []);

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

  const filtradas = llantas.filter(l => {
    const coincideBusqueda = l.referencia?.toLowerCase().includes(busqueda.toLowerCase());
    const coincideMarca = !marcaSeleccionada || l.marca === marcaSeleccionada;
    const coincideAncho = !ancho || l.referencia.includes(ancho);
    const coincidePerfil = !perfil || l.referencia.includes(perfil);
    const coincideRin = !rin || l.referencia.includes(rin);
    const esEditando = modoEdicion === l.id;
    return (coincideBusqueda && coincideMarca && coincideAncho && coincidePerfil && coincideRin) || esEditando;
  });

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
      prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id]
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
      setNuevoItem({
        referencia: '',
        marca: '',
        proveedor: '',
        costo_empresa: '',
        precio_cliente: '',
        stock: ''
      });
      setMensaje('Llanta agregada ✅');
      setTimeout(() => setMensaje(''), 2000);
    } catch {
      setMensaje('Error al agregar ❌');
      setTimeout(() => setMensaje(''), 2000);
    }
  };

  const actualizarCampo = (id, campo, valor) => {
    setLlantas(prev =>
      prev.map(l => (l.id === id ? { ...l, [campo]: valor } : l))
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
        <img src="/logowp.PNG" className="h-13 w-48" />
        <div className="flex flex-wrap gap-2">
          {/*<Link to="/subir" className="bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"> Subir archivo</Link>*/}
          <button onClick={() => setMostrarModal(true)} className="bg-gray-700 text-white px-3 py-1.5 rounded text-sm hover:bg-gray-800">Agregar ítem</button>
          <button onClick={handleEliminarMultiples} disabled={seleccionadas.length === 0}className="bg-red-600 text-white px-3 py-1.5 rounded text-sm hover:bg-red-700">Eliminar seleccionados</button>
          <button onClick={() => {localStorage.removeItem('acceso');window.location.href = '/login';}}
            className="bg-red-500 text-white px-3 py-1.5 rounded text-sm hover:bg-red-600">Cerrar sesión</button>
          <button onClick={() => window.open('/lista_llantar.pdf', '_blank')}
            className="bg-yellow-500 text-white px-3 py-1.5 rounded text-sm hover:bg-yellow-600">Lista llantar</button>
        </div>
      </div>

      {mensaje && (<div className="text-center text-blue-700 font-semibold mb-4"> ❗{mensaje}
        </div>)}
        {cargando ? (
          <div className="text-center py-10 text-gray-500">⏳ Cargando llantas...</div>
        ) : (
          <>
            <div className="text-sm text-gray-700 mb-2">Mostrando {filtradas.length} resultados</div>
            <div className="bg-white p-6 rounded-3xl shadow-xl border mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Ingrese su busqueda</h2>

            <div className="mb-4">
              <div className="mb-4">
              <input type="text" placeholder="Buscar referencia..." value={busqueda} onChange={e => { const valor = e.target.value;
              setBusqueda(valor);

                 if (valor.length > 2) {const recientes = JSON.parse(localStorage.getItem('busquedasRecientes')) || [];
                  if (!recientes.includes(valor)) {const nuevas = [valor, ...recientes].slice(0, 5); // máximo 5 recientes
                  localStorage.setItem('busquedasRecientes', JSON.stringify(nuevas));
                   setBusquedasRecientes(nuevas);
             }
           }
         }}
         className="w-full p-2 border rounded"/>
            {busquedasRecientes.length > 0 && (
            <div className="mt-2 text-sm text-gray-700">
            <p className="font-semibold mb-1">Búsquedas recientes:</p>
            <div className="flex flex-wrap gap-2">{busquedasRecientes.map((b, i) => (<button
            key={i}
            onClick={() => setBusqueda(b)}
            className="bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded">
            {b}
              </button>
                 ))}
            </div>
          </div>
          )}
      </div>
        
        <label className="block text-sm font-medium text-gray-600 mb-2">Marca</label>
          <select value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)} 
              className="w-full p-4 border-2 border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-400 outline-none transition ease-in-out duration-300">
              <option value="">Todas las marcas</option>
                  
                  {marcasUnicas.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex justify-center mt-10">
                <button onClick={() => { setBusqueda(''); setMarcaSeleccionada(''); }} 
                    className="px-8 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 focus:ring-2 focus:ring-orange-400 transition ease-in-out duration-300">Limpiar filtros</button>
                </div></div>

              <div className="flex-3 overflow-auto">
                <table className="w-full border text-sm">
                  <thead className="bg-gradient-to-r from-gray-400 to-orange-300 text-black">
                    <tr>
                      <th></th>
                      <th onClick={() => ordenarPor('referencia')} className="cursor-pointer p-2">Referencia</th>
                      <th onClick={() => ordenarPor('marca')} className="cursor-pointer p-2">Marca</th>
                      <th onClick={() => ordenarPor('proveedor')} className="cursor-pointer p-2">Proveedor</th>
                      <th onClick={() => ordenarPor('costo_empresa')} className="cursor-pointer p-2">Costo
                          <button onClick={(e) => { e.stopPropagation(); setMostrarCosto(!mostrarCosto); }}className="ml-2 text-white-600">
                            {mostrarCosto ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                      </th>
                      <th onClick={() => ordenarPor('precio_cliente')} className="cursor-pointer p-2">Precio</th>
                      <th onClick={() => ordenarPor('stock')} className="cursor-pointer p-2">Stock</th>
                      <th className="p-2">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtradas.map(ll => (
                      <tr key={ll.id} className={`text-center border-t even:bg-gray-50 ${ll.stock % 2 !== 0 ? 'bg-red-100' : ''}`}>
                        <td className="p-1"><input type="checkbox" checked={seleccionadas.includes(ll.id)} onChange={() => toggleSeleccion(ll.id)} /></td>
                        {modoEdicion === ll.id ? (
                          <>
                            <td><input value={ll.referencia} onChange={e => actualizarCampo(ll.id, 'referencia', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                            <td><input value={ll.marca} onChange={e => actualizarCampo(ll.id, 'marca', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                            <td><input value={ll.proveedor} onChange={e => actualizarCampo(ll.id, 'proveedor', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                            <td><input type="number" value={ll.costo_empresa} onChange={e => actualizarCampo(ll.id, 'costo_empresa', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                            <td><input type="number" value={ll.precio_cliente} onChange={e => actualizarCampo(ll.id, 'precio_cliente', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                            <td><input type="number" value={ll.stock} onChange={e => actualizarCampo(ll.id, 'stock', e.target.value)} className="w-full border rounded text-sm p-1" /></td>
                            <td className="flex gap-1 justify-center">
                              <button onClick={() => handleGuardar(ll)} className="bg-blue-500 text-white px-2 py-1 text-xs rounded">Guardar</button>
                              <button onClick={() => setModoEdicion(null)} className="bg-gray-300 text-black px-2 py-1 text-xs rounded">Cancelar</button>
                            </td>
                          </>
                        ) : (
                          <>
                          <td className="p-1 flex items-center justify-center gap-2">
                             <span>{ll.referencia}</span>
                           <button onClick={() =>window.open(`https://www.llantar.com.co/collections/llantas?q=${encodeURIComponent(ll.referencia)}`,'_blank') }
                              className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 text-xs">Ver</button>
                               </td>
                            <td>{ll.marca}</td>
                            <td>{ll.proveedor}</td>
                            <td className="text-blue-600">{mostrarCosto ? `$${ll.costo_empresa.toLocaleString()}` : '•••••'}</td>
                            <td className="text-green-600">${ll.precio_cliente.toLocaleString()}</td>
                            <td className={ll.stock === 0 ? 'text-red-600' : ''}>{ll.stock === 0 ? 'Sin stock' : ll.stock}</td>
                            <td className="flex gap-1 justify-center">
                              <button onClick={() => setModoEdicion(ll.id)} className="bg-gray-200 hover:bg-gray-300 px-2 py-1 text-xs rounded">Editar</button>
                              <button onClick={() => handleEliminar(ll.id)} className="bg-red-500 text-white hover:bg-red-600 px-2 py-1 text-xs rounded">Eliminar</button>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

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
