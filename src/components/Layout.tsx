import {
  BarChart2,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  PieChart,
  PlusCircle,
  Settings,
  User,
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "./ui/button";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

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

  const confirmLogout = async () => {
    try {
      await signOut();
      toast.success("Logout realizado com sucesso");
      navigate("/login");
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
    setLogoutModalOpen(false);
  };

  const cancelLogout = () => {
    setLogoutModalOpen(false);
  };

  // Obtém iniciais do usuário para o fallback do Avatar
  const getUserInitials = () => {
    if (!user || !user.email) return "U";
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar (desktop) */}
      <aside
        className={`
          hidden md:flex flex-col bg-white shadow-sm border-r
          transition-all duration-300
          ${collapsed ? "w-16" : "w-64"}
        `}
      >
        {/* Topo do sidebar */}
        <div className="flex items-center justify-between py-2 px-4 border-b">
          {!collapsed && (
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-28 w-64" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-neutral-500 hover:text-neutral-700"
          >
            {collapsed ? (
              <ChevronRight className="ml-2 h-6 w-6" />
            ) : (
              <ChevronLeft className="h-6 w-6" />
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
                {React.cloneElement(link.icon, {
                  className: `h-5 w-5 ${
                    isActive ? "text-blue-600" : "text-neutral-700"
                  }`,
                })}

                {!collapsed && (
                  <span className="ml-3 font-medium">{link.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Informações do usuário e logout */}
        <div className="p-4 border-t">
          {!collapsed ? (
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate max-w-[12rem]">
                    {user?.email}
                  </span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLogoutModalOpen(true)}
                className="flex items-center w-full"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback>{getUserInitials()}</AvatarFallback>
              </Avatar>
              <button
                onClick={() => setLogoutModalOpen(true)}
                className="text-neutral-500 hover:text-neutral-700"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Conteúdo principal */}
      <main className="flex-1 relative">
        <div className="absolute inset-0 overflow-auto">
          <div className="container py-8 px-4 md:px-6 max-w-screen-xl mx-auto pb-24">
            {children}
          </div>
        </div>
      </main>

      {/* Cabeçalho mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t">
        <div className="flex justify-between items-center px-2">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`flex flex-1 flex-col items-center justify-center py-2 px-1 ${
                location.pathname === link.path
                  ? "text-blue-600"
                  : "text-neutral-700"
              }`}
            >
              {React.cloneElement(link.icon, {
                className: `h-5 w-5 ${
                  location.pathname === link.path ? "text-blue-600" : "text-neutral-700"
                }`,
              })}
              <span className="text-[10px] mt-1 text-center">{link.name}</span>
            </Link>
          ))}
          <button
            onClick={() => setLogoutModalOpen(true)}
            className="flex flex-1 flex-col items-center justify-center py-2 px-1 text-neutral-700"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] mt-1">Sair</span>
          </button>
        </div>
      </div>

      {/* Modal de Confirmação de Logout */}
      <AlertDialog open={logoutModalOpen} onOpenChange={setLogoutModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja sair? Você será redirecionado para a tela de login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelLogout}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmLogout}
              className="bg-danger-500 hover:bg-danger-600 text-white"
            >
              Sair
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Layout;
