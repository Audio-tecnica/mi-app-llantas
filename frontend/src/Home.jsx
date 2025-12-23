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
  }, []);

  useEffect(() => {
    if (alerts.length > 0) {
      const timer = setInterval(() => {
        setCurrentAlert((prev) => (prev + 1) % alerts.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [alerts.length]);

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
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
