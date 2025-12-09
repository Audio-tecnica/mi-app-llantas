import React, { useState, useMemo } from "react";

// Función para parsear la referencia de llanta (ej: "215/65R16", "225/65 R16", "215-65-16")
const parsearMedida = (referencia) => {
  if (!referencia) return null;
  
  // Limpiar la referencia
  const ref = referencia.toUpperCase().replace(/\s+/g, '');
  
  // Patrones comunes: 215/65R16, 215-65-16, 215/65/16, 2156516
  const patrones = [
    /(\d{3})[\/\-](\d{2,3})[R\/\-]?(\d{2})/i,  // 215/65R16 o 215-65-16
    /(\d{3})(\d{2})R?(\d{2})/i,                 // 2156516
  ];
  
  for (const patron of patrones) {
    const match = ref.match(patron);
    if (match) {
      return {
        ancho: parseInt(match[1]),      // Ancho en mm (ej: 215)
        perfil: parseInt(match[2]),     // Perfil/Aspecto (ej: 65)
        rin: parseInt(match[3]),        // Diámetro del rin en pulgadas (ej: 16)
      };
    }
  }
  return null;
};

// Función para calcular las especificaciones de la llanta
const calcularEspecificaciones = (medida) => {
  if (!medida) return null;
  
  const { ancho, perfil, rin } = medida;
  
  // Altura del sidewall (costado) en mm
  const alturaLateral = (ancho * perfil) / 100;
  
  // Diámetro total en mm = (altura lateral * 2) + (diámetro rin en mm)
  const diametroRinMM = rin * 25.4;
  const diametroTotalMM = (alturaLateral * 2) + diametroRinMM;
  
  // Convertir a pulgadas
  const diametroTotalPulgadas = diametroTotalMM / 25.4;
  const anchoPulgadas = ancho / 25.4;
  const alturaLateralPulgadas = alturaLateral / 25.4;
  
  // Circunferencia en mm y pulgadas
  const circunferenciaMM = diametroTotalMM * Math.PI;
  const circunferenciaPulgadas = diametroTotalPulgadas * Math.PI;
  
  // Revoluciones por milla (1 milla = 1,609,344 mm)
  const revsPorMilla = 1609344 / circunferenciaMM;
  
  // Revoluciones por kilómetro
  const revsPorKm = 1000000 / circunferenciaMM;
  
  return {
    ancho: ancho,
    perfil: perfil,
    rin: rin,
    diametroTotal: {
      mm: diametroTotalMM,
      pulgadas: diametroTotalPulgadas
    },
    anchoTotal: {
      mm: ancho,
      pulgadas: anchoPulgadas
    },
    alturaLateral: {
      mm: alturaLateral,
      pulgadas: alturaLateralPulgadas
    },
    circunferencia: {
      mm: circunferenciaMM,
      pulgadas: circunferenciaPulgadas
    },
    revsPorMilla: revsPorMilla,
    revsPorKm: revsPorKm
  };
};

// Función para calcular diferencia porcentual
const calcularDiferencia = (valor1, valor2) => {
  if (!valor1 || !valor2) return 0;
  return ((valor2 - valor1) / valor1) * 100;
};

