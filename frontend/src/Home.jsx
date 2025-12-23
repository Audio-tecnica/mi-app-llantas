import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Menu, X } from "lucide-react";
import {
  FaCarSide,
  FaCompactDisc,
  FaRulerCombined,
  FaCaravan,
  FaMusic,
  FaLightbulb,
  FaLink,
  FaExclamationTriangle,
  FaChartLine,
  FaBoxOpen,
} from "react-icons/fa";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(0);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [fraseDelDia, setFraseDelDia] = useState("");

  const frases = [
    "El éxito es la suma de pequeños esfuerzos repetidos día tras día.",
    "No importa lo lento que vayas, siempre y cuando no te detengas.",
    "La disciplina es el puente entre metas y logros.",
    "Cada día es una nueva oportunidad para mejorar.",
    "El trabajo duro supera al talento cuando el talento no trabaja duro.",
    "Tu única limitación eres tú mismo.",
    "Los sueños no funcionan a menos que tú lo hagas.",
    "El momento perfecto es ahora.",
    "La constancia es la clave del éxito.",
    "Cree en ti mismo y todo será posible.",
    "Las oportunidades no pasan, las creas tú.",
    "Haz hoy lo que otros no quieren, para tener mañana lo que otros no tienen.",
    "El único modo de hacer un gran trabajo es amar lo que haces.",
    "No cuentes los días, haz que los días cuenten.",
    "La actitud lo es todo, elige una buena.",
    "Pequeños pasos todos los días llevan a grandes logros.",
    "Tu futuro se crea con lo que haces hoy, no mañana.",
    "Persiste, insiste, resiste y nunca desistas.",
    "El fracaso es solo la oportunidad de comenzar de nuevo con más inteligencia.",
    "La motivación te pone en marcha, el hábito te mantiene en movimiento.",
    "No esperes el momento perfecto, toma el momento y hazlo perfecto.",
    "El éxito no es el final, el fracaso no es fatal: es el coraje para continuar lo que cuenta.",
    "La diferencia entre lo ordinario y lo extraordinario es ese pequeño extra.",
    "No te rindas, el comienzo siempre es lo más difícil.",
    "La mejor inversión que puedes hacer es en ti mismo.",
    "Cada experto fue una vez un principiante.",
    "No busques excusas, busca resultados.",
    "La acción es la clave fundamental de todo éxito.",
    "Haz de cada día tu obra maestra.",
    "El fracaso es el condimento que da sabor al éxito.",
    "La vida es 10% lo que te pasa y 90% cómo reaccionas a ello.",
    "No dejes que el miedo al fracaso te impida intentarlo.",
    "El éxito es aprender a ir de fracaso en fracaso sin desesperarse.",
    "La perseverancia es el trabajo duro que haces después de cansarte del trabajo duro que ya hiciste.",
    "Tu tiempo es limitado, no lo desperdicies viviendo la vida de otro.",
    "La única forma de hacer un gran trabajo es amar lo que haces.",
    "No te compares con otros, compárate con quien eras ayer.",
    "El progreso no es automático, requiere compromiso.",
    "La excelencia no es un acto, es un hábito.",
    "Enfócate en ser productivo en lugar de estar ocupado.",
    "Los ganadores nunca se rinden, los que se rinden nunca ganan.",
    "La vida comienza donde termina tu zona de confort.",
    "No esperes oportunidades, créalas.",
    "La mejor manera de predecir el futuro es crearlo.",
    "Cada día trae nuevas oportunidades, nuevas bendiciones.",
    "Sé la razón por la que alguien sonríe hoy.",
    "La gratitud convierte lo que tenemos en suficiente.",
    "Elige la felicidad todos los días.",
    "Tu actitud determina tu dirección.",
    "Confía en el Señor de todo corazón, y no en tu propia inteligencia.",
    "Todo lo puedo en Cristo que me fortalece.",
    "Dios tiene un plan perfecto para tu vida, confía en Él.",
    "Encomienda a Dios tus obras, y tus pensamientos serán afirmados.",
    "Con Dios todo es posible.",
    "La fe mueve montañas, confía en el poder de Dios.",
    "Dios nunca llega tarde, su tiempo es perfecto.",
    "Cada nuevo día es una bendición del Señor.",
    "El Señor es mi pastor, nada me faltará.",
    "Camina por fe, no por vista.",
  ];

  const categories = [
    {
      name: "Llantas",
      icon: <FaCarSide />,
      path: "/llantas",
      color: "#3b82f6",
      bgColor: "#eff6ff",
    },
    {
      name: "Rines",
      icon: <FaCompactDisc />,
      path: "/rines",
      color: "#8b5cf6",
      bgColor: "#f5f3ff",
    },
    {
      name: "Tapetes",
      icon: <FaRulerCombined />,
      path: "/tapetes",
      color: "#10b981",
      bgColor: "#ecfdf5",
    },
    {
      name: "Carpas",
      icon: <FaCaravan />,
      path: "/carpas",
      color: "#f59e0b",
      bgColor: "#fffbeb",
    },
    {
      name: "Sonido",
      icon: <FaMusic />,
      path: "/sonido",
      color: "#06b6d4",
      bgColor: "#ecfeff",
    },
    {
      name: "Luces",
      icon: <FaLightbulb />,
      path: "/luces",
      color: "#eab308",
      bgColor: "#fefce8",
    },
    {
      name: "Tiros",
      icon: <FaLink />,
      path: "/tiros-arrastre",
      color: "#64748b",
      bgColor: "#f8fafc",
    },
  ];

  useEffect(() => {
    loadAlerts();
    cargarFraseDelDia();
  }, []);

  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setInterval(() => {
        setCurrentAlert((prev) => (prev + 1) % alerts.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [alerts.length]);

  const cargarFraseDelDia = () => {
    const hoy = new Date().toDateString();
    const fraseGuardada = localStorage.getItem("fraseDelDia");
    const fechaGuardada = localStorage.getItem("fechaFrase");

    if (fechaGuardada === hoy && fraseGuardada) {
      setFraseDelDia(fraseGuardada);
    } else {
      const fraseAleatoria = frases[Math.floor(Math.random() * frases.length)];
      setFraseDelDia(fraseAleatoria);
      localStorage.setItem("fraseDelDia", fraseAleatoria);
      localStorage.setItem("fechaFrase", hoy);
    }
  };

  const loadAlerts = async () => {
    try {
      const alertsData = [];
      const { data: sinStock } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/llantas"
      );

      const sinStockItems = sinStock.filter((l) => l.stock === 0).slice(0, 20);
      if (sinStockItems.length > 0) {
        const randomItems = sinStockItems
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        alertsData.push({
          type: "danger",
          icon: <FaExclamationTriangle />,
          title: "Sin Stock",
          items: randomItems.map(
            (item) => `${item.referencia} - ${item.marca}`
          ),
          color: "#ef4444",
        });
      }

      const stockBajoItems = sinStock
        .filter((l) => l.stock > 0 && l.stock < 3)
        .slice(0, 20);
      if (stockBajoItems.length > 0) {
        const randomItems = stockBajoItems
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        alertsData.push({
          type: "warning",
          icon: <FaBoxOpen />,
          title: "Stock Bajo",
          items: randomItems.map(
            (item) => `${item.referencia} - ${item.marca} (${item.stock})`
          ),
          color: "#f59e0b",
        });
      }

      const { data: promociones } = await axios.get(
        "https://mi-app-llantas.onrender.com/api/promociones"
      );
      const promocionesActivas = promociones
        .filter((p) => p.activa)
        .slice(0, 3);
      if (promocionesActivas.length > 0) {
        alertsData.push({
          type: "info",
          icon: <FaChartLine />,
          title: "Promociones Activas",
          items: promocionesActivas.map(
            (item) =>
              `${item.marca} ${
                item.referencia
              } - $${item.precio_promo?.toLocaleString("es-CO")}`
          ),
          color: "#3b82f6",
        });
      }

      setAlerts(alertsData.slice(0, 3));
    } catch (error) {
      console.error("Error loading alerts:", error);
    }
  };

  const handleCategoryClick = (path) => {
    navigate(path);
  };

  const goToAlert = (index) => {
    setCurrentAlert(index);
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
              onClick={() => navigate("/")}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-700 transition-all text-sm"
            >
              <span>🏠</span>
              <span>Home</span>
            </button>

            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3 mt-6">
              Categorías
            </div>

            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => handleCategoryClick(category.path)}
                className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-slate-700 transition-all text-sm"
              >
                <span>{category.icon}</span>
                <span>{category.name}</span>
              </button>
            ))}

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
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4">
          <div className="home-container">
            <div className="home-header">
              <h1>Bienvenido a Mi App Audio Tecnica</h1>
              <p>Selecciona una categoría para comenzar</p>
            </div>

            <div className="categories-grid">
              {categories.map((category, index) => (
                <div
                  key={index}
                  className="category-card"
                  onClick={() => handleCategoryClick(category.path)}
                  style={{
                    "--category-color": category.color,
                    "--category-bg": category.bgColor,
                  }}
                >
                  <div
                    className="category-icon"
                    style={{ color: category.color }}
                  >
                    {category.icon}
                  </div>
                  <h3>{category.name}</h3>
                </div>
              ))}
            </div>

            {alerts.length > 0 && (
              <div className="alerts-section">
                <h2>Alertas del Sistema</h2>
                <div className="alerts-carousel">
                  <div
                    className="alerts-track"
                    style={{ transform: `translateX(-${currentAlert * 100}%)` }}
                  >
                    {alerts.map((alert, index) => (
                      <div
                        key={index}
                        className="alert-card"
                        style={{ borderLeftColor: alert.color }}
                      >
                        <div className="alert-header">
                          <div
                            className="alert-icon"
                            style={{ color: alert.color }}
                          >
                            {alert.icon}
                          </div>
                          <h3>{alert.title}</h3>
                        </div>
                        <ul className="alert-items">
                          {alert.items.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>

                  <div className="carousel-indicators">
                    {alerts.map((_, index) => (
                      <button
                        key={index}
                        className={`indicator ${
                          index === currentAlert ? "active" : ""
                        }`}
                        onClick={() => goToAlert(index)}
                        aria-label={`Ir a alerta ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Frase del día - Debajo de las alertas */}
            <div className="mt-6">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-md border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-500 rounded-full p-3">
                    <span className="text-2xl">💡</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">
                    Frase del Día
                  </h3>
                </div>
                <p className="text-slate-700 text-base leading-relaxed italic font-medium">
                  "{fraseDelDia}"
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;