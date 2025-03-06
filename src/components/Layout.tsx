
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CircleDollarSign, BarChart2, PlusCircle, Settings } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  
  const links = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: <BarChart2 className="h-5 w-5" /> 
    },
    { 
      name: 'Apostas', 
      path: '/apostas', 
      icon: <CircleDollarSign className="h-5 w-5" /> 
    },
    { 
      name: 'Nova Aposta', 
      path: '/nova-aposta', 
      icon: <PlusCircle className="h-5 w-5" /> 
    },
    { 
      name: 'Configurações', 
      path: '/configuracoes', 
      icon: <Settings className="h-5 w-5" /> 
    }
  ];

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Sidebar */}
      <aside className="w-64 hidden md:block bg-white shadow-sm border-r">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-center py-8">
            <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
              Bet Tracker
            </h1>
          </div>
          
          <nav className="flex-1 p-4 space-y-1">
            {links.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center px-4 py-3 rounded-xl transition-all ${
                  location.pathname === link.path
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <span className="mr-3">
                  {link.icon}
                </span>
                <span className="font-medium">{link.name}</span>
              </Link>
            ))}
          </nav>
          
          <div className="p-4 border-t">
            <div className="text-xs text-neutral-500 text-center">
              Bet Tracker &copy; {new Date().getFullYear()}
            </div>
          </div>
        </div>
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
                  ? 'text-blue-600'
                  : 'text-neutral-700'
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
