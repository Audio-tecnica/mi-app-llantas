import React, { useState, useMemo } from "react";

const parsearMedida = (referencia) => {
  if (!referencia) return null;
  const ref = referencia.toUpperCase().replace(/\s+/g, '');
  const patrones = [/(\d{3})[\/\-](\d{2,3})[R\/\-]?(\d{2})/i, /(\d{3})(\d{2})R?(\d{2})/i];
  for (const patron of patrones) {
    const match = ref.match(patron);
    if (match) return { ancho: parseInt(match[1]), perfil: parseInt(match[2]), rin: parseInt(match[3]) };
  }
  return null;
};

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
  return { ancho, perfil, rin, diametroTotal: { mm: diametroTotalMM, pulgadas: diametroTotalPulgadas }, anchoTotal: { mm: ancho, pulgadas: anchoPulgadas }, alturaLateral: { mm: alturaLateralMM, pulgadas: alturaLateralPulgadas }, circunferencia: { mm: circunferenciaMM, pulgadas: circunferenciaPulgadas }, revsPorMilla, revsPorKm };
};

// =============================================
// LLANTA BANDA DE RODAMIENTO (Vista de frente - para comparación lado a lado)
// =============================================
const LlantaBandaRodamiento = ({ specs, numero, alturaBase = 180 }) => {
  if (!specs) return null;
  const escalaAltura = specs.diametroTotal.pulgadas / 28;
  const escalaAncho = specs.anchoTotal.mm / 220;
  const altura = alturaBase * escalaAltura;
  const ancho = 55 * escalaAncho;
  const radio = ancho / 2;
  const filas = Math.floor((altura - radio * 1.2) / 8);
  
  return (
    <svg width={ancho + 4} height={altura + 4} viewBox={`0 0 ${ancho + 4} ${altura + 4}`}>
      <defs>
        <linearGradient id={`bg${numero}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a1a1a"/><stop offset="25%" stopColor="#2a2a2a"/><stop offset="50%" stopColor="#333"/><stop offset="75%" stopColor="#2a2a2a"/><stop offset="100%" stopColor="#1a1a1a"/>
        </linearGradient>
        <linearGradient id={`bl${numero}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#444"/><stop offset="100%" stopColor="#2a2a2a"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width={ancho - 2} height={altura - 2} rx={radio} fill="rgba(0,0,0,0.15)"/>
      <rect x="2" y="2" width={ancho - 2} height={altura - 2} rx={radio} fill={`url(#bg${numero})`}/>
      {[...Array(filas)].map((_, f) => {
        const y = 2 + radio * 0.5 + f * 8;
        const impar = f % 2 === 1;
        return (
          <g key={f}>
            {!impar ? (
              <>
                <rect x={5} y={y} width={ancho * 0.26} height={5} rx={1} fill={`url(#bl${numero})`}/>
                <rect x={5 + ancho * 0.30} y={y} width={ancho * 0.26} height={5} rx={1} fill={`url(#bl${numero})`}/>
                <rect x={5 + ancho * 0.60} y={y} width={ancho * 0.24} height={5} rx={1} fill={`url(#bl${numero})`}/>
              </>
            ) : (
              <>
                <rect x={3} y={y} width={ancho * 0.36} height={5} rx={1} fill={`url(#bl${numero})`}/>
                <rect x={3 + ancho * 0.42} y={y} width={ancho * 0.40} height={5} rx={1} fill={`url(#bl${numero})`}/>
              </>
            )}
          </g>
        );
      })}
      <line x1={ancho * 0.33} y1={radio * 0.6} x2={ancho * 0.33} y2={altura - radio * 0.4} stroke="#222" strokeWidth="1"/>
      <line x1={ancho * 0.66} y1={radio * 0.6} x2={ancho * 0.66} y2={altura - radio * 0.4} stroke="#222" strokeWidth="1"/>
      <text x={ancho / 2} y={altura / 2 + 6} textAnchor="middle" fill="white" fontSize="18" fontWeight="bold" fontFamily="Arial" style={{textShadow:'1px 1px 2px #000'}}>{numero}</text>
    </svg>
  );
};

// =============================================
// LLANTA CON RIN (Vista frontal completa)
// =============================================
const LlantaConRin = ({ specs, numero, size = 200 }) => {
  if (!specs) return null;
  const rinRatio = (specs.rin * 25.4) / specs.diametroTotal.mm;
  const llantaR = size / 2 - 2;
  const rinR = llantaR * rinRatio;
  const sidewallWidth = llantaR - rinR;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={`llantaRad${numero}`} cx="50%" cy="50%" r="50%">
          <stop offset="85%" stopColor="#1a1a1a"/><stop offset="100%" stopColor="#111"/>
        </radialGradient>
        <radialGradient id={`rinRad${numero}`} cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#555"/><stop offset="100%" stopColor="#222"/>
        </radialGradient>
      </defs>
      
      {/* Llanta exterior */}
      <circle cx={size/2} cy={size/2} r={llantaR} fill={`url(#llantaRad${numero})`}/>
      
      {/* Patrón banda de rodamiento */}
      {[...Array(60)].map((_, i) => (
        <line key={i} x1={size/2} y1="4" x2={size/2} y2="18" stroke="#222" strokeWidth="2" transform={`rotate(${i * 6} ${size/2} ${size/2})`}/>
      ))}
      
      {/* Sidewall */}
      <circle cx={size/2} cy={size/2} r={llantaR - 15} fill="#1f1f1f"/>
      <circle cx={size/2} cy={size/2} r={rinR + sidewallWidth * 0.15} fill="#252525"/>
      
      {/* Rin */}
      <circle cx={size/2} cy={size/2} r={rinR} fill={`url(#rinRad${numero})`}/>
      
      {/* Rayos del rin */}
      {[...Array(10)].map((_, i) => {
        const angle = (i * 36 - 90) * Math.PI / 180;
        const x1 = size/2 + Math.cos(angle) * rinR * 0.25;
        const y1 = size/2 + Math.sin(angle) * rinR * 0.25;
        const x2 = size/2 + Math.cos(angle) * rinR * 0.85;
        const y2 = size/2 + Math.sin(angle) * rinR * 0.85;
        const x3 = size/2 + Math.cos(angle + 0.15) * rinR * 0.85;
        const y3 = size/2 + Math.sin(angle + 0.15) * rinR * 0.85;
        const x4 = size/2 + Math.cos(angle + 0.15) * rinR * 0.25;
        const y4 = size/2 + Math.sin(angle + 0.15) * rinR * 0.25;
        return <polygon key={i} points={`${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`} fill="#1a1a1a"/>;
      })}
      
      {/* Centro */}
      <circle cx={size/2} cy={size/2} r={rinR * 0.22} fill="#333"/>
      <circle cx={size/2} cy={size/2} r={rinR * 0.12} fill="#222"/>
      
      {/* Número */}
      <text x={size/2} y={size/2 + 8} textAnchor="middle" fill="white" fontSize="24" fontWeight="bold" fontFamily="Arial">{numero}</text>
    </svg>
  );
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
function ComparadorLlantas({ llantas = [], onClose }) {
  const [medida1, setMedida1] = useState({ ancho: "215", perfil: "65", rin: "16" });
  const [medida2, setMedida2] = useState({ ancho: "225", perfil: "60", rin: "17" });
  const [llantaSeleccionada1, setLlantaSeleccionada1] = useState("");
  const [llantaSeleccionada2, setLlantaSeleccionada2] = useState("");
  const [modoIngreso, setModoIngreso] = useState("manual");

  const specs1 = useMemo(() => {
    if (modoIngreso === "inventario" && llantaSeleccionada1) {
      const llanta = llantas.find(l => l.id?.toString() === llantaSeleccionada1);
      if (llanta) return calcularEspecificaciones(parsearMedida(llanta.referencia));
    }
    return calcularEspecificaciones({ ancho: parseInt(medida1.ancho) || 0, perfil: parseInt(medida1.perfil) || 0, rin: parseInt(medida1.rin) || 0 });
  }, [medida1, llantaSeleccionada1, modoIngreso, llantas]);

  const specs2 = useMemo(() => {
    if (modoIngreso === "inventario" && llantaSeleccionada2) {
      const llanta = llantas.find(l => l.id?.toString() === llantaSeleccionada2);
      if (llanta) return calcularEspecificaciones(parsearMedida(llanta.referencia));
    }
    return calcularEspecificaciones({ ancho: parseInt(medida2.ancho) || 0, perfil: parseInt(medida2.perfil) || 0, rin: parseInt(medida2.rin) || 0 });
  }, [medida2, llantaSeleccionada2, modoIngreso, llantas]);

  const diferencias = useMemo(() => {
    if (!specs1 || !specs2) return null;
    const calcDif = (v1, v2) => ((v2 - v1) / v1) * 100;
    return { diametro: calcDif(specs1.diametroTotal.pulgadas, specs2.diametroTotal.pulgadas), ancho: calcDif(specs1.anchoTotal.mm, specs2.anchoTotal.mm), perfil: calcDif(specs1.alturaLateral.mm, specs2.alturaLateral.mm), circunferencia: calcDif(specs1.circunferencia.mm, specs2.circunferencia.mm), revsPorMilla: specs2.revsPorMilla - specs1.revsPorMilla };
  }, [specs1, specs2]);

  const velocidades = [20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120];
  const calcularVelocidadReal = (vel) => specs1 && specs2 ? vel * (specs2.diametroTotal.mm / specs1.diametroTotal.mm) : vel;
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
              <h2 className="text-xl sm:text-2xl font-bold">📊 Comparador de Llantas</h2>
              <p className="text-slate-300 text-sm mt-1 hidden sm:block">Compara medidas y especificaciones</p>
            </div>
            <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-2 w-10 h-10 flex items-center justify-center text-2xl">×</button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          {/* Selector de modo */}
          <div className="flex gap-2 mb-6 justify-center">
            <button onClick={() => setModoIngreso("manual")} className={`px-4 py-2 rounded-lg font-semibold text-sm ${modoIngreso === "manual" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>✏️ Manual</button>
            {llantas.length > 0 && <button onClick={() => setModoIngreso("inventario")} className={`px-4 py-2 rounded-lg font-semibold text-sm ${modoIngreso === "inventario" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>📦 Inventario</button>}
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <span className="font-bold text-amber-800">Llanta Original</span>
              </div>
              {modoIngreso === "manual" ? (
                <div className="flex items-center justify-center gap-1">
                  <input type="number" value={medida1.ancho} onChange={(e) => setMedida1({...medida1, ancho: e.target.value})} className="w-16 px-2 py-2 border-2 border-amber-300 rounded-lg text-center font-bold outline-none"/>
                  <span className="text-xl font-bold text-gray-400">/</span>
                  <input type="number" value={medida1.perfil} onChange={(e) => setMedida1({...medida1, perfil: e.target.value})} className="w-14 px-2 py-2 border-2 border-amber-300 rounded-lg text-center font-bold outline-none"/>
                  <span className="text-xl font-bold text-gray-400">R</span>
                  <input type="number" value={medida1.rin} onChange={(e) => setMedida1({...medida1, rin: e.target.value})} className="w-14 px-2 py-2 border-2 border-amber-300 rounded-lg text-center font-bold outline-none"/>
                </div>
              ) : (
                <select value={llantaSeleccionada1} onChange={(e) => setLlantaSeleccionada1(e.target.value)} className="w-full px-3 py-2 border-2 border-amber-300 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {llantas.map((ll) => <option key={ll.id} value={ll.id}>{ll.referencia} - {ll.marca}</option>)}
                </select>
              )}
            </div>
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold">2</span>
                <span className="font-bold text-blue-800">Llanta Nueva</span>
              </div>
              {modoIngreso === "manual" ? (
                <div className="flex items-center justify-center gap-1">
                  <input type="number" value={medida2.ancho} onChange={(e) => setMedida2({...medida2, ancho: e.target.value})} className="w-16 px-2 py-2 border-2 border-blue-300 rounded-lg text-center font-bold outline-none"/>
                  <span className="text-xl font-bold text-gray-400">/</span>
                  <input type="number" value={medida2.perfil} onChange={(e) => setMedida2({...medida2, perfil: e.target.value})} className="w-14 px-2 py-2 border-2 border-blue-300 rounded-lg text-center font-bold outline-none"/>
                  <span className="text-xl font-bold text-gray-400">R</span>
                  <input type="number" value={medida2.rin} onChange={(e) => setMedida2({...medida2, rin: e.target.value})} className="w-14 px-2 py-2 border-2 border-blue-300 rounded-lg text-center font-bold outline-none"/>
                </div>
              ) : (
                <select value={llantaSeleccionada2} onChange={(e) => setLlantaSeleccionada2(e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {llantas.map((ll) => <option key={ll.id} value={ll.id}>{ll.referencia} - {ll.marca}</option>)}
                </select>
              )}
            </div>
          </div>

          {specs1 && specs2 && diferencias && (
            <>
              {/* ============================================= */}
              {/* VISUALIZACIÓN PRINCIPAL - ESTILO TIRESIZE.COM */}
              {/* ============================================= */}
              <div className="bg-gradient-to-b from-gray-200 to-gray-300 rounded-xl p-4 mb-6">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
                  
                  {/* SECCIÓN IZQUIERDA: Comparación banda de rodamiento */}
                  <div className="bg-gray-400 rounded-xl p-4 flex flex-col items-center">
                    <div className="flex items-end">
                      {/* Medida altura izquierda */}
                      <div className="flex flex-col items-center mr-2" style={{height: `${180 * (specs1.diametroTotal.pulgadas / 28) + 4}px`}}>
                        <div className="h-full flex items-center">
                          <span className="text-white text-xs font-bold mr-1">{formatNum(specs1.diametroTotal.pulgadas)}"</span>
                          <div className="flex flex-col h-full items-center">
                            <div className="w-1.5 h-1.5 border-t border-l border-white"></div>
                            <div className="w-px bg-white flex-1"></div>
                            <div className="w-1.5 h-1.5 border-b border-l border-white"></div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Llanta 1 */}
                      <LlantaBandaRodamiento specs={specs1} numero={1} alturaBase={180} />
                      
                      {/* Llanta 2 */}
                      <LlantaBandaRodamiento specs={specs2} numero={2} alturaBase={180} />
                      
                      {/* Medida altura derecha */}
                      <div className="flex flex-col items-center ml-2" style={{height: `${180 * (specs2.diametroTotal.pulgadas / 28) + 4}px`}}>
                        <div className="h-full flex items-center">
                          <div className="flex flex-col h-full items-center">
                            <div className="w-1.5 h-1.5 border-t border-r border-yellow-400"></div>
                            <div className="w-px bg-yellow-400 flex-1"></div>
                            <div className="w-1.5 h-1.5 border-b border-r border-yellow-400"></div>
                          </div>
                          <span className="text-yellow-300 text-xs font-bold ml-1">{formatNum(specs2.diametroTotal.pulgadas)}"</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Medidas de ancho abajo */}
                    <div className="flex mt-2 gap-0">
                      <div className="flex flex-col items-center" style={{width: `${55 * (specs1.anchoTotal.mm / 220) + 4}px`}}>
                        <div className="flex items-center w-full">
                          <div className="h-1.5 w-1.5 border-l border-b border-white"></div>
                          <div className="h-px bg-white flex-1"></div>
                          <div className="h-1.5 w-1.5 border-r border-b border-white"></div>
                        </div>
                        <span className="text-white text-xs font-bold mt-1">{formatNum(specs1.anchoTotal.pulgadas, 1)}"</span>
                      </div>
                      <div className="flex flex-col items-center" style={{width: `${55 * (specs2.anchoTotal.mm / 220) + 4}px`}}>
                        <div className="flex items-center w-full">
                          <div className="h-1.5 w-1.5 border-l border-b border-yellow-400"></div>
                          <div className="h-px bg-yellow-400 flex-1"></div>
                          <div className="h-1.5 w-1.5 border-r border-b border-yellow-400"></div>
                        </div>
                        <span className="text-yellow-300 text-xs font-bold mt-1">{formatNum(specs2.anchoTotal.pulgadas, 1)}"</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* SECCIÓN CENTRO: Llanta 1 con rin y medidas */}
                  <div className="bg-gray-300 rounded-xl p-3 flex flex-col items-center relative">
                    {/* Medida del rin arriba */}
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                      <div className="flex items-center">
                        <div className="w-1 h-1 border-l border-t border-gray-600"></div>
                        <div className="h-px bg-gray-600 w-16"></div>
                        <div className="w-1 h-1 border-r border-t border-gray-600"></div>
                      </div>
                      <span className="text-gray-700 text-xs font-bold">{specs1.rin}"</span>
                    </div>
                    
                    <div className="mt-6 flex items-center">
                      <LlantaConRin specs={specs1} numero={1} size={160} />
                      
                      {/* Medida circunferencia derecha */}
                      <div className="flex items-center ml-1 h-32">
                        <div className="flex flex-col h-full items-center">
                          <div className="w-1 h-1 border-t border-r border-gray-600"></div>
                          <div className="w-px bg-gray-600 flex-1"></div>
                          <div className="w-1 h-1 border-b border-r border-gray-600"></div>
                        </div>
                        <span className="text-gray-700 text-xs font-bold ml-1 writing-mode-vertical" style={{writingMode: 'vertical-rl'}}>{formatNum(specs1.circunferencia.pulgadas, 1)}"</span>
                      </div>
                    </div>
                    
                    {/* Medida sidewall abajo */}
                    <div className="flex items-center mt-1">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <div className="h-1 w-1 border-l border-b border-gray-600"></div>
                          <div className="h-px bg-gray-600 w-10"></div>
                          <div className="h-1 w-1 border-r border-b border-gray-600"></div>
                        </div>
                        <span className="text-gray-700 text-xs font-bold">{formatNum(specs1.alturaLateral.pulgadas, 1)}"</span>
                      </div>
                    </div>
                    
                    {/* Revs/Mile */}
                    <div className="mt-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {Math.round(specs1.revsPorMilla)} Revs/Mile
                    </div>
                  </div>
                  
                  {/* SECCIÓN DERECHA: Llanta 2 con rin y medidas */}
                  <div className="bg-gray-300 rounded-xl p-3 flex flex-col items-center relative">
                    {/* Medida del rin arriba */}
                    <div className="absolute top-1 right-2 flex flex-col items-end">
                      <div className="flex items-center">
                        <div className="w-1 h-1 border-l border-t border-amber-500"></div>
                        <div className="h-px bg-amber-500 w-12"></div>
                        <div className="w-1 h-1 border-r border-t border-amber-500"></div>
                      </div>
                      <span className="text-amber-600 text-xs font-bold">{specs2.rin}"</span>
                    </div>
                    
                    <div className="mt-6 flex items-center">
                      <LlantaConRin specs={specs2} numero={2} size={160 * (specs2.diametroTotal.pulgadas / specs1.diametroTotal.pulgadas)} />
                      
                      {/* Medida circunferencia derecha */}
                      <div className="flex items-center ml-1" style={{height: `${130 * (specs2.diametroTotal.pulgadas / specs1.diametroTotal.pulgadas)}px`}}>
                        <div className="flex flex-col h-full items-center">
                          <div className="w-1 h-1 border-t border-r border-amber-500"></div>
                          <div className="w-px bg-amber-500 flex-1"></div>
                          <div className="w-1 h-1 border-b border-r border-amber-500"></div>
                        </div>
                        <span className="text-amber-600 text-xs font-bold ml-1" style={{writingMode: 'vertical-rl'}}>{formatNum(specs2.circunferencia.pulgadas, 1)}"</span>
                      </div>
                    </div>
                    
                    {/* Medida sidewall abajo */}
                    <div className="flex items-center mt-1">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center">
                          <div className="h-1 w-1 border-l border-b border-amber-500"></div>
                          <div className="h-px bg-amber-500 w-10"></div>
                          <div className="h-1 w-1 border-r border-b border-amber-500"></div>
                        </div>
                        <span className="text-amber-600 text-xs font-bold">{formatNum(specs2.alturaLateral.pulgadas, 1)}"</span>
                      </div>
                    </div>
                    
                    {/* Revs/Mile */}
                    <div className="mt-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {Math.round(specs2.revsPorMilla)} Revs/Mile
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabla de especificaciones */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className="bg-slate-700 text-white px-4 py-3"><h3 className="font-bold">📋 Especificaciones Técnicas</h3></div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-3 text-left">Especificación</th>
                        <th className="p-3 text-center bg-amber-50 text-amber-700">{specs1.ancho}/{specs1.perfil}R{specs1.rin}</th>
                        <th className="p-3 text-center bg-blue-50 text-blue-700">{specs2.ancho}/{specs2.perfil}R{specs2.rin}</th>
                        <th className="p-3 text-center">Diferencia</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr><td className="p-3">📏 Diámetro</td><td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.diametroTotal.pulgadas)}" | {formatNum(specs1.diametroTotal.mm,0)}mm</td><td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.diametroTotal.pulgadas)}" | {formatNum(specs2.diametroTotal.mm,0)}mm</td><td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.diametro).text}`}>{formatDif(diferencias.diametro)}</td></tr>
                      <tr><td className="p-3">↔️ Ancho</td><td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.anchoTotal.pulgadas,1)}" | {specs1.anchoTotal.mm}mm</td><td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.anchoTotal.pulgadas,1)}" | {specs2.anchoTotal.mm}mm</td><td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.ancho,3,6).text}`}>{formatDif(diferencias.ancho)}</td></tr>
                      <tr><td className="p-3">📐 Sidewall</td><td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.alturaLateral.pulgadas,2)}" | {formatNum(specs1.alturaLateral.mm,1)}mm</td><td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.alturaLateral.pulgadas,2)}" | {formatNum(specs2.alturaLateral.mm,1)}mm</td><td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.perfil,3,6).text}`}>{formatDif(diferencias.perfil)}</td></tr>
                      <tr><td className="p-3">⭕ Circunferencia</td><td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.circunferencia.pulgadas,1)}" | {formatNum(specs1.circunferencia.mm,0)}mm</td><td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.circunferencia.pulgadas,1)}" | {formatNum(specs2.circunferencia.mm,0)}mm</td><td className={`p-3 text-center font-bold ${getColorDiferencia(diferencias.circunferencia).text}`}>{formatDif(diferencias.circunferencia)}</td></tr>
                      <tr><td className="p-3">🔄 Revs/Mile</td><td className="p-3 text-center bg-amber-50/50 font-bold">{formatNum(specs1.revsPorMilla,0)}</td><td className="p-3 text-center bg-blue-50/50 font-bold">{formatNum(specs2.revsPorMilla,0)}</td><td className="p-3 text-center">{diferencias.revsPorMilla > 0 ? "+" : ""}{formatNum(diferencias.revsPorMilla,0)}</td></tr>
                      <tr><td className="p-3">🔄 Revs/Km</td><td className="p-3 text-center bg-amber-50/50">{formatNum(specs1.revsPorKm,0)}</td><td className="p-3 text-center bg-blue-50/50">{formatNum(specs2.revsPorKm,0)}</td><td className="p-3 text-center">—</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Error del Velocímetro */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <div className={`px-4 py-3 text-white ${Math.abs(diferencias.diametro) < 2 ? "bg-green-600" : Math.abs(diferencias.diametro) < 4 ? "bg-yellow-500" : "bg-red-600"}`}>
                  <h3 className="font-bold">🚗 Error del Velocímetro</h3>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap items-center justify-center gap-4 mb-4">
                    <div className={`text-center p-4 rounded-xl border-2 ${getColorDiferencia(diferencias.diametro).bg} ${getColorDiferencia(diferencias.diametro).border}`}>
                      <div className="text-sm text-gray-600">Error</div>
                      <div className={`text-3xl font-bold ${getColorDiferencia(diferencias.diametro).text}`}>{formatDif(diferencias.diametro)}</div>
                    </div>
                    <div className="text-sm text-gray-600 max-w-xs">
                      {diferencias.diametro > 0 ? <p>Velocímetro marca <strong>menos</strong> de lo real. A 100 km/h vas a {formatNum(calcularVelocidadReal(100),1)} km/h.</p> : diferencias.diametro < 0 ? <p>Velocímetro marca <strong>más</strong> de lo real. A 100 km/h vas a {formatNum(calcularVelocidadReal(100),1)} km/h.</p> : <p>Sin diferencia significativa.</p>}
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100"><tr><th className="p-2 text-left">Velocímetro</th>{velocidades.map(v => <th key={v} className="p-2 text-center">{v}</th>)}</tr></thead>
                      <tbody>
                        <tr className="bg-blue-50"><td className="p-2 font-bold text-blue-700">Real (km/h)</td>{velocidades.map(v => { const real = calcularVelocidadReal(v); const diff = Math.abs(real - v); return <td key={v} className={`p-2 text-center font-bold ${diff < v * 0.02 ? "text-green-600" : diff < v * 0.04 ? "text-yellow-600" : "text-red-600"}`}>{formatNum(real, 1)}</td>; })}</tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Recomendación */}
              <div className={`rounded-xl p-4 mb-4 border-2 ${Math.abs(diferencias.diametro) < 3 ? "bg-green-50 border-green-300" : Math.abs(diferencias.diametro) < 5 ? "bg-yellow-50 border-yellow-300" : "bg-red-50 border-red-300"}`}>
                <h3 className="font-bold text-lg mb-2">{Math.abs(diferencias.diametro) < 3 ? "✅ Compatible" : Math.abs(diferencias.diametro) < 5 ? "⚠️ Precaución" : "❌ No Recomendado"}</h3>
                <p className="text-gray-700 text-sm">{Math.abs(diferencias.diametro) < 3 ? "Cambio seguro. Diferencia menor al 3%." : Math.abs(diferencias.diametro) < 5 ? "Diferencia 3-5%. Puede afectar velocímetro y consumo." : "Diferencia mayor al 5%. Consulta con un profesional."}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400"></span> &lt;3%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> 3-5%</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400"></span> &gt;5%</span>
              </div>
            </>
          )}
        </div>

        <div className="bg-gray-100 p-4 border-t sticky bottom-0">
          <div className="flex justify-end">
            <button onClick={onClose} className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 font-semibold">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparadorLlantas;