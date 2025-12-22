import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FaCarSide,
  FaCompactDisc,
  FaRulerCombined,
  FaShoppingBag,
  FaCaravan,
  FaMusic,
  FaLightbulb,
  FaLink,
  FaExclamationTriangle,
  FaChartLine,
  FaBoxOpen,
  FaSignOutAlt,
  FaHome
} from 'react-icons/fa';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(0);

  const categories = [
    {
      name: 'Llantas',
      icon: <FaCarSide />,
      path: '/',
      color: '#3b82f6',
      bgColor: '#eff6ff'
    },
    {
      name: 'Rines',
      icon: <FaCompactDisc />,
      path: '/rines',
      color: '#8b5cf6',
      bgColor: '#f5f3ff'
    },
    {
      name: 'Tapetes',
      icon: <FaRulerCombined />,
      path: '/tapetes',
      color: '#10b981',
      bgColor: '#ecfdf5'
    },
    {
      name: 'Carpas',
      icon: <FaCaravan />,
      path: '/carpas',
      color: '#f59e0b',
      bgColor: '#fffbeb'
    },
    {
      name: 'Sonido',
      icon: <FaMusic />,
      path: '/sonido',
      color: '#06b6d4',
      bgColor: '#ecfeff'
    },
    {
      name: 'Luces',
      icon: <FaLightbulb />,
      path: '/luces',
      color: '#eab308',
      bgColor: '#fefce8'
    },
    {
      name: 'Tiros',
      icon: <FaLink />,
      path: '/tiros-arrastre',
      color: '#64748b',
      bgColor: '#f8fafc'
    }
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

      // Alerta 1: Productos sin stock
      const { data: sinStock } = await axios.get(
        'https://mi-app-llantas.onrender.com/api/llantas'
      );

      const sinStockItems = sinStock.filter(l => l.stock === 0).slice(0, 20);
      
      if (sinStockItems.length > 0) {
        const randomItems = sinStockItems.sort(() => 0.5 - Math.random()).slice(0, 3);
        alertsData.push({
          type: 'danger',
          icon: <FaExclamationTriangle />,
          title: 'Sin Stock',
          items: randomItems.map(item => `${item.referencia} - ${item.marca}`),
          color: '#ef4444'
        });
      }

      // Alerta 2: Stock bajo
      const stockBajoItems = sinStock.filter(l => l.stock > 0 && l.stock < 3).slice(0, 20);
      
      if (stockBajoItems.length > 0) {
        const randomItems = stockBajoItems.sort(() => 0.5 - Math.random()).slice(0, 3);
        alertsData.push({
          type: 'warning',
          icon: <FaBoxOpen />,
          title: 'Stock Bajo',
          items: randomItems.map(item => `${item.referencia} - ${item.marca} (${item.stock})`),
          color: '#f59e0b'
        });
      }

      // Alerta 3: Promociones activas
      const { data: promociones } = await axios.get(
        'https://mi-app-llantas.onrender.com/api/promociones'
      );

      const promocionesActivas = promociones.filter(p => p.activa).slice(0, 3);
      
      if (promocionesActivas.length > 0) {
        alertsData.push({
          type: 'info',
          icon: <FaChartLine />,
          title: 'Promociones Activas',
          items: promocionesActivas.map(item => `${item.marca} ${item.referencia} - $${item.precio_promo?.toLocaleString('es-CO')}`),
          color: '#3b82f6'
        });
      }

      setAlerts(alertsData.slice(0, 3));
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const handleCategoryClick = (path) => {
    navigate(path);
  };

  const goToAlert = (index) => {
    setCurrentAlert(index);
  };

  const handleLogout = () => {
    localStorage.removeItem('acceso');
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 text-white min-h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center justify-between mb-8">
            <img src="/logowp.PNG" className="h-16 w-auto" alt="Logo" />
          </div>

          <nav className="space-y-1">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3">
              Principal
            </div>

            <button
              onClick={() => navigate('/home')}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 transition-all text-sm"
            >
              <span><FaHome /></span>
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
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-red-600 transition-all text-sm"
            >
              <span><FaSignOutAlt /></span>
              <span>Cerrar Sesión</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <div className="home-container">
          <div className="home-header">
            <h1>Bienvenido a Mi App Llantas</h1>
            <p>Selecciona una categoría para comenzar</p>
          </div>

          <div className="categories-grid">
            {categories.map((category, index) => (
              <div
                key={index}
                className="category-card"
                onClick={() => handleCategoryClick(category.path)}
                style={{
                  '--category-color': category.color,
                  '--category-bg': category.bgColor
                }}
              >
                <div className="category-icon" style={{ color: category.color }}>
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
                <div className="alerts-track" style={{ transform: `translateX(-${currentAlert * 100}%)` }}>
                  {alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="alert-card"
                      style={{ borderLeftColor: alert.color }}
                    >
                      <div className="alert-header">
                        <div className="alert-icon" style={{ color: alert.color }}>
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
                      className={`indicator ${index === currentAlert ? 'active' : ''}`}
                      onClick={() => goToAlert(index)}
                      aria-label={`Ir a alerta ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;