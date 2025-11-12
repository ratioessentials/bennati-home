
import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils";
import { apiClient } from "@/components/api/apiClient";
import { useProperty } from "@/contexts/PropertyContext";
import { 
  LayoutDashboard,
  Building2, 
  Home, 
  ClipboardList, 
  Package, 
  Users,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = React.useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const { selectedProperty, properties, selectProperty, loading: propertiesLoading, refreshProperties } = useProperty();

  React.useEffect(() => {
    // Carica l'utente corrente dal backend Python
    apiClient.getCurrentUser()
      .then((userData) => {
        setUser(userData);
        // Dopo il login, ricarica le strutture
        refreshProperties();
      })
      .catch(() => {
        // Se non autenticato, reindirizza al login
        window.location.href = '/login';
      })
      .finally(() => setLoading(false));
  }, [refreshProperties]);

  // Reindirizza operatori all'OperatorWorkflow se sono sulla Dashboard
  React.useEffect(() => {
    if (user?.role === 'operator' && currentPageName === 'Dashboard') {
      window.location.href = '/OperatorWorkflow';
    }
  }, [user, currentPageName]);

  const isAdmin = user?.role === 'admin';
  const isOperator = user?.role === 'operator';

  const adminMenuItems = [
    { name: "Dashboard", icon: LayoutDashboard, page: "Dashboard" },
    { name: "Strutture", icon: Building2, page: "Properties" },
    { name: "Appartamenti", icon: Home, page: "Apartments" },
    { name: "Checklist", icon: ClipboardList, page: "AdminChecklists" },
    { name: "Dotazioni", icon: Box, page: "AdminDotazioni" },
    { name: "Magazzino", icon: Package, page: "AdminSupplies" },
    { name: "Operazioni", icon: Users, page: "Operators" },
  ];

  const operatorMenuItems = [
    { name: "Operazioni", icon: ClipboardList, page: "OperatorWorkflow" },
  ];

  const menuItems = isAdmin ? adminMenuItems : operatorMenuItems;

  const handleLogout = () => {
    apiClient.logout();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Desktop Sidebar */}
      {(isAdmin || isOperator) && (
        <div className="hidden md:fixed md:inset-y-0 md:flex md:w-64 md:flex-col">
          <div className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-teal-600 to-cyan-700 shadow-xl">
            <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
              <div className="flex flex-shrink-0 items-center px-6 mb-8">
                <h1 className="text-2xl font-bold text-white">TopClean</h1>
              </div>
              
              {/* Selettore Struttura - Prima voce */}
              {isAdmin && (
                <div className="px-3 mb-4">
                  <div className="bg-teal-700/50 rounded-lg p-3 border border-teal-500/30">
                    <label className="text-xs font-medium text-teal-200 mb-2 block">
                      Struttura
                    </label>
                    {propertiesLoading ? (
                      <div className="h-9 bg-teal-800/50 rounded animate-pulse" />
                    ) : properties.length > 0 ? (
                      <Select
                        value={selectedProperty?.id?.toString() || ""}
                        onValueChange={(value) => selectProperty(parseInt(value))}
                      >
                        <SelectTrigger className="w-full bg-white/10 border-teal-500/50 text-white hover:bg-white/20 h-9">
                          <SelectValue placeholder="Seleziona struttura">
                            {selectedProperty?.name || "Seleziona struttura"}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {properties.map((property) => (
                            <SelectItem key={property.id} value={property.id.toString()}>
                              {property.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-xs text-teal-300 text-center py-2">
                        Nessuna struttura
                      </div>
                    )}
                  </div>
                </div>
              )}

              <nav className="mt-5 flex-1 space-y-2 px-3">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-white text-teal-700 shadow-lg'
                          : 'text-teal-50 hover:bg-teal-700 hover:text-white'
                      }`}
                    >
                      <Icon className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive ? 'text-teal-600' : 'text-teal-200'
                      }`} />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex flex-shrink-0 border-t border-teal-500 p-4">
              <div className="flex items-center w-full">
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-teal-200">{isAdmin ? 'Admin' : 'Operator'}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleLogout}
                  className="text-teal-100 hover:text-white hover:bg-teal-700"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-teal-600 to-cyan-700 shadow-lg">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold text-white">TopClean</h1>
          {(isAdmin || isOperator) && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          )}
        </div>
        
        {mobileMenuOpen && (isAdmin || isOperator) && (
          <div className="bg-teal-700 border-t border-teal-500">
            {/* Selettore Struttura Mobile */}
            {isAdmin && (
              <div className="px-3 py-3 border-b border-teal-500">
                <label className="text-xs font-medium text-teal-200 mb-2 block">
                  Struttura
                </label>
                {propertiesLoading ? (
                  <div className="h-9 bg-teal-800/50 rounded animate-pulse" />
                ) : properties.length > 0 ? (
                  <Select
                    value={selectedProperty?.id?.toString() || ""}
                    onValueChange={(value) => selectProperty(parseInt(value))}
                  >
                    <SelectTrigger className="w-full bg-white/10 border-teal-500/50 text-white hover:bg-white/20 h-9">
                      <SelectValue placeholder="Seleziona struttura">
                        {selectedProperty?.name || "Seleziona struttura"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id.toString()}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-xs text-teal-300 text-center py-2">
                    Nessuna struttura
                  </div>
                )}
              </div>
            )}
            <nav className="px-2 py-3 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg ${
                      isActive
                        ? 'bg-white text-teal-700'
                        : 'text-teal-50 hover:bg-teal-600'
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg text-teal-50 hover:bg-teal-600"
              >
                <LogOut className="mr-3 h-5 w-5" />
                Logout
              </button>
            </nav>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className={(isAdmin || isOperator) ? "md:pl-64" : ""}>
        <main className={`${(isAdmin || isOperator) ? 'md:pt-0 pt-16' : 'pt-16'} ${isOperator ? 'pb-20' : ''}`}>
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation for Operators */}
      {isOperator && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg md:hidden z-50">
          <nav className="flex justify-around items-center h-16">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  className={`flex flex-col items-center justify-center flex-1 h-full ${
                    isActive ? 'text-teal-600' : 'text-gray-500'
                  }`}
                >
                  <Icon className={`h-6 w-6 mb-1 ${isActive ? 'text-teal-600' : 'text-gray-400'}`} />
                  <span className="text-xs font-medium">{item.name}</span>
                </Link>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex flex-col items-center justify-center flex-1 h-full text-gray-500"
            >
              <LogOut className="h-6 w-6 mb-1 text-gray-400" />
              <span className="text-xs font-medium">Esci</span>
            </button>
          </nav>
        </div>
      )}
    </div>
  );
}
