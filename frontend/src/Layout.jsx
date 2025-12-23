import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaCarSide,
  FaCompactDisc,
  FaRulerCombined,
  FaCaravan,
  FaMusic,
  FaLightbulb,
  FaLink,
  FaSignOutAlt,
  FaHome
} from 'react-icons/fa';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { section: 'PRINCIPAL', items: [
      { name: 'Home', icon: <FaHome />, path: '/' }
    ]},
    { section: 'CATEGORÍAS', items: [
      { name: 'Llantas', icon: <FaCarSide />, path: '/llantas' },
      { name: 'Rines', icon: <FaCompactDisc />, path: '/rines' },
      { name: 'Tapetes', icon: <FaRulerCombined />, path: '/tapetes' },
      { name: 'Carpas', icon: <FaCaravan />, path: '/carpas' },
      { name: 'Sonido', icon: <FaMusic />, path: '/sonido' },
      { name: 'Luces', icon: <FaLightbulb />, path: '/luces' },
      { name: 'Tiros', icon: <FaLink />, path: '/tiros-arrastre' }
    ]}
  ];

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
            {menuItems.map((section, idx) => (
              <div key={idx}>
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-3 mt-6 first:mt-0">
                  {section.section}
                </div>
                {section.items.map((item, itemIdx) => (
                  <button
                    key={itemIdx}
                    onClick={() => navigate(item.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all text-sm ${
                      location.pathname === item.path
                        ? 'bg-slate-700 text-white'
                        : 'hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.name}</span>
                  </button>
                ))}
              </div>
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
        {children}
      </div>
    </div>
  );
};

export default Layout;