import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  PieChart,
  PlusCircle,
  Settings,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const links = [
    {
      name: "Dashboard",
      path: "/",
      icon: <BarChart2 className="h-5 w-5" />,
    },
    {
      name: "Apostas",
      path: "/apostas",
      icon: <CircleDollarSign className="h-5 w-5" />,
    },
    {
      name: "Nova Aposta",
      path: "/nova-aposta",
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      name: "Análise",
      path: "/analise",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      name: "Configurações",
      path: "/configuracoes",
      icon: <Settings className="h-5 w-5" />,
    },
  ];

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar (desktop) */}
      <aside
        className={`
          hidden md:flex flex-col bg-white shadow-sm border-r
          transition-all duration-300
          ${collapsed ? "w-16" : "w-64"}
        `}
      >
        {/* Topo do sidebar */}
        <div className="flex items-center justify-between py-6 px-4 border-b">
          {!collapsed && (
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 mr-2" />
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                Bet Tracker
              </h1>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-neutral-500 hover:text-neutral-700"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 p-4 space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`
                flex items-center rounded-xl transition-all duration-300
                ${collapsed ? "w-10 h-10 justify-center p-2" : "px-3 py-2"}
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-neutral-700 hover:bg-neutral-100"
                }
              `}
              >
                {/* Ícone com tamanho consistente */}
                {React.cloneElement(link.icon, {
                  className: `h-5 w-5 ${
                    isActive ? "text-blue-600" : "text-neutral-700"
                  }`,
                })}

                {/* Texto condicional */}
                {!collapsed && (
                  <span className="ml-3 font-medium">{link.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Rodapé do sidebar */}
        {!collapsed && (
          <div className="p-4 border-t">
            <div className="text-xs text-neutral-500 text-center">
              Bet Tracker &copy; {new Date().getFullYear()}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile header */}
      <div className="fixed bottom-0 left-0 right-0 z-10 md:hidden bg-white border-t">
        <div className="flex justify-between items-center">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-1 flex-col items-center justify-center py-3 ${
                location.pathname === link.path
                  ? "text-blue-600"
                  : "text-neutral-700"
              }`}
            >
              {link.icon}
              <span className="text-xs mt-1">{link.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="container py-8 px-4 md:px-6 max-w-screen-xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
