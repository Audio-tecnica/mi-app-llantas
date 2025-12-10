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
// LLANTA MICKEY THOMPSON BAJA LEGEND - BANDA DE RODAMIENTO
// =============================================
const LlantaBandaRodamiento = ({ specs, numero, alturaBase = 180 }) => {
  if (!specs) return null;
  const escalaAltura = specs.diametroTotal.pulgadas / 28;
  const escalaAncho = specs.anchoTotal.mm / 220;
  const altura = alturaBase * escalaAltura;
  const ancho = 60 * escalaAncho;
  // Radio más pequeño para extremos más cuadrados (como llanta real)
  const radio = ancho * 0.35;
  
  return (
    <svg width={ancho + 8} height={altura + 6} viewBox={`0 0 ${ancho + 8} ${altura + 6}`}>
      <defs>
        <linearGradient id={`mg${numero}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#1a1a1a"/><stop offset="20%" stopColor="#2d2d2d"/><stop offset="50%" stopColor="#3a3a3a"/><stop offset="80%" stopColor="#2d2d2d"/><stop offset="100%" stopColor="#1a1a1a"/>
        </linearGradient>
        <linearGradient id={`bg${numero}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4d4d4d"/><stop offset="100%" stopColor="#333"/>
        </linearGradient>
        <linearGradient id={`sg${numero}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#4a4a4a"/><stop offset="100%" stopColor="#333"/>
        </linearGradient>
      </defs>
      
      {/* Sombra */}
      <rect x="6" y="5" width={ancho} height={altura} rx={radio} fill="rgba(0,0,0,0.25)"/>
      
      {/* Cuerpo principal - rx más pequeño = más cuadrado */}
      <rect x="4" y="3" width={ancho} height={altura} rx={radio} fill={`url(#mg${numero})`}/>
      
      {/* Hombros izquierdos - shoulder lugs */}
      {[...Array(Math.floor((altura - radio) / 14))].map((_, i) => (
        <g key={`sl${i}`}>
          <rect x="1" y={3 + radio * 0.5 + i * 14} width="7" height="10" rx="2" fill={`url(#sg${numero})`}/>
          <rect x="2" y={5 + radio * 0.5 + i * 14} width="4" height="6" rx="1" fill="#555"/>
        </g>
      ))}
      
      {/* Hombros derechos */}
      {[...Array(Math.floor((altura - radio) / 14))].map((_, i) => (
        <g key={`sr${i}`}>
          <rect x={ancho - 2} y={3 + radio * 0.5 + i * 14 + 7} width="7" height="10" rx="2" fill={`url(#sg${numero})`}/>
          <rect x={ancho - 1} y={5 + radio * 0.5 + i * 14 + 7} width="4" height="6" rx="1" fill="#555"/>
        </g>
      ))}
      
      {/* Patrón Baja Legend - Bloques en chevron */}
      {[...Array(Math.floor((altura - radio * 0.8) / 10))].map((_, f) => {
        const y = 3 + radio * 0.4 + f * 10;
        const off = (f % 2) * 4;
        return (
          <g key={`r${f}`}>
            {/* Bloque izquierdo */}
            <path d={`M ${7 + off} ${y} L ${7 + off + ancho * 0.22} ${y + 1.5} L ${7 + off + ancho * 0.20} ${y + 7} L ${6 + off} ${y + 6} Z`} fill={`url(#bg${numero})`}/>
            
            {/* Bloque central chevron */}
            <path d={`M ${ancho * 0.32 + off} ${y + 1} L ${ancho * 0.50 + 4} ${y + 2.5} L ${ancho * 0.68 - off} ${y + 1} L ${ancho * 0.65 - off} ${y + 7} L ${ancho * 0.50 + 4} ${y + 5.5} L ${ancho * 0.35 + off} ${y + 7} Z`} fill={`url(#bg${numero})`}/>
            
            {/* Bloque derecho */}
            <path d={`M ${ancho * 0.72 - off} ${y} L ${ancho - 2 - off} ${y + 1} L ${ancho - off} ${y + 6} L ${ancho * 0.70 - off} ${y + 7} Z`} fill={`url(#bg${numero})`}/>
            
            {/* Sipes */}
            <path d={`M ${10 + off} ${y + 3} Q ${13 + off} ${y + 2.5} ${15 + off} ${y + 4}`} stroke="#222" strokeWidth="0.5" fill="none"/>
          </g>
        );
      })}
      
      {/* Canal central zigzag */}
      <path d={`M ${ancho * 0.50 + 4} ${radio * 0.5} ${[...Array(Math.floor(altura / 12))].map((_, i) => `L ${ancho * (0.46 + (i % 2) * 0.08) + 4} ${radio * 0.5 + i * 12 + 6}`).join(' ')}`} stroke="#1a1a1a" strokeWidth="2" fill="none"/>
      
      {/* Ranuras laterales */}
      <line x1={ancho * 0.28 + 4} y1={radio * 0.6} x2={ancho * 0.30 + 4} y2={altura - radio * 0.5} stroke="#1f1f1f" strokeWidth="1.5"/>
      <line x1={ancho * 0.72 + 4} y1={radio * 0.6} x2={ancho * 0.70 + 4} y2={altura - radio * 0.5} stroke="#1f1f1f" strokeWidth="1.5"/>
      
      {/* Número - más grande y centrado DENTRO de la llanta */}
      <ellipse cx={ancho / 2 + 4} cy={altura / 2 + 3} rx={ancho * 0.28} ry={altura * 0.08} fill="rgba(0,0,0,0.5)"/>
      <text x={ancho / 2 + 4} y={altura / 2 + 9} textAnchor="middle" fill="white" fontSize="26" fontWeight="bold" fontFamily="Arial Black" style={{textShadow: '2px 2px 4px #000'}}>{numero}</text>
    </svg>
  );
};

// =============================================
// =============================================
// LLANTA MICKEY THOMPSON - VISTA FRONTAL CON RIN 8 RAYOS
// =============================================
const LlantaConRin = ({ specs, numero, size = 200 }) => {
  if (!specs) return null;
  const rinRatio = (specs.rin * 25.4) / specs.diametroTotal.mm;
  const llantaR = size / 2 - 2;
  const rinR = llantaR * rinRatio;
  const cx = size / 2;
  const cy = size / 2;
  
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id={`tr${numero}`} cx="50%" cy="50%" r="50%">
          <stop offset="80%" stopColor="#252525"/><stop offset="95%" stopColor="#1a1a1a"/><stop offset="100%" stopColor="#111"/>
        </radialGradient>
        <radialGradient id={`rr${numero}`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#4a4a4a"/><stop offset="50%" stopColor="#333"/><stop offset="100%" stopColor="#1a1a1a"/>
        </radialGradient>
        <linearGradient id={`sp${numero}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#555"/><stop offset="50%" stopColor="#3a3a3a"/><stop offset="100%" stopColor="#222"/>
        </linearGradient>
      </defs>
      
      {/* Llanta exterior */}
      <circle cx={cx} cy={cy} r={llantaR} fill={`url(#tr${numero})`}/>
      
      {/* Shoulder lugs */}
      {[...Array(36)].map((_, i) => {
        const angle = (i * 10) * Math.PI / 180;
        return <line key={i} x1={cx + Math.cos(angle) * (llantaR - 1)} y1={cy + Math.sin(angle) * (llantaR - 1)} x2={cx + Math.cos(angle) * (llantaR - 12)} y2={cy + Math.sin(angle) * (llantaR - 12)} stroke="#1a1a1a" strokeWidth="3"/>;
      })}
      
      {/* Banda de rodamiento */}
      <circle cx={cx} cy={cy} r={llantaR - 7} fill="none" stroke="#333" strokeWidth="10"/>
      
      {/* Bloques tread */}
      {[...Array(24)].map((_, i) => {
        const angle = (i * 15) * Math.PI / 180;
        const r1 = llantaR - 4, r2 = llantaR - 16;
        return <path key={i} d={`M ${cx + Math.cos(angle - 0.08) * r1} ${cy + Math.sin(angle - 0.08) * r1} L ${cx + Math.cos(angle + 0.08) * r1} ${cy + Math.sin(angle + 0.08) * r1} L ${cx + Math.cos(angle + 0.06) * r2} ${cy + Math.sin(angle + 0.06) * r2} L ${cx + Math.cos(angle - 0.06) * r2} ${cy + Math.sin(angle - 0.06) * r2} Z`} fill="#444"/>;
      })}
      
      {/* Sidewall */}
      <circle cx={cx} cy={cy} r={llantaR - 18} fill="#1f1f1f"/>
      <circle cx={cx} cy={cy} r={llantaR - 22} fill="#252525"/>
      
      {/* Rin */}
      <circle cx={cx} cy={cy} r={rinR + 4} fill="#2a2a2a"/>
      <circle cx={cx} cy={cy} r={rinR} fill={`url(#rr${numero})`}/>
      
      {/* 8 Rayos split-spoke */}
      {[...Array(8)].map((_, i) => {
        const angle = (i * 45 - 22.5) * Math.PI / 180;
        const innerR = rinR * 0.28, outerR = rinR * 0.88, w = 0.18;
        const x1 = cx + Math.cos(angle - w) * innerR, y1 = cy + Math.sin(angle - w) * innerR;
        const x2 = cx + Math.cos(angle + w) * innerR, y2 = cy + Math.sin(angle + w) * innerR;
        const x3 = cx + Math.cos(angle + w * 0.7) * outerR, y3 = cy + Math.sin(angle + w * 0.7) * outerR;
        const x4 = cx + Math.cos(angle - w * 0.7) * outerR, y4 = cy + Math.sin(angle - w * 0.7) * outerR;
        const mx = cx + Math.cos(angle) * (rinR * 0.55), my = cy + Math.sin(angle) * (rinR * 0.55);
        return (
          <g key={i}>
            <path d={`M ${x1} ${y1} L ${x4} ${y4} L ${x3} ${y3} L ${x2} ${y2} Z`} fill={`url(#sp${numero})`} stroke="#222" strokeWidth="0.5"/>
            <rect x={mx - 5} y={my - 3} width="10" height="6" rx="1" fill="#1a1a1a" transform={`rotate(${i * 45} ${mx} ${my})`}/>
          </g>
        );
      })}
      
      {/* Centro */}
      <circle cx={cx} cy={cy} r={rinR * 0.25} fill="#333" stroke="#222" strokeWidth="1.5"/>
      <circle cx={cx} cy={cy} r={rinR * 0.15} fill="#2a2a2a"/>
      
      {/* Tornillos */}
      {[...Array(6)].map((_, i) => {
        const angle = (i * 60) * Math.PI / 180;
        return <circle key={i} cx={cx + Math.cos(angle) * (rinR * 0.18)} cy={cy + Math.sin(angle) * (rinR * 0.18)} r="2.5" fill="#222" stroke="#444" strokeWidth="0.5"/>;
      })}
      
      <circle cx={cx} cy={cy} r={rinR * 0.07} fill="#444"/>
      <text x={cx} y={cy + 6} textAnchor="middle" fill="white" fontSize="20" fontWeight="bold" fontFamily="Arial Black" style={{textShadow: '1px 1px 3px #000'}}>{numero}</text>
    </svg>
  );
};

// =============================================
// COMPONENTE PRINCIPAL
// =============================================
function ComparadorLlantas({ llantas = [], onClose }) {
  const [referencia1, setReferencia1] = useState("265/65R17");
  const [referencia2, setReferencia2] = useState("265/70R17");
  const [llantaSeleccionada1, setLlantaSeleccionada1] = useState("");
  const [llantaSeleccionada2, setLlantaSeleccionada2] = useState("");
  const [modoIngreso, setModoIngreso] = useState("manual");
  const [unidad, setUnidad] = useState("pulgadas");
  const [mostrarEquivalencias, setMostrarEquivalencias] = useState(false);
  const [precio1, setPrecio1] = useState("");
  const [precio2, setPrecio2] = useState("");

  // Función para formatear referencia automáticamente
  const formatearReferencia = (valor) => {
    // Eliminar todo excepto números
    const numeros = valor.replace(/[^\d]/g, '');
    
    // Si tiene 7-8 dígitos, formatear como XXX/XXRXX
    if (numeros.length >= 6) {
      const ancho = numeros.slice(0, 3);
      const perfil = numeros.slice(3, 5);
      const rin = numeros.slice(5, 7);
      return `${ancho}/${perfil}R${rin}`;
    }
    return valor;
  };

  // Manejar cambio de referencia con autoformato
  const handleReferenciaChange = (valor, setReferencia) => {
    // Si el usuario está borrando, no formatear
    if (valor.length < 3) {
      setReferencia(valor);
      return;
    }
    
    // Solo números sin formato
    const soloNumeros = valor.replace(/[^\d]/g, '');
    
    // Si tiene suficientes números, formatear
    if (soloNumeros.length >= 6) {
      setReferencia(formatearReferencia(soloNumeros));
    } else {
      setReferencia(valor);
    }
  };

  // Parsear referencia del campo de texto
  const parsearReferenciaTexto = (ref) => {
    const parsed = parsearMedida(ref);
    return parsed;
  };

  const specs1 = useMemo(() => {
    if (modoIngreso === "inventario" && llantaSeleccionada1) {
      const llanta = llantas.find(l => l.id?.toString() === llantaSeleccionada1);
      if (llanta) return calcularEspecificaciones(parsearMedida(llanta.referencia));
    }
    return calcularEspecificaciones(parsearMedida(referencia1));
  }, [referencia1, llantaSeleccionada1, modoIngreso, llantas]);

  const specs2 = useMemo(() => {
    if (modoIngreso === "inventario" && llantaSeleccionada2) {
      const llanta = llantas.find(l => l.id?.toString() === llantaSeleccionada2);
      if (llanta) return calcularEspecificaciones(parsearMedida(llanta.referencia));
    }
    return calcularEspecificaciones(parsearMedida(referencia2));
  }, [referencia2, llantaSeleccionada2, modoIngreso, llantas]);

  // Calcular equivalencias (medidas alternativas con diferencia <3%)
  const equivalencias = useMemo(() => {
    if (!specs1) return [];
    const anchos = [205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315];
    const perfiles = [45, 50, 55, 60, 65, 70, 75, 80, 85];
    const rines = [15, 16, 17, 18, 19, 20, 21, 22];
    const equiv = [];
    
    for (const ancho of anchos) {
      for (const perfil of perfiles) {
        for (const rin of rines) {
          const specsAlt = calcularEspecificaciones({ ancho, perfil, rin });
          if (specsAlt) {
            const difDiametro = Math.abs((specsAlt.diametroTotal.mm - specs1.diametroTotal.mm) / specs1.diametroTotal.mm * 100);
            if (difDiametro <= 3 && difDiametro > 0.1) {
              equiv.push({
                referencia: `${ancho}/${perfil}R${rin}`,
                specs: specsAlt,
                diferencia: difDiametro
              });
            }
          }
        }
      }
    }
    return equiv.sort((a, b) => a.diferencia - b.diferencia).slice(0, 12);
  }, [specs1]);

  const diferencias = useMemo(() => {
    if (!specs1 || !specs2) return null;
    const calcDif = (v1, v2) => ((v2 - v1) / v1) * 100;
    return { diametro: calcDif(specs1.diametroTotal.pulgadas, specs2.diametroTotal.pulgadas), ancho: calcDif(specs1.anchoTotal.mm, specs2.anchoTotal.mm), perfil: calcDif(specs1.alturaLateral.mm, specs2.alturaLateral.mm), circunferencia: calcDif(specs1.circunferencia.mm, specs2.circunferencia.mm), revsPorMilla: specs2.revsPorMilla - specs1.revsPorMilla };
  }, [specs1, specs2]);

  // Formatear precio
  const formatPrecio = (precio) => {
    if (!precio) return "";
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(precio);
  };

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
          {/* Selector de modo y unidades */}
          <div className="flex flex-wrap gap-2 mb-6 justify-center items-center">
            <div className="flex gap-2">
              <button onClick={() => setModoIngreso("manual")} className={`px-4 py-2 rounded-lg font-semibold text-sm ${modoIngreso === "manual" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>✏️ Manual</button>
              {llantas.length > 0 && <button onClick={() => setModoIngreso("inventario")} className={`px-4 py-2 rounded-lg font-semibold text-sm ${modoIngreso === "inventario" ? "bg-slate-700 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>📦 Inventario</button>}
            </div>
            <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
            {/* Toggle de unidades */}
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setUnidad("pulgadas")} 
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${unidad === "pulgadas" ? "bg-amber-500 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}
              >
                Pulgadas
              </button>
              <button 
                onClick={() => setUnidad("mm")} 
                className={`px-3 py-1.5 rounded-md text-sm font-semibold transition-all ${unidad === "mm" ? "bg-amber-500 text-white shadow" : "text-gray-600 hover:bg-gray-200"}`}
              >
                Milímetros
              </button>
            </div>
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <span className="font-bold text-amber-800">Llanta Original (OEM)</span>
              </div>
              {modoIngreso === "manual" ? (
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={referencia1} 
                    onChange={(e) => handleReferenciaChange(e.target.value, setReferencia1)}
                    placeholder="Ej: 2656517 o 265/65R17"
                    className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg text-center text-xl font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">💰 Precio:</span>
                    <input 
                      type="number" 
                      value={precio1} 
                      onChange={(e) => setPrecio1(e.target.value)}
                      placeholder="$ Opcional"
                      className="flex-1 px-2 py-1 border border-amber-200 rounded text-sm outline-none"
                    />
                  </div>
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
                <div className="space-y-2">
                  <input 
                    type="text" 
                    value={referencia2} 
                    onChange={(e) => handleReferenciaChange(e.target.value, setReferencia2)}
                    placeholder="Ej: 2657017 o 265/70R17"
                    className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg text-center text-xl font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">💰 Precio:</span>
                    <input 
                      type="number" 
                      value={precio2} 
                      onChange={(e) => setPrecio2(e.target.value)}
                      placeholder="$ Opcional"
                      className="flex-1 px-2 py-1 border border-blue-200 rounded text-sm outline-none"
                    />
                  </div>
                </div>
              ) : (
                <select value={llantaSeleccionada2} onChange={(e) => setLlantaSeleccionada2(e.target.value)} className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg">
                  <option value="">Seleccionar...</option>
                  {llantas.map((ll) => <option key={ll.id} value={ll.id}>{ll.referencia} - {ll.marca}</option>)}
                </select>
              )}
            </div>
          </div>

          {/* Calculadora de precios (si hay precios ingresados) */}
          {(precio1 || precio2) && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-xl p-4 mb-6">
              <h3 className="font-bold text-green-800 mb-3">💰 Calculadora de Precios</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {precio1 && (
                  <>
                    <div className="bg-white rounded-lg p-2 border border-amber-200">
                      <div className="text-xs text-gray-500">Llanta 1 (x1)</div>
                      <div className="font-bold text-amber-600">{formatPrecio(precio1)}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-amber-200">
                      <div className="text-xs text-gray-500">Juego x4</div>
                      <div className="font-bold text-amber-600">{formatPrecio(precio1 * 4)}</div>
                    </div>
                  </>
                )}
                {precio2 && (
                  <>
                    <div className="bg-white rounded-lg p-2 border border-blue-200">
                      <div className="text-xs text-gray-500">Llanta 2 (x1)</div>
                      <div className="font-bold text-blue-600">{formatPrecio(precio2)}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-blue-200">
                      <div className="text-xs text-gray-500">Juego x4</div>
                      <div className="font-bold text-blue-600">{formatPrecio(precio2 * 4)}</div>
                    </div>
                  </>
                )}
              </div>
              {precio1 && precio2 && (
                <div className="mt-3 text-center">
                  <span className={`text-sm font-bold ${Number(precio2) > Number(precio1) ? 'text-red-600' : 'text-green-600'}`}>
                    {Number(precio2) > Number(precio1) 
                      ? `⬆️ Llanta 2 es ${formatPrecio(Math.abs(precio2 - precio1))} más cara (${formatPrecio(Math.abs(precio2 - precio1) * 4)} x4)`
                      : Number(precio2) < Number(precio1)
                        ? `⬇️ Llanta 2 es ${formatPrecio(Math.abs(precio1 - precio2))} más barata (${formatPrecio(Math.abs(precio1 - precio2) * 4)} x4)`
                        : '= Mismo precio'
                    }
                  </span>
                </div>
              )}
            </div>
          )}

          {specs1 && specs2 && diferencias && (
            <>
              {/* ============================================= */}
              {/* VISUALIZACIÓN PRINCIPAL - ESTILO TIRESIZE.COM */}
              {/* ============================================= */}
              <div className="bg-gradient-to-b from-gray-500 to-gray-600 rounded-xl p-4 mb-6">
                <div className="flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-8">
                  
                  {/* SECCIÓN IZQUIERDA: Comparación banda de rodamiento */}
                  <div className="bg-gray-500 rounded-xl p-4 flex flex-col items-center">
                    <div className="flex items-end">
                      {/* Medida altura izquierda */}
                      <div className="flex flex-col items-center mr-2" style={{height: `${180 * (specs1.diametroTotal.pulgadas / 28) + 6}px`}}>
                        <div className="h-full flex items-center">
                          <span className="text-white text-xs font-bold mr-1">
                            {unidad === "pulgadas" ? `${formatNum(specs1.diametroTotal.pulgadas)}"` : `${formatNum(specs1.diametroTotal.mm, 0)}mm`}
                          </span>
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
                      
                      {/* Medida altura derecha + DIFERENCIA */}
                      <div className="flex flex-col items-center ml-2" style={{height: `${180 * (specs2.diametroTotal.pulgadas / 28) + 6}px`}}>
                        <div className="h-full flex items-center">
                          <div className="flex flex-col h-full items-center">
                            <div className="w-1.5 h-1.5 border-t border-r border-yellow-400"></div>
                            <div className="w-px bg-yellow-400 flex-1"></div>
                            <div className="w-1.5 h-1.5 border-b border-r border-yellow-400"></div>
                          </div>
                          <div className="flex flex-col ml-1">
                            <span className="text-yellow-300 text-xs font-bold">
                              {unidad === "pulgadas" ? `${formatNum(specs2.diametroTotal.pulgadas)}"` : `${formatNum(specs2.diametroTotal.mm, 0)}mm`}
                            </span>
                            {/* Diferencia de altura */}
                            <span className={`text-xs font-bold ${diferencias.diametro >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {diferencias.diametro >= 0 ? '↑' : '↓'} {unidad === "pulgadas" 
                                ? `${Math.abs(specs2.diametroTotal.pulgadas - specs1.diametroTotal.pulgadas).toFixed(2)}"` 
                                : `${Math.abs(specs2.diametroTotal.mm - specs1.diametroTotal.mm).toFixed(1)}mm`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Medidas de ancho abajo */}
                    <div className="flex mt-3 gap-1 items-start">
                      <div className="flex flex-col items-center" style={{width: `${60 * (specs1.anchoTotal.mm / 220) + 8}px`}}>
                        <div className="flex items-center w-full">
                          <div className="h-1.5 w-1.5 border-l border-b border-white"></div>
                          <div className="h-px bg-white flex-1"></div>
                          <div className="h-1.5 w-1.5 border-r border-b border-white"></div>
                        </div>
                        <span className="text-white text-xs font-bold mt-1">
                          {unidad === "pulgadas" ? `${formatNum(specs1.anchoTotal.pulgadas, 1)}"` : `${specs1.anchoTotal.mm}mm`}
                        </span>
                      </div>
                      <div className="flex flex-col items-center" style={{width: `${60 * (specs2.anchoTotal.mm / 220) + 8}px`}}>
                        <div className="flex items-center w-full">
                          <div className="h-1.5 w-1.5 border-l border-b border-yellow-400"></div>
                          <div className="h-px bg-yellow-400 flex-1"></div>
                          <div className="h-1.5 w-1.5 border-r border-b border-yellow-400"></div>
                        </div>
                        <span className="text-yellow-300 text-xs font-bold mt-1">
                          {unidad === "pulgadas" ? `${formatNum(specs2.anchoTotal.pulgadas, 1)}"` : `${specs2.anchoTotal.mm}mm`}
                        </span>
                        {/* Diferencia de ancho */}
                        {specs2.anchoTotal.mm !== specs1.anchoTotal.mm && (
                          <span className={`text-xs font-bold ${diferencias.ancho >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {diferencias.ancho >= 0 ? '↑' : '↓'} {unidad === "pulgadas" 
                              ? `${Math.abs(specs2.anchoTotal.pulgadas - specs1.anchoTotal.pulgadas).toFixed(2)}"` 
                              : `${Math.abs(specs2.anchoTotal.mm - specs1.anchoTotal.mm)}mm`}
                          </span>
                        )}
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
                        <span className="text-gray-700 text-xs font-bold ml-1" style={{writingMode: 'vertical-rl'}}>
                          {unidad === "pulgadas" ? `${formatNum(specs1.circunferencia.pulgadas, 1)}"` : `${formatNum(specs1.circunferencia.mm, 0)}mm`}
                        </span>
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
                        <span className="text-gray-700 text-xs font-bold">
                          {unidad === "pulgadas" ? `${formatNum(specs1.alturaLateral.pulgadas, 1)}"` : `${formatNum(specs1.alturaLateral.mm, 0)}mm`}
                        </span>
                      </div>
                    </div>
                    
                    {/* Revs/Mile o Revs/Km */}
                    <div className="mt-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {unidad === "pulgadas" ? `${Math.round(specs1.revsPorMilla)} Revs/Mile` : `${Math.round(specs1.revsPorKm)} Revs/Km`}
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
                        <span className="text-amber-600 text-xs font-bold ml-1" style={{writingMode: 'vertical-rl'}}>
                          {unidad === "pulgadas" ? `${formatNum(specs2.circunferencia.pulgadas, 1)}"` : `${formatNum(specs2.circunferencia.mm, 0)}mm`}
                        </span>
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
                        <span className="text-amber-600 text-xs font-bold">
                          {unidad === "pulgadas" ? `${formatNum(specs2.alturaLateral.pulgadas, 1)}"` : `${formatNum(specs2.alturaLateral.mm, 0)}mm`}
                        </span>
                      </div>
                    </div>
                    
                    {/* Revs/Mile o Revs/Km */}
                    <div className="mt-2 bg-gray-700 text-white px-3 py-1 rounded-full text-sm font-bold">
                      {unidad === "pulgadas" ? `${Math.round(specs2.revsPorMilla)} Revs/Mile` : `${Math.round(specs2.revsPorKm)} Revs/Km`}
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

              {/* Equivalencias */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <button 
                  onClick={() => setMostrarEquivalencias(!mostrarEquivalencias)}
                  className="w-full px-4 py-3 bg-purple-600 text-white font-bold flex items-center justify-between hover:bg-purple-700 transition-colors"
                >
                  <span>🔄 Medidas Equivalentes a {referencia1} (±3%)</span>
                  <span className="text-xl">{mostrarEquivalencias ? '▲' : '▼'}</span>
                </button>
                
                {mostrarEquivalencias && (
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      Si no tienes {referencia1}, estas medidas tienen un diámetro similar y pueden servir como alternativa:
                    </p>
                    {equivalencias.length > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {equivalencias.map((eq, idx) => (
                          <button
                            key={idx}
                            onClick={() => setReferencia2(eq.referencia)}
                            className={`p-2 rounded-lg border-2 text-center hover:bg-purple-50 transition-colors ${
                              eq.diferencia < 1 ? 'border-green-300 bg-green-50' : 
                              eq.diferencia < 2 ? 'border-yellow-300 bg-yellow-50' : 
                              'border-orange-300 bg-orange-50'
                            }`}
                          >
                            <div className="font-bold text-sm">{eq.referencia}</div>
                            <div className={`text-xs ${
                              eq.diferencia < 1 ? 'text-green-600' : 
                              eq.diferencia < 2 ? 'text-yellow-600' : 
                              'text-orange-600'
                            }`}>
                              {eq.diferencia.toFixed(1)}% dif.
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No se encontraron equivalencias</p>
                    )}
                    <p className="text-xs text-gray-400 mt-3 text-center">
                      💡 Haz clic en una medida para compararla
                    </p>
                  </div>
                )}
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
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => {
                setReferencia1("265/65R17");
                setReferencia2("265/70R17");
                setPrecio1("");
                setPrecio2("");
              }} 
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 font-semibold"
            >
              🔄 Reiniciar
            </button>
            <button onClick={onClose} className="bg-slate-600 text-white px-6 py-2 rounded-lg hover:bg-slate-700 font-semibold">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ComparadorLlantas;