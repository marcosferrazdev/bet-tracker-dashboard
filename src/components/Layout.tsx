import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/context/AuthContext";
import {
    BarChart2,
    Calculator,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    LogOut,
    PieChart,
    PlusCircle,
    Settings
} from "lucide-react";
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "./ui/button";

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
    },    {
      name: <span className="font-extrabold">Nova Aposta</span>,
      path: "/nova-aposta",
      icon: <PlusCircle className="h-5 w-5" />,
    },
    {
      name: "Análise",      path: "/analise",
      icon: <PieChart className="h-5 w-5" />,
    },
    {
      name: "Calc. Surebet",
      path: "/calculadora-surebet",
      icon: <Calculator className="h-5 w-5" />,
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

  // Função para formatar o nome do usuário
  const formatUserName = () => {
    const fullName = user?.user_metadata?.name || '';
    if (!fullName) return user?.email || 'Usuário';

    const nameParts = fullName.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0];
    
    // Retorna o primeiro nome + último sobrenome
    return `${nameParts[0]} ${nameParts[nameParts.length - 1]}`;
  };

  // Obtém iniciais do usuário para o fallback do Avatar
  const getUserInitials = () => {
    const name = user?.user_metadata?.name;
    if (!name) return user?.email?.charAt(0).toUpperCase() || 'U';
    
    const nameParts = name.trim().split(' ');
    if (nameParts.length === 1) return nameParts[0].charAt(0).toUpperCase();
    
    // Retorna as iniciais do primeiro e último nome
    return (nameParts[0].charAt(0) + nameParts[nameParts.length - 1].charAt(0)).toUpperCase();
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
                <div className="flex flex-col min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="font-medium text-sm truncate w-[140px]">
                          {formatUserName()}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{user?.user_metadata?.name || user?.email}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
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

      {/* Menu mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
        <div className="safe-area-bottom grid grid-cols-5 gap-0.5 px-1">
          {links.slice(0, 4).map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="flex flex-col items-center justify-center py-1.5 px-0.5 relative transition-colors duration-200"
              data-active={location.pathname === link.path}
            >
              <div className="flex flex-col items-center">
                {React.cloneElement(link.icon, {
                  className: `h-5 w-5 ${location.pathname === link.path ? "text-blue-600" : "text-neutral-600"}`,
                })}
                <span className="text-[0.65rem] font-medium mt-0.5 text-center leading-tight line-clamp-1">
                  {link.name}
                </span>
                {location.pathname === link.path && (
                  <div className="absolute inset-x-3 -top-px h-0.5 bg-blue-600 rounded-full" />
                )}
              </div>
            </Link>
          ))}
          {/* Botão Mais com dropdown */}
          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex flex-col items-center justify-center py-1.5 px-0.5 relative w-full h-full text-neutral-600 hover:text-neutral-900"
                >
                  <Settings className="h-5 w-5" />
                  <span className="text-[0.65rem] font-medium mt-0.5">Mais</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" alignOffset={-8} className="w-48 mb-2">
                {links.slice(4).map((link) => (
                  <DropdownMenuItem key={link.path} asChild>
                    <Link 
                      to={link.path}
                      className={`flex items-center space-x-2 ${
                        location.pathname === link.path ? "text-blue-600" : ""
                      }`}
                    >
                      {React.cloneElement(link.icon, {
                        className: "h-4 w-4",
                      })}
                      <span>{link.name}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setLogoutModalOpen(true)} className="text-danger-500">
                  <LogOut className="h-4 w-4 mr-2" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
