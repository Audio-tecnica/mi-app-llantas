import React, { useEffect, useState } from "react";
import axios from "axios";
import { Eye, EyeOff, Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ComparadorLlantas from "./ComparadorLlantas";

const ModalResultadoActualizacion = ({ resultado, onCerrar }) => {
  if (!resultado) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-slate-800 p-6 text-white">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">
                📊 Resultado de Actualización
              </h2>
              <p className="text-slate-300 text-sm mt-1">
                Lista de precios Llantar procesada
              </p>
            </div>
            <button
              onClick={onCerrar}
              className="text-white hover:bg-slate-700 rounded-full p-2 text-2xl leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-gray-50 border-b">
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">
              {resultado.actualizadas}
            </div>
            <div className="text-slate-500 text-xs mt-1">✅ Actualizadas</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {resultado.margenBajo}
            </div>
            <div className="text-slate-500 text-xs mt-1">⚠️ Margen Bajo</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">
              {resultado.bloqueadas}
            </div>
            <div className="text-slate-500 text-xs mt-1">🔴 Críticas</div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {resultado.noEncontradas || 0}
            </div>
            <div className="text-slate-500 text-xs mt-1">❌ No Encontradas</div>
          </div>
        </div>

        {/* Detalles */}
        <div
          className="p-4 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 300px)" }}
        >
          {/* Alertas Críticas */}
          {resultado.detalles?.filter((d) => d.estado === "critico").length >
            0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-red-600 mb-3 flex items-center gap-2">
                <span>🔴</span>
                <span>MÁRGENES CRÍTICOS - ¡NO COMPRAR!</span>
              </h3>
              <div className="space-y-2">
                {resultado.detalles
                  .filter((d) => d.estado === "critico")
                  .map((item, i) => (
                    <div
                      key={i}
                      className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-sm">
                            {item.referencia}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {item.marca} {item.medida} {item.diseno}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-red-600">
                            Margen: {item.margen}%
                          </div>
                          <div className="text-xs text-gray-600">
                            ${item.precioNuevo.toLocaleString("es-CO")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Alertas de Margen Bajo */}
          {resultado.detalles?.filter((d) => d.estado === "margen_bajo")
            .length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-yellow-600 mb-3 flex items-center gap-2">
                <span>⚠️</span>
                <span>MÁRGENES BAJOS - Evaluar antes de comprar</span>
              </h3>
              <div className="space-y-2">
                {resultado.detalles
                  .filter((d) => d.estado === "margen_bajo")
                  .map((item, i) => (
                    <div
                      key={i}
                      className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-sm">
                            {item.referencia}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {item.marca} {item.medida} {item.diseno}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-yellow-600">
                            Margen: {item.margen}%
                          </div>
                          <div className="text-xs text-gray-600">
                            ${item.precioNuevo.toLocaleString("es-CO")}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* No Encontradas */}
          {resultado.noEncontradasLista &&
            resultado.noEncontradasLista.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-600 mb-3 flex items-center gap-2">
                  <span>❌</span>
                  <span>No Encontradas en Inventario (primeras 20)</span>
                </h3>
                <div className="space-y-2">
                  {resultado.noEncontradasLista.slice(0, 20).map((item, i) => (
                    <div
                      key={i}
                      className="bg-gray-50 border-l-4 border-gray-400 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-gray-700 text-sm">
                            {item.marca} {item.medida}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {item.diseno}
                          </div>
                        </div>
                        <div className="text-xs text-gray-600">
                          ${item.precio.toLocaleString("es-CO")}
                        </div>
                      </div>
                    </div>
                  ))}
                  {resultado.noEncontradasLista.length > 20 && (
                    <div className="text-center text-xs text-gray-500 mt-2">
                      ... y {resultado.noEncontradasLista.length - 20} más
                    </div>
                  )}
                </div>
              </div>
            )}

          {/* Actualizaciones Exitosas (solo primeras 10) */}
          {resultado.detalles?.filter((d) => d.estado === "actualizada")
            .length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-green-600 mb-3 flex items-center gap-2">
                <span>✅</span>
                <span>Actualizaciones Exitosas (primeras 10)</span>
              </h3>
              <div className="space-y-2">
                {resultado.detalles
                  .filter((d) => d.estado === "actualizada")
                  .slice(0, 10)
                  .map((item, i) => (
                    <div
                      key={i}
                      className="bg-green-50 border-l-4 border-green-500 p-3 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-bold text-gray-800 text-sm">
                            {item.referencia}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            ${item.precioAnterior.toLocaleString("es-CO")} → $
                            {item.precioNuevo.toLocaleString("es-CO")}
                            <span
                              className={`ml-2 ${
                                item.cambio > 0
                                  ? "text-red-600"
                                  : "text-green-600"
                              }`}
                            >
                              ({item.cambio > 0 ? "+" : ""}
                              {item.cambio}%)
                            </span>
                          </div>
                        </div>
                        <div className="text-xs font-semibold text-green-600">
                          Margen: {item.margen}%
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onCerrar}
            className="px-6 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 font-semibold"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================
// COMPONENTE MODAL ALERTA MARGEN
// ============================================
const ModalAlertaMargen = ({ alerta, llanta, onCerrar }) => {
  if (!alerta) return null;

  const {
    tipo,
    costoReal,
    precioEsperado,
    precioPublico,
    margenDisponible,
    porcentajeReal,
  } = alerta;

  const divisor = llanta.marca === "TOYO" ? 1.15 : 1.2;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onCerrar} // ← AGREGAR ESTO
    >
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" // ← AGREGAR max-h y overflow
        onClick={(e) => e.stopPropagation()} // ← AGREGAR ESTO
      >
        {/* Header */}
        <div
          className={`${
            tipo === "critico" ? "bg-red-600" : "bg-yellow-600"
          } text-white px-6 py-4 rounded-t-lg`}
        >
          <h2 className="text-xl font-bold flex items-center gap-2">
            {tipo === "critico" ? "🔴" : "⚠️"}
            ALERTA DE MARGEN {tipo.toUpperCase()}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          {/* Info de la llanta */}
          <div className="bg-gray-50 p-3 rounded">
            <p className="font-bold text-gray-800">
              {llanta.marca} {llanta.referencia}
            </p>
          </div>

          {/* Proveedor */}
          <div className="text-sm">
            <p className="text-gray-600">
              Proveedor:{" "}
              <span className="font-semibold text-gray-800">
                {llanta.proveedor || "N/A"}
              </span>{" "}
              (margen mínimo: costo/{divisor})
            </p>
          </div>

          {/* Cálculos */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tu costo:</span>
              <span className="font-semibold">
                ${costoReal?.toLocaleString("es-CO")}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">
                Precio esperado (costo/{divisor}):
              </span>
              <span className="font-semibold text-blue-600">
                ${Math.round(precioEsperado).toLocaleString("es-CO")}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Precio público Llantar:</span>
              <span className="font-semibold text-green-600">
                ${precioPublico?.toLocaleString("es-CO")}
              </span>
            </div>

            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Margen disponible:</span>
                <span
                  className={`font-bold ${
                    tipo === "critico" ? "text-red-600" : "text-yellow-600"
                  }`}
                >
                  ${margenDisponible?.toLocaleString("es-CO")} (
                  {porcentajeReal?.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Explicación del problema */}
          <div
            className={`p-3 rounded border-l-4 ${
              tipo === "critico"
                ? "bg-red-50 border-red-500"
                : "bg-yellow-50 border-yellow-500"
            }`}
          >
            <p className="font-semibold text-gray-800 mb-2">
              {tipo === "critico" ? "⛔" : "⚠️"} PROBLEMA:
            </p>
            <p className="text-sm text-gray-700">
              El precio público de Llantar ($
              {precioPublico?.toLocaleString("es-CO")}) está{" "}
              <strong>DEMASIADO CERCANO</strong> a tu costo real ($
              {costoReal?.toLocaleString("es-CO")}).
            </p>
            <p className="text-sm text-gray-700 mt-2">
              Tu margen real es solo $
              {margenDisponible?.toLocaleString("es-CO")} (
              {porcentajeReal?.toFixed(1)}%), insuficiente para cubrir gastos
              operativos.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex justify-end rounded-b-lg sticky bottom-0">
          <button
            onClick={onCerrar}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para cada tarjeta de llanta
const TarjetaLlanta = ({
  ll,
  seleccionadas,
  toggleSeleccion,
  mostrarCosto,
  iniciarEdicion,
  guardarComentario,
  handleEliminar,
  handleAgregarComparador,
  modoEdicion,
  actualizarCampo,
  handleGuardar,
  setModoEdicion,
  setLlantaOriginalEdicion,
  API_URL,
  setLlantas,
  setComentarioModal,
}) => {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mostrarAlerta, setMostrarAlerta] = useState(false);
  const [mostrarCostoLocal, setMostrarCostoLocal] = useState(false);

  // Si está en modo edición, mostrar formulario
  if (modoEdicion === ll.id) {
    return (
      <div className="bg-blue-50 rounded-lg shadow-sm border-2 border-blue-300 p-3">
        <div className="text-xs font-bold text-blue-800 mb-3">
          ✏️ Editando: {ll.referencia}
        </div>

        <div className="space-y-2 mb-3">
          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
              Referencia
            </label>
            <input
              value={ll.referencia}
              onChange={(e) =>
                actualizarCampo(ll.id, "referencia", e.target.value)
              }
              className="w-full border-2 border-blue-300 rounded text-xs p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
              Marca
            </label>
            <input
              value={ll.marca}
              onChange={(e) => actualizarCampo(ll.id, "marca", e.target.value)}
              className="w-full border-2 border-blue-300 rounded text-xs p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
              Proveedor
            </label>
            <input
              value={ll.proveedor}
              onChange={(e) =>
                actualizarCampo(ll.id, "proveedor", e.target.value)
              }
              className="w-full border-2 border-blue-300 rounded text-xs p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                Costo
              </label>
              <input
                type="number"
                value={ll.costo_empresa}
                onChange={(e) =>
                  actualizarCampo(ll.id, "costo_empresa", e.target.value)
                }
                className="w-full border-2 border-blue-300 rounded text-xs p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
                Precio
              </label>
              <input
                type="number"
                value={ll.precio_cliente}
                onChange={(e) =>
                  actualizarCampo(ll.id, "precio_cliente", e.target.value)
                }
                className="w-full border-2 border-blue-300 rounded text-xs p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-medium text-gray-600 mb-0.5">
              Stock
            </label>
            <input
              type="number"
              value={ll.stock}
              onChange={(e) => actualizarCampo(ll.id, "stock", e.target.value)}
              className="w-full border-2 border-blue-300 rounded text-xs p-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={ll.consignacion || false}
                onChange={() =>
                  actualizarCampo(ll.id, "consignacion", !ll.consignacion)
                }
                className="cursor-pointer"
              />
              <span className="font-medium text-orange-700">
                Marcar como consignación
              </span>
            </label>
          </div>
        </div>

        {/* Botones de guardar/cancelar */}
        <div className="flex gap-2">
          <button
            onClick={() => handleGuardar(ll)}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-xs rounded font-semibold transition-all"
          >
            💾 Guardar
          </button>
          <button
            onClick={() => {
              setModoEdicion(null);
              setLlantaOriginalEdicion(null);
              axios
                .get(`${API_URL}/api/llantas`)
                .then((res) => setLlantas(res.data));
            }}
            className="flex-1 bg-gray-400 hover:bg-gray-500 text-white px-3 py-2 text-xs rounded font-semibold transition-all"
          >
            ✖ Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Vista normal (no editando)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 relative">
      {/* Header con checkbox y referencia */}
      <div className="flex items-start gap-2 mb-2">
        <input
          type="checkbox"
          checked={seleccionadas.includes(ll.id)}
          onChange={() => toggleSeleccion(ll.id)}
          className="cursor-pointer mt-0.5 flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-slate-800 text-sm leading-tight flex items-center gap-1">
            <span className="truncate">{ll.referencia}</span>
            {ll.comentario && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setComentarioModal(ll);
                }}
                className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0 text-[8px] hover:bg-blue-600 active:bg-blue-700 transition-all"
              >
                💬
              </button>
            )}
          </div>
          <div className="text-xs text-gray-600 truncate font-medium mt-0.5">
            {ll.marca}
          </div>
        </div>
      </div>

      {/* Badges de consignación */}
      {/* Badges de consignación y alerta */}
      <div className="mb-2 flex items-center gap-1 flex-wrap">
        {ll.consignacion && (
          <span className="inline-block bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-medium">
            Consignación
          </span>
        )}
        {ll.alerta_margen && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMostrarAlerta(true);
            }}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
              ll.alerta_margen.tipo === "critico"
                ? "bg-red-100 text-red-700 border border-red-300"
                : "bg-yellow-100 text-yellow-700 border border-yellow-300"
            }`}
          >
            {ll.alerta_margen.tipo === "critico" ? "🔴" : "⚠️"}
            <span>MARGEN</span>
          </button>
        )}
      </div>

      {/* Info grid */}
      {/* Info grid */}
      <div className="space-y-1 text-xs mb-2.5">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Proveedor:</span>
          <span className="font-semibold truncate ml-2 max-w-[55%] text-right text-slate-800">
            {ll.proveedor || "—"}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Stock:</span>
          <span
            className={`font-bold text-sm ${
              ll.stock === 0
                ? "text-red-600"
                : ll.stock % 2 !== 0
                ? "text-orange-600"
                : "text-green-600"
            }`}
          >
            {ll.stock === 0 ? "Sin stock" : ll.stock}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Precio:</span>
          <span className="font-bold text-sm text-green-600">
            ${Number(ll.precio_cliente || 0).toLocaleString("es-CO")}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 font-medium">Costo:</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-blue-600">
              {mostrarCostoLocal
                ? `$${Number(ll.costo_empresa || 0).toLocaleString("es-CO")}`
                : "•••"}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMostrarCostoLocal(!mostrarCostoLocal);
              }}
              className="p-1 hover:bg-gray-100 rounded transition-all"
              title={mostrarCostoLocal ? "Ocultar costo" : "Mostrar costo"}
            >
              {mostrarCostoLocal ? (
                <EyeOff size={14} className="text-gray-600" />
              ) : (
                <Eye size={14} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Botones MUCHO más compactos */}
      <div className="flex gap-1">
        <button
          onClick={() =>
            window.open(
              `https://www.llantar.com.co/search?q=${encodeURIComponent(
                ll.referencia
              )}`,
              "_blank"
            )
          }
          className="bg-blue-500 hover:bg-blue-600 text-white px-1 py-1 rounded transition-all flex items-center justify-center gap-0.5"
          style={{ flex: "0 0 45%" }}
        >
          <span className="text-xs">🔍</span>
          <span className="text-[9px] font-medium">Llantar</span>
        </button>
        <button
          onClick={() => handleAgregarComparador(ll)}
          className="bg-purple-500 hover:bg-purple-600 text-white px-1 py-1 rounded transition-all flex items-center justify-center gap-0.5"
          style={{ flex: "0 0 40%" }}
        >
          <span className="text-xs">⚖️</span>
          <span className="text-[9px] font-medium">Web</span>
        </button>

        {/* Menú de 3 puntos */}
        <div className="relative" style={{ flex: "0 0 auto" }}>
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="bg-slate-200 hover:bg-slate-300 p-1 rounded transition-all flex items-center justify-center"
            style={{ width: "28px", height: "28px" }}
          >
            <span className="text-base font-bold text-slate-700">⋮</span>
          </button>

          {menuAbierto && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuAbierto(false)}
              ></div>

              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden min-w-[140px]">
                <button
                  onClick={() => {
                    iniciarEdicion(ll.id);
                    setMenuAbierto(false);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2"
                >
                  <span>✏️</span>
                  <span className="font-medium">Editar</span>
                </button>
                <button
                  onClick={async () => {
                    setMenuAbierto(false);
                    const texto = prompt("Comentario:", ll.comentario || "");
                    if (texto !== null) {
                      await guardarComentario(ll, texto);
                    }
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 border-t border-gray-100"
                >
                  <span>💬</span>
                  <span className="font-medium">Comentario</span>
                </button>
                <button
                  onClick={() => {
                    setMenuAbierto(false);
                    handleEliminar(ll.id);
                  }}
                  className="w-full px-3 py-2 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2 border-t border-gray-100"
                >
                  <span>🗑️</span>
                  <span className="font-medium">Eliminar</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal de Alerta */}
      {mostrarAlerta && ll.alerta_margen && (
        <ModalAlertaMargen
          alerta={ll.alerta_margen}
          llanta={ll}
          onCerrar={() => setMostrarAlerta(false)}
        />
      )}
    </div>
  );
};

// Orden de prioridad de marcas
const MARCAS_PRIORITARIAS = ["MICKEY THOMPSON", "YOKOHAMA", "TOYO", "NITTO"];

function App() {
  // 🔥 AGREGAR AQUÍ - Función para formatear referencia automáticamente
  const formatearReferencia = (texto) => {
    // Eliminar espacios y caracteres especiales
    const limpio = texto.replace(/[\/\s-]/g, "");

    // Detectar patrones comunes: 2755520, 275 55 20, 275-55-20, etc.
    // Formato esperado: 3 dígitos + 2 dígitos + R + 2 dígitos
    const patron = /^(\d{3})(\d{2})R?(\d{2})$/i;
    const match = limpio.match(patron);

    if (match) {
      // Si coincide con el patrón, formatear como 275/55R20
      return `${match[1]}/${match[2]}R${match[3]}`;
    }

    // Si no coincide, devolver el texto original
    return texto;
  };
  // 🔥 FIN DE LA FUNCIÓN

  const [mostrarCosto, setMostrarCosto] = useState(false);
  const [llantas, setLlantas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [ancho, setAncho] = useState("");
  const [perfil, setPerfil] = useState("");
  const [rin, setRin] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modoEdicion, setModoEdicion] = useState(null);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [comparadorAbierto, setComparadorAbierto] = useState(false);
  const [referenciaSeleccionada, setReferenciaSeleccionada] = useState("");
  const [comentarioModal, setComentarioModal] = useState(null);
  const [nuevoItem, setNuevoItem] = useState({
    referencia: "",
    marca: "",
    proveedor: "",
    costo_empresa: "",
    precio_cliente: "",
    stock: "",
  });
  const [cargando, setCargando] = useState(true);
  const [orden, setOrden] = useState({ campo: "", asc: true });
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [mostrarComparador, setMostrarComparador] = useState(false);
  const [mostrarLogModal, setMostrarLogModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [cargandoLogs, setCargandoLogs] = useState(false);
  const [busquedaLog, setBusquedaLog] = useState("");
  const [filtroTipoLog, setFiltroTipoLog] = useState("");
  const [llantaOriginalEdicion, setLlantaOriginalEdicion] = useState(null);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [resultadoActualizacion, setResultadoActualizacion] = useState(null);

  const navigate = useNavigate();

  const [busquedasRecientes, setBusquedasRecientes] = useState(() => {
    const guardadas = localStorage.getItem("busquedasRecientes");
    return guardadas ? JSON.parse(guardadas) : [];
  });

  useEffect(() => {
    const acceso = localStorage.getItem("acceso");
    const timestamp = localStorage.getItem("timestamp");
    const maxTiempo = 60 * 60 * 1000;

    if (!acceso || !timestamp || Date.now() - parseInt(timestamp) > maxTiempo) {
      localStorage.removeItem("acceso");
      localStorage.removeItem("timestamp");
      window.location.href = "/login";
      return;
    }

    localStorage.setItem("timestamp", Date.now());

    const timer = setTimeout(() => {
      localStorage.removeItem("acceso");
      localStorage.removeItem("timestamp");
      window.location.href = "/login";
    }, maxTiempo);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    axios
      .get("https://mi-app-llantas.onrender.com/api/llantas")
      .then((res) => setLlantas(res.data))
      .catch(() => setMensaje("Error al cargar llantas ❌"))
      .finally(() => setCargando(false));
  }, []);

  const registrarActividad = async (tipo, detalles) => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/log-actividad",
        {
          tipo,
          detalles,
          fecha: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error("Error registrando actividad:", error);
    }
  };

  const abrirLogActividades = () => {
    const password = prompt(
      "Ingrese la contraseña para ver el log de actividades:"
    );

    const PASSWORD_CORRECTA = "Cmd2025";

    if (password === PASSWORD_CORRECTA) {
      cargarLogs();
      setMostrarLogModal(true);
    } else if (password !== null) {
      alert("❌ Contraseña incorrecta");
    }
  };

  const cargarLogs = async () => {
    setCargandoLogs(true);
    try {
      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/logs"
      );
      setLogs(data);
    } catch (error) {
      console.error("Error cargando logs:", error);
      setMensaje("Error al cargar historial ❌");
      setTimeout(() => setMensaje(""), 2000);
    } finally {
      setCargandoLogs(false);
    }
  };

  const abrirComparador = (referencia) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(
      referencia +
        " site:llantar.com.co OR site:virtualllantas.com OR site:tullanta.com"
    )}`;
    window.open(url, "_blank");
  };

  const handleAgregarComparador = (llanta) => {
    abrirComparador(llanta.referencia);
  };

  const marcasUnicas = [...new Set(llantas.map((l) => l.marca))].sort(
    (a, b) => {
      const indexA = MARCAS_PRIORITARIAS.indexOf(a?.toUpperCase());
      const indexB = MARCAS_PRIORITARIAS.indexOf(b?.toUpperCase());

      // Si ambas están en la lista prioritaria, ordenar por índice
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;

      // Si solo A está en la lista, A va primero
      if (indexA !== -1) return -1;

      // Si solo B está en la lista, B va primero
      if (indexB !== -1) return 1;

      // Si ninguna está en la lista, orden alfabético
      return a.localeCompare(b);
    }
  );

  const filtradas = llantas
    .filter((l) => {
      // Si la llanta está en modo edición, siempre mostrarla
      if (modoEdicion === l.id) {
        return true;
      }

      const coincideBusqueda = l.referencia
        ?.toLowerCase()
        .includes(busqueda.toLowerCase());
      const coincideMarca = !marcaSeleccionada || l.marca === marcaSeleccionada;
      const coincideAncho = !ancho || l.referencia.includes(ancho);
      const coincidePerfil = !perfil || l.referencia.includes(perfil);
      const coincideRin = !rin || l.referencia.includes(rin);
      return (
        coincideBusqueda &&
        coincideMarca &&
        coincideAncho &&
        coincidePerfil &&
        coincideRin
      );
    })
    .sort((a, b) => {
      // Ordenar por prioridad de marca
      const indexA = MARCAS_PRIORITARIAS.indexOf(a.marca?.toUpperCase());
      const indexB = MARCAS_PRIORITARIAS.indexOf(b.marca?.toUpperCase());

      // Si ambas están en la lista prioritaria, ordenar por índice
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;

      // Si solo A está en la lista, A va primero
      if (indexA !== -1) return -1;

      // Si solo B está en la lista, B va primero
      if (indexB !== -1) return 1;

      // Si ninguna está en la lista, mantener orden original
      return 0;
    });

  const logsFiltrados = logs.filter((log) => {
    const coincideBusqueda =
      log.detalles?.toLowerCase().includes(busquedaLog.toLowerCase()) ||
      log.tipo?.toLowerCase().includes(busquedaLog.toLowerCase());
    const coincideTipo = !filtroTipoLog || log.tipo === filtroTipoLog;
    return coincideBusqueda && coincideTipo;
  });

  const ordenarPor = (campo) => {
    const asc = orden.campo === campo ? !orden.asc : true;
    const ordenadas = [...filtradas].sort((a, b) => {
      if (typeof a[campo] === "number") {
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

  const actualizarCampo = (id, campo, valor) => {
    setLlantas((prevLlantas) =>
      prevLlantas.map((ll) => {
        if (ll.id === id) {
          // Si se actualiza el costo, calcular nuevo precio automáticamente
          if (campo === "costo_empresa") {
            const costo = parseFloat(valor) || 0;
            const precioCalculado = Math.round(costo / 0.8);
            return {
              ...ll,
              [campo]: valor,
              precio_cliente: precioCalculado,
            };
          }
          return { ...ll, [campo]: valor };
        }
        return ll;
      })
    );
  };

  const guardarComentario = async (llanta, texto) => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-llanta",
        {
          ...llanta,
          comentario: texto,
        }
      );

      await registrarActividad(
        "COMENTARIO",
        `${llanta.referencia}: ${
          texto ? "Comentario agregado/editado" : "Comentario eliminado"
        }`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
      setLlantas(data);
      setComentarioModal(null);
      setMensaje("Comentario guardado ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("Error guardando comentario:", error);
      setMensaje("Error al guardar comentario ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const toggleSeleccion = (id) => {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEliminarMultiples = async () => {
    if (!window.confirm("¿Eliminar los ítems seleccionados?")) return;
    try {
      const referencias = llantas
        .filter((l) => seleccionadas.includes(l.id))
        .map((l) => l.referencia)
        .join(", ");

      for (let id of seleccionadas) {
        await axios.post(
          "https://mi-app-llantas.onrender.com/api/eliminar-llanta",
          { id }
        );
      }

      await registrarActividad(
        "ELIMINACIÓN MÚLTIPLE",
        `Se eliminaron ${seleccionadas.length} llantas: ${referencias}`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
      setLlantas(data);
      setSeleccionadas([]);
      setMensaje("Ítems eliminados ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const iniciarEdicion = (id) => {
    const llanta = llantas.find((l) => l.id === id);
    if (llanta) {
      setLlantaOriginalEdicion(JSON.parse(JSON.stringify(llanta)));
      setModoEdicion(id);
    }
  };

  const handleGuardar = async (llanta) => {
    try {
      if (!llantaOriginalEdicion) {
        setMensaje("Error: No se encontró la llanta original ❌");
        return;
      }

      const cambios = [];

      if (
        String(llantaOriginalEdicion.referencia) !== String(llanta.referencia)
      ) {
        cambios.push(
          `Referencia: ${llantaOriginalEdicion.referencia} → ${llanta.referencia}`
        );
      }

      if (String(llantaOriginalEdicion.marca) !== String(llanta.marca)) {
        cambios.push(`Marca: ${llantaOriginalEdicion.marca} → ${llanta.marca}`);
      }

      if (
        String(llantaOriginalEdicion.proveedor) !== String(llanta.proveedor)
      ) {
        cambios.push(
          `Proveedor: ${llantaOriginalEdicion.proveedor} → ${llanta.proveedor}`
        );
      }

      if (
        Number(llantaOriginalEdicion.costo_empresa) !==
        Number(llanta.costo_empresa)
      ) {
        cambios.push(
          `Costo: ${llantaOriginalEdicion.costo_empresa} → ${llanta.costo_empresa}`
        );
      }

      if (
        Number(llantaOriginalEdicion.precio_cliente) !==
        Number(llanta.precio_cliente)
      ) {
        cambios.push(
          `Precio: ${llantaOriginalEdicion.precio_cliente} → ${llanta.precio_cliente}`
        );
      }

      if (Number(llantaOriginalEdicion.stock) !== Number(llanta.stock)) {
        cambios.push(`Stock: ${llantaOriginalEdicion.stock} → ${llanta.stock}`);
      }

      if (!!llantaOriginalEdicion.consignacion !== !!llanta.consignacion) {
        cambios.push(
          `Consignación: ${
            llantaOriginalEdicion.consignacion ? "Sí" : "No"
          } → ${llanta.consignacion ? "Sí" : "No"}`
        );
      }

      await axios.post(
        "https://mi-app-llantas.onrender.com/api/editar-llanta",
        llanta
      );

      if (cambios.length > 0) {
        await registrarActividad(
          "EDICIÓN",
          `Llanta ${llanta.referencia}: ${cambios.join(", ")}`
        );
      }

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
      setLlantas(data);

      setMensaje("Cambios guardados ✅");
      setModoEdicion(null);
      setLlantaOriginalEdicion(null);
      setTimeout(() => setMensaje(""), 2000);
    } catch (error) {
      console.error("❌ ERROR:", error);
      setMensaje("Error al guardar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleAgregar = async () => {
    try {
      await axios.post(
        "https://mi-app-llantas.onrender.com/api/agregar-llanta",
        nuevoItem
      );

      await registrarActividad(
        "NUEVA LLANTA",
        `Se agregó: ${nuevoItem.referencia} - ${nuevoItem.marca} (Stock: ${nuevoItem.stock})`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
      setLlantas(data);
      setMostrarModal(false);
      setNuevoItem({
        referencia: "",
        marca: "",
        proveedor: "",
        costo_empresa: "",
        precio_cliente: "",
        stock: "",
      });
      setMensaje("Llanta agregada ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al agregar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  const handleEliminar = async (id) => {
    if (!window.confirm("¿Eliminar esta llanta?")) return;
    try {
      const llanta = llantas.find((l) => l.id === id);

      await axios.post(
        "https://mi-app-llantas.onrender.com/api/eliminar-llanta",
        { id }
      );

      await registrarActividad(
        "ELIMINACIÓN",
        `Se eliminó: ${llanta.referencia} - ${llanta.marca}`
      );

      const { data } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );
      setLlantas(data);
      setMensaje("Llanta eliminada ✅");
      setTimeout(() => setMensaje(""), 2000);
    } catch {
      setMensaje("Error al eliminar ❌");
      setTimeout(() => setMensaje(""), 2000);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen bg-slate-800 text-white transition-all duration-300 z-50 ${
          menuAbierto ? "w-64" : "w-0 lg:w-64"
        } overflow-hidden`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <img src="/logowp.PNG" className="h-16 w-auto" alt="Logo" />
            <button
              onClick={() => setMenuAbierto(false)}
              className="lg:hidden text-white hover:bg-slate-700 p-2 rounded"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Principal
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all text-sm"
            >
              <span>🏠</span>
              <span>Llantas</span>
            </button>

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3 mt-6">
              Categorías
            </div>

            <button
              onClick={() => navigate("/tapetes")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🚗</span>
              <span>Tapetes</span>
            </button>

            <button
              onClick={() => navigate("/rines")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>⚙️</span>
              <span>Rines</span>
            </button>

            <button
              onClick={() => navigate("/carpas")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🏕️</span>
              <span>Carpas</span>
            </button>

            <button
              onClick={() => navigate("/tiros-arrastre")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🔗</span>
              <span>Tiros</span>
            </button>

            <button
              onClick={() => navigate("/sonido")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>🔊</span>
              <span>Sonido</span>
            </button>

            <button
              onClick={() => navigate("/luces")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
            >
              <span>💡</span>
              <span>Luces</span>
            </button>

            <div className="border-t border-slate-700 my-4"></div>

            <button
              onClick={() => {
                localStorage.removeItem("acceso");
                window.location.href = "/login";
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-600 transition-all text-sm"
            >
              <span>🚪</span>
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Overlay para móvil */}
      {menuAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMenuAbierto(false)}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-4 py-3 sticky top-0 z-30">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setMenuAbierto(true)}
              className="lg:hidden text-slate-800 hover:bg-slate-100 p-2 rounded"
            >
              <Menu size={24} />
            </button>

            <h1 className="text-lg font-bold text-slate-800">
              Inventario de Llantas
            </h1>

            <div className="text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {filtradas.length}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-4">
          {/* Mensajes */}
          {mensaje && (
            <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-800 p-3 rounded-lg mb-4">
              <span className="text-sm font-medium">{mensaje}</span>
            </div>
          )}

          {cargando ? (
            <div className="bg-white rounded-xl shadow p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-slate-700 mb-4"></div>
              <p className="text-gray-600">Cargando inventario...</p>
            </div>
          ) : (
            <>
              {/* Dashboard Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {filtradas.length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Total Llantas
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {seleccionadas.length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Seleccionadas
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {filtradas.filter((l) => l.stock === 0).length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Sin Stock</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="text-2xl font-bold text-slate-700">
                    {marcasUnicas.length}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">Marcas</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 mb-4">
                <button
                  onClick={() => setMostrarModal(true)}
                  className="flex items-center justify-center gap-1 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-all text-xs"
                >
                  <span>+</span>
                  <span>Agregar</span>
                </button>

                <button
                  onClick={handleEliminarMultiples}
                  disabled={seleccionadas.length === 0}
                  className="flex items-center justify-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-xs"
                >
                  <span>🗑️</span>
                  <span>Eliminar</span>
                </button>

                <button
                  onClick={abrirLogActividades}
                  className="flex items-center justify-center gap-1 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-all text-xs"
                >
                  <span>📋</span>
                  <span>Update</span>
                </button>

                <div className="relative">
                  <input
                    type="file"
                    id="lista-llantar-input"
                    accept=".xlsx,.xls"
                    onChange={async (e) => {
                      const archivo = e.target.files[0];
                      if (!archivo) return;

                      try {
                        setMensaje("⏳ Procesando lista de Llantar...");

                        const formData = new FormData();
                        formData.append("excel", archivo);

                        const response = await axios.post(
                          "https://mi-app-llantas.onrender.com/api/procesar-excel-llantar",
                          formData,
                          {
                            headers: {
                              "Content-Type": "multipart/form-data",
                            },
                          }
                        );

                        const resultado = response.data;

                        // ✅ MOSTRAR MODAL CON RESULTADOS
                        setResultadoActualizacion(resultado);

                        setMensaje(
                          `✅ Procesado: ${resultado.actualizadas} actualizadas, ${resultado.margenBajo} con margen bajo, ${resultado.bloqueadas} críticas`
                        );

                        // Recargar llantas
                        const { data } = await axios.get(
                          "https://mi-app-llantas.onrender.com/api/llantas"
                        );
                        setLlantas(data);

                        e.target.value = "";
                        setTimeout(() => setMensaje(""), 4000);
                      } catch (error) {
                        console.error("Error:", error);
                        setMensaje("❌ Error al procesar la lista");
                        setTimeout(() => setMensaje(""), 3000);
                      }
                    }}
                    className="hidden"
                  />
                  <label
                    htmlFor="lista-llantar-input"
                    className="flex items-center justify-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-all text-xs cursor-pointer"
                  >
                    <span>📄</span>
                    <span>Lista</span>
                  </label>
                </div>

                <button
                  onClick={() => setMostrarComparador(true)}
                  className="flex items-center justify-center gap-1 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-all text-xs"
                >
                  <span>📊</span>
                  <span>Comparar</span>
                </button>

                <button
                  onClick={() => navigate("/visor-stock")}
                  className="flex items-center justify-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-all text-xs"
                >
                  <span>📈</span>
                  <span>Pedido llantas</span>
                </button>

                <button
                  onClick={() => navigate("/promociones")}
                  className="flex items-center justify-center gap-1 bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-all text-xs"
                >
                  <span>🎉</span>
                  <span>Promos</span>
                </button>

                <button
                  onClick={() => {
                    setBusqueda("");
                    setMarcaSeleccionada("");
                  }}
                  className="flex items-center justify-center gap-1 bg-slate-600 text-white px-3 py-2 rounded-lg hover:bg-slate-700 transition-all text-xs"
                >
                  <span>🔄</span>
                  <span>Limpiar</span>
                </button>
              </div>

              {/* Panel de búsqueda con fondo azul */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-4 mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-1">
                      🔍 Referencia
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar..."
                      value={busqueda}
                      onChange={(e) => {
                        const valor = e.target.value;
                        const formateado = formatearReferencia(valor);

                        // Si el formateo cambió el valor Y es un patrón válido completo, aplicarlo
                        // Solo formatear si tiene al menos 7 caracteres (2755520)
                        if (
                          formateado !== valor &&
                          valor.replace(/[\/\s-]/g, "").length >= 7
                        ) {
                          setBusqueda(formateado);
                        } else {
                          setBusqueda(valor);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && busqueda.trim() !== "") {
                          // Formatear antes de guardar en búsquedas recientes
                          const formateado = formatearReferencia(busqueda);
                          setBusqueda(formateado);
                          let nuevas = [
                            busqueda,
                            ...busquedasRecientes.filter((v) => v !== busqueda),
                          ];
                          if (nuevas.length > 5) nuevas = nuevas.slice(0, 5);
                          setBusquedasRecientes(nuevas);
                          localStorage.setItem(
                            "busquedasRecientes",
                            JSON.stringify(nuevas)
                          );
                        }
                      }}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-blue-900 mb-1">
                      🏷️ Marca
                    </label>
                    <select
                      value={marcaSeleccionada}
                      onChange={(e) => setMarcaSeleccionada(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white shadow-sm"
                    >
                      <option value="">Todas</option>
                      {marcasUnicas.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Búsquedas recientes */}
                {busquedasRecientes.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <span className="text-xs font-semibold text-blue-800 mb-2 block flex items-center gap-1">
                      🕒 Búsquedas recientes:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {busquedasRecientes.map((b, i) => (
                        <button
                          key={i}
                          onClick={() => setBusqueda(b)}
                          className="px-3 py-1.5 bg-white border border-blue-300 text-blue-700 rounded-full text-xs font-medium hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm transition-all"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Vista móvil - tarjetas 2x2 con menú de opciones */}
              <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
                {filtradas.map((ll) => (
                  <TarjetaLlanta
                    key={ll.id}
                    ll={ll}
                    seleccionadas={seleccionadas}
                    toggleSeleccion={toggleSeleccion}
                    mostrarCosto={mostrarCosto}
                    iniciarEdicion={iniciarEdicion}
                    guardarComentario={guardarComentario}
                    handleEliminar={handleEliminar}
                    handleAgregarComparador={handleAgregarComparador}
                    modoEdicion={modoEdicion}
                    actualizarCampo={actualizarCampo}
                    handleGuardar={handleGuardar}
                    setModoEdicion={setModoEdicion}
                    setLlantaOriginalEdicion={setLlantaOriginalEdicion}
                    API_URL="https://mi-app-llantas.onrender.com"
                    setLlantas={setLlantas}
                    setComentarioModal={setComentarioModal}
                  />
                ))}
              </div>

              {/* Vista desktop - tabla */}
              <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-700 text-white">
                      <tr>
                        <th className="p-2 text-left">
                          <input
                            type="checkbox"
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSeleccionadas(filtradas.map((l) => l.id));
                              } else {
                                setSeleccionadas([]);
                              }
                            }}
                            checked={
                              seleccionadas.length === filtradas.length &&
                              filtradas.length > 0
                            }
                            className="cursor-pointer"
                          />
                        </th>
                        <th
                          onClick={() => ordenarPor("referencia")}
                          className="cursor-pointer p-2 text-left hover:bg-slate-600"
                        >
                          Referencia
                        </th>
                        <th className="p-2 text-center">Búsqueda</th>
                        <th
                          onClick={() => ordenarPor("marca")}
                          className="cursor-pointer p-2 text-left hover:bg-slate-600"
                        >
                          Marca
                        </th>
                        <th
                          onClick={() => ordenarPor("proveedor")}
                          className="cursor-pointer p-2 text-left hover:bg-slate-600"
                        >
                          Proveedor
                        </th>
                        <th
                          onClick={() => ordenarPor("costo_empresa")}
                          className="cursor-pointer p-2 text-right hover:bg-slate-600"
                        >
                          <div className="flex items-center justify-end gap-2">
                            Costo
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMostrarCosto(!mostrarCosto);
                              }}
                              className="hover:bg-slate-600 p-1 rounded"
                            >
                              {mostrarCosto ? (
                                <EyeOff size={14} />
                              ) : (
                                <Eye size={14} />
                              )}
                            </button>
                          </div>
                        </th>
                        <th
                          onClick={() => ordenarPor("precio_cliente")}
                          className="cursor-pointer p-2 text-right hover:bg-slate-600"
                        >
                          Precio
                        </th>
                        <th
                          onClick={() => ordenarPor("stock")}
                          className="cursor-pointer p-2 text-center hover:bg-slate-600"
                        >
                          Stock
                        </th>
                        <th className="p-2 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filtradas.map((ll, idx) => (
                        <tr
                          key={ll.id}
                          className={`${
                            idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50`}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={seleccionadas.includes(ll.id)}
                              onChange={() => toggleSeleccion(ll.id)}
                              className="cursor-pointer"
                            />
                          </td>
                          {modoEdicion === ll.id ? (
                            <>
                              <td className="p-2">
                                <input
                                  value={ll.referencia}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "referencia",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() =>
                                    window.open(
                                      `https://www.llantar.com.co/search?q=${encodeURIComponent(
                                        ll.referencia
                                      )}`,
                                      "_blank"
                                    )
                                  }
                                  className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                                >
                                  Llantar
                                </button>
                              </td>
                              <td className="p-2">
                                <input
                                  value={ll.marca}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "marca",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  value={ll.proveedor}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "proveedor",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={ll.costo_empresa}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "costo_empresa",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={ll.precio_cliente}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "precio_cliente",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <input
                                  type="number"
                                  value={ll.stock}
                                  onChange={(e) =>
                                    actualizarCampo(
                                      ll.id,
                                      "stock",
                                      e.target.value
                                    )
                                  }
                                  className="w-full border-2 border-blue-300 rounded text-sm p-1"
                                />
                              </td>
                              <td className="p-2">
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() =>
                                      actualizarCampo(
                                        ll.id,
                                        "consignacion",
                                        !ll.consignacion
                                      )
                                    }
                                    className={`px-2 py-1 text-xs rounded ${
                                      ll.consignacion
                                        ? "bg-red-500 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                                  >
                                    {ll.consignacion ? "✓ Consig." : "Marcar"}
                                  </button>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleGuardar(ll)}
                                      className="bg-green-500 text-white px-2 py-1 text-xs rounded hover:bg-green-600"
                                    >
                                      💾
                                    </button>
                                    <button
                                      onClick={() => {
                                        setModoEdicion(null);
                                        setLlantaOriginalEdicion(null);
                                        axios
                                          .get(
                                            "https://mi-app-llantas.onrender.com/api/llantas"
                                          )
                                          .then((res) => setLlantas(res.data));
                                      }}
                                      className="bg-gray-400 text-white px-2 py-1 text-xs rounded hover:bg-gray-500"
                                    >
                                      ✖
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold">
                                    {ll.referencia}
                                  </span>
                                  {ll.comentario && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setComentarioModal(ll);
                                      }}
                                      className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0 text-[8px] hover:bg-blue-600"
                                    >
                                      💬
                                    </button>
                                  )}
                                  {ll.consignacion && (
                                    <span className="w-5 h-5 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                      C
                                    </span>
                                  )}
                                  {/* ✅ NUEVO: Badge de alerta de margen */}
                                  {ll.alerta_margen && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Abrir modal con la alerta
                                        const ModalAlertaMargen = ({
                                          alerta,
                                          llanta,
                                          onCerrar,
                                        }) => {
                                          // ... el mismo componente que ya tienes
                                        };
                                        // Por ahora, mostrar un alert simple
                                        alert(
                                          `⚠️ ALERTA DE MARGEN ${ll.alerta_margen.tipo.toUpperCase()}\n\n` +
                                            `Costo: $${ll.alerta_margen.costoReal?.toLocaleString(
                                              "es-CO"
                                            )}\n` +
                                            `Precio público: $${ll.alerta_margen.precioPublico?.toLocaleString(
                                              "es-CO"
                                            )}\n` +
                                            `Margen disponible: ${ll.alerta_margen.porcentajeReal}%\n\n` +
                                            (ll.alerta_margen.tipo === "critico"
                                              ? "🔴 ALERTA"
                                              : "⚠️ ALERTA")
                                        );
                                      }}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                        ll.alerta_margen.tipo === "critico"
                                          ? "bg-red-100 text-red-700 border border-red-300"
                                          : "bg-yellow-100 text-yellow-700 border border-yellow-300"
                                      }`}
                                    >
                                      {ll.alerta_margen.tipo === "critico"
                                        ? "🔴"
                                        : "⚠️"}
                                    </button>
                                  )}
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `https://www.llantar.com.co/search?q=${encodeURIComponent(
                                          ll.referencia
                                        )}`,
                                        "_blank"
                                      )
                                    }
                                    className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                                  >
                                    Llantar
                                  </button>
                                  <button
                                    onClick={() =>
                                      abrirComparador(ll.referencia)
                                    }
                                    className="bg-purple-600 text-white px-2 py-1 rounded text-xs hover:bg-purple-700"
                                  >
                                    Web
                                  </button>
                                </div>
                              </td>
                              <td className="p-2">{ll.marca}</td>
                              <td className="p-2">{ll.proveedor}</td>
                              <td className="p-2 text-right text-blue-600 font-semibold">
                                {mostrarCosto
                                  ? `$${(
                                      ll.costo_empresa || 0
                                    ).toLocaleString()}`
                                  : "•••"}
                              </td>
                              <td className="p-2 text-right text-green-600 font-semibold">
                                ${ll.precio_cliente.toLocaleString()}
                              </td>
                              <td
                                className={`p-2 text-center font-semibold ${
                                  ll.stock === 0
                                    ? "text-red-600"
                                    : "text-gray-700"
                                }`}
                              >
                                {ll.stock === 0 ? "❌" : ll.stock}
                              </td>
                              <td className="p-2">
                                <div className="flex gap-1 justify-center">
                                  <button
                                    onClick={() => iniciarEdicion(ll.id)}
                                    className="bg-slate-100 hover:bg-slate-200 px-2 py-1 text-xs rounded"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const texto = prompt(
                                        "Comentario:",
                                        ll.comentario || ""
                                      );
                                      if (texto !== null) {
                                        await guardarComentario(ll, texto);
                                      }
                                    }}
                                    className="bg-yellow-100 hover:bg-yellow-200 px-2 py-1 text-xs rounded"
                                  >
                                    💬
                                  </button>
                                  <button
                                    onClick={() => handleEliminar(ll.id)}
                                    className="bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 text-xs rounded"
                                  >
                                    🗑️
                                  </button>
                                </div>
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
        </main>
      </div>

      {/* Modal Agregar CON CÁLCULO AUTOMÁTICO */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              ➕ Agregar Nueva Llanta
            </h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Referencia
                </label>
                <input
                  placeholder="Ingrese referencia"
                  value={nuevoItem.referencia}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      referencia: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Marca
                </label>
                <input
                  placeholder="Ingrese marca"
                  value={nuevoItem.marca}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      marca: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <input
                  placeholder="Ingrese proveedor"
                  value={nuevoItem.proveedor}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      proveedor: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Costo Empresa
                </label>
                <input
                  type="number"
                  placeholder="Ingrese costo empresa"
                  value={nuevoItem.costo_empresa}
                  onChange={(e) => {
                    const costo = parseFloat(e.target.value) || 0;
                    const precioCalculado = Math.round(costo / 0.8);
                    setNuevoItem({
                      ...nuevoItem,
                      costo_empresa: e.target.value,
                      precio_cliente: precioCalculado.toString(),
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Precio Cliente
                  <span className="text-xs text-gray-500 ml-1">(editable)</span>
                </label>
                <input
                  type="number"
                  placeholder="Ingrese precio cliente"
                  value={nuevoItem.precio_cliente}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      precio_cliente: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
                {nuevoItem.costo_empresa && (
                  <p className="text-xs text-green-600 mt-1">
                    💡 Sugerido: $
                    {Math.round(
                      parseFloat(nuevoItem.costo_empresa) / 0.8
                    ).toLocaleString("es-CO")}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Stock
                </label>
                <input
                  type="number"
                  placeholder="Ingrese stock"
                  value={nuevoItem.stock}
                  onChange={(e) =>
                    setNuevoItem({
                      ...nuevoItem,
                      stock: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAgregar}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                Guardar
              </button>
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 bg-gray-400 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-500"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Comentario */}
      {comentarioModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
          onClick={() => setComentarioModal(null)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  💬 Comentario
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Ref: {comentarioModal.referencia}
                </p>
              </div>
              <button
                onClick={() => setComentarioModal(null)}
                className="text-gray-400 hover:text-gray-600 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-gray-800 whitespace-pre-wrap text-sm">
                {comentarioModal.comentario}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={async () => {
                  const nuevoTexto = prompt(
                    "Editar comentario:",
                    comentarioModal.comentario
                  );
                  if (nuevoTexto !== null) {
                    await guardarComentario(comentarioModal, nuevoTexto);
                  }
                }}
                className="flex-1 bg-yellow-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-yellow-600"
              >
                Editar
              </button>
              <button
                onClick={() => setComentarioModal(null)}
                className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-600"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Log */}
      {mostrarLogModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
          onClick={() => setMostrarLogModal(false)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-800 p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold">📋 Historial</h2>
                  <p className="text-slate-300 text-sm mt-1">
                    Registro de cambios
                  </p>
                </div>
                <button
                  onClick={() => setMostrarLogModal(false)}
                  className="text-white hover:bg-slate-700 rounded-full p-2 text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-b">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="🔍 Buscar..."
                  value={busquedaLog}
                  onChange={(e) => setBusquedaLog(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                />
                <select
                  value={filtroTipoLog}
                  onChange={(e) => setFiltroTipoLog(e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 outline-none"
                >
                  <option value="">Todos</option>
                  <option value="NUEVA LLANTA">Nueva</option>
                  <option value="EDICIÓN">Edición</option>
                  <option value="ELIMINACIÓN">Eliminación</option>
                  <option value="COMENTARIO">Comentario</option>
                </select>
              </div>
            </div>

            <div
              className="p-4 overflow-y-auto"
              style={{ maxHeight: "calc(90vh - 200px)" }}
            >
              {cargandoLogs ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-slate-700 mb-2"></div>
                  <p className="text-gray-600 text-sm">Cargando...</p>
                </div>
              ) : logsFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-5xl mb-3">📭</div>
                  <p className="font-semibold">No hay registros</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {logsFiltrados.map((log, index) => {
                    const fecha = new Date(log.fecha);
                    let colorClase = "bg-blue-50 border-blue-300";
                    let iconoTipo = "📝";

                    if (log.tipo === "NUEVA LLANTA") {
                      colorClase = "bg-green-50 border-green-300";
                      iconoTipo = "➕";
                    } else if (
                      log.tipo === "ELIMINACIÓN" ||
                      log.tipo === "ELIMINACIÓN MÚLTIPLE"
                    ) {
                      colorClase = "bg-red-50 border-red-300";
                      iconoTipo = "🗑️";
                    } else if (log.tipo === "EDICIÓN") {
                      colorClase = "bg-yellow-50 border-yellow-300";
                      iconoTipo = "✏️";
                    } else if (log.tipo === "COMENTARIO") {
                      colorClase = "bg-purple-50 border-purple-300";
                      iconoTipo = "💬";
                    }

                    return (
                      <div
                        key={log.id || index}
                        className={`${colorClase} border-l-4 p-3 rounded-lg text-sm`}
                      >
                        <div className="flex justify-between items-start gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{iconoTipo}</span>
                              <span className="font-bold text-gray-800 text-xs">
                                {log.tipo}
                              </span>
                            </div>
                            <p className="text-gray-700 text-xs leading-relaxed">
                              {log.detalles}
                            </p>
                          </div>
                          <div className="text-right text-xs text-gray-500 bg-white px-2 py-1 rounded">
                            <div className="font-semibold whitespace-nowrap">
                              {fecha.toLocaleDateString("es-CO", {
                                day: "2-digit",
                                month: "short",
                              })}
                            </div>
                            <div className="whitespace-nowrap">
                              {fecha.toLocaleTimeString("es-CO", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparador */}
      {mostrarComparador && (
        <ComparadorLlantas
          llantas={llantas}
          onClose={() => setMostrarComparador(false)}
        />
      )}
      {/* Modal Resultado Actualización */}
      {resultadoActualizacion && (
        <ModalResultadoActualizacion
          resultado={resultadoActualizacion}
          onCerrar={() => setResultadoActualizacion(null)}
        />
      )}
    </div>
  );
}

export default App;
