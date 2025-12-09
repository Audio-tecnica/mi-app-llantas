import React, { useState, useMemo } from "react";

// Función para parsear la referencia de llanta
const parsearMedida = (referencia) => {
  if (!referencia) return null;
  const ref = referencia.toUpperCase().replace(/\s+/g, '');
  const patrones = [
    /(\d{3})[\/\-](\d{2,3})[R\/\-]?(\d{2})/i,
    /(\d{3})(\d{2})R?(\d{2})/i,
  ];
  for (const patron of patrones) {
    const match = ref.match(patron);
    if (match) {
      return {
        ancho: parseInt(match[1]),
        perfil: parseInt(match[2]),
        rin: parseInt(match[3]),
      };
    }
  }
  return null;
};

// Función para calcular especificaciones
const calcularEspecificaciones = (medida) => {
  if (!medida) return null;
  const { ancho, perfil, rin } = medida;
  
  const alturaLateralMM = (ancho * perfil) / 100;
  const diametroRinMM = rin * 25.4;
  const diametroTotalMM = (alturaLateralMM * 2) + diametroRinMM;
  const diametroTotalPulgadas = diametroTotalMM / 25.4;
  const anchoPulgadas = ancho / 25.4;
  const alturaLateralPulgadas = alturaLateralMM / 25.4;
  const circunferenciaMM = diametroTotalMM * Math.PI;
  const circunferenciaPulgadas = diametroTotalPulgadas * Math.PI;
  const revsPorMilla = 1609344 / circunferenciaMM;
  const revsPorKm = 1000000 / circunferenciaMM;
  
  return {
    ancho, perfil, rin,
    diametroTotal: { mm: diametroTotalMM, pulgadas: diametroTotalPulgadas },
    anchoTotal: { mm: ancho, pulgadas: anchoPulgadas },
    alturaLateral: { mm: alturaLateralMM, pulgadas: alturaLateralPulgadas },
    circunferencia: { mm: circunferenciaMM, pulgadas: circunferenciaPulgadas },
    revsPorMilla, revsPorKm
  };
};

// Componente de llanta frontal SVG
const LlantaFrontalSVG = ({ specs, numero, tamaño = 180 }) => {
  if (!specs) return null;
  
  const color = numero === 1 ? "#f59e0b" : "#3b82f6";
  
  return (
    <svg width={tamaño} height={tamaño} viewBox="0 0 200 200">
      {/* Llanta exterior */}
      <circle cx="100" cy="100" r="95" fill="#1a1a1a" stroke={color} strokeWidth="3"/>
      
      {/* Banda de rodamiento - patrón */}
      <circle cx="100" cy="100" r="90" fill="none" stroke="#2d2d2d" strokeWidth="15"/>
      
      {/* Líneas de la banda */}
      {[...Array(24)].map((_, i) => (
        <line
          key={i}
          x1="100"
          y1="12"
          x2="100"
          y2="25"
          stroke="#3d3d3d"
          strokeWidth="2"
          transform={`rotate(${i * 15} 100 100)`}
        />
      ))}
      
      {/* Borde interior de la llanta */}
      <circle cx="100" cy="100" r="65" fill="#1a1a1a" stroke="#333" strokeWidth="2"/>
      
      {/* Rin */}
      <circle cx="100" cy="100" r="55" fill="url(#rinGradient)" stroke="#888" strokeWidth="2"/>
      
      {/* Rayos del rin */}
      {[...Array(5)].map((_, i) => (
        <path
          key={i}
          d={`M100,100 L100,55 A45,45 0 0,1 ${100 + 45 * Math.sin(Math.PI * 2 / 5)},${100 - 45 * Math.cos(Math.PI * 2 / 5)} Z`}
          fill="url(#rayoGradient)"
          transform={`rotate(${i * 72} 100 100)`}
          opacity="0.9"
        />
      ))}
      
      {/* Centro del rin */}
      <circle cx="100" cy="100" r="20" fill="url(#centroGradient)" stroke="#666" strokeWidth="1"/>
      
      {/* Número */}
      <text x="100" y="107" textAnchor="middle" fill="white" fontSize="24" fontWeight="bold">{numero}</text>
      
      {/* Gradientes */}
      <defs>
        <radialGradient id="rinGradient">
          <stop offset="0%" stopColor="#d1d5db"/>
          <stop offset="100%" stopColor="#9ca3af"/>
        </radialGradient>
        <linearGradient id="rayoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e5e7eb"/>
          <stop offset="100%" stopColor="#9ca3af"/>
        </linearGradient>
        <radialGradient id="centroGradient">
          <stop offset="0%" stopColor="#9ca3af"/>
          <stop offset="100%" stopColor="#6b7280"/>
        </radialGradient>
      </defs>
    </svg>
  );
};

