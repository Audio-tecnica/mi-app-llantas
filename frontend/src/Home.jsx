import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
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
  FaBoxOpen
} from 'react-icons/fa';
import './Home.css';
import Layout from './Layout';

const Home = () => {
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [currentAlert, setCurrentAlert] = useState(0);

  const categories = [
    {
      name: 'Llantas',
      icon: <FaCarSide />,
      path: '/llantas',
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

  return (
    <Layout>
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
    </Layout>
  );
};

export default Home;