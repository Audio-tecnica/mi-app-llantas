import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  ChevronUp,
  ChevronDown,
  ChevronRight,
  X,
  ShoppingCart,
} from "lucide-react";
import "./index.css";

function VisorStock() {
  const navigate = useNavigate();
  const [llantas, setLlantas] = useState([]);
  const [promociones, setPromociones] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [cargando, setCargando] = useState(true);
  const [ordenPor, setOrdenPor] = useState("referencia");
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [carritoPedido, setCarritoPedido] = useState([]);
  const [dimensionesExpandidas, setDimensionesExpandidas] = useState({});
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  const API_URL = "https://mi-app-llantas.onrender.com";

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const { data: llantasData } = await axios.get(`${API_URL}/api/llantas`);
      setLlantas(llantasData);

      const { data: promoData } = await axios.get(`${API_URL}/api/promociones`);
      setPromociones(promoData.filter((p) => p.activa));
    } catch (err) {
      console.error("Error cargando datos:", err);
    } finally {
      setCargando(false);
    }
  };

  // ⭐ FUNCIÓN NUEVA: Extraer el diseño de la referencia
  const extraerDiseno = (referencia) => {
    if (!referencia) return "";
    // La referencia viene como "265/65R17 G056"
    // Queremos obtener solo "G056"
    const partes = referencia.trim().split(/\s+/);
    if (partes.length > 1) {
      return partes[1];
    }
    return "";
  };

  // ⭐ FUNCIÓN CORREGIDA: Validar promociones con diseño incluido en referencia
  const obtenerPromocion = (marca, referenciaCompleta) => {
    const normalizarRef = (ref) => {
      if (!ref) return "";
      let normalizada = ref.replace(/^(LT|P)\s*/i, "");
      normalizada = normalizada.split(" ")[0];
      return normalizada.trim().toUpperCase();
    };

    const normalizarDiseno = (dis) => {
      if (!dis) return "";
      return dis.trim().toUpperCase();
    };

    const refNormalizada = normalizarRef(referenciaCompleta);
    const disenoLlanta = extraerDiseno(referenciaCompleta);
    const disenoNormalizado = normalizarDiseno(disenoLlanta);

    const promo = promociones.find((p) => {
      const promoRefNormalizada = normalizarRef(p.referencia);
      const promoDisenoNormalizado = normalizarDiseno(p.diseno);

      return (
        p.marca === marca &&
        promoRefNormalizada === refNormalizada &&
        promoDisenoNormalizado === disenoNormalizado &&
        p.activa
      );
    });

    return promo;
  };

  const marcasUnicas = [...new Set(llantas.map((l) => l.marca))].sort();
  let llantasFiltradas = llantas.filter((l) => l.marca === marcaSeleccionada);

  const extraerRin = (referencia) => {
    const match = referencia?.match(/R(\d+)/i);
    return match ? match[1] : "Otros";
  };

  const agruparPorRin = () => {
    const grupos = {};
    llantasFiltradas.forEach((llanta) => {
      const rin = extraerRin(llanta.referencia);
      if (!grupos[rin]) {
        grupos[rin] = [];
      }
      grupos[rin].push(llanta);
    });

    Object.keys(grupos).forEach((rin) => {
      grupos[rin].sort((a, b) => {
        if (ordenPor === "referencia") {
          return ordenAsc
            ? a.referencia.localeCompare(b.referencia)
            : b.referencia.localeCompare(a.referencia);
        } else if (ordenPor === "proveedor") {
          return ordenAsc
            ? (a.proveedor || "").localeCompare(b.proveedor || "")
            : (b.proveedor || "").localeCompare(a.proveedor || "");
        } else if (ordenPor === "stock") {
          return ordenAsc ? a.stock - b.stock : b.stock - a.stock;
        }
        return 0;
      });
    });

    return grupos;
  };

  const gruposPorRin = agruparPorRin();
  const rinesOrdenados = Object.keys(gruposPorRin).sort((a, b) => {
    if (a === "Otros") return 1;
    if (b === "Otros") return -1;
    return parseInt(a) - parseInt(b);
  });

  const toggleDimension = (rin) => {
    setDimensionesExpandidas((prev) => ({
      ...prev,
      [rin]: !prev[rin],
    }));
  };

  const totalUnidades = llantasFiltradas.reduce(
    (sum, l) => sum + (l.stock || 0),
    0
  );
  const totalReferencias = llantasFiltradas.length;
  const stockImpares = llantasFiltradas.filter(
    (l) => l.stock > 0 && l.stock % 2 !== 0
  ).length;
  const stockCriticos = llantasFiltradas.filter(
    (l) => l.stock > 0 && l.stock <= 3
  ).length;
  const totalEnPromocion = llantasFiltradas.filter((l) =>
    obtenerPromocion(l.marca, l.referencia)
  ).length;

  const handleOrdenar = (campo) => {
    if (ordenPor === campo) {
      setOrdenAsc(!ordenAsc);
    } else {
      setOrdenPor(campo);
      setOrdenAsc(true);
    }
  };

  // Agregar al carrito
  const agregarAlCarrito = (llanta) => {
    const cantidad = prompt(
      `¿Cuántas unidades de ${llanta.referencia} vas a pedir?`,
      "4"
    );

    if (cantidad && !isNaN(cantidad) && parseInt(cantidad) > 0) {
      const cantidadNum = parseInt(cantidad);

      const existe = carritoPedido.find((item) => item.id === llanta.id);

      if (existe) {
        setCarritoPedido((prev) =>
          prev.map((item) =>
            item.id === llanta.id
              ? { ...item, cantidadPedir: item.cantidadPedir + cantidadNum }
              : item
          )
        );
      } else {
        setCarritoPedido((prev) => [
          ...prev,
          {
            id: llanta.id,
            referencia: llanta.referencia,
            marca: llanta.marca,
            proveedor: llanta.proveedor,
            stockActual: llanta.stock,
            cantidadPedir: cantidadNum,
            esPersonalizada: false,
          },
        ]);
      }

      alert(`✅ ${cantidadNum} unidades agregadas al pedido`);
    }
  };

  // Agregar referencia personalizada
  const agregarReferenciaPersonalizada = () => {
    const referencia = prompt("Ingresa la referencia (ej: 225/45R17):");
    if (!referencia || referencia.trim() === "") return;

    const diseno = prompt("Ingresa el diseño (opcional):");
    const cantidad = prompt("¿Cuántas unidades?", "4");

    if (!cantidad || isNaN(cantidad) || parseInt(cantidad) <= 0) {
      alert("⚠️ Cantidad inválida");
      return;
    }

    // Agregar al carrito con ID temporal negativo
    const nuevoId = -(carritoPedido.length + 1);

    setCarritoPedido((prev) => [
      ...prev,
      {
        id: nuevoId,
        referencia: referencia.trim(),
        diseno: diseno ? diseno.trim() : null,
        marca: marcaSeleccionada,
        proveedor: "Por confirmar",
        stockActual: 0,
        cantidadPedir: parseInt(cantidad),
        esPersonalizada: true,
      },
    ]);

    alert(`✅ Referencia personalizada agregada: ${referencia}`);
  };

  const eliminarDelCarrito = (id) => {
    setCarritoPedido((prev) => prev.filter((item) => item.id !== id));
  };

  const actualizarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      eliminarDelCarrito(id);
    } else {
      setCarritoPedido((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, cantidadPedir: parseInt(nuevaCantidad) }
            : item
        )
      );
    }
  };

  const vaciarCarrito = () => {
    if (window.confirm("¿Vaciar todo el carrito de pedido?")) {
      setCarritoPedido([]);
    }
  };

  const enviarPorWhatsApp = () => {
    if (carritoPedido.length === 0) {
      alert("⚠️ El carrito está vacío");
      return;
    }

    let texto = `📋 *PEDIDO DE LLANTAS*\n`;
    texto += `Marca: *${marcaSeleccionada}*\n`;
    texto += `Fecha: ${new Date().toLocaleDateString("es-CO")}\n`;
    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    carritoPedido.forEach((item, index) => {
      texto += `${index + 1}. *${item.referencia}*\n`;
      if (item.diseno) {
        texto += `   Diseño: ${item.diseno}\n`;
      }
      texto += `   Cantidad: *${item.cantidadPedir} unidades*\n`;

      if (item.esPersonalizada) {
        texto += `   ⚠️ *REFERENCIA NO EN INVENTARIO*\n`;
      } else if (item.proveedor && item.proveedor !== "Por confirmar") {
        texto += `   Proveedor: ${item.proveedor}\n`;
      }

      texto += `\n`;
    });

    const totalUnidadesPedir = carritoPedido.reduce(
      (sum, item) => sum + item.cantidadPedir,
      0
    );

    texto += `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
    texto += `*RESUMEN:*\n`;
    texto += `• Total referencias: ${carritoPedido.length}\n`;
    texto += `• Total unidades a pedir: ${totalUnidadesPedir}`;

    navigator.clipboard.writeText(texto);

    const mensajeEncoded = encodeURIComponent(texto);
    window.open(`https://wa.me/?text=${mensajeEncoded}`, "_blank");

    setTimeout(() => {
      if (window.confirm("Pedido enviado ✅\n¿Deseas vaciar el carrito?")) {
        setCarritoPedido([]);
      }
    }, 500);
  };

  const EncabezadoOrdenable = ({ campo, children }) => (
    <th
      onClick={() => handleOrdenar(campo)}
      className="p-2 text-left text-xs font-bold text-gray-700 cursor-pointer hover:bg-slate-200 transition-colors select-none"
    >
      <div className="flex items-center gap-1">
        {children}
        {ordenPor === campo && (
          <span className="text-slate-600">
            {ordenAsc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </span>
        )}
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <img src="/logowp.PNG" className="h-10 w-auto" alt="Logo" />
              <h1 className="text-xl font-bold text-gray-800">
                📊 Visor de Stock
              </h1>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setMostrarCarrito(!mostrarCarrito)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 shadow-md hover:shadow-lg relative"
              >
                <ShoppingCart size={18} />
                Carrito
                {carritoPedido.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {carritoPedido.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/")}
                className="inline-flex items-center gap-2 bg-slate-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-600 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                ← Volver
              </button>
            </div>
          </div>
        </div>

        {cargando ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
            <p className="text-gray-600 text-base">Cargando inventario...</p>
          </div>
        ) : (
          <>
            {/* Selector de Marca */}
            <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
              <label className="block text-sm font-bold text-gray-800 mb-2">
                🏷️ Seleccionar Marca:
              </label>
              <select
                value={marcaSeleccionada}
                onChange={(e) => {
                  setMarcaSeleccionada(e.target.value);
                  setDimensionesExpandidas({});
                }}
                className="w-full px-4 py-3 text-xl font-bold border-2 border-slate-300 rounded-xl shadow-sm focus:ring-2 focus:ring-slate-500 focus:border-slate-500 outline-none transition-all duration-200"
              >
                <option value="">-- Selecciona una marca --</option>
                {marcasUnicas.map((marca) => (
                  <option key={marca} value={marca}>
                    {marca}
                  </option>
                ))}
              </select>
            </div>

            {/* Estadísticas Compactas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-blue-500">
                <div className="text-2xl font-bold text-blue-600">
                  {totalReferencias}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Referencias
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-green-500">
                <div className="text-2xl font-bold text-green-600">
                  {totalUnidades}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  Unidades
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-yellow-500">
                <div className="text-2xl font-bold text-yellow-600">
                  {stockImpares}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  ⚠️ Impares
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-red-500">
                <div className="text-2xl font-bold text-red-600">
                  {stockCriticos}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  🔴 Críticos
                </div>
              </div>
              <div className="bg-white rounded-lg shadow-md p-3 border-l-4 border-amber-500">
                <div className="text-2xl font-bold text-amber-600">
                  {totalEnPromocion}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  🎉 Promos
                </div>
              </div>
            </div>

            {/* Leyenda */}
            <div className="bg-white rounded-lg shadow-md p-3 mb-4">
              <div className="flex flex-wrap gap-4 items-center text-xs">
                <span className="font-bold text-gray-700">📌 Leyenda:</span>
                <span className="flex items-center gap-1">
                  <span className="text-lg">❌</span>
                  <span className="font-medium text-gray-700">Agotado</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-lg">🔴</span>
                  <span className="font-medium text-gray-700">
                    Crítico (≤3)
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-lg">⚠️</span>
                  <span className="font-medium text-gray-700">Impar</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="text-lg">🎉</span>
                  <span className="font-medium text-gray-700">Promoción</span>
                </span>
              </div>
            </div>

            {/* Grupos por Dimensión */}
            <div className="space-y-3">
              {rinesOrdenados.map((rin) => {
                const llantasGrupo = gruposPorRin[rin];
                const estaExpandido = dimensionesExpandidas[rin];
                const totalGrupo = llantasGrupo.reduce(
                  (sum, l) => sum + (l.stock || 0),
                  0
                );
                const criticosGrupo = llantasGrupo.filter(
                  (l) => l.stock > 0 && l.stock <= 3
                ).length;
                const imparesGrupo = llantasGrupo.filter(
                  (l) => l.stock > 0 && l.stock % 2 !== 0
                ).length;
                const promosGrupo = llantasGrupo.filter((l) =>
                  obtenerPromocion(l.marca, l.referencia)
                ).length;

                return (
                  <div
                    key={rin}
                    className="bg-white rounded-xl shadow-lg overflow-hidden"
                  >
                    {/* Header del grupo */}
                    <div
                      onClick={() => toggleDimension(rin)}
                      className="bg-gradient-to-r from-slate-600 to-slate-700 p-3 cursor-pointer hover:from-slate-700 hover:to-slate-800 transition-all"
                    >
                      <div className="flex justify-between items-center text-white">
                        <div className="flex items-center gap-3">
                          <ChevronRight
                            size={20}
                            className={`transition-transform ${
                              estaExpandido ? "rotate-90" : ""
                            }`}
                          />
                          <span className="text-lg font-bold">
                            Rin {rin}" ({llantasGrupo.length})
                          </span>
                          <span className="text-sm opacity-90">
                            {totalGrupo} unidades
                          </span>
                          {promosGrupo > 0 && (
                            <span className="bg-amber-500 text-amber-900 px-2 py-0.5 rounded-full text-xs font-bold">
                              🎉 {promosGrupo}
                            </span>
                          )}
                          {imparesGrupo > 0 && (
                            <span className="bg-yellow-500 text-yellow-900 px-2 py-0.5 rounded-full text-xs font-bold">
                              ⚠️ {imparesGrupo}
                            </span>
                          )}
                          {criticosGrupo > 0 && (
                            <span className="bg-red-500 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                              🔴 {criticosGrupo}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Tabla del grupo */}
                    {estaExpandido && (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-100 border-b border-slate-200">
                            <tr>
                              <EncabezadoOrdenable campo="referencia">
                                Referencia
                              </EncabezadoOrdenable>
                              <EncabezadoOrdenable campo="proveedor">
                                Proveedor
                              </EncabezadoOrdenable>
                              <EncabezadoOrdenable campo="stock">
                                Stock
                              </EncabezadoOrdenable>
                              <th className="p-2 text-center text-xs font-bold text-gray-700">
                                Acción
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {llantasGrupo.map((llanta, idx) => {
                              const esImpar =
                                llanta.stock > 0 && llanta.stock % 2 !== 0;
                              const esCritico =
                                llanta.stock > 0 && llanta.stock <= 3;
                              const estaAgotado = llanta.stock === 0;
                              const estaEnCarrito = carritoPedido.some(
                                (item) => item.id === llanta.id
                              );
                              const promocion = obtenerPromocion(
                                llanta.marca,
                                llanta.referencia
                              );

                              return (
                                <tr
                                  key={llanta.id}
                                  className={`${
                                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                                  } hover:bg-blue-50 transition-colors ${
                                    estaEnCarrito ? "bg-purple-50" : ""
                                  } ${promocion ? "bg-amber-50" : ""}`}
                                >
                                  <td className="p-2">
                                    <div>
                                      <span className="text-sm font-semibold text-gray-800">
                                        {llanta.referencia}
                                      </span>
                                      {promocion && (
                                        <div className="mt-1">
                                          <span className="inline-flex items-center gap-1 bg-amber-500 text-amber-900 px-2 py-0.5 rounded-full text-xs font-bold">
                                            🎉 PROMO $
                                            {Number(
                                              promocion.precio_promo
                                            ).toLocaleString("es-CO")}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2">
                                    <span className="text-xs text-gray-600">
                                      {llanta.proveedor || "—"}
                                    </span>
                                  </td>
                                  <td className="p-2">
                                    <div className="flex items-center gap-2">
                                      {estaAgotado ? (
                                        <span className="text-xl font-bold text-red-600 flex items-center gap-1">
                                          ❌
                                        </span>
                                      ) : esCritico && esImpar ? (
                                        <span className="text-xl font-bold text-red-600 flex items-center gap-1">
                                          {llanta.stock} 🔴⚠️
                                        </span>
                                      ) : esCritico ? (
                                        <span className="text-xl font-bold text-red-600 flex items-center gap-1">
                                          {llanta.stock} 🔴
                                        </span>
                                      ) : esImpar ? (
                                        <span className="text-xl font-bold text-yellow-600 flex items-center gap-1">
                                          {llanta.stock} ⚠️
                                        </span>
                                      ) : (
                                        <span className="text-xl font-bold text-green-600">
                                          {llanta.stock}
                                        </span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-2 text-center">
                                    <button
                                      onClick={() => agregarAlCarrito(llanta)}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm hover:shadow-md ${
                                        estaEnCarrito
                                          ? "bg-purple-200 text-purple-800 hover:bg-purple-300"
                                          : "bg-blue-500 text-white hover:bg-blue-600"
                                      }`}
                                    >
                                      {estaEnCarrito
                                        ? "✓ Agregado"
                                        : "+ Agregar"}
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Modal del Carrito */}
        {mostrarCarrito && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header del Carrito */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 text-white">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <ShoppingCart size={28} />
                      Carrito de Pedido
                    </h2>
                    <p className="text-sm opacity-90 mt-1">
                      {carritoPedido.length} referencias seleccionadas
                    </p>
                  </div>
                  <button
                    onClick={() => setMostrarCarrito(false)}
                    className="hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Contenido del Carrito */}
              <div className="flex-1 overflow-y-auto p-6">
                {carritoPedido.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingCart
                      size={64}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <p className="text-gray-500 text-lg">
                      El carrito está vacío
                    </p>
                    <p className="text-gray-400 text-sm mt-2">
                      Agrega productos desde la lista o usa el botón de abajo
                      para agregar referencias personalizadas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {carritoPedido.map((item) => (
                      <div
                        key={item.id}
                        className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200 hover:border-purple-300 transition-all"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                              {item.referencia}
                              {item.esPersonalizada && (
                                <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                                  Personalizada
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Marca: {item.marca}
                            </p>
                            {item.diseno && (
                              <p className="text-xs text-blue-600">
                                Diseño: {item.diseno}
                              </p>
                            )}
                            {item.proveedor && (
                              <p className="text-xs text-gray-500">
                                Proveedor: {item.proveedor}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={() => eliminarDelCarrito(item.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full p-2 transition-all"
                            title="Eliminar"
                          >
                            <X size={20} />
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <label className="text-sm font-semibold text-gray-700">
                            Cantidad a pedir:
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={item.cantidadPedir}
                            onChange={(e) =>
                              actualizarCantidad(item.id, e.target.value)
                            }
                            className="w-24 px-3 py-2 border-2 border-gray-300 rounded-lg font-bold text-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
                          />
                          <span className="text-sm text-gray-600">
                            unidades
                          </span>
                        </div>
                      </div>
                    ))}

                    {/* Botón para agregar referencia personalizada */}
                    <button
                      onClick={agregarReferenciaPersonalizada}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">➕</span>
                      Agregar Referencia Personalizada
                    </button>
                  </div>
                )}

                {/* Botón para agregar referencia personalizada cuando está vacío */}
                {carritoPedido.length === 0 && (
                  <button
                    onClick={agregarReferenciaPersonalizada}
                    className="w-full mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">➕</span>
                    Agregar Referencia Personalizada
                  </button>
                )}
              </div>

              {/* Footer del Carrito */}
              {carritoPedido.length > 0 && (
                <div className="border-t-2 border-gray-200 p-6 bg-gray-50">
                  <div className="mb-4">
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>Total referencias:</span>
                      <span>{carritoPedido.length}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-gray-800">
                      <span>Total unidades a pedir:</span>
                      <span>
                        {carritoPedido.reduce(
                          (sum, item) => sum + item.cantidadPedir,
                          0
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={enviarPorWhatsApp}
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl font-bold hover:from-green-700 hover:to-green-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📱</span>
                      Enviar por WhatsApp
                    </button>
                    <button
                      onClick={vaciarCarrito}
                      className="bg-red-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-red-600 transition-all shadow-lg hover:shadow-xl"
                    >
                      🗑️ Vaciar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default VisorStock;
