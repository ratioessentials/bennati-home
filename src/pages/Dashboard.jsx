import React from "react";
import { apiClient } from "@/components/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Home, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  TrendingUp,
  Calendar
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils";

export default function Dashboard() {
  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties(),
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => apiClient.getApartments({ active: true }),
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['operators'],
    queryFn: () => apiClient.getUsers({ role: 'user' }),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['recent-completions'],
    queryFn: () => apiClient.getCompletions({ limit: 50 }),
  });

  const { data: supplyAlerts = [] } = useQuery({
    queryKey: ['supply-alerts-dashboard'],
    queryFn: () => apiClient.getSupplyAlerts({ resolved: false }),
  });

  const { data: allChecklists = [] } = useQuery({
    queryKey: ['all-checklists'],
    queryFn: () => apiClient.getChecklistItems({ active: true }),
  });

  // Calcola statistiche
  const totalCompletionsToday = completions.filter(c => {
    const completionDate = new Date(c.completion_date);
    const today = new Date();
    return completionDate.toDateString() === today.toDateString();
  }).length;

  const apartmentsWithRecentCleaning = apartments.filter(apt => {
    const aptCompletions = completions.filter(c => c.apartment_id === apt.id);
    if (aptCompletions.length === 0) return false;
    
    const lastCleaning = new Date(aptCompletions[0].completion_date);
    const daysSince = Math.floor((new Date() - lastCleaning) / (1000 * 60 * 60 * 24));
    return daysSince <= 7;
  }).length;

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'N/A';
  };

  const getLastCleaning = (apartmentId) => {
    const aptCompletions = completions.filter(c => c.apartment_id === apartmentId);
    if (aptCompletions.length === 0) return null;
    
    return new Date(aptCompletions[0].completion_date);
  };

  const getCompletionPercentage = (apartmentId) => {
    const aptChecklists = allChecklists.filter(c => c.apartment_id === apartmentId);
    if (aptChecklists.length === 0) return 0;
    
    const aptCompletions = completions.filter(c => c.apartment_id === apartmentId);
    const completedToday = aptCompletions.filter(c => {
      const completionDate = new Date(c.completion_date);
      const today = new Date();
      return completionDate.toDateString() === today.toDateString();
    }).length;
    
    return Math.round((completedToday / aptChecklists.length) * 100);
  };

  const getApartmentAlerts = (apartmentId) => {
    return supplyAlerts.filter(a => a.apartment_id === apartmentId).length;
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Panoramica generale delle attività</p>
        </div>

        {/* Statistiche principali */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-none shadow-lg bg-gradient-to-br from-teal-500 to-cyan-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm font-medium">Appartamenti Attivi</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{apartments.length}</h3>
                </div>
                <Home className="w-12 h-12 text-teal-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-purple-500 to-pink-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Strutture</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{properties.length}</h3>
                </div>
                <Building2 className="w-12 h-12 text-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Operatori</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{operators.length}</h3>
                </div>
                <Users className="w-12 h-12 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg bg-gradient-to-br from-orange-500 to-red-600">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Alert Scorte</p>
                  <h3 className="text-3xl font-bold text-white mt-2">{supplyAlerts.length}</h3>
                </div>
                <AlertTriangle className="w-12 h-12 text-orange-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Statistiche secondarie */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Attività Completate Oggi</p>
                  <p className="text-2xl font-bold text-gray-900">{totalCompletionsToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-teal-100 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-teal-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Pulizie Recenti (7gg)</p>
                  <p className="text-2xl font-bold text-gray-900">{apartmentsWithRecentCleaning}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Scorte da Gestire</p>
                  <p className="text-2xl font-bold text-gray-900">{supplyAlerts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista appartamenti */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Appartamenti</h2>
            <Link to={createPageUrl('Apartments')}>
              <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
                Vedi tutti →
              </Badge>
            </Link>
          </div>

          {loadingApartments ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : apartments.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">Nessun appartamento attivo</p>
                <p className="text-gray-400 text-sm">
                  Crea il tuo primo appartamento per iniziare
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apartments.slice(0, 6).map((apartment) => {
                const lastCleaning = getLastCleaning(apartment.id);
                const daysSinceCleaning = lastCleaning 
                  ? Math.floor((new Date() - lastCleaning) / (1000 * 60 * 60 * 24))
                  : null;
                const completionPerc = getCompletionPercentage(apartment.id);
                const alerts = getApartmentAlerts(apartment.id);

                return (
                  <Link key={apartment.id} to={createPageUrl('Apartments')}>
                    <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Home className="w-5 h-5 text-cyan-600" />
                            <h3 className="text-lg font-semibold">{apartment.name}</h3>
                          </div>
                          {alerts > 0 && (
                            <Badge className="bg-orange-100 text-orange-700">
                              {alerts} alert
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                          {getPropertyName(apartment.property_id)}
                        </p>
                        
                        {lastCleaning ? (
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm text-gray-600">
                              Ultima pulizia: {daysSinceCleaning === 0 ? 'Oggi' : `${daysSinceCleaning}gg fa`}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 mb-4">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-400">
                              Nessuna pulizia registrata
                            </span>
                          </div>
                        )}

                        {completionPerc > 0 && (
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Progresso oggi</span>
                              <span className="text-sm font-bold text-teal-600">{completionPerc}%</span>
                            </div>
                            <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-teal-500 to-cyan-600 h-full transition-all duration-500"
                                style={{ width: `${completionPerc}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}