// Componente de llanta lateral SVG - VERSIÓN REALISTA
const LlantaLateralSVG = ({ specs, numero, altura = 160 }) => {
  if (!specs) return null;
  
  const color = numero === 1 ? "#f59e0b" : "#3b82f6";
  const colorClaro = numero === 1 ? "#fef3c7" : "#dbeafe";
  
  // Calcular proporciones basadas en las especificaciones reales
  const anchoBase = 70;
  const escalaAncho = specs.anchoTotal.mm / 225; // Normalizado a 225mm
  const ancho = Math.max(anchoBase * escalaAncho, 50);
  
  // El perfil determina la altura del sidewall
  const perfilAltura = Math.max(20, 35 * (specs.perfil / 65)); // Normalizado a perfil 65
  const rinAltura = 45;
  const totalAltura = perfilAltura * 2 + rinAltura;
  
  const startY = (altura - totalAltura) / 2;
  const centerX = ancho / 2 + 10;
  
  return (
    <svg width={ancho + 20} height={altura} viewBox={`0 0 ${ancho + 20} ${altura}`}>
      {/* Sombra */}
      <ellipse cx={centerX} cy={altura - 8} rx={ancho/2 - 5} ry="4" fill="rgba(0,0,0,0.15)"/>
      
      {/* Sidewall superior - con forma redondeada */}
      <path 
        d={`
          M ${10 + 5} ${startY + perfilAltura}
          L ${10 + 5} ${startY + 8}
          Q ${10 + 5} ${startY}, ${10 + 15} ${startY}
          L ${10 + ancho - 15} ${startY}
          Q ${10 + ancho - 5} ${startY}, ${10 + ancho - 5} ${startY + 8}
          L ${10 + ancho - 5} ${startY + perfilAltura}
          Z
        `}
        fill="#1f1f1f"
      />
      
      {/* Textura del sidewall superior */}
      <path 
        d={`
          M ${10 + 8} ${startY + perfilAltura - 2}
          L ${10 + 8} ${startY + 10}
          Q ${10 + 8} ${startY + 5}, ${10 + 15} ${startY + 5}
          L ${10 + ancho - 15} ${startY + 5}
          Q ${10 + ancho - 8} ${startY + 5}, ${10 + ancho - 8} ${startY + 10}
          L ${10 + ancho - 8} ${startY + perfilAltura - 2}
          Z
        `}
        fill="#2a2a2a"
      />
      
      {/* Texto en sidewall superior */}
      <text 
        x={centerX} 
        y={startY + perfilAltura/2 + 3} 
        textAnchor="middle" 
        fill="#4a4a4a" 
        fontSize="7"
        fontWeight="bold"
        fontFamily="Arial"
      >
        {specs.ancho}/{specs.perfil}R{specs.rin}
      </text>
      
      {/* Rin - con efecto metálico */}
      <rect 
        x="10" 
        y={startY + perfilAltura} 
        width={ancho} 
        height={rinAltura} 
        fill="url(#rinMetalGradient)"
      />
      
      {/* Líneas del rin para dar profundidad */}
      <line x1="10" y1={startY + perfilAltura + 8} x2={10 + ancho} y2={startY + perfilAltura + 8} stroke="#999" strokeWidth="1"/>
      <line x1="10" y1={startY + perfilAltura + rinAltura - 8} x2={10 + ancho} y2={startY + perfilAltura + rinAltura - 8} stroke="#999" strokeWidth="1"/>
      
      {/* Número en rin */}
      <text 
        x={centerX} 
        y={startY + perfilAltura + rinAltura/2 + 6} 
        textAnchor="middle" 
        fill="#555" 
        fontSize="20"
        fontWeight="bold"
      >
        {numero}
      </text>
      
      {/* Sidewall inferior - con forma redondeada */}
      <path 
        d={`
          M ${10 + 5} ${startY + perfilAltura + rinAltura}
          L ${10 + 5} ${startY + perfilAltura + rinAltura + perfilAltura - 8}
          Q ${10 + 5} ${startY + totalAltura}, ${10 + 15} ${startY + totalAltura}
          L ${10 + ancho - 15} ${startY + totalAltura}
          Q ${10 + ancho - 5} ${startY + totalAltura}, ${10 + ancho - 5} ${startY + perfilAltura + rinAltura + perfilAltura - 8}
          L ${10 + ancho - 5} ${startY + perfilAltura + rinAltura}
          Z
        `}
        fill="#1f1f1f"
      />
      
      {/* Textura del sidewall inferior */}
      <path 
        d={`
          M ${10 + 8} ${startY + perfilAltura + rinAltura + 2}
          L ${10 + 8} ${startY + perfilAltura + rinAltura + perfilAltura - 10}
          Q ${10 + 8} ${startY + totalAltura - 5}, ${10 + 15} ${startY + totalAltura - 5}
          L ${10 + ancho - 15} ${startY + totalAltura - 5}
          Q ${10 + ancho - 8} ${startY + totalAltura - 5}, ${10 + ancho - 8} ${startY + perfilAltura + rinAltura + perfilAltura - 10}
          L ${10 + ancho - 8} ${startY + perfilAltura + rinAltura + 2}
          Z
        `}
        fill="#2a2a2a"
      />
      
      {/* Banda de rodamiento superior */}
      <rect x={10 + 3} y={startY} width={ancho - 6} height="4" fill="#0f0f0f" rx="2"/>
      
      {/* Banda de rodamiento inferior */}
      <rect x={10 + 3} y={startY + totalAltura - 4} width={ancho - 6} height="4" fill="#0f0f0f" rx="2"/>
      
      {/* Borde de color identificador */}
      <rect 
        x="10" 
        y={startY} 
        width={ancho} 
        height={totalAltura} 
        fill="none"
        stroke={color}
        strokeWidth="3"
        rx="8"
      />
      
      {/* Gradiente para el rin */}
      <defs>
        <linearGradient id="rinMetalGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e0e0e0"/>
          <stop offset="20%" stopColor="#c0c0c0"/>
          <stop offset="50%" stopColor="#a8a8a8"/>
          <stop offset="80%" stopColor="#c0c0c0"/>
          <stop offset="100%" stopColor="#d0d0d0"/>
        </linearGradient>
      </defs>
    </svg>
  );
};