// Componente visual de la llanta - VERSIÓN REALISTA
const LlantaVisual = ({ specs, numero, color, escala = 1, esComparacion = false, diferencias = null, specs1 = null }) => {
  if (!specs) return null;
  
  const baseSize = 160;
  const size = baseSize * escala;
  const rinSize = (specs.rin / specs.diametroTotal.pulgadas) * size;
  const sidewallSize = (size - rinSize) / 2;
  
  // Colores según el número
  const colorPrimario = numero === 1 ? "#f59e0b" : "#3b82f6";
  const colorSecundario = numero === 1 ? "#d97706" : "#2563eb";
  
  return (
    <div className="flex flex-col items-center">
      {/* Etiqueta de medida arriba */}
      <div className={`mb-2 px-3 py-1 rounded-full text-white text-sm font-bold ${numero === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}>
        {specs.ancho}/{specs.perfil}R{specs.rin}
      </div>
      
      <div className="relative">
        {/* Llanta exterior */}
        <div 
          className="relative rounded-full flex items-center justify-center shadow-2xl"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: `
              radial-gradient(circle at 30% 30%, #4a4a4a 0%, #1a1a1a 50%, #0a0a0a 100%)
            `,
            boxShadow: `
              0 0 0 3px ${colorPrimario},
              inset 0 0 20px rgba(0,0,0,0.8),
              0 10px 30px rgba(0,0,0,0.5)
            `
          }}
        >
          {/* Patrón de la banda de rodamiento */}
          <div 
            className="absolute rounded-full"
            style={{
              width: `${size - 8}px`,
              height: `${size - 8}px`,
              background: `
                repeating-conic-gradient(
                  from 0deg,
                  #2d2d2d 0deg 5deg,
                  #1a1a1a 5deg 10deg
                )
              `,
              opacity: 0.6
            }}
          />
          
          {/* Líneas del dibujo de la llanta */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute bg-gray-800"
              style={{
                width: '3px',
                height: `${sidewallSize - 5}px`,
                transformOrigin: 'center bottom',
                transform: `rotate(${i * 30}deg) translateY(-${rinSize/2 + sidewallSize/2}px)`,
                borderRadius: '2px'
              }}
            />
          ))}
          
          {/* Rin interior */}
          <div 
            className="rounded-full flex items-center justify-center relative z-10"
            style={{
              width: `${rinSize}px`,
              height: `${rinSize}px`,
              background: `
                radial-gradient(circle at 40% 40%, #e8e8e8 0%, #b0b0b0 40%, #888 70%, #666 100%)
              `,
              boxShadow: `
                inset 0 2px 10px rgba(255,255,255,0.5),
                inset 0 -2px 10px rgba(0,0,0,0.3),
                0 0 0 4px #555
              `
            }}
          >
            {/* Rayos del rin */}
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute bg-gradient-to-b from-gray-400 to-gray-600"
                style={{
                  width: `${rinSize * 0.15}px`,
                  height: `${rinSize * 0.35}px`,
                  transform: `rotate(${i * 72}deg) translateY(-${rinSize * 0.2}px)`,
                  borderRadius: '3px',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.3)'
                }}
              />
            ))}
            
            {/* Centro del rin */}
            <div 
              className="absolute rounded-full flex items-center justify-center"
              style={{
                width: `${rinSize * 0.35}px`,
                height: `${rinSize * 0.35}px`,
                background: `radial-gradient(circle at 40% 40%, #999 0%, #666 100%)`,
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.4), 0 2px 4px rgba(0,0,0,0.3)'
              }}
            >
              <span className="text-xl font-bold text-white drop-shadow-lg">{numero}</span>
            </div>
          </div>
        </div>
        
        {/* Indicador de diámetro */}
        <div className="absolute -right-16 top-1/2 transform -translate-y-1/2 flex items-center">
          <div className={`w-8 border-t-2 border-dashed ${numero === 1 ? 'border-amber-500' : 'border-blue-500'}`}></div>
          <div className={`px-2 py-1 rounded text-xs font-bold text-white ${numero === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}>
            ⌀ {specs.diametroTotal.pulgadas.toFixed(1)}"
          </div>
        </div>
      </div>
      
      {/* Info debajo de la llanta */}
      <div className="mt-4 text-center">
        <div className={`text-lg font-bold ${numero === 1 ? 'text-amber-600' : 'text-blue-600'}`}>
          Llanta {numero}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Ancho: {specs.anchoTotal.mm}mm | Perfil: {specs.alturaLateral.mm.toFixed(1)}mm
        </div>
        
        {/* Mostrar diferencias si es la llanta 2 */}
        {numero === 2 && diferencias && (
          <div className="mt-3 p-2 bg-gray-100 rounded-lg">
            <div className="text-xs font-semibold text-gray-700 mb-1">Diferencia vs Llanta 1:</div>
            <div className="flex flex-wrap justify-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                Math.abs(diferencias.diametro) < 2 ? 'bg-green-100 text-green-700' : 
                Math.abs(diferencias.diametro) < 4 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                ⌀ {diferencias.diametro > 0 ? '+' : ''}{diferencias.diametro.toFixed(1)}%
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                Math.abs(diferencias.ancho) < 3 ? 'bg-green-100 text-green-700' : 
                Math.abs(diferencias.ancho) < 6 ? 'bg-yellow-100 text-yellow-700' : 
                'bg-red-100 text-red-700'
              }`}>
                ↔ {diferencias.ancho > 0 ? '+' : ''}{diferencias.ancho.toFixed(1)}%
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Componente visual lateral de la llanta - VERSIÓN REALISTA
const LlantaLateral = ({ specs, numero, color, diferencias = null }) => {
  if (!specs) return null;
  
  const anchoBase = 60;
  const alturaBase = 140;
  const escalaAncho = specs.anchoTotal.pulgadas / 8.5;
  const ancho = anchoBase * escalaAncho;
  const alturaSidewall = specs.alturaLateral.pulgadas * 6;
  const alturaRin = 40;
  
  const colorPrimario = numero === 1 ? "#f59e0b" : "#3b82f6";
  
  return (
    <div className="flex flex-col items-center">
      {/* Etiqueta */}
      <div className={`mb-2 px-2 py-0.5 rounded text-white text-xs font-bold ${numero === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}>
        Vista Lateral
      </div>
      
      <div className="relative flex flex-col items-center">
        {/* Indicador de altura total */}
        <div className="absolute -left-12 top-0 bottom-0 flex flex-col items-center justify-center">
          <div className={`h-full border-l-2 border-dashed ${numero === 1 ? 'border-amber-400' : 'border-blue-400'}`}></div>
          <div className={`absolute top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap px-1 py-0.5 rounded text-xs font-bold text-white ${numero === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}>
            {specs.diametroTotal.pulgadas.toFixed(1)}"
          </div>
        </div>
        
        {/* Sidewall superior */}
        <div 
          className="relative"
          style={{
            width: `${ancho}px`,
            height: `${alturaSidewall}px`,
            background: `linear-gradient(to right, #1a1a1a 0%, #3d3d3d 20%, #3d3d3d 80%, #1a1a1a 100%)`,
            borderRadius: '8px 8px 0 0',
            boxShadow: `
              inset 0 5px 15px rgba(255,255,255,0.1),
              inset 0 -5px 10px rgba(0,0,0,0.5)
            `,
            borderTop: `3px solid ${colorPrimario}`,
            borderLeft: `2px solid ${colorPrimario}`,
            borderRight: `2px solid ${colorPrimario}`
          }}
        >
          {/* Texto en el sidewall */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-gray-500 text-xs font-bold opacity-50" style={{writingMode: 'vertical-rl'}}>
              {specs.ancho}/{specs.perfil}R{specs.rin}
            </span>
          </div>
        </div>
        
        {/* Rin */}
        <div 
          className="flex items-center justify-center"
          style={{
            width: `${ancho}px`,
            height: `${alturaRin}px`,
            background: `linear-gradient(to bottom, #c0c0c0 0%, #a0a0a0 30%, #808080 70%, #909090 100%)`,
            boxShadow: `
              inset 0 2px 5px rgba(255,255,255,0.5),
              inset 0 -2px 5px rgba(0,0,0,0.3)
            `
          }}
        >
          <span className="text-gray-700 font-bold text-lg">{numero}</span>
        </div>
        
        {/* Sidewall inferior */}
        <div 
          style={{
            width: `${ancho}px`,
            height: `${alturaSidewall}px`,
            background: `linear-gradient(to right, #1a1a1a 0%, #3d3d3d 20%, #3d3d3d 80%, #1a1a1a 100%)`,
            borderRadius: '0 0 8px 8px',
            boxShadow: `
              inset 0 5px 10px rgba(0,0,0,0.5),
              inset 0 -5px 15px rgba(255,255,255,0.1),
              0 5px 15px rgba(0,0,0,0.3)
            `,
            borderBottom: `3px solid ${colorPrimario}`,
            borderLeft: `2px solid ${colorPrimario}`,
            borderRight: `2px solid ${colorPrimario}`
          }}
        />
        
        {/* Indicador de ancho */}
        <div className="mt-3 flex items-center gap-1">
          <div className={`flex-1 border-t-2 ${numero === 1 ? 'border-amber-400' : 'border-blue-400'}`} style={{width: `${ancho/2 - 15}px`}}></div>
          <span className={`px-2 py-0.5 rounded text-xs font-bold text-white ${numero === 1 ? 'bg-amber-500' : 'bg-blue-500'}`}>
            {specs.anchoTotal.mm}mm
          </span>
          <div className={`flex-1 border-t-2 ${numero === 1 ? 'border-amber-400' : 'border-blue-400'}`} style={{width: `${ancho/2 - 15}px`}}></div>
        </div>
        
        {/* Diferencias para llanta 2 */}
        {numero === 2 && diferencias && (
          <div className="mt-2 flex flex-col items-center gap-1">
            <span className={`px-2 py-0.5 rounded text-xs font-bold ${
              Math.abs(diferencias.alturaLateral) < 3 ? 'bg-green-100 text-green-700' : 
              Math.abs(diferencias.alturaLateral) < 6 ? 'bg-yellow-100 text-yellow-700' : 
              'bg-red-100 text-red-700'
            }`}>
              Perfil: {diferencias.alturaLateral > 0 ? '+' : ''}{diferencias.alturaLateral.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

function ComparadorLlantas({ llantas = [], onClose }) {
  const [medida1, setMedida1] = useState({ ancho: "215", perfil: "65", rin: "16" });
  const [medida2, setMedida2] = useState({ ancho: "225", perfil: "65", rin: "16" });
  const [llantaSeleccionada1, setLlantaSeleccionada1] = useState("");
  const [llantaSeleccionada2, setLlantaSeleccionada2] = useState("");
  const [modoIngreso, setModoIngreso] = useState("manual"); // "manual" o "inventario"
  const [unidades, setUnidades] = useState("mm"); // "mm" o "pulgadas"

  // Calcular especificaciones
  const specs1 = useMemo(() => {
    if (modoIngreso === "inventario" && llantaSeleccionada1) {
      const llanta = llantas.find(l => l.id?.toString() === llantaSeleccionada1);
      if (llanta) {
        const parsed = parsearMedida(llanta.referencia);
        return calcularEspecificaciones(parsed);
      }
    }
    return calcularEspecificaciones({
      ancho: parseInt(medida1.ancho) || 0,
      perfil: parseInt(medida1.perfil) || 0,
      rin: parseInt(medida1.rin) || 0
    });
  }, [medida1, llantaSeleccionada1, modoIngreso, llantas]);

  const specs2 = useMemo(() => {
    if (modoIngreso === "inventario" && llantaSeleccionada2) {
      const llanta = llantas.find(l => l.id?.toString() === llantaSeleccionada2);
      if (llanta) {
        const parsed = parsearMedida(llanta.referencia);
        return calcularEspecificaciones(parsed);
      }
    }
    return calcularEspecificaciones({
      ancho: parseInt(medida2.ancho) || 0,
      perfil: parseInt(medida2.perfil) || 0,
      rin: parseInt(medida2.rin) || 0
    });
  }, [medida2, llantaSeleccionada2, modoIngreso, llantas]);

  // Calcular diferencias
  const diferencias = useMemo(() => {
    if (!specs1 || !specs2) return null;
    return {
      diametro: calcularDiferencia(specs1.diametroTotal.pulgadas, specs2.diametroTotal.pulgadas),
      ancho: calcularDiferencia(specs1.anchoTotal.pulgadas, specs2.anchoTotal.pulgadas),
      alturaLateral: calcularDiferencia(specs1.alturaLateral.pulgadas, specs2.alturaLateral.pulgadas),
      circunferencia: calcularDiferencia(specs1.circunferencia.pulgadas, specs2.circunferencia.pulgadas),
      revsPorMilla: specs2.revsPorMilla - specs1.revsPorMilla,
    };
  }, [specs1, specs2]);

  // Calcular error del velocímetro
  const errorVelocimetro = useMemo(() => {
    if (!specs1 || !specs2) return 0;
    return ((specs2.circunferencia.mm - specs1.circunferencia.mm) / specs1.circunferencia.mm) * 100;
  }, [specs1, specs2]);

  const formatearValor = (valor, decimales = 1) => {
    return valor?.toFixed(decimales) || "—";
  };

  const formatearDiferencia = (valor) => {
    if (!valor && valor !== 0) return "";
    const signo = valor > 0 ? "+" : "";
    return `${signo}${valor.toFixed(1)}%`;
  };

  const getColorDiferencia = (valor) => {
    if (!valor && valor !== 0) return "text-gray-500";
    if (Math.abs(valor) < 1) return "text-green-600";
    if (Math.abs(valor) < 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <span>📊</span>
                Comparador de Llantas
              </h2>
              <p className="text-slate-300 text-sm mt-1">
                Compara medidas y especificaciones
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all w-10 h-10 flex items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Selector de modo */}
          <div className="flex gap-4 mb-6 justify-center">
            <button
              onClick={() => setModoIngreso("manual")}
              className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                modoIngreso === "manual"
                  ? "bg-slate-700 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✏️ Ingreso Manual
            </button>
            {llantas.length > 0 && (
              <button
                onClick={() => setModoIngreso("inventario")}
                className={`px-6 py-3 rounded-xl font-semibold transition-all ${
                  modoIngreso === "inventario"
                    ? "bg-slate-700 text-white shadow-lg"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📦 Desde Inventario
              </button>
            )}
          </div>

          {/* Inputs de medidas - LADO A LADO */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-6">
              
              {/* Llanta 1 */}
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 w-full lg:w-auto">
                <h3 className="text-lg font-bold text-amber-800 mb-4 flex items-center justify-center gap-2">
                  <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                  Llanta 1 (Original)
                </h3>
                
                {modoIngreso === "manual" ? (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      value={medida1.ancho}
                      onChange={(e) => setMedida1({...medida1, ancho: e.target.value})}
                      className="w-20 px-3 py-3 border-2 border-amber-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      placeholder="215"
                    />
                    <span className="text-2xl font-bold text-gray-400">/</span>
                    <input
                      type="number"
                      value={medida1.perfil}
                      onChange={(e) => setMedida1({...medida1, perfil: e.target.value})}
                      className="w-16 px-3 py-3 border-2 border-amber-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      placeholder="65"
                    />
                    <span className="text-2xl font-bold text-gray-400">R</span>
                    <input
                      type="number"
                      value={medida1.rin}
                      onChange={(e) => setMedida1({...medida1, rin: e.target.value})}
                      className="w-16 px-3 py-3 border-2 border-amber-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                      placeholder="16"
                    />
                  </div>
                ) : (
                  <select
                    value={llantaSeleccionada1}
                    onChange={(e) => setLlantaSeleccionada1(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                  >
                    <option value="">Seleccionar llanta...</option>
                    {llantas.map((ll) => (
                      <option key={ll.id} value={ll.id}>
                        {ll.referencia} - {ll.marca}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Separador VS */}
              <div className="flex items-center justify-center">
                <div className="bg-slate-700 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-lg">
                  VS
                </div>
              </div>

              {/* Llanta 2 */}
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 w-full lg:w-auto">
                <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center justify-center gap-2">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                  Llanta 2 (Nueva)
                </h3>
                
                {modoIngreso === "manual" ? (
                  <div className="flex items-center justify-center gap-2">
                    <input
                      type="number"
                      value={medida2.ancho}
                      onChange={(e) => setMedida2({...medida2, ancho: e.target.value})}
                      className="w-20 px-3 py-3 border-2 border-blue-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="225"
                    />
                    <span className="text-2xl font-bold text-gray-400">/</span>
                    <input
                      type="number"
                      value={medida2.perfil}
                      onChange={(e) => setMedida2({...medida2, perfil: e.target.value})}
                      className="w-16 px-3 py-3 border-2 border-blue-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="65"
                    />
                    <span className="text-2xl font-bold text-gray-400">R</span>
                    <input
                      type="number"
                      value={medida2.rin}
                      onChange={(e) => setMedida2({...medida2, rin: e.target.value})}
                      className="w-16 px-3 py-3 border-2 border-blue-300 rounded-lg text-center font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      placeholder="16"
                    />
                  </div>
                ) : (
                  <select
                    value={llantaSeleccionada2}
                    onChange={(e) => setLlantaSeleccionada2(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="">Seleccionar llanta...</option>
                    {llantas.map((ll) => (
                      <option key={ll.id} value={ll.id}>
                        {ll.referencia} - {ll.marca}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Botón Comparar */}
            <div className="flex justify-center mt-6">
              <button
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-xl font-bold text-lg hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
              >
                <span>🔍</span>
                Comparar
              </button>
            </div>
          </div>

          {/* Visualización de llantas */}
          {specs1 && specs2 && (
            <>
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-6 mb-6">
                <h3 className="text-xl font-bold text-gray-700 mb-6 text-center flex items-center justify-center gap-2">
                  <span>🔍</span> Comparación Visual
                </h3>
                
                {/* Contenedor principal de comparación */}
                <div className="flex flex-col lg:flex-row justify-center items-start gap-8">
                  
                  {/* Vista Frontal */}
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h4 className="text-center font-semibold text-gray-600 mb-4">Vista Frontal</h4>
                    <div className="flex items-end justify-center gap-6">
                      <LlantaVisual 
                        specs={specs1} 
                        numero={1} 
                        color="#f59e0b" 
                        escala={1} 
                        diferencias={null}
                      />
                      
                      {/* Indicador VS central */}
                      <div className="flex flex-col items-center justify-center pb-16">
                        <div className="bg-slate-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                          VS
                        </div>
                      </div>
                      
                      <LlantaVisual 
                        specs={specs2} 
                        numero={2} 
                        color="#3b82f6" 
                        escala={specs2.diametroTotal.pulgadas / specs1.diametroTotal.pulgadas} 
                        diferencias={diferencias}
                        specs1={specs1}
                      />
                    </div>
                  </div>
                  
                  {/* Vista Lateral */}
                  <div className="bg-white rounded-xl p-6 shadow-lg">
                    <h4 className="text-center font-semibold text-gray-600 mb-4">Vista Lateral (Perfil)</h4>
                    <div className="flex items-end justify-center gap-8">
                      <LlantaLateral 
                        specs={specs1} 
                        numero={1} 
                        color="#f59e0b"
                        diferencias={null}
                      />
                      <LlantaLateral 
                        specs={specs2} 
                        numero={2} 
                        color="#3b82f6"
                        diferencias={diferencias}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Resumen de diferencias */}
                <div className="mt-6 bg-white rounded-xl p-4 shadow-md">
                  <h4 className="text-center font-semibold text-gray-700 mb-3">📊 Resumen de Diferencias</h4>
                  <div className="flex flex-wrap justify-center gap-4">
                    <div className={`px-4 py-2 rounded-lg ${
                      Math.abs(diferencias.diametro) < 2 ? 'bg-green-100 border-2 border-green-300' : 
                      Math.abs(diferencias.diametro) < 4 ? 'bg-yellow-100 border-2 border-yellow-300' : 
                      'bg-red-100 border-2 border-red-300'
                    }`}>
                      <div className="text-xs text-gray-500">Diámetro</div>
                      <div className={`text-lg font-bold ${
                        Math.abs(diferencias.diametro) < 2 ? 'text-green-700' : 
                        Math.abs(diferencias.diametro) < 4 ? 'text-yellow-700' : 
                        'text-red-700'
                      }`}>
                        {diferencias.diametro > 0 ? '+' : ''}{diferencias.diametro.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-lg ${
                      Math.abs(diferencias.ancho) < 3 ? 'bg-green-100 border-2 border-green-300' : 
                      Math.abs(diferencias.ancho) < 6 ? 'bg-yellow-100 border-2 border-yellow-300' : 
                      'bg-red-100 border-2 border-red-300'
                    }`}>
                      <div className="text-xs text-gray-500">Ancho</div>
                      <div className={`text-lg font-bold ${
                        Math.abs(diferencias.ancho) < 3 ? 'text-green-700' : 
                        Math.abs(diferencias.ancho) < 6 ? 'text-yellow-700' : 
                        'text-red-700'
                      }`}>
                        {diferencias.ancho > 0 ? '+' : ''}{diferencias.ancho.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-lg ${
                      Math.abs(diferencias.alturaLateral) < 3 ? 'bg-green-100 border-2 border-green-300' : 
                      Math.abs(diferencias.alturaLateral) < 6 ? 'bg-yellow-100 border-2 border-yellow-300' : 
                      'bg-red-100 border-2 border-red-300'
                    }`}>
                      <div className="text-xs text-gray-500">Perfil</div>
                      <div className={`text-lg font-bold ${
                        Math.abs(diferencias.alturaLateral) < 3 ? 'text-green-700' : 
                        Math.abs(diferencias.alturaLateral) < 6 ? 'text-yellow-700' : 
                        'text-red-700'
                      }`}>
                        {diferencias.alturaLateral > 0 ? '+' : ''}{diferencias.alturaLateral.toFixed(2)}%
                      </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-lg ${
                      Math.abs(errorVelocimetro) < 2 ? 'bg-green-100 border-2 border-green-300' : 
                      Math.abs(errorVelocimetro) < 4 ? 'bg-yellow-100 border-2 border-yellow-300' : 
                      'bg-red-100 border-2 border-red-300'
                    }`}>
                      <div className="text-xs text-gray-500">Velocímetro</div>
                      <div className={`text-lg font-bold ${
                        Math.abs(errorVelocimetro) < 2 ? 'text-green-700' : 
                        Math.abs(errorVelocimetro) < 4 ? 'text-yellow-700' : 
                        'text-red-700'
                      }`}>
                        {errorVelocimetro > 0 ? '+' : ''}{errorVelocimetro.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                  
                  {/* Leyenda de colores */}
                  <div className="flex justify-center gap-4 mt-4 text-xs">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400"></span> Compatible</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> Precaución</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400"></span> No recomendado</span>
                  </div>
                </div>
                
                <p className="text-center text-sm text-gray-500 mt-4">
                  ℹ️ Las llantas se muestran a escala proporcional entre sí
                </p>
              </div>

              {/* Selector de unidades */}
              <div className="flex justify-center gap-2 mb-4">
                <button
                  onClick={() => setUnidades("mm")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    unidades === "mm"
                      ? "bg-slate-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Milímetros
                </button>
                <button
                  onClick={() => setUnidades("pulgadas")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    unidades === "pulgadas"
                      ? "bg-slate-700 text-white"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Pulgadas
                </button>
              </div>

              {/* Tabla de comparación */}
              <div className="overflow-x-auto rounded-xl border border-gray-200 mb-6">
                <table className="w-full text-sm">
                  <thead className="bg-gradient-to-r from-slate-600 to-slate-700 text-white">
                    <tr>
                      <th className="p-4 text-left">Especificación</th>
                      <th className="p-4 text-center bg-amber-600">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-6 h-6 bg-white text-amber-600 rounded-full flex items-center justify-center font-bold text-xs">1</span>
                          {specs1.ancho}/{specs1.perfil}R{specs1.rin}
                        </div>
                      </th>
                      <th className="p-4 text-center bg-blue-600">
                        <div className="flex items-center justify-center gap-2">
                          <span className="w-6 h-6 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">2</span>
                          {specs2.ancho}/{specs2.perfil}R{specs2.rin}
                        </div>
                      </th>
                      <th className="p-4 text-center">Diferencia</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>📏</span> Diámetro Total
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-amber-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs1.diametroTotal.mm, 1)} mm`
                          : `${formatearValor(specs1.diametroTotal.pulgadas, 2)}"`
                        }
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs2.diametroTotal.mm, 1)} mm`
                          : `${formatearValor(specs2.diametroTotal.pulgadas, 2)}"`
                        }
                      </td>
                      <td className={`p-4 text-center font-bold ${getColorDiferencia(diferencias?.diametro)}`}>
                        {formatearDiferencia(diferencias?.diametro)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>↔️</span> Ancho
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-amber-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs1.anchoTotal.mm, 0)} mm`
                          : `${formatearValor(specs1.anchoTotal.pulgadas, 2)}"`
                        }
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs2.anchoTotal.mm, 0)} mm`
                          : `${formatearValor(specs2.anchoTotal.pulgadas, 2)}"`
                        }
                      </td>
                      <td className={`p-4 text-center font-bold ${getColorDiferencia(diferencias?.ancho)}`}>
                        {formatearDiferencia(diferencias?.ancho)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>📐</span> Altura Lateral (Sidewall)
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-amber-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs1.alturaLateral.mm, 1)} mm`
                          : `${formatearValor(specs1.alturaLateral.pulgadas, 2)}"`
                        }
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs2.alturaLateral.mm, 1)} mm`
                          : `${formatearValor(specs2.alturaLateral.pulgadas, 2)}"`
                        }
                      </td>
                      <td className={`p-4 text-center font-bold ${getColorDiferencia(diferencias?.alturaLateral)}`}>
                        {formatearDiferencia(diferencias?.alturaLateral)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>⭕</span> Circunferencia
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-amber-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs1.circunferencia.mm, 1)} mm`
                          : `${formatearValor(specs1.circunferencia.pulgadas, 2)}"`
                        }
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-700">
                        {unidades === "mm" 
                          ? `${formatearValor(specs2.circunferencia.mm, 1)} mm`
                          : `${formatearValor(specs2.circunferencia.pulgadas, 2)}"`
                        }
                      </td>
                      <td className={`p-4 text-center font-bold ${getColorDiferencia(diferencias?.circunferencia)}`}>
                        {formatearDiferencia(diferencias?.circunferencia)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>🔄</span> Revoluciones/Milla
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-amber-700">
                        {formatearValor(specs1.revsPorMilla, 0)}
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-700">
                        {formatearValor(specs2.revsPorMilla, 0)}
                      </td>
                      <td className={`p-4 text-center font-bold ${getColorDiferencia(-diferencias?.revsPorMilla/10)}`}>
                        {diferencias?.revsPorMilla > 0 ? "+" : ""}{formatearValor(diferencias?.revsPorMilla, 0)}
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="p-4 font-medium text-gray-700">
                        <div className="flex items-center gap-2">
                          <span>🔄</span> Revoluciones/Km
                        </div>
                      </td>
                      <td className="p-4 text-center font-semibold text-amber-700">
                        {formatearValor(specs1.revsPorKm, 0)}
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-700">
                        {formatearValor(specs2.revsPorKm, 0)}
                      </td>
                      <td className="p-4 text-center text-gray-500">—</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Error del velocímetro */}
              <div className={`rounded-xl p-6 mb-6 ${
                Math.abs(errorVelocimetro) < 2 
                  ? "bg-green-50 border-2 border-green-200" 
                  : Math.abs(errorVelocimetro) < 5 
                    ? "bg-yellow-50 border-2 border-yellow-200"
                    : "bg-red-50 border-2 border-red-200"
              }`}>
                <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <span>🚗</span> Error del Velocímetro
                </h3>
                <p className="text-gray-600 mb-3">
                  Si cambias de la Llanta 1 a la Llanta 2:
                </p>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className={`text-3xl font-bold ${
                    Math.abs(errorVelocimetro) < 2 
                      ? "text-green-600" 
                      : Math.abs(errorVelocimetro) < 5 
                        ? "text-yellow-600"
                        : "text-red-600"
                  }`}>
                    {errorVelocimetro > 0 ? "+" : ""}{errorVelocimetro.toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">
                    {errorVelocimetro > 0 ? (
                      <p>Tu velocímetro marcará <strong>menos</strong> de lo que realmente vas. A 100 km/h reales, marcará ~{(100 - (100 * errorVelocimetro / 100)).toFixed(1)} km/h</p>
                    ) : errorVelocimetro < 0 ? (
                      <p>Tu velocímetro marcará <strong>más</strong> de lo que realmente vas. A 100 km/h marcados, irás ~{(100 + (100 * Math.abs(errorVelocimetro) / 100)).toFixed(1)} km/h</p>
                    ) : (
                      <p>No hay diferencia en el velocímetro</p>
                    )}
                  </div>
                </div>
                
                {Math.abs(errorVelocimetro) > 3 && (
                  <div className="mt-4 p-3 bg-white rounded-lg">
                    <p className="text-sm text-orange-700">
                      ⚠️ <strong>Advertencia:</strong> Una diferencia mayor al 3% puede afectar la precisión del velocímetro y el odómetro. Consulta con un especialista.
                    </p>
                  </div>
                )}
              </div>

              {/* Recomendaciones */}
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                  <span>💡</span> Recomendaciones
                </h3>
                <ul className="space-y-2 text-sm text-blue-900">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Diferencia de diámetro menor al <strong>3%</strong> es generalmente aceptable</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">✓</span>
                    <span>Mantén el mismo rin si es posible para evitar cambios en suspensión</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-yellow-500">⚠</span>
                    <span>Cambios mayores pueden afectar el consumo de combustible y desgaste</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">✗</span>
                    <span>Evita diferencias mayores al <strong>5%</strong> sin consultar un especialista</span>
                  </li>
                </ul>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-6 border-t sticky bottom-0">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="bg-slate-600 text-white px-8 py-3 rounded-xl hover:bg-slate-700 font-semibold transition-all shadow-lg hover:shadow-xl"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparadorLlantas;