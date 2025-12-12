import React, { useState, useMemo, useEffect } from "react";

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
  
  // Estados para simulador de cambio de rin
  const [mostrarSimuladorRin, setMostrarSimuladorRin] = useState(false);
  const [rinOriginal, setRinOriginal] = useState({ diametro: 17, ancho: 7.5, et: 30 });
  const [rinNuevo, setRinNuevo] = useState({ diametro: 17, ancho: 8, et: 0 });
  
  // Estados para búsqueda de vehículos con API
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [anios, setAnios] = useState([]);
  const [marcaSeleccionada, setMarcaSeleccionada] = useState("");
  const [modeloSeleccionado, setModeloSeleccionado] = useState("");
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [medidasVehiculo, setMedidasVehiculo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [errorAPI, setErrorAPI] = useState("");

  // ✅ Tu API Key de wheel-size.com (pendiente de aprobación)
  const API_KEY = "bea173769797e9430888b5d47ceb0e9a";
  const API_BASE = "https://api.wheel-size.com/v2";
  
  // ⚠️ TEMPORAL: Forzar datos demo mientras la API no esté aprobada
  // Cuando te llegue el email de aprobación, cambia esto a: const usarDatosDemo = false;
  const usarDatosDemo = true;

  // Cargar marcas al iniciar
  useEffect(() => {
    const cargarMarcas = async () => {
      if (usarDatosDemo) {
        // Si no hay API key, usar datos de ejemplo
        setMarcas([
          { slug: "toyota", name: "Toyota" },
          { slug: "chevrolet", name: "Chevrolet" },
          { slug: "ford", name: "Ford" },
          { slug: "nissan", name: "Nissan" },
          { slug: "mazda", name: "Mazda" },
          { slug: "hyundai", name: "Hyundai" },
          { slug: "kia", name: "Kia" },
          { slug: "jeep", name: "Jeep" },
          { slug: "mitsubishi", name: "Mitsubishi" },
          { slug: "suzuki", name: "Suzuki" },
          { slug: "honda", name: "Honda" },
          { slug: "volkswagen", name: "Volkswagen" },
          { slug: "renault", name: "Renault" },
          { slug: "subaru", name: "Subaru" },
          { slug: "ram", name: "RAM" },
          { slug: "dodge", name: "Dodge" },
          { slug: "land-rover", name: "Land Rover" },
          { slug: "bmw", name: "BMW" },
          { slug: "mercedes-benz", name: "Mercedes-Benz" },
          { slug: "audi", name: "Audi" },
        ]);
        return;
      }
      
      try {
        setCargando(true);
        const response = await fetch(`${API_BASE}/makes/?user_key=${API_KEY}`);
        const data = await response.json();
        if (data.data) {
          setMarcas(data.data);
        }
      } catch (error) {
        console.error("Error cargando marcas:", error);
        setErrorAPI("Error al conectar con la API");
      } finally {
        setCargando(false);
      }
    };
    cargarMarcas();
  }, []);

  // Cargar modelos cuando se selecciona marca
  useEffect(() => {
    if (!marcaSeleccionada) {
      setModelos([]);
      return;
    }

    const cargarModelos = async () => {
      if (usarDatosDemo) {
        // Datos de ejemplo si no hay API key
        const modelosEjemplo = {
          toyota: ["4Runner", "Avalon", "Camry", "C-HR", "Corolla", "Corolla Cross", "FJ Cruiser", "Fortuner", "Highlander", "Hilux", "Land Cruiser", "Land Cruiser Prado", "Prius", "RAV4", "Sequoia", "Sienna", "Supra", "Tacoma", "Tundra", "Yaris"],
          chevrolet: ["Blazer", "Camaro", "Captiva", "Colorado", "Equinox", "Malibu", "Onix", "Silverado", "Spark", "Suburban", "Tahoe", "Tracker", "Trailblazer", "Traverse", "Trax"],
          ford: ["Bronco", "Bronco Sport", "EcoSport", "Edge", "Escape", "Expedition", "Explorer", "F-150", "F-250", "Mustang", "Ranger", "Territory", "Transit"],
          nissan: ["Altima", "Armada", "Frontier", "Kicks", "Leaf", "Maxima", "Murano", "Navara", "Pathfinder", "Patrol", "Qashqai", "Rogue", "Sentra", "Titan", "Versa", "X-Trail"],
          mazda: ["2", "3", "6", "BT-50", "CX-3", "CX-30", "CX-5", "CX-50", "CX-9", "MX-5"],
          hyundai: ["Accent", "Creta", "Elantra", "Ioniq", "Kona", "Palisade", "Santa Fe", "Sonata", "Tucson", "Venue", "Veloster"],
          kia: ["Carnival", "Cerato", "EV6", "Forte", "K5", "Niro", "Picanto", "Rio", "Seltos", "Sorento", "Soul", "Sportage", "Stinger", "Telluride"],
          jeep: ["Cherokee", "Compass", "Gladiator", "Grand Cherokee", "Renegade", "Wrangler"],
        };
        setModelos((modelosEjemplo[marcaSeleccionada] || []).map(m => ({ slug: m.toLowerCase().replace(/ /g, "-"), name: m })));
        return;
      }

      try {
        setCargando(true);
        const response = await fetch(`${API_BASE}/models/?make=${marcaSeleccionada}&user_key=${API_KEY}`);
        const data = await response.json();
        if (data.data) {
          setModelos(data.data);
        }
      } catch (error) {
        console.error("Error cargando modelos:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarModelos();
    setModeloSeleccionado("");
    setAnioSeleccionado("");
    setMedidasVehiculo(null);
  }, [marcaSeleccionada]);

  // Cargar años cuando se selecciona modelo
  useEffect(() => {
    if (!marcaSeleccionada || !modeloSeleccionado) {
      setAnios([]);
      return;
    }

    const cargarAnios = async () => {
      if (usarDatosDemo) {
        // Datos de ejemplo
        const aniosEjemplo = [];
        for (let a = 2024; a >= 2000; a--) {
          aniosEjemplo.push({ slug: a.toString(), name: a.toString() });
        }
        setAnios(aniosEjemplo);
        return;
      }

      try {
        setCargando(true);
        const response = await fetch(`${API_BASE}/years/?make=${marcaSeleccionada}&model=${modeloSeleccionado}&user_key=${API_KEY}`);
        const data = await response.json();
        if (data.data) {
          setAnios(data.data);
        }
      } catch (error) {
        console.error("Error cargando años:", error);
      } finally {
        setCargando(false);
      }
    };
    cargarAnios();
    setAnioSeleccionado("");
    setMedidasVehiculo(null);
  }, [modeloSeleccionado]);

  // Cargar medidas cuando se selecciona año
  useEffect(() => {
    if (!marcaSeleccionada || !modeloSeleccionado || !anioSeleccionado) {
      setMedidasVehiculo(null);
      return;
    }

    const cargarMedidas = async () => {
      if (usarDatosDemo) {
        // Datos de ejemplo con información técnica completa estilo wheel-size.com
        // Incluye equivalencias REALES específicas para cada vehículo
        const vehiculosData = {
          "toyota-fortuner": { 
            generacion: "AN150/AN160 Facelift",
            produccion: "2020-2025",
            regiones: "Central & South America, Southeast Asia, Middle East",
            potencia: "164 hp | 122 kW | 166 PS",
            motor: "2.7 L, 2TR-FE, I4, Petrol",
            trimLevels: "SR5, SRX",
            centerBore: "106.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "105 Nm",
            llantas: [
              { medida: "265/65R17", indice: "112S", rin: "7.5Jx17 ET30", offset: "28-32", presion: "2.0", oem: true },
              { medida: "265/60R18", indice: "110H", rin: "7.5Jx18 ET30", offset: "28-32", presion: "2.0", oem: true },
              { medida: "265/55R19", indice: "109H", rin: "8Jx19 ET30", offset: "28-32", presion: "2.2", oem: false },
            ],
            // Equivalencias REALES que le sirven a este vehículo
            equivalenciasReales: {
              verdes: [ // <3% - Compatibles sin modificación
                { medida: "265/70R17", nota: "Muy popular, +20mm altura" },
                { medida: "275/65R17", nota: "+10mm ancho, misma altura" },
                { medida: "255/70R17", nota: "-10mm ancho, similar altura" },
                { medida: "265/65R18", nota: "Con rin 18, mismo diámetro" },
              ],
              amarillas: [ // 3-5% - Con precaución
                { medida: "275/70R17", nota: "Puede rozar en giro completo" },
                { medida: "285/65R17", nota: "Requiere verificar espacio" },
                { medida: "255/75R17", nota: "Más alta, verificar guardafango" },
                { medida: "265/70R18", nota: "Con rin 18, más grande" },
              ],
              rojas: [ // >5% - No recomendado sin modificación
                { medida: "285/70R17", nota: "Muy grande, requiere lift" },
                { medida: "275/75R17", nota: "Requiere modificación" },
                { medida: "305/65R17", nota: "Demasiado ancha" },
              ]
            }
          },
          "toyota-hilux": { 
            generacion: "AN120/AN130",
            produccion: "2015-2024",
            regiones: "Global",
            potencia: "150 hp | 112 kW",
            motor: "2.4 L, 2GD-FTV, I4, Diesel",
            trimLevels: "SR, SR5, TRD",
            centerBore: "106.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "105 Nm",
            llantas: [
              { medida: "265/65R17", indice: "112S", rin: "7.5Jx17 ET30", offset: "25-30", presion: "2.0", oem: true },
              { medida: "265/60R18", indice: "110H", rin: "7.5Jx18 ET30", offset: "25-30", presion: "2.1", oem: true },
              { medida: "265/70R17", indice: "115T", rin: "7.5Jx17 ET30", offset: "25-30", presion: "2.0", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "265/70R17", nota: "Popular para off-road" },
                { medida: "255/70R17", nota: "Alternativa más económica" },
                { medida: "275/65R17", nota: "Más ancha, buen agarre" },
                { medida: "265/65R18", nota: "Para rin 18" },
              ],
              amarillas: [
                { medida: "275/70R17", nota: "Verificar espacio" },
                { medida: "285/65R17", nota: "Puede rozar" },
                { medida: "255/75R17", nota: "Más alta" },
                { medida: "265/70R18", nota: "Grande para rin 18" },
              ],
              rojas: [
                { medida: "285/70R17", nota: "Requiere lift kit" },
                { medida: "305/65R17", nota: "Demasiado ancha" },
                { medida: "275/75R17", nota: "Muy alta" },
              ]
            }
          },
          "toyota-4runner": { 
            generacion: "N280",
            produccion: "2010-2024",
            regiones: "North America, Middle East",
            potencia: "270 hp | 201 kW",
            motor: "4.0 L, 1GR-FE, V6, Petrol",
            trimLevels: "SR5, TRD Off-Road, Limited, TRD Pro",
            centerBore: "106.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "105 Nm",
            llantas: [
              { medida: "265/70R17", indice: "115T", rin: "7.5Jx17 ET15", offset: "10-25", presion: "2.1", oem: true },
              { medida: "265/60R18", indice: "110H", rin: "7.5Jx18 ET25", offset: "20-30", presion: "2.1", oem: true },
              { medida: "275/70R17", indice: "114T", rin: "8Jx17 ET15", offset: "10-25", presion: "2.1", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "275/70R17", nota: "TRD Pro spec" },
                { medida: "265/65R17", nota: "Más bajo, mejor en calle" },
                { medida: "255/75R17", nota: "Alternativa popular" },
                { medida: "275/65R18", nota: "Para rin 18" },
              ],
              amarillas: [
                { medida: "285/70R17", nota: "Popular con lift 2\"" },
                { medida: "275/75R17", nota: "Requiere ajustes" },
                { medida: "285/65R18", nota: "Grande para rin 18" },
                { medida: "265/75R17", nota: "Más alta" },
              ],
              rojas: [
                { medida: "285/75R17", nota: "Requiere lift 3\"+" },
                { medida: "305/70R17", nota: "Muy grande" },
                { medida: "295/70R17", nota: "Requiere modificación" },
              ]
            }
          },
          "toyota-land-cruiser": { 
            generacion: "J300",
            produccion: "2021-2024",
            regiones: "Global (except North America)",
            potencia: "409 hp | 305 kW",
            motor: "3.5 L, V35A-FTS, V6, Twin-Turbo",
            trimLevels: "GX, VX, ZX, GR Sport",
            centerBore: "110.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M14 x 1.5",
            torque: "140 Nm",
            llantas: [
              { medida: "285/60R18", indice: "116V", rin: "8Jx18 ET50", offset: "45-55", presion: "2.3", oem: true },
              { medida: "285/50R20", indice: "112V", rin: "8.5Jx20 ET50", offset: "45-55", presion: "2.4", oem: true },
              { medida: "275/65R18", indice: "116H", rin: "8Jx18 ET50", offset: "45-55", presion: "2.2", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "275/65R18", nota: "Alternativa económica" },
                { medida: "285/65R18", nota: "Más alta, popular" },
                { medida: "275/60R20", nota: "Para rin 20" },
                { medida: "285/55R20", nota: "Sport look" },
              ],
              amarillas: [
                { medida: "295/60R18", nota: "Más ancha" },
                { medida: "285/70R18", nota: "Off-road" },
                { medida: "305/55R20", nota: "Ancha para rin 20" },
              ],
              rojas: [
                { medida: "295/70R18", nota: "Requiere modificación" },
                { medida: "305/60R18", nota: "Muy ancha" },
                { medida: "285/75R18", nota: "Muy alta" },
              ]
            }
          },
          "toyota-land-cruiser-prado": { 
            generacion: "J150 Facelift",
            produccion: "2017-2024",
            regiones: "Global",
            potencia: "163 hp | 122 kW",
            motor: "2.7 L, 2TR-FE, I4, Petrol",
            trimLevels: "TX, TX-L, VX",
            centerBore: "106.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "105 Nm",
            llantas: [
              { medida: "265/65R17", indice: "112S", rin: "7.5Jx17 ET25", offset: "20-30", presion: "2.0", oem: true },
              { medida: "265/60R18", indice: "110H", rin: "7.5Jx18 ET25", offset: "20-30", presion: "2.1", oem: true },
              { medida: "265/55R19", indice: "109V", rin: "8Jx19 ET25", offset: "20-30", presion: "2.2", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "265/70R17", nota: "Popular upgrade" },
                { medida: "275/65R17", nota: "Más ancha" },
                { medida: "255/70R17", nota: "Económica" },
                { medida: "265/65R18", nota: "Para rin 18" },
              ],
              amarillas: [
                { medida: "275/70R17", nota: "Verificar espacio" },
                { medida: "285/65R17", nota: "Puede rozar" },
                { medida: "265/70R18", nota: "Grande" },
              ],
              rojas: [
                { medida: "285/70R17", nota: "Requiere lift" },
                { medida: "275/75R17", nota: "Muy alta" },
                { medida: "305/65R17", nota: "Muy ancha" },
              ]
            }
          },
          "toyota-rav4": { 
            generacion: "XA50",
            produccion: "2019-2024",
            regiones: "Global",
            potencia: "203 hp | 151 kW",
            motor: "2.5 L, A25A-FKS, I4, Petrol",
            trimLevels: "LE, XLE, Adventure, TRD Off-Road, Limited",
            centerBore: "60.1 mm",
            boltPattern: "5x114.3 (5x4.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "103 Nm",
            llantas: [
              { medida: "225/65R17", indice: "102H", rin: "7Jx17 ET35", offset: "32-40", presion: "2.3", oem: true },
              { medida: "235/55R19", indice: "101V", rin: "7.5Jx19 ET35", offset: "32-40", presion: "2.4", oem: true },
              { medida: "225/60R18", indice: "100H", rin: "7Jx18 ET35", offset: "32-40", presion: "2.3", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "235/65R17", nota: "Más ancha" },
                { medida: "225/60R18", nota: "Para rin 18" },
                { medida: "235/60R18", nota: "Adventure spec" },
                { medida: "225/55R19", nota: "Para rin 19" },
              ],
              amarillas: [
                { medida: "245/65R17", nota: "Verificar espacio" },
                { medida: "235/65R18", nota: "Más grande" },
                { medida: "245/55R19", nota: "TRD spec" },
              ],
              rojas: [
                { medida: "255/65R17", nota: "Puede rozar" },
                { medida: "245/60R18", nota: "Muy grande" },
                { medida: "255/55R19", nota: "Requiere modificación" },
              ]
            }
          },
          "toyota-corolla": { 
            generacion: "E210",
            produccion: "2019-2024",
            regiones: "Global",
            potencia: "169 hp | 126 kW",
            motor: "2.0 L, M20A-FKS, I4, Petrol",
            trimLevels: "L, LE, SE, XSE",
            centerBore: "54.1 mm",
            boltPattern: "5x100",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "103 Nm",
            llantas: [
              { medida: "205/55R16", indice: "91V", rin: "6.5Jx16 ET40", offset: "35-45", presion: "2.2", oem: true },
              { medida: "225/40R18", indice: "88W", rin: "8Jx18 ET45", offset: "40-50", presion: "2.4", oem: true },
              { medida: "215/45R17", indice: "87V", rin: "7Jx17 ET40", offset: "35-45", presion: "2.3", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "215/55R16", nota: "Más confort" },
                { medida: "215/50R17", nota: "Para rin 17" },
                { medida: "205/50R17", nota: "Sport look" },
                { medida: "225/45R17", nota: "SE spec" },
              ],
              amarillas: [
                { medida: "225/50R17", nota: "Verificar espacio" },
                { medida: "215/40R18", nota: "Muy baja" },
                { medida: "235/40R18", nota: "XSE spec" },
              ],
              rojas: [
                { medida: "225/55R16", nota: "Puede rozar" },
                { medida: "235/45R17", nota: "Muy ancha" },
                { medida: "245/40R18", nota: "Requiere modificación" },
              ]
            }
          },
          "toyota-camry": { 
            generacion: "XV70",
            produccion: "2018-2024",
            regiones: "Global",
            potencia: "203 hp | 151 kW",
            motor: "2.5 L, A25A-FKS, I4, Petrol",
            trimLevels: "LE, SE, XLE, XSE, TRD",
            centerBore: "60.1 mm",
            boltPattern: "5x114.3 (5x4.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "103 Nm",
            llantas: [
              { medida: "235/45R18", indice: "94V", rin: "8Jx18 ET45", offset: "40-50", presion: "2.4", oem: true },
              { medida: "215/55R17", indice: "94V", rin: "7Jx17 ET40", offset: "35-45", presion: "2.2", oem: true },
              { medida: "225/45R18", indice: "91V", rin: "7.5Jx18 ET45", offset: "40-50", presion: "2.3", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "225/45R18", nota: "Alternativa común" },
                { medida: "215/55R17", nota: "Más confort" },
                { medida: "225/55R17", nota: "LE spec" },
                { medida: "245/45R18", nota: "TRD spec" },
              ],
              amarillas: [
                { medida: "245/40R19", nota: "XSE spec" },
                { medida: "235/40R19", nota: "Sport" },
                { medida: "225/40R19", nota: "Verificar" },
              ],
              rojas: [
                { medida: "255/40R19", nota: "Muy ancha" },
                { medida: "245/35R19", nota: "Muy baja" },
                { medida: "235/55R17", nota: "Puede rozar" },
              ]
            }
          },
          "toyota-tacoma": { 
            generacion: "N300",
            produccion: "2016-2023",
            regiones: "North America",
            potencia: "278 hp | 207 kW",
            motor: "3.5 L, 2GR-FKS, V6, Petrol",
            trimLevels: "SR, SR5, TRD Sport, TRD Off-Road, Limited, TRD Pro",
            centerBore: "106.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "105 Nm",
            llantas: [
              { medida: "265/70R16", indice: "112T", rin: "7Jx16 ET13", offset: "5-20", presion: "2.1", oem: true },
              { medida: "265/65R17", indice: "112S", rin: "7.5Jx17 ET13", offset: "5-20", presion: "2.1", oem: true },
              { medida: "265/60R18", indice: "110H", rin: "7.5Jx18 ET25", offset: "20-30", presion: "2.2", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "265/75R16", nota: "Popular off-road" },
                { medida: "265/70R17", nota: "TRD spec" },
                { medida: "275/65R17", nota: "Más ancha" },
                { medida: "255/75R17", nota: "Alternativa" },
              ],
              amarillas: [
                { medida: "275/70R17", nota: "Verificar espacio" },
                { medida: "285/65R18", nota: "Grande" },
                { medida: "285/70R17", nota: "TRD Pro popular" },
              ],
              rojas: [
                { medida: "285/75R16", nota: "Requiere lift" },
                { medida: "295/70R17", nota: "Muy grande" },
                { medida: "305/65R17", nota: "Requiere modificación" },
              ]
            }
          },
          "toyota-tundra": { 
            generacion: "XK70",
            produccion: "2022-2024",
            regiones: "North America",
            potencia: "389 hp | 290 kW",
            motor: "3.5 L, V35A-FTS, V6, Twin-Turbo",
            trimLevels: "SR, SR5, Limited, Platinum, TRD Pro, Capstone",
            centerBore: "110.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M14 x 1.5",
            torque: "140 Nm",
            llantas: [
              { medida: "275/65R18", indice: "116T", rin: "8Jx18 ET50", offset: "45-55", presion: "2.3", oem: true },
              { medida: "275/55R20", indice: "113H", rin: "8.5Jx20 ET50", offset: "45-55", presion: "2.4", oem: true },
              { medida: "285/65R18", indice: "116T", rin: "8Jx18 ET50", offset: "45-55", presion: "2.3", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "285/65R18", nota: "Popular upgrade" },
                { medida: "275/70R18", nota: "Más alta" },
                { medida: "285/55R20", nota: "Para rin 20" },
                { medida: "275/60R20", nota: "Sport" },
              ],
              amarillas: [
                { medida: "295/65R18", nota: "Verificar espacio" },
                { medida: "285/70R18", nota: "Off-road" },
                { medida: "295/55R20", nota: "Ancha" },
              ],
              rojas: [
                { medida: "295/70R18", nota: "Requiere lift" },
                { medida: "305/65R18", nota: "Muy grande" },
                { medida: "315/70R17", nota: "Requiere modificación" },
              ]
            }
          },
          "chevrolet-colorado": { 
            generacion: "GMT31XX",
            produccion: "2017-2024",
            regiones: "North America, Asia Pacific",
            potencia: "308 hp | 230 kW",
            motor: "3.6 L, LGZ, V6, Petrol",
            trimLevels: "WT, LT, Z71, ZR2",
            centerBore: "77.8 mm",
            boltPattern: "6x120",
            wheelFasteners: "Lug nuts",
            threadSize: "M14 x 1.5",
            torque: "190 Nm",
            llantas: [
              { medida: "255/65R17", indice: "110T", rin: "7.5Jx17 ET30", offset: "25-35", presion: "2.1", oem: true },
              { medida: "265/60R18", indice: "110T", rin: "8Jx18 ET30", offset: "25-35", presion: "2.2", oem: true },
              { medida: "265/65R17", indice: "112T", rin: "8Jx17 ET30", offset: "25-35", presion: "2.1", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "265/65R17", nota: "Popular upgrade" },
                { medida: "265/70R17", nota: "Z71 spec" },
                { medida: "255/70R17", nota: "Alternativa" },
                { medida: "265/65R18", nota: "Para rin 18" },
              ],
              amarillas: [
                { medida: "275/65R17", nota: "Verificar" },
                { medida: "275/70R17", nota: "ZR2 popular" },
                { medida: "285/65R18", nota: "Grande" },
              ],
              rojas: [
                { medida: "285/70R17", nota: "Requiere lift" },
                { medida: "285/75R17", nota: "Muy grande" },
                { medida: "305/65R17", nota: "Requiere modificación" },
              ]
            }
          },
          "chevrolet-trailblazer": { 
            generacion: "RG",
            produccion: "2017-2024",
            regiones: "South America, Asia, Middle East",
            potencia: "200 hp | 149 kW",
            motor: "2.8 L, LWN, I4, Diesel",
            trimLevels: "LT, LTZ, Premier",
            centerBore: "106.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "105 Nm",
            llantas: [
              { medida: "265/65R17", indice: "112S", rin: "7.5Jx17 ET30", offset: "25-35", presion: "2.0", oem: true },
              { medida: "265/60R18", indice: "110H", rin: "7.5Jx18 ET30", offset: "25-35", presion: "2.1", oem: true },
              { medida: "265/70R17", indice: "115T", rin: "7.5Jx17 ET30", offset: "25-35", presion: "2.0", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "265/70R17", nota: "Popular" },
                { medida: "275/65R17", nota: "Más ancha" },
                { medida: "255/70R17", nota: "Económica" },
                { medida: "265/65R18", nota: "Para rin 18" },
              ],
              amarillas: [
                { medida: "275/70R17", nota: "Verificar espacio" },
                { medida: "285/65R17", nota: "Puede rozar" },
                { medida: "265/70R18", nota: "Grande" },
              ],
              rojas: [
                { medida: "285/70R17", nota: "Requiere lift" },
                { medida: "305/65R17", nota: "Muy ancha" },
                { medida: "275/75R17", nota: "Muy alta" },
              ]
            }
          },
          "ford-ranger": { 
            generacion: "T6 Facelift",
            produccion: "2019-2024",
            regiones: "Global",
            potencia: "210 hp | 157 kW",
            motor: "2.0 L, EcoBlue, I4, Diesel Bi-Turbo",
            trimLevels: "XL, XLS, XLT, Wildtrak, Raptor",
            centerBore: "93.1 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.5",
            torque: "135 Nm",
            llantas: [
              { medida: "265/65R17", indice: "112S", rin: "7.5Jx17 ET55", offset: "50-60", presion: "2.0", oem: true },
              { medida: "265/60R18", indice: "110H", rin: "8Jx18 ET55", offset: "50-60", presion: "2.1", oem: true },
              { medida: "265/70R17", indice: "115T", rin: "7.5Jx17 ET55", offset: "50-60", presion: "2.0", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "265/70R17", nota: "Wildtrak spec" },
                { medida: "275/65R17", nota: "Más ancha" },
                { medida: "255/70R17", nota: "Alternativa" },
                { medida: "265/65R18", nota: "Para rin 18" },
              ],
              amarillas: [
                { medida: "275/70R17", nota: "Verificar" },
                { medida: "285/70R17", nota: "Raptor spec" },
                { medida: "285/60R18", nota: "Grande" },
              ],
              rojas: [
                { medida: "285/75R17", nota: "Muy grande" },
                { medida: "305/70R17", nota: "Requiere lift" },
                { medida: "295/70R17", nota: "Requiere modificación" },
              ]
            }
          },
          "ford-f-150": { 
            generacion: "P702",
            produccion: "2021-2024",
            regiones: "North America",
            potencia: "400 hp | 298 kW",
            motor: "3.5 L, EcoBoost, V6, Twin-Turbo",
            trimLevels: "XL, XLT, Lariat, King Ranch, Platinum, Limited, Raptor",
            centerBore: "87.1 mm",
            boltPattern: "6x135",
            wheelFasteners: "Lug nuts",
            threadSize: "M14 x 1.5",
            torque: "204 Nm",
            llantas: [
              { medida: "275/65R18", indice: "116T", rin: "8Jx18 ET44", offset: "40-50", presion: "2.4", oem: true },
              { medida: "275/60R20", indice: "115S", rin: "8.5Jx20 ET44", offset: "40-50", presion: "2.4", oem: true },
              { medida: "285/65R18", indice: "116T", rin: "8Jx18 ET44", offset: "40-50", presion: "2.5", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "285/65R18", nota: "Popular upgrade" },
                { medida: "275/70R18", nota: "Más alta" },
                { medida: "285/55R20", nota: "Para rin 20" },
                { medida: "275/55R20", nota: "Sport" },
              ],
              amarillas: [
                { medida: "295/65R18", nota: "Verificar" },
                { medida: "285/70R18", nota: "Off-road" },
                { medida: "295/60R20", nota: "Grande" },
              ],
              rojas: [
                { medida: "315/70R17", nota: "Raptor spec, requiere lift" },
                { medida: "325/60R18", nota: "Muy grande" },
                { medida: "305/70R18", nota: "Requiere modificación" },
              ]
            }
          },
          "nissan-frontier": { 
            generacion: "D23",
            produccion: "2022-2024",
            regiones: "North America",
            potencia: "310 hp | 231 kW",
            motor: "3.8 L, VQ38DD, V6, Petrol",
            trimLevels: "S, SV, PRO-4X, PRO-X",
            centerBore: "93.1 mm",
            boltPattern: "6x114.3 (6x4.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M12 x 1.25",
            torque: "117 Nm",
            llantas: [
              { medida: "255/70R16", indice: "111T", rin: "7Jx16 ET15", offset: "10-20", presion: "2.1", oem: true },
              { medida: "265/70R17", indice: "115T", rin: "7.5Jx17 ET15", offset: "10-20", presion: "2.2", oem: true },
              { medida: "255/65R17", indice: "110T", rin: "7Jx17 ET15", offset: "10-20", presion: "2.1", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "265/70R17", nota: "PRO-4X spec" },
                { medida: "265/65R17", nota: "Alternativa" },
                { medida: "255/75R17", nota: "Más alta" },
                { medida: "275/65R17", nota: "Más ancha" },
              ],
              amarillas: [
                { medida: "275/70R17", nota: "Verificar" },
                { medida: "285/65R17", nota: "Popular" },
                { medida: "265/75R17", nota: "Off-road" },
              ],
              rojas: [
                { medida: "285/70R17", nota: "Requiere lift" },
                { medida: "285/75R17", nota: "Muy grande" },
                { medida: "305/65R17", nota: "Requiere modificación" },
              ]
            }
          },
          "nissan-patrol": { 
            generacion: "Y62",
            produccion: "2010-2024",
            regiones: "Middle East, Asia, Australia",
            potencia: "400 hp | 298 kW",
            motor: "5.6 L, VK56VD, V8, Petrol",
            trimLevels: "XE, SE, LE, Platinum, Nismo",
            centerBore: "77.8 mm",
            boltPattern: "6x139.7 (6x5.5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M14 x 1.5",
            torque: "140 Nm",
            llantas: [
              { medida: "275/65R18", indice: "116H", rin: "8Jx18 ET25", offset: "20-30", presion: "2.2", oem: true },
              { medida: "275/50R22", indice: "111H", rin: "9Jx22 ET30", offset: "25-35", presion: "2.4", oem: true },
              { medida: "285/65R18", indice: "116H", rin: "8Jx18 ET25", offset: "20-30", presion: "2.3", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "285/65R18", nota: "Popular" },
                { medida: "275/70R18", nota: "Más alta" },
                { medida: "285/60R18", nota: "Sport" },
                { medida: "275/60R20", nota: "Para rin 20" },
              ],
              amarillas: [
                { medida: "295/65R18", nota: "Más ancha" },
                { medida: "285/70R18", nota: "Off-road" },
                { medida: "305/60R18", nota: "Nismo spec" },
              ],
              rojas: [
                { medida: "305/70R18", nota: "Muy grande" },
                { medida: "315/70R17", nota: "Requiere lift" },
                { medida: "295/75R18", nota: "Requiere modificación" },
              ]
            }
          },
          "jeep-wrangler": { 
            generacion: "JL",
            produccion: "2018-2024",
            regiones: "Global",
            potencia: "285 hp | 213 kW",
            motor: "3.6 L, Pentastar, V6, Petrol",
            trimLevels: "Sport, Sahara, Rubicon, 4xe, 392",
            centerBore: "71.5 mm",
            boltPattern: "5x127 (5x5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M14 x 1.5",
            torque: "129 Nm",
            llantas: [
              { medida: "255/70R18", indice: "113T", rin: "7.5Jx18 ET44", offset: "40-50", presion: "2.3", oem: true },
              { medida: "285/70R17", indice: "116T", rin: "8Jx17 ET0", offset: "-10-10", presion: "2.4", oem: true },
              { medida: "275/70R18", indice: "116T", rin: "8Jx18 ET44", offset: "40-50", presion: "2.4", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "285/70R17", nota: "Rubicon spec" },
                { medida: "275/70R18", nota: "Popular upgrade" },
                { medida: "265/70R17", nota: "Sport spec" },
                { medida: "275/65R18", nota: "Sahara spec" },
              ],
              amarillas: [
                { medida: "285/75R17", nota: "33\" equivalente" },
                { medida: "295/70R17", nota: "Verificar" },
                { medida: "285/70R18", nota: "Grande" },
              ],
              rojas: [
                { medida: "315/70R17", nota: "35\", requiere lift 2.5\"+" },
                { medida: "325/65R18", nota: "Muy grande" },
                { medida: "35x12.50R17", nota: "Requiere modificación" },
              ]
            }
          },
          "jeep-grand-cherokee": { 
            generacion: "WL",
            produccion: "2022-2024",
            regiones: "Global",
            potencia: "293 hp | 218 kW",
            motor: "3.6 L, Pentastar, V6, Petrol",
            trimLevels: "Laredo, Limited, Overland, Summit, Trailhawk",
            centerBore: "71.6 mm",
            boltPattern: "5x127 (5x5)",
            wheelFasteners: "Lug nuts",
            threadSize: "M14 x 1.5",
            torque: "129 Nm",
            llantas: [
              { medida: "265/60R18", indice: "110H", rin: "8Jx18 ET34", offset: "30-40", presion: "2.3", oem: true },
              { medida: "265/50R20", indice: "107V", rin: "8.5Jx20 ET34", offset: "30-40", presion: "2.4", oem: true },
              { medida: "275/55R20", indice: "113H", rin: "9Jx20 ET34", offset: "30-40", presion: "2.4", oem: false },
            ],
            equivalenciasReales: {
              verdes: [
                { medida: "275/60R18", nota: "Trailhawk spec" },
                { medida: "265/55R19", nota: "Para rin 19" },
                { medida: "275/55R20", nota: "Popular" },
                { medida: "265/45R21", nota: "Summit spec" },
              ],
              amarillas: [
                { medida: "285/60R18", nota: "Verificar" },
                { medida: "275/50R21", nota: "Grande" },
                { medida: "285/50R20", nota: "Off-road" },
              ],
              rojas: [
                { medida: "285/65R18", nota: "Muy grande" },
                { medida: "295/55R20", nota: "Requiere modificación" },
                { medida: "305/50R20", nota: "Muy ancha" },
              ]
            }
          },
        };
        
        const key = `${marcaSeleccionada}-${modeloSeleccionado}`;
        const vehiculoData = vehiculosData[key];
        
        if (vehiculoData) {
          setMedidasVehiculo({
            marca: marcaSeleccionada,
            modelo: modeloSeleccionado,
            anio: anioSeleccionado,
            generacion: vehiculoData.generacion,
            produccion: vehiculoData.produccion,
            regiones: vehiculoData.regiones,
            potencia: vehiculoData.potencia,
            motor: vehiculoData.motor,
            trimLevels: vehiculoData.trimLevels,
            centerBore: vehiculoData.centerBore,
            boltPattern: vehiculoData.boltPattern,
            wheelFasteners: vehiculoData.wheelFasteners,
            threadSize: vehiculoData.threadSize,
            torque: vehiculoData.torque,
            llantas: vehiculoData.llantas,
            medidaOEM: vehiculoData.llantas[0].medida,
            medidasAlt: vehiculoData.llantas.filter(l => !l.oem).map(l => l.medida),
            equivalenciasReales: vehiculoData.equivalenciasReales // Agregamos las equivalencias reales
          });
          setReferencia1(vehiculoData.llantas[0].medida);
        } else {
          setMedidasVehiculo({
            marca: marcaSeleccionada,
            modelo: modeloSeleccionado,
            anio: anioSeleccionado,
            medidaOEM: "225/65R17",
            medidasAlt: ["235/65R17", "225/60R18"]
          });
          setReferencia1("225/65R17");
        }
        return;
      }

      try {
        setCargando(true);
        const response = await fetch(
          `${API_BASE}/search/by_model/?make=${marcaSeleccionada}&model=${modeloSeleccionado}&year=${anioSeleccionado}&user_key=${API_KEY}`
        );
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
          const vehiculo = data.data[0];
          // Extraer medidas del primer trim/configuración
          const wheels = vehiculo.wheels;
          if (wheels && wheels.length > 0) {
            const frontTire = wheels[0].front?.tire || wheels[0].rear?.tire;
            if (frontTire) {
              const medidaOEM = `${frontTire.width}/${frontTire.aspect_ratio}R${frontTire.rim_diameter}`;
              
              // Obtener medidas alternativas de otras configuraciones
              const medidasAlt = [];
              wheels.forEach(w => {
                const tire = w.front?.tire || w.rear?.tire;
                if (tire) {
                  const medida = `${tire.width}/${tire.aspect_ratio}R${tire.rim_diameter}`;
                  if (medida !== medidaOEM && !medidasAlt.includes(medida)) {
                    medidasAlt.push(medida);
                  }
                }
              });

              setMedidasVehiculo({
                marca: marcaSeleccionada,
                modelo: modeloSeleccionado,
                anio: anioSeleccionado,
                medidaOEM,
                medidasAlt: medidasAlt.slice(0, 4)
              });
              setReferencia1(medidaOEM);
            }
          }
        }
      } catch (error) {
        console.error("Error cargando medidas:", error);
        setErrorAPI("Error al obtener medidas del vehículo");
      } finally {
        setCargando(false);
      }
    };
    cargarMedidas();
  }, [anioSeleccionado]);

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

  // Calcular equivalencias (medidas alternativas del MISMO RIN)
  const equivalencias = useMemo(() => {
    if (!specs1) return { verdes: [], amarillas: [], rojas: [] };
    const anchos = [195, 205, 215, 225, 235, 245, 255, 265, 275, 285, 295, 305, 315, 325, 335];
    const perfiles = [40, 45, 50, 55, 60, 65, 70, 75, 80, 85];
    const rinActual = specs1.rin; // Mismo rin que la llanta original
    
    const verdes = [];   // <3%
    const amarillas = []; // 3-5%
    const rojas = [];     // >5%
    
    for (const ancho of anchos) {
      for (const perfil of perfiles) {
        // Solo el mismo rin
        const specsAlt = calcularEspecificaciones({ ancho, perfil, rin: rinActual });
        if (specsAlt) {
          const difDiametro = Math.abs((specsAlt.diametroTotal.mm - specs1.diametroTotal.mm) / specs1.diametroTotal.mm * 100);
          const refActual = `${specs1.ancho}/${specs1.perfil}R${specs1.rin}`;
          const refAlt = `${ancho}/${perfil}R${rinActual}`;
          
          // No incluir la misma medida
          if (refAlt === refActual) continue;
          
          const item = {
            referencia: refAlt,
            specs: specsAlt,
            diferencia: difDiametro,
            difMM: Math.abs(specsAlt.diametroTotal.mm - specs1.diametroTotal.mm),
            difPulgadas: Math.abs(specsAlt.diametroTotal.pulgadas - specs1.diametroTotal.pulgadas),
            esMayor: specsAlt.diametroTotal.mm > specs1.diametroTotal.mm
          };
          
          if (difDiametro < 3) {
            verdes.push(item);
          } else if (difDiametro < 5) {
            amarillas.push(item);
          } else if (difDiametro <= 8) {
            rojas.push(item);
          }
        }
      }
    }
    
    return {
      verdes: verdes.sort((a, b) => a.diferencia - b.diferencia).slice(0, 8),
      amarillas: amarillas.sort((a, b) => a.diferencia - b.diferencia).slice(0, 6),
      rojas: rojas.sort((a, b) => a.diferencia - b.diferencia).slice(0, 4)
    };
  }, [specs1]);

  // Calcular efecto del cambio de rin (offset y ancho)
  const calculoCambioRin = useMemo(() => {
    const anchoOriginalMM = rinOriginal.ancho * 25.4;
    const anchoNuevoMM = rinNuevo.ancho * 25.4;
    const diferenciaAncho = anchoNuevoMM - anchoOriginalMM;
    const diferenciaET = rinNuevo.et - rinOriginal.et;
    
    // Cálculo de desplazamiento
    // El rin se mide desde el centro. ET es la distancia del centro al plano de montaje.
    // Cambio hacia AFUERA (positivo) = rin sale del guardafango
    // Cambio hacia ADENTRO (negativo) = rin entra hacia suspensión
    
    // Lado EXTERIOR del rin (hacia el guardafango):
    // Si ET baja (ej: de 30 a 0), el rin sale 30mm hacia afuera
    // Si el rin es más ancho, la mitad del aumento va hacia afuera
    const cambioExterior = -diferenciaET + (diferenciaAncho / 2);
    
    // Lado INTERIOR del rin (hacia la suspensión):
    // Si ET baja, el interior sale también (se aleja de suspensión = bueno)
    // Si el rin es más ancho, la mitad va hacia adentro (puede rozar)
    const cambioInterior = -diferenciaET - (diferenciaAncho / 2);
    
    // Ancho de llanta recomendado para el rin
    // Regla general: ancho de llanta = ancho de rin + 0.5" a 1.5" (en mm: +12 a +38mm)
    const anchoLlantaMinMM = anchoNuevoMM + 10;
    const anchoLlantaMaxMM = anchoNuevoMM + 40;
    const anchoLlantaIdealMM = anchoNuevoMM + 25;
    
    // Convertir a medidas comerciales (múltiplos de 5 o 10)
    const anchoLlantaMin = Math.ceil(anchoLlantaMinMM / 5) * 5;
    const anchoLlantaMax = Math.floor(anchoLlantaMaxMM / 5) * 5;
    const anchoLlantaIdeal = Math.round(anchoLlantaIdealMM / 5) * 5;
    
    // Generar medidas de llanta recomendadas
    const medidasRecomendadas = [];
    const perfilesComunes = [30, 35, 40, 45, 50, 55, 60, 65, 70, 75];
    
    for (let ancho = anchoLlantaMin; ancho <= anchoLlantaMax; ancho += 10) {
      for (const perfil of perfilesComunes) {
        const specs = calcularEspecificaciones({ ancho, perfil, rin: rinNuevo.diametro });
        if (specs) {
          // Verificar si el diámetro es similar al original (si hay specs1)
          let compatibilidad = "compatible";
          let difDiametro = 0;
          
          if (specs1) {
            difDiametro = ((specs.diametroTotal.mm - specs1.diametroTotal.mm) / specs1.diametroTotal.mm) * 100;
            if (Math.abs(difDiametro) < 3) {
              compatibilidad = "optimo";
            } else if (Math.abs(difDiametro) < 5) {
              compatibilidad = "aceptable";
            } else {
              compatibilidad = "diferente";
            }
          }
          
          medidasRecomendadas.push({
            medida: `${ancho}/${perfil}R${rinNuevo.diametro}`,
            ancho,
            perfil,
            diametroTotal: specs.diametroTotal.mm,
            diametroTotalPulg: specs.diametroTotal.pulgadas,
            difDiametro,
            compatibilidad,
            esIdeal: ancho === anchoLlantaIdeal
          });
        }
      }
    }
    
    // Ordenar por compatibilidad y diferencia
    medidasRecomendadas.sort((a, b) => {
      const orden = { optimo: 0, aceptable: 1, compatible: 2, diferente: 3 };
      if (orden[a.compatibilidad] !== orden[b.compatibilidad]) {
        return orden[a.compatibilidad] - orden[b.compatibilidad];
      }
      return Math.abs(a.difDiametro) - Math.abs(b.difDiametro);
    });
    
    // Análisis de seguridad
    let estadoExterior = "ok";
    let estadoInterior = "ok";
    let mensajeExterior = "";
    let mensajeInterior = "";
    
    if (cambioExterior > 25) {
      estadoExterior = "peligro";
      mensajeExterior = "Puede rozar guardafangos. Considerar fender flares.";
    } else if (cambioExterior > 15) {
      estadoExterior = "precaucion";
      mensajeExterior = "Verificar espacio con guardafangos.";
    } else if (cambioExterior > 0) {
      estadoExterior = "ok";
      mensajeExterior = "Probablemente OK, pero verificar.";
    } else {
      estadoExterior = "ok";
      mensajeExterior = "Entra más. Sin problemas de guardafangos.";
    }
    
    if (cambioInterior < -20) {
      estadoInterior = "peligro";
      mensajeInterior = "Puede rozar suspensión o frenos.";
    } else if (cambioInterior < -10) {
      estadoInterior = "precaucion";
      mensajeInterior = "Verificar espacio con suspensión.";
    } else {
      estadoInterior = "ok";
      mensajeInterior = "Sin problemas con suspensión.";
    }
    
    return {
      diferenciaAncho,
      diferenciaET,
      cambioExterior,
      cambioInterior,
      anchoLlantaMin,
      anchoLlantaMax,
      anchoLlantaIdeal,
      medidasRecomendadas: medidasRecomendadas.slice(0, 12),
      estadoExterior,
      estadoInterior,
      mensajeExterior,
      mensajeInterior
    };
  }, [rinOriginal, rinNuevo, specs1]);

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

          {/* Buscador de vehículos con API */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🚗</span>
                <span className="font-bold text-indigo-800">Buscar por Vehículo</span>
              </div>
              {cargando && <span className="text-sm text-indigo-500">⏳ Cargando...</span>}
            </div>
            
            {usarDatosDemo && (
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-2 mb-3 text-sm text-yellow-800">
                ⚠️ Modo demo. Para acceso completo, obtén tu API Key en <a href="https://www.wheel-size.com/api/" target="_blank" rel="noopener noreferrer" className="underline font-bold">wheel-size.com/api</a>
              </div>
            )}
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Selector de Marca */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Marca</label>
                <select 
                  value={marcaSeleccionada}
                  onChange={(e) => setMarcaSeleccionada(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg outline-none focus:border-indigo-400"
                >
                  <option value="">Seleccionar marca...</option>
                  {marcas.map((m) => (
                    <option key={m.slug} value={m.slug}>{m.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Selector de Modelo */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Modelo</label>
                <select 
                  value={modeloSeleccionado}
                  onChange={(e) => setModeloSeleccionado(e.target.value)}
                  disabled={!marcaSeleccionada}
                  className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg outline-none focus:border-indigo-400 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Seleccionar modelo...</option>
                  {modelos.map((m) => (
                    <option key={m.slug} value={m.slug}>{m.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Selector de Año */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Año</label>
                <select 
                  value={anioSeleccionado}
                  onChange={(e) => setAnioSeleccionado(e.target.value)}
                  disabled={!modeloSeleccionado}
                  className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg outline-none focus:border-indigo-400 disabled:bg-gray-100 disabled:text-gray-400"
                >
                  <option value="">Seleccionar año...</option>
                  {anios.map((a) => (
                    <option key={a.slug} value={a.slug}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Resultado - Medidas del vehículo */}
            {medidasVehiculo && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-indigo-200">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-bold text-indigo-800 capitalize">{medidasVehiculo.marca} {medidasVehiculo.modelo}</span>
                    <span className="text-gray-500 text-sm ml-2">({medidasVehiculo.anio})</span>
                  </div>
                  <button 
                    onClick={() => {
                      setMarcaSeleccionada("");
                      setModeloSeleccionado("");
                      setAnioSeleccionado("");
                      setMedidasVehiculo(null);
                    }}
                    className="text-gray-400 hover:text-gray-600 text-xl"
                  >×</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-semibold">
                    ✅ OEM: {medidasVehiculo.medidaOEM}
                  </span>
                  {medidasVehiculo.medidasAlt?.map((m, idx) => (
                    <button
                      key={idx}
                      onClick={() => setReferencia2(m)}
                      className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold hover:bg-blue-200 transition-colors"
                    >
                      Alt: {m}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">💡 La medida OEM se cargó en Llanta 1. Clic en alternativa para compararla.</p>
              </div>
            )}
            
            {errorAPI && (
              <div className="mt-3 text-red-600 text-sm">{errorAPI}</div>
            )}
          </div>

          {/* Inputs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">1</span>
                <span className="font-bold text-amber-800">Llanta Original (OEM)</span>
              </div>
              {modoIngreso === "manual" ? (
                <input 
                  type="text" 
                  value={referencia1} 
                  onChange={(e) => handleReferenciaChange(e.target.value, setReferencia1)}
                  placeholder="Ej: 2656517 o 265/65R17"
                  className="w-full px-4 py-3 border-2 border-amber-300 rounded-lg text-center text-xl font-bold outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                />
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
                <input 
                  type="text" 
                  value={referencia2} 
                  onChange={(e) => handleReferenciaChange(e.target.value, setReferencia2)}
                  placeholder="Ej: 2657017 o 265/70R17"
                  className="w-full px-4 py-3 border-2 border-blue-300 rounded-lg text-center text-xl font-bold outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
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

                  {/* Resumen rápido de diferencias - COMPACTO */}
                  <div className="bg-gray-700 rounded-xl p-3 flex flex-col justify-center min-w-[200px]">
                    <div className="text-white text-center mb-2">
                      <div className="text-xs text-gray-400">Diferencia Diámetro</div>
                      <div className={`text-2xl font-bold ${Math.abs(diferencias.diametro) < 3 ? 'text-green-400' : Math.abs(diferencias.diametro) < 5 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {formatDif(diferencias.diametro)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-600 rounded p-2 text-center">
                        <div className="text-gray-400">Rin 1</div>
                        <div className="text-white font-bold">{specs1.rin}"</div>
                      </div>
                      <div className="bg-gray-600 rounded p-2 text-center">
                        <div className="text-gray-400">Rin 2</div>
                        <div className="text-yellow-400 font-bold">{specs2.rin}"</div>
                      </div>
                      <div className="bg-gray-600 rounded p-2 text-center">
                        <div className="text-gray-400">Revs/Km</div>
                        <div className="text-white font-bold">{Math.round(specs1.revsPorKm)}</div>
                      </div>
                      <div className="bg-gray-600 rounded p-2 text-center">
                        <div className="text-gray-400">Revs/Km</div>
                        <div className="text-yellow-400 font-bold">{Math.round(specs2.revsPorKm)}</div>
                      </div>
                    </div>
                    {/* Indicador de compatibilidad */}
                    <div className={`mt-2 text-center py-1 rounded-lg text-sm font-bold ${Math.abs(diferencias.diametro) < 3 ? 'bg-green-500 text-white' : Math.abs(diferencias.diametro) < 5 ? 'bg-yellow-500 text-black' : 'bg-red-500 text-white'}`}>
                      {Math.abs(diferencias.diametro) < 3 ? '✅ Compatible' : Math.abs(diferencias.diametro) < 5 ? '⚠️ Precaución' : '❌ No Recomendado'}
                    </div>
                  </div>
                </div>
              </div>

              {/* GRID COMPACTO: Especificaciones + Velocímetro lado a lado */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* Tabla de especificaciones - COMPACTA */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-slate-700 text-white px-3 py-2"><h3 className="font-bold text-sm">📋 Especificaciones</h3></div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="p-2 text-left">Spec</th>
                          <th className="p-2 text-center bg-amber-50 text-amber-700">{specs1.ancho}/{specs1.perfil}R{specs1.rin}</th>
                          <th className="p-2 text-center bg-blue-50 text-blue-700">{specs2.ancho}/{specs2.perfil}R{specs2.rin}</th>
                          <th className="p-2 text-center">Dif</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        <tr><td className="p-2">📏 Diámetro</td><td className="p-2 text-center bg-amber-50/50">{formatNum(specs1.diametroTotal.pulgadas)}"</td><td className="p-2 text-center bg-blue-50/50">{formatNum(specs2.diametroTotal.pulgadas)}"</td><td className={`p-2 text-center font-bold ${getColorDiferencia(diferencias.diametro).text}`}>{formatDif(diferencias.diametro)}</td></tr>
                        <tr><td className="p-2">↔️ Ancho</td><td className="p-2 text-center bg-amber-50/50">{specs1.anchoTotal.mm}mm</td><td className="p-2 text-center bg-blue-50/50">{specs2.anchoTotal.mm}mm</td><td className={`p-2 text-center font-bold ${getColorDiferencia(diferencias.ancho,3,6).text}`}>{formatDif(diferencias.ancho)}</td></tr>
                        <tr><td className="p-2">📐 Sidewall</td><td className="p-2 text-center bg-amber-50/50">{formatNum(specs1.alturaLateral.mm,0)}mm</td><td className="p-2 text-center bg-blue-50/50">{formatNum(specs2.alturaLateral.mm,0)}mm</td><td className={`p-2 text-center font-bold ${getColorDiferencia(diferencias.perfil,3,6).text}`}>{formatDif(diferencias.perfil)}</td></tr>
                        <tr><td className="p-2">⭕ Circunf.</td><td className="p-2 text-center bg-amber-50/50">{formatNum(specs1.circunferencia.mm,0)}mm</td><td className="p-2 text-center bg-blue-50/50">{formatNum(specs2.circunferencia.mm,0)}mm</td><td className={`p-2 text-center font-bold ${getColorDiferencia(diferencias.circunferencia).text}`}>{formatDif(diferencias.circunferencia)}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Error del Velocímetro - COMPACTO */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className={`px-3 py-2 text-white ${Math.abs(diferencias.diametro) < 2 ? "bg-green-600" : Math.abs(diferencias.diametro) < 4 ? "bg-yellow-500" : "bg-red-600"}`}>
                    <h3 className="font-bold text-sm">🚗 Error Velocímetro</h3>
                  </div>
                  <div className="p-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`text-center px-4 py-2 rounded-lg ${getColorDiferencia(diferencias.diametro).bg}`}>
                        <div className={`text-2xl font-bold ${getColorDiferencia(diferencias.diametro).text}`}>{formatDif(diferencias.diametro)}</div>
                      </div>
                      <div className="text-xs text-gray-600">
                        {diferencias.diametro > 0 ? <span>A 100 km/h reales vas a <strong>{formatNum(calcularVelocidadReal(100),1)}</strong> km/h</span> : diferencias.diametro < 0 ? <span>A 100 km/h reales vas a <strong>{formatNum(calcularVelocidadReal(100),1)}</strong> km/h</span> : <span>Sin diferencia</span>}
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100"><tr><th className="p-1 text-left">Veloc.</th>{[40, 60, 80, 100, 120].map(v => <th key={v} className="p-1 text-center">{v}</th>)}</tr></thead>
                        <tbody>
                          <tr className="bg-blue-50"><td className="p-1 font-bold text-blue-700">Real</td>{[40, 60, 80, 100, 120].map(v => { const real = calcularVelocidadReal(v); const diff = Math.abs(real - v); return <td key={v} className={`p-1 text-center font-bold ${diff < v * 0.02 ? "text-green-600" : diff < v * 0.04 ? "text-yellow-600" : "text-red-600"}`}>{formatNum(real, 0)}</td>; })}</tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ficha Técnica del Vehículo - Estilo Wheel-Size.com */}
              {medidasVehiculo && medidasVehiculo.generacion && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-4 border border-gray-200">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-4 py-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg uppercase">
                        {medidasVehiculo.marca} {medidasVehiculo.modelo} {medidasVehiculo.generacion} [{medidasVehiculo.produccion}]
                      </h3>
                      <span className="text-gray-300 text-sm">{medidasVehiculo.potencia?.split('|')[0]}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">LADM</span>
                      <span className="px-2 py-1 bg-gray-600 text-white text-xs rounded">COL</span>
                    </div>
                  </div>
                  
                  {/* Info del vehículo en 2 columnas */}
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Columna izquierda */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">›</span>
                        <span><strong>Generation:</strong> {medidasVehiculo.generacion}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">›</span>
                        <span><strong>Production:</strong> [{medidasVehiculo.produccion}]</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">›</span>
                        <span><strong>Sales regions:</strong> {medidasVehiculo.regiones}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">›</span>
                        <span><strong>Power:</strong> {medidasVehiculo.potencia}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">›</span>
                        <span><strong>Engine:</strong> {medidasVehiculo.motor}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-gray-400">›</span>
                        <span><strong>Trim Levels:</strong> {medidasVehiculo.trimLevels}</span>
                      </div>
                    </div>
                    
                    {/* Columna derecha */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">›</span>
                        <span><strong>Center Bore / Hub Bore:</strong> {medidasVehiculo.centerBore}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">›</span>
                        <span><strong>Bolt Pattern (PCD):</strong> {medidasVehiculo.boltPattern}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">›</span>
                        <span><strong>Wheel Fasteners:</strong> {medidasVehiculo.wheelFasteners}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">›</span>
                        <span><strong>Thread Size:</strong> {medidasVehiculo.threadSize}</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-500">›</span>
                        <span><strong>Wheel Tightening Torque:</strong> {medidasVehiculo.torque}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Tabla de llantas */}
                  {medidasVehiculo.llantas && (
                    <div className="border-t border-gray-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 text-gray-600">
                            <tr>
                              <th className="px-4 py-2 text-left"></th>
                              <th className="px-4 py-2 text-left">TIRE</th>
                              <th className="px-4 py-2 text-left">RIM</th>
                              <th className="px-4 py-2 text-center">OFFSET RANGE<br/><span className="text-xs text-gray-400">mm</span></th>
                              <th className="px-4 py-2 text-center">🔑<br/><span className="text-xs text-gray-400">bar</span></th>
                              <th className="px-4 py-2 text-center"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {medidasVehiculo.llantas.map((llanta, idx) => (
                              <tr key={idx} className={`border-t border-gray-100 ${llanta.oem ? 'bg-white' : 'bg-gray-50'}`}>
                                <td className="px-4 py-3">
                                  {llanta.oem && <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded font-bold">OE</span>}
                                </td>
                                <td className="px-4 py-3">
                                  <span className="font-bold">{llanta.medida}</span>
                                  <span className="ml-2 px-1.5 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">{llanta.indice}</span>
                                </td>
                                <td className="px-4 py-3 text-gray-700">{llanta.rin}</td>
                                <td className="px-4 py-3 text-center text-gray-700">{llanta.offset}</td>
                                <td className="px-4 py-3 text-center text-gray-700">{llanta.presion}</td>
                                <td className="px-4 py-3 text-center">
                                  <button 
                                    onClick={() => setReferencia2(llanta.medida)}
                                    className="text-purple-600 hover:text-purple-800 text-lg"
                                    title="Comparar esta medida"
                                  >
                                    📊
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Equivalencias */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                <button 
                  onClick={() => setMostrarEquivalencias(!mostrarEquivalencias)}
                  className="w-full px-4 py-3 bg-purple-600 text-white font-bold flex items-center justify-between hover:bg-purple-700 transition-colors"
                >
                  <span>🔄 Medidas Equivalentes {medidasVehiculo?.equivalenciasReales ? `para ${medidasVehiculo.marca} ${medidasVehiculo.modelo}` : `en Rin ${specs1?.rin}"`}</span>
                  <span className="text-xl">{mostrarEquivalencias ? '▲' : '▼'}</span>
                </button>
                
                {mostrarEquivalencias && (
                  <div className="p-4">
                    {/* Si hay vehículo seleccionado con equivalencias reales */}
                    {medidasVehiculo?.equivalenciasReales ? (
                      <>
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-blue-800">
                            🚗 <strong>Medidas verificadas</strong> para <strong className="capitalize">{medidasVehiculo.marca} {medidasVehiculo.modelo}</strong> - 
                            Compatibles con guardafangos, suspensión y offset del vehículo.
                          </p>
                        </div>
                        
                        {/* Sección Verde - Compatible sin modificación */}
                        {medidasVehiculo.equivalenciasReales.verdes?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-4 h-4 rounded-full bg-green-500"></span>
                              <span className="font-bold text-green-700">✅ Compatible (sin modificación)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                              {medidasVehiculo.equivalenciasReales.verdes.map((eq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReferencia2(eq.medida)}
                                  className="p-3 rounded-lg border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors text-left"
                                >
                                  <div className="font-bold text-green-800 text-lg">{eq.medida}</div>
                                  <div className="text-xs text-green-600 mt-1">
                                    💡 {eq.nota}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Sección Amarilla - Con precaución */}
                        {medidasVehiculo.equivalenciasReales.amarillas?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
                              <span className="font-bold text-yellow-700">⚠️ Con precaución (verificar espacio)</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {medidasVehiculo.equivalenciasReales.amarillas.map((eq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReferencia2(eq.medida)}
                                  className="p-3 rounded-lg border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors text-left"
                                >
                                  <div className="font-bold text-yellow-800 text-lg">{eq.medida}</div>
                                  <div className="text-xs text-yellow-700 mt-1">
                                    ⚠️ {eq.nota}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Sección Roja - No recomendado */}
                        {medidasVehiculo.equivalenciasReales.rojas?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-4 h-4 rounded-full bg-red-500"></span>
                              <span className="font-bold text-red-700">❌ Requiere modificación</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {medidasVehiculo.equivalenciasReales.rojas.map((eq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReferencia2(eq.medida)}
                                  className="p-3 rounded-lg border-2 border-red-400 bg-red-50 hover:bg-red-100 transition-colors text-left"
                                >
                                  <div className="font-bold text-red-800 text-lg">{eq.medida}</div>
                                  <div className="text-xs text-red-700 mt-1">
                                    🔧 {eq.nota}
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 mt-3 text-center border-t pt-3">
                          💡 Estas medidas han sido verificadas para tu vehículo • Clic en una medida para compararla
                        </p>
                      </>
                    ) : (
                      /* Si NO hay vehículo seleccionado, mostrar cálculo matemático */
                      <>
                        <p className="text-sm text-gray-600 mb-4">
                          Alternativas para <strong>{referencia1}</strong> en el mismo rin ({specs1?.rin}"):
                        </p>
                        
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-sm text-yellow-800">
                            ⚠️ <strong>Cálculo matemático.</strong> Para ver medidas verificadas para tu vehículo específico, 
                            selecciona marca, modelo y año arriba.
                          </p>
                        </div>
                        
                        {/* Sección Verde - Compatible <3% */}
                        {equivalencias.verdes?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-4 h-4 rounded-full bg-green-500"></span>
                              <span className="font-bold text-green-700">✅ Compatible (&lt;3% diferencia)</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {equivalencias.verdes.map((eq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReferencia2(eq.referencia)}
                                  className="p-2 rounded-lg border-2 border-green-400 bg-green-50 hover:bg-green-100 transition-colors text-left"
                                >
                                  <div className="font-bold text-green-800">{eq.referencia}</div>
                                  <div className="text-xs text-green-600">
                                    {eq.esMayor ? '↑' : '↓'} {eq.diferencia.toFixed(1)}% ({eq.difMM.toFixed(0)}mm)
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Sección Amarilla - Precaución 3-5% */}
                        {equivalencias.amarillas?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-4 h-4 rounded-full bg-yellow-500"></span>
                              <span className="font-bold text-yellow-700">⚠️ Precaución (3-5% diferencia)</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {equivalencias.amarillas.map((eq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReferencia2(eq.referencia)}
                                  className="p-2 rounded-lg border-2 border-yellow-400 bg-yellow-50 hover:bg-yellow-100 transition-colors text-left"
                                >
                                  <div className="font-bold text-yellow-800">{eq.referencia}</div>
                                  <div className="text-xs text-yellow-600">
                                    {eq.esMayor ? '↑' : '↓'} {eq.diferencia.toFixed(1)}% ({eq.difMM.toFixed(0)}mm)
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Sección Roja - No recomendado >5% */}
                        {equivalencias.rojas?.length > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="w-4 h-4 rounded-full bg-red-500"></span>
                              <span className="font-bold text-red-700">❌ No Recomendado (&gt;5% diferencia)</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                              {equivalencias.rojas.map((eq, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => setReferencia2(eq.referencia)}
                                  className="p-2 rounded-lg border-2 border-red-400 bg-red-50 hover:bg-red-100 transition-colors text-left"
                                >
                                  <div className="font-bold text-red-800">{eq.referencia}</div>
                                  <div className="text-xs text-red-600">
                                    {eq.esMayor ? '↑' : '↓'} {eq.diferencia.toFixed(1)}% ({eq.difMM.toFixed(0)}mm)
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {(!equivalencias.verdes?.length && !equivalencias.amarillas?.length && !equivalencias.rojas?.length) && (
                          <p className="text-gray-500 text-center py-4">No se encontraron equivalencias para rin {specs1?.rin}"</p>
                        )}
                        
                        <p className="text-xs text-gray-400 mt-3 text-center">
                          💡 Clic en una medida para compararla • ↑ más grande ↓ más pequeña
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400"></span> &lt;3% Compatible</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> 3-5% Precaución</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400"></span> &gt;5% No Recomendado</span>
              </div>

              {/* ============================================= */}
              {/* SIMULADOR DE CAMBIO DE RIN */}
              {/* ============================================= */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
                <button 
                  onClick={() => setMostrarSimuladorRin(!mostrarSimuladorRin)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold flex items-center justify-between hover:from-orange-600 hover:to-amber-600 transition-colors"
                >
                  <span>🛞 Simulador de Cambio de Rin (ET y Ancho)</span>
                  <span className="text-xl">{mostrarSimuladorRin ? '▲' : '▼'}</span>
                </button>
                
                {mostrarSimuladorRin && (
                  <div className="p-4">
                    <p className="text-sm text-gray-600 mb-4">
                      Simula qué pasa cuando cambias tus rines por otros con diferente <strong>ancho</strong> y/o <strong>ET (offset)</strong>.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      {/* Rin Original */}
                      <div className="bg-gray-50 border-2 border-gray-300 rounded-xl p-4">
                        <h4 className="font-bold text-gray-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-gray-500 text-white rounded-full flex items-center justify-center text-sm">1</span>
                          Rin Original (OEM)
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Diámetro</label>
                            <select 
                              value={rinOriginal.diametro}
                              onChange={(e) => setRinOriginal({...rinOriginal, diametro: parseInt(e.target.value)})}
                              className="w-full px-2 py-2 border rounded-lg text-center font-bold"
                            >
                              {[15, 16, 17, 18, 19, 20, 21, 22].map(d => (
                                <option key={d} value={d}>{d}"</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Ancho</label>
                            <select 
                              value={rinOriginal.ancho}
                              onChange={(e) => setRinOriginal({...rinOriginal, ancho: parseFloat(e.target.value)})}
                              className="w-full px-2 py-2 border rounded-lg text-center font-bold"
                            >
                              {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12].map(a => (
                                <option key={a} value={a}>{a}"</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">ET (Offset)</label>
                            <select 
                              value={rinOriginal.et}
                              onChange={(e) => setRinOriginal({...rinOriginal, et: parseInt(e.target.value)})}
                              className="w-full px-2 py-2 border rounded-lg text-center font-bold"
                            >
                              {[-44, -40, -38, -35, -32, -30, -25, -22, -20, -18, -15, -12, -10, -6, -5, 0, 5, 6, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 60].map(et => (
                                <option key={et} value={et}>{et >= 0 ? `+${et}` : et}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                          {rinOriginal.diametro}x{rinOriginal.ancho}" ET{rinOriginal.et}
                        </p>
                      </div>
                      
                      {/* Rin Nuevo */}
                      <div className="bg-orange-50 border-2 border-orange-300 rounded-xl p-4">
                        <h4 className="font-bold text-orange-700 mb-3 flex items-center gap-2">
                          <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm">2</span>
                          Rin Nuevo
                        </h4>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Diámetro</label>
                            <select 
                              value={rinNuevo.diametro}
                              onChange={(e) => setRinNuevo({...rinNuevo, diametro: parseInt(e.target.value)})}
                              className="w-full px-2 py-2 border border-orange-300 rounded-lg text-center font-bold"
                            >
                              {[15, 16, 17, 18, 19, 20, 21, 22].map(d => (
                                <option key={d} value={d}>{d}"</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">Ancho</label>
                            <select 
                              value={rinNuevo.ancho}
                              onChange={(e) => setRinNuevo({...rinNuevo, ancho: parseFloat(e.target.value)})}
                              className="w-full px-2 py-2 border border-orange-300 rounded-lg text-center font-bold"
                            >
                              {[6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10, 10.5, 11, 12].map(a => (
                                <option key={a} value={a}>{a}"</option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500 mb-1">ET (Offset)</label>
                            <select 
                              value={rinNuevo.et}
                              onChange={(e) => setRinNuevo({...rinNuevo, et: parseInt(e.target.value)})}
                              className="w-full px-2 py-2 border border-orange-300 rounded-lg text-center font-bold"
                            >
                              {[-44, -40, -38, -35, -32, -30, -25, -22, -20, -18, -15, -12, -10, -6, -5, 0, 5, 6, 10, 12, 15, 18, 20, 22, 25, 28, 30, 32, 35, 38, 40, 42, 45, 48, 50, 52, 55, 60].map(et => (
                                <option key={et} value={et}>{et >= 0 ? `+${et}` : et}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <p className="text-xs text-orange-600 mt-2 text-center font-semibold">
                          {rinNuevo.diametro}x{rinNuevo.ancho}" ET{rinNuevo.et}
                        </p>
                      </div>
                    </div>
                    
                    {/* Resultados del cálculo */}
                    <div className="bg-gradient-to-r from-slate-100 to-gray-100 rounded-xl p-4 mb-4">
                      <h4 className="font-bold text-gray-800 mb-3">📊 Análisis del Cambio</h4>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-xs text-gray-500">Δ Ancho</div>
                          <div className={`text-xl font-bold ${calculoCambioRin.diferenciaAncho === 0 ? 'text-gray-600' : calculoCambioRin.diferenciaAncho > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                            {calculoCambioRin.diferenciaAncho > 0 ? '+' : ''}{calculoCambioRin.diferenciaAncho.toFixed(1)}mm
                          </div>
                          <div className="text-xs text-gray-400">
                            ({(calculoCambioRin.diferenciaAncho / 25.4).toFixed(2)}")
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                          <div className="text-xs text-gray-500">Δ ET</div>
                          <div className={`text-xl font-bold ${calculoCambioRin.diferenciaET === 0 ? 'text-gray-600' : calculoCambioRin.diferenciaET > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {calculoCambioRin.diferenciaET > 0 ? '+' : ''}{calculoCambioRin.diferenciaET}mm
                          </div>
                          <div className="text-xs text-gray-400">
                            {calculoCambioRin.diferenciaET < 0 ? 'Sale más' : calculoCambioRin.diferenciaET > 0 ? 'Entra más' : 'Igual'}
                          </div>
                        </div>
                        <div className={`rounded-lg p-3 text-center shadow-sm ${calculoCambioRin.estadoExterior === 'ok' ? 'bg-green-50' : calculoCambioRin.estadoExterior === 'precaucion' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                          <div className="text-xs text-gray-500">Lado Exterior</div>
                          <div className={`text-xl font-bold ${calculoCambioRin.estadoExterior === 'ok' ? 'text-green-600' : calculoCambioRin.estadoExterior === 'precaucion' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {calculoCambioRin.cambioExterior > 0 ? '+' : ''}{calculoCambioRin.cambioExterior.toFixed(1)}mm
                          </div>
                          <div className="text-xs text-gray-500">
                            {calculoCambioRin.cambioExterior > 0 ? '→ Sale' : '← Entra'}
                          </div>
                        </div>
                        <div className={`rounded-lg p-3 text-center shadow-sm ${calculoCambioRin.estadoInterior === 'ok' ? 'bg-green-50' : calculoCambioRin.estadoInterior === 'precaucion' ? 'bg-yellow-50' : 'bg-red-50'}`}>
                          <div className="text-xs text-gray-500">Lado Interior</div>
                          <div className={`text-xl font-bold ${calculoCambioRin.estadoInterior === 'ok' ? 'text-green-600' : calculoCambioRin.estadoInterior === 'precaucion' ? 'text-yellow-600' : 'text-red-600'}`}>
                            {calculoCambioRin.cambioInterior > 0 ? '+' : ''}{calculoCambioRin.cambioInterior.toFixed(1)}mm
                          </div>
                          <div className="text-xs text-gray-500">
                            {calculoCambioRin.cambioInterior < 0 ? '← Entra' : '→ Sale'}
                          </div>
                        </div>
                      </div>
                      
                      {/* Alertas */}
                      <div className="space-y-2">
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${calculoCambioRin.estadoExterior === 'ok' ? 'bg-green-100 text-green-800' : calculoCambioRin.estadoExterior === 'precaucion' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          <span>{calculoCambioRin.estadoExterior === 'ok' ? '✅' : calculoCambioRin.estadoExterior === 'precaucion' ? '⚠️' : '❌'}</span>
                          <span className="text-sm"><strong>Guardafangos:</strong> {calculoCambioRin.mensajeExterior}</span>
                        </div>
                        <div className={`flex items-center gap-2 p-2 rounded-lg ${calculoCambioRin.estadoInterior === 'ok' ? 'bg-green-100 text-green-800' : calculoCambioRin.estadoInterior === 'precaucion' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          <span>{calculoCambioRin.estadoInterior === 'ok' ? '✅' : calculoCambioRin.estadoInterior === 'precaucion' ? '⚠️' : '❌'}</span>
                          <span className="text-sm"><strong>Suspensión:</strong> {calculoCambioRin.mensajeInterior}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Llantas recomendadas */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4">
                      <h4 className="font-bold text-gray-800 mb-2">🛞 Llantas Recomendadas para Rin {rinNuevo.diametro}x{rinNuevo.ancho}"</h4>
                      <p className="text-xs text-gray-500 mb-3">
                        Ancho de llanta ideal: <strong>{calculoCambioRin.anchoLlantaMin}mm - {calculoCambioRin.anchoLlantaMax}mm</strong> 
                        (óptimo: {calculoCambioRin.anchoLlantaIdeal}mm)
                      </p>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {calculoCambioRin.medidasRecomendadas.map((m, idx) => (
                          <button
                            key={idx}
                            onClick={() => setReferencia2(m.medida)}
                            className={`p-2 rounded-lg border-2 transition-colors text-left ${
                              m.compatibilidad === 'optimo' 
                                ? 'border-green-400 bg-green-50 hover:bg-green-100' 
                                : m.compatibilidad === 'aceptable'
                                ? 'border-yellow-400 bg-yellow-50 hover:bg-yellow-100'
                                : m.compatibilidad === 'compatible'
                                ? 'border-blue-400 bg-blue-50 hover:bg-blue-100'
                                : 'border-gray-300 bg-gray-50 hover:bg-gray-100'
                            } ${m.esIdeal ? 'ring-2 ring-orange-400' : ''}`}
                          >
                            <div className="font-bold text-gray-800">{m.medida}</div>
                            <div className="text-xs text-gray-600">
                              ⌀ {m.diametroTotalPulg.toFixed(1)}" ({m.diametroTotal.toFixed(0)}mm)
                            </div>
                            {specs1 && (
                              <div className={`text-xs ${Math.abs(m.difDiametro) < 3 ? 'text-green-600' : Math.abs(m.difDiametro) < 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {m.difDiametro > 0 ? '↑' : '↓'} {Math.abs(m.difDiametro).toFixed(1)}% vs OEM
                              </div>
                            )}
                            {m.esIdeal && <span className="text-xs text-orange-600 font-semibold">⭐ Ideal</span>}
                          </button>
                        ))}
                      </div>
                      
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 justify-center">
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-400"></span> Óptimo (&lt;3%)</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> Aceptable (3-5%)</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-400"></span> Compatible</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded ring-2 ring-orange-400"></span> Ancho ideal</span>
                      </div>
                    </div>
                    
                    {/* Explicación de ET */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="font-bold text-blue-800 text-sm mb-2">💡 ¿Qué es el ET (Offset)?</h5>
                      <p className="text-xs text-blue-700">
                        El <strong>ET</strong> (Einpresstiefe) es la distancia en mm desde el centro del rin hasta la superficie de montaje.
                      </p>
                      <ul className="text-xs text-blue-700 mt-2 space-y-1">
                        <li>• <strong>ET positivo alto</strong> (ej: ET45): El rin entra más hacia la suspensión</li>
                        <li>• <strong>ET bajo o negativo</strong> (ej: ET0, ET-10): El rin sale más hacia el guardafangos</li>
                        <li>• <strong>Regla:</strong> Por cada 1mm que baja el ET, el rin sale 1mm hacia afuera</li>
                      </ul>
                    </div>
                  </div>
                )}
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
                setMarcaSeleccionada("");
                setModeloSeleccionado("");
                setAnioSeleccionado("");
                setMedidasVehiculo(null);
                setRinOriginal({ diametro: 17, ancho: 7.5, et: 30 });
                setRinNuevo({ diametro: 17, ancho: 8, et: 0 });
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