function ComparadorLlantas({ llantas = [], onClose }) {
  const [medida1, setMedida1] = useState({ ancho: "215", perfil: "65", rin: "16" });
  const [medida2, setMedida2] = useState({ ancho: "225", perfil: "70", rin: "16" });
  const [llantaSeleccionada1, setLlantaSeleccionada1] = useState("");
  const [llantaSeleccionada2, setLlantaSeleccionada2] = useState("");
  const [modoIngreso, setModoIngreso] = useState("manual");

  const specs1 = useMemo(() => {
    if (modoIngreso === "inventario" && llantaSeleccionada1) {
      const llanta = llantas.find(l => l.id?.toString() === llantaSeleccionada1);
      if (llanta) return calcularEspecificaciones(parsearMedida(llanta.referencia));
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
      if (llanta) return calcularEspecificaciones(parsearMedida(llanta.referencia));
    }
    return calcularEspecificaciones({
      ancho: parseInt(medida2.ancho) || 0,
      perfil: parseInt(medida2.perfil) || 0,
      rin: parseInt(medida2.rin) || 0
    });
  }, [medida2, llantaSeleccionada2, modoIngreso, llantas]);

  const diferencias = useMemo(() => {
    if (!specs1 || !specs2) return null;
    const calcDif = (v1, v2) => ((v2 - v1) / v1) * 100;
    return {
      diametro: calcDif(specs1.diametroTotal.pulgadas, specs2.diametroTotal.pulgadas),
      ancho: calcDif(specs1.anchoTotal.mm, specs2.anchoTotal.mm),
      perfil: calcDif(specs1.alturaLateral.mm, specs2.alturaLateral.mm),
      circunferencia: calcDif(specs1.circunferencia.mm, specs2.circunferencia.mm),
      revsPorMilla: specs2.revsPorMilla - specs1.revsPorMilla,
    };
  }, [specs1, specs2]);

  const velocidades = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  
  const calcularVelocidadReal = (velocimetro) => {
    if (!specs1 || !specs2) return velocimetro;
    return velocimetro * (specs2.diametroTotal.mm / specs1.diametroTotal.mm);
  };

  const getColorDiferencia = (valor, limiteVerde = 2, limiteAmarillo = 4) => {
    const abs = Math.abs(valor);
    if (abs < limiteVerde) return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" };
    if (abs < limiteAmarillo) return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" };
    return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" };
  };

  const formatNum = (num, dec = 1) => num?.toFixed(dec) || "—";
  const formatDif = (num) => (num > 0 ? "+" : "") + formatNum(num, 2) + "%";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[98vh] overflow-y-auto">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-4 sm:p-6 text-white sticky top-0 z-10">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                📊 Comparador de Llantas
              </h2>
              <p className="text-slate-300 text-sm mt-1 hidden sm:block">
                Compara medidas, especificaciones y error de velocímetro
              </p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2 w-10 h-10 flex items-center justify-center text-2xl">
              ×
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          
          {/* Selector de modo */}
          <div className="flex gap-2 mb-6 justify-center">
            <button
              onClick={() => setModoIngreso("manual")}
              className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                modoIngreso === "manual" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              ✏️ Manual
            </button>
            {llantas.length > 0 && (
              <button
                onClick={() => setModoIngreso("inventario")}
                className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm ${
                  modoIngreso === "inventario" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                📦 Inventario
              </button>
            )}
          </div>

          {/* Inputs de medidas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Llanta 1 */}
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <span className="font-bold text-amber-800">Llanta Original (OEM)</span>
              </div>
              {modoIngreso === "manual" ? (
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <input type="number" value={medida1.ancho} onChange={(e) => setMedida1({...medida1, ancho: e.target.value})}
                    className="w-16 sm:w-20 px-2 py-2 border-2 border-amber-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="215"/>
                  <span className="text-xl font-bold text-gray-400">/</span>
                  <input type="number" value={medida1.perfil} onChange={(e) => setMedida1({...medida1, perfil: e.target.value})}
                    className="w-14 sm:w-16 px-2 py-2 border-2 border-amber-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="65"/>
                  <span className="text-xl font-bold text-gray-400">R</span>
                  <input type="number" value={medida1.rin} onChange={(e) => setMedida1({...medida1, rin: e.target.value})}
                    className="w-14 sm:w-16 px-2 py-2 border-2 border-amber-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-amber-500 outline-none" placeholder="16"/>
                </div>
              ) : (
                <select value={llantaSeleccionada1} onChange={(e) => setLlantaSeleccionada1(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none">
                  <option value="">Seleccionar llanta...</option>
                  {llantas.map((ll) => (<option key={ll.id} value={ll.id}>{ll.referencia} - {ll.marca}</option>))}
                </select>
              )}
            </div>

            {/* Llanta 2 */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <span className="font-bold text-blue-800">Llanta Nueva</span>
              </div>
              {modoIngreso === "manual" ? (
                <div className="flex items-center justify-center gap-1 sm:gap-2">
                  <input type="number" value={medida2.ancho} onChange={(e) => setMedida2({...medida2, ancho: e.target.value})}
                    className="w-16 sm:w-20 px-2 py-2 border-2 border-blue-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="225"/>
                  <span className="text-xl font-bold text-gray-400">/</span>
                  <input type="number" value={medida2.perfil} onChange={(e) => setMedida2({...medida2, perfil: e.target.value})}
                    className="w-14 sm:w-16 px-2 py-2 border-2 border-blue-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="70"/>
                  <span className="text-xl font-bold text-gray-400">R</span>
                  <input type="number" value={medida2.rin} onChange={(e) => setMedida2({...medida2, rin: e.target.value})}
                    className="w-14 sm:w-16 px-2 py-2 border-2 border-blue-300 rounded-lg text-center font-bold focus:ring-2 focus:ring-blue-500 outline-none" placeholder="16"/>
                </div>
              ) : (
                <select value={llantaSeleccionada2} onChange={(e) => setLlantaSeleccionada2(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Seleccionar llanta...</option>
                  {llantas.map((ll) => (<option key={ll.id} value={ll.id}>{ll.referencia} - {ll.marca}</option>))}
                </select>
              )}
            </div>
          </div>

          {specs1 && specs2 && diferencias && (
            <>
              {/* Visualización lado a lado */}
              <div className="bg-gray-50 rounded-xl p-4 sm:p-6 mb-6">
                <h3 className="text-lg font-bold text-center text-gray-700 mb-4">🔍 Comparación Visual</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Vista Frontal */}
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h4 className="text-center font-semibold text-gray-600 mb-4 border-b pb-2">Vista Frontal</h4>
                    <div className="flex justify-center items-end gap-4 sm:gap-6">
                      <div className="text-center">
                        <div className="bg-amber-100 rounded-lg px-3 py-1 text-amber-700 font-bold text-sm mb-3 inline-block">
                          {specs1.ancho}/{specs1.perfil}R{specs1.rin}
                        </div>
                        <LlantaFrontalSVG specs={specs1} numero={1} tamaño={130} />
                        <div className="mt-3 space-y-1">
                          <div className="text-lg font-bold text-gray-800">⌀ {formatNum(specs1.diametroTotal.pulgadas)}"</div>
                          <div className="text-sm text-gray-500">({formatNum(specs1.diametroTotal.mm, 0)}mm)</div>
                        </div>
                      </div>
                      
                      <div className="pb-20">
                        <div className="bg-slate-700 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg">VS</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="bg-blue-100 rounded-lg px-3 py-1 text-blue-700 font-bold text-sm mb-3 inline-block">
                          {specs2.ancho}/{specs2.perfil}R{specs2.rin}
                        </div>
                        <LlantaFrontalSVG specs={specs2} numero={2} tamaño={130 * (specs2.diametroTotal.pulgadas / specs1.diametroTotal.pulgadas)} />
                        <div className="mt-3 space-y-1">
                          <div className="text-lg font-bold text-gray-800">⌀ {formatNum(specs2.diametroTotal.pulgadas)}"</div>
                          <div className="text-sm text-gray-500">({formatNum(specs2.diametroTotal.mm, 0)}mm)</div>
                          <div className={`px-2 py-1 rounded text-sm font-bold inline-block ${getColorDiferencia(diferencias.diametro).bg} ${getColorDiferencia(diferencias.diametro).text}`}>
                            {formatDif(diferencias.diametro)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Vista Lateral */}
                  <div className="bg-white rounded-xl p-4 shadow-md">
                    <h4 className="text-center font-semibold text-gray-600 mb-4 border-b pb-2">Vista Lateral (Perfil)</h4>
                    <div className="flex justify-center items-end gap-6 sm:gap-10">
                      {/* Llanta 1 */}
                      <div className="text-center">
                        <LlantaLateralSVG specs={specs1} numero={1} altura={150} />
                        <div className="mt-3 space-y-1">
                          <div className="font-bold text-gray-800">{specs1.anchoTotal.mm}mm</div>
                          <div className="text-xs text-gray-500">({formatNum(specs1.anchoTotal.pulgadas, 1)}")</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Perfil: {formatNum(specs1.alturaLateral.mm, 1)}mm
                          </div>
                          <div className="text-xs text-gray-400">
                            ({formatNum(specs1.alturaLateral.pulgadas, 2)}")
                          </div>
                        </div>
                      </div>
                      
                      {/* Llanta 2 */}
                      <div className="text-center">
                        <LlantaLateralSVG specs={specs2} numero={2} altura={150} />
                        <div className="mt-3 space-y-1">
                          <div className="font-bold text-gray-800">
                            {specs2.anchoTotal.mm}mm
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-bold ${getColorDiferencia(diferencias.ancho, 3, 6).bg} ${getColorDiferencia(diferencias.ancho, 3, 6).text}`}>
                              {formatDif(diferencias.ancho)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">({formatNum(specs2.anchoTotal.pulgadas, 1)}")</div>
                          <div className="text-xs text-gray-600 mt-1">
                            Perfil: {formatNum(specs2.alturaLateral.mm, 1)}mm
                            <span className={`ml-1 px-1.5 py-0.5 rounded font-bold ${getColorDiferencia(diferencias.perfil, 3, 6).bg} ${getColorDiferencia(diferencias.perfil, 3, 6).text}`}>
                              {formatDif(diferencias.perfil)}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            ({formatNum(specs2.alturaLateral.pulgadas, 2)}")
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de especificaciones */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="bg-slate-700 text-white px-4 py-3">
                  <h3 className="font-bold">📋 Especificaciones Técnicas</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left font-semibold text-gray-700">Especificación</th>
                        <th className="p-3 text-center font-semibold text-amber-700 bg-amber-50">
                          🟡 Llanta 1<br/><span className="text-xs font-normal">{specs1.ancho}/{specs1.perfil}R{specs1.rin}</span>
                        </th>
                        <th className="p-3 text-center font-semibold text-blue-700 bg-blue-50">
                          🔵 Llanta 2<br/><span className="text-xs font-normal">{specs2.ancho}/{specs2.perfil}R{specs2.rin}</span>
                        </th>
                        <th className="p-3 text-center font-semibold text-gray-700">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">📏 Diámetro Total</td>
                        <td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.diametroTotal.pulgadas)}" <span className="text-gray-500 text-xs">({formatNum(specs1.diametroTotal.mm, 0)}mm)</span></td>
                        <td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.diametroTotal.pulgadas)}" <span className="text-gray-500 text-xs">({formatNum(specs2.diametroTotal.mm, 0)}mm)</span></td>
                        <td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.diametro).text}`}>{formatDif(diferencias.diametro)}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">↔️ Ancho</td>
                        <td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.anchoTotal.pulgadas, 2)}" <span className="text-gray-500 text-xs">({specs1.anchoTotal.mm}mm)</span></td>
                        <td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.anchoTotal.pulgadas, 2)}" <span className="text-gray-500 text-xs">({specs2.anchoTotal.mm}mm)</span></td>
                        <td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.ancho, 3, 6).text}`}>{formatDif(diferencias.ancho)}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">📐 Altura Lateral (Sidewall)</td>
                        <td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.alturaLateral.pulgadas, 2)}" <span className="text-gray-500 text-xs">({formatNum(specs1.alturaLateral.mm, 1)}mm)</span></td>
                        <td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.alturaLateral.pulgadas, 2)}" <span className="text-gray-500 text-xs">({formatNum(specs2.alturaLateral.mm, 1)}mm)</span></td>
                        <td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.perfil, 3, 6).text}`}>{formatDif(diferencias.perfil)}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">⭕ Circunferencia</td>
                        <td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.circunferencia.pulgadas, 1)}" <span className="text-gray-500 text-xs">({formatNum(specs1.circunferencia.mm, 0)}mm)</span></td>
                        <td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.circunferencia.pulgadas, 1)}" <span className="text-gray-500 text-xs">({formatNum(specs2.circunferencia.mm, 0)}mm)</span></td>
                        <td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.circunferencia).text}`}>{formatDif(diferencias.circunferencia)}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">🔄 Revoluciones/Milla</td>
                        <td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.revsPorMilla, 0)}</td>
                        <td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.revsPorMilla, 0)}</td>
                        <td className="p-3 text-center font-bold text-gray-600">{diferencias.revsPorMilla > 0 ? "+" : ""}{formatNum(diferencias.revsPorMilla, 0)}</td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="p-3 font-medium">🔄 Revoluciones/Km</td>
                        <td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.revsPorKm, 0)}</td>
                        <td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.revsPorKm, 0)}</td>
                        <td className="p-3 text-center text-gray-500">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error del Velocímetro */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className={`px-4 py-3 ${
                  Math.abs(diferencias.diametro) < 2 ? "bg-green-600" :
                  Math.abs(diferencias.diametro) < 4 ? "bg-yellow-500" : "bg-red-600"
                } text-white`}>
                  <h3 className="font-bold">🚗 Error del Velocímetro</h3>
                  <p className="text-sm opacity-90">Si cambias de Llanta 1 a Llanta 2</p>
                </div>
                
                <div className="p-4">
                  <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                    <div className={`text-center p-4 rounded-xl ${getColorDiferencia(diferencias.diametro).bg} ${getColorDiferencia(diferencias.diametro).border} border-2`}>
                      <div className="text-sm text-gray-600">Error del velocímetro</div>
                      <div className={`text-3xl font-bold ${getColorDiferencia(diferencias.diametro).text}`}>
                        {formatDif(diferencias.diametro)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 max-w-xs">
                      {diferencias.diametro > 0 ? (
                        <p>Tu velocímetro marcará <strong>menos</strong> de lo que realmente vas. Irás más rápido de lo que indica.</p>
                      ) : diferencias.diametro < 0 ? (
                        <p>Tu velocímetro marcará <strong>más</strong> de lo que realmente vas. Irás más lento de lo que indica.</p>
                      ) : (
                        <p>No hay diferencia significativa en el velocímetro.</p>
                      )}
                    </div>
                  </div>

                  {/* Tabla de velocidades */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs sm:text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left font-semibold">Velocímetro marca (km/h)</th>
                          {velocidades.slice(0, 7).map(v => (
                            <th key={v} className="p-2 text-center font-semibold">{v}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="bg-blue-50">
                          <td className="p-2 font-semibold text-blue-700">Velocidad Real (km/h)</td>
                          {velocidades.slice(0, 7).map(v => (
                            <td key={v} className={`p-2 text-center font-bold ${
                              Math.abs(calcularVelocidadReal(v) - v) < v * 0.02 ? "text-green-600" :
                              Math.abs(calcularVelocidadReal(v) - v) < v * 0.04 ? "text-yellow-600" : "text-red-600"
                            }`}>
                              {formatNum(calcularVelocidadReal(v), 1)}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recomendaciones */}
              <div className={`rounded-xl p-4 mb-4 ${
                Math.abs(diferencias.diametro) < 3 ? "bg-green-50 border-2 border-green-200" :
                Math.abs(diferencias.diametro) < 5 ? "bg-yellow-50 border-2 border-yellow-200" : "bg-red-50 border-2 border-red-200"
              }`}>
                <h3 className="font-bold text-gray-800 mb-2 flex items-center gap-2">
                  {Math.abs(diferencias.diametro) < 3 ? "✅" : Math.abs(diferencias.diametro) < 5 ? "⚠️" : "❌"}
                  Recomendación
                </h3>
                <p className="text-sm text-gray-700">
                  {Math.abs(diferencias.diametro) < 3 ? (
                    "Este cambio de llantas es compatible. La diferencia está dentro del rango aceptable (menor al 3%)."
                  ) : Math.abs(diferencias.diametro) < 5 ? (
                    "Precaución: La diferencia está entre 3% y 5%. Puede afectar ligeramente el velocímetro y consumo. Consulta con un especialista."
                  ) : (
                    "No recomendado: La diferencia es mayor al 5%. Esto puede causar problemas con el velocímetro, odómetro, consumo de combustible y desgaste irregular."
                  )}
                </p>
              </div>

              {/* Leyenda */}
              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-600 mb-4">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400"></span> Compatible (&lt;3%)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> Precaución (3-5%)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400"></span> No recomendado (&gt;5%)</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 p-4 border-t sticky bottom-0">
          <div className="flex justify-end">
            <button onClick={onClose} className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 font-semibold transition-all">
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparadorLlantas;