import React from "react";
import { apiClient } from "@/components/api/apiClient";
import { useProperty } from "@/contexts/PropertyContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Home, 
  Building2, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Package,
  TrendingUp,
  Calendar,
  ClipboardList,
  Clock,
  MapPin,
  ShoppingCart,
  ExternalLink
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/components/utils";

export default function Dashboard() {
  const { selectedPropertyId } = useProperty();
  const { data: properties = [], isLoading: loadingProperties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties(),
  });

  const { data: apartments = [], isLoading: loadingApartments } = useQuery({
    queryKey: ['apartments', selectedPropertyId],
    queryFn: () => apiClient.getApartments(selectedPropertyId ? { property_id: selectedPropertyId, active: true } : { active: true }),
    enabled: !!selectedPropertyId,
  });

  const { data: operators = [] } = useQuery({
    queryKey: ['operators'],
    queryFn: () => apiClient.getUsers({ role: 'operator' }),
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['recent-completions'],
    queryFn: () => apiClient.getCompletions({ limit: 50 }),
  });

  const { data: supplyAlerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['supply-alerts-dashboard'],
    queryFn: () => apiClient.getSupplyAlerts({ is_resolved: false }),
  });

  const { data: workSessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['work-sessions-dashboard'],
    queryFn: () => apiClient.getWorkSessions({ limit: 5 }),
  });

  const { data: allSupplies = [] } = useQuery({
    queryKey: ['supplies-all'],
    queryFn: () => apiClient.getSupplies(),
  });

  const { data: allChecklistItems = [] } = useQuery({
    queryKey: ['checklist-items-all'],
    queryFn: () => apiClient.getChecklistItems(),
  });

  // Recupera tutte le assegnazioni di checklist per calcolare le dotazioni mancanti
  const apartmentChecklistsQueries = useQuery({
    queryKey: ['all-apartment-checklists'],
    queryFn: async () => {
      const allAssignments = [];
      for (const apartment of apartments) {
        const assignments = await apiClient.getApartmentChecklists(apartment.id);
        allAssignments.push(...assignments.map(a => ({ ...a, apartment_id: apartment.id })));
      }
      return allAssignments;
    },
    enabled: apartments.length > 0,
  });

  const allApartmentChecklists = apartmentChecklistsQueries.data || [];

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'N/A';
  };

  const getApartmentName = (apartmentId) => {
    const apartment = apartments.find(a => a.id === apartmentId);
    return apartment?.name || 'N/A';
  };

  const getUserName = (userId) => {
    const allUsers = [...operators];
    const user = allUsers.find(u => u.id === userId);
    return user?.full_name || user?.email || 'N/A';
  };

  const getSupplyName = (supplyId) => {
    const supply = allSupplies.find(s => s.id === supplyId);
    return supply?.name || 'N/A';
  };

  const getChecklistItemName = (checklistItemId) => {
    const item = allChecklistItems.find(i => i.id === checklistItemId);
    return item?.name || 'N/A';
  };

  const getChecklistItemDetails = (checklistItemId) => {
    return allChecklistItems.find(i => i.id === checklistItemId);
  };

  const getLastCleaning = (apartmentId) => {
    const aptCompletions = completions.filter(c => c.apartment_id === apartmentId);
    if (aptCompletions.length === 0) return null;
    
    return new Date(aptCompletions[0].completed_at);
  };

  const getApartmentAlerts = (apartmentId) => {
    return supplyAlerts.filter(a => a.apartment_id === apartmentId).length;
  };

  // Calcola dotazioni mancanti
  const getMissingEquipment = () => {
    const missing = [];
    
    allApartmentChecklists.forEach((assignment) => {
      const item = getChecklistItemDetails(assignment.checklist_item_id);
      if (!item || item.item_type !== 'number') return;

      // Trova l'ultimo completion per questo item e appartamento
      const itemCompletions = completions.filter(
        c => c.checklist_item_id === assignment.checklist_item_id && 
             c.apartment_id === assignment.apartment_id
      );

      const currentValue = itemCompletions.length > 0 && itemCompletions[0].value_number !== null
        ? itemCompletions[0].value_number
        : 0;

      const expected = item.expected_number || 0;

      if (currentValue < expected) {
        missing.push({
          id: `${assignment.apartment_id}-${item.id}`,
          apartment_id: assignment.apartment_id,
          item_name: item.name,
          current: currentValue,
          expected: expected,
          difference: expected - currentValue,
          amazon_link: item.amazon_link,
        });
      }
    });

    // Ordina per differenza decrescente (priorità)
    return missing.sort((a, b) => b.difference - a.difference);
  };

  const missingEquipment = getMissingEquipment();

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('it-IT', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!endTime) return 'In corso...';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-gray-600">Panoramica generale delle attività</p>
        </div>

        {/* PRIMA RIGA: Magazzino in esaurimento + Stato Dotazioni */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          
          {/* Magazzino in Esaurimento */}
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 md:w-6 md:h-6 text-orange-600" />
                  <CardTitle className="text-lg md:text-xl">Magazzino in Esaurimento</CardTitle>
                </div>
                {supplyAlerts.length > 0 && (
                  <Badge variant="destructive">{supplyAlerts.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              {loadingAlerts ? (
                <div className="space-y-3">
                  {Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : supplyAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="text-gray-500 text-sm">Nessuna scorta in esaurimento</p>
                  <p className="text-gray-400 text-xs mt-1">Tutto sotto controllo! 🎉</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {supplyAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-orange-50 border-l-4 border-orange-500 rounded-r-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Package className="w-4 h-4 text-orange-600 shrink-0" />
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {getSupplyName(alert.supply_id)}
                          </span>
                        </div>
                        <Badge variant="destructive" className="text-xs shrink-0">Urgente</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{getApartmentName(alert.apartment_id)}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-600">Attuale: <span className="font-bold text-orange-600">{alert.current_quantity}</span></span>
                        <span className="text-gray-600">Minimo: <span className="font-semibold">{alert.threshold}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stato Dotazioni */}
          <Card className="border-none shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
                  <CardTitle className="text-lg md:text-xl">Dotazioni Mancanti</CardTitle>
                </div>
                {missingEquipment.length > 0 && (
                  <Badge variant="destructive">{missingEquipment.length}</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="max-h-[400px] overflow-y-auto">
              {missingEquipment.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500" />
                  <p className="text-gray-500 text-sm">Tutte le dotazioni complete</p>
                  <p className="text-gray-400 text-xs mt-1">Nessun acquisto necessario! ✨</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {missingEquipment.slice(0, 10).map((item) => (
                    <div key={item.id} className="p-3 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Package className="w-4 h-4 text-red-600 shrink-0" />
                          <span className="font-semibold text-sm text-gray-900 truncate">
                            {item.item_name}
                          </span>
                        </div>
                        <Badge variant="destructive" className="text-xs shrink-0">-{item.difference}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{getApartmentName(item.apartment_id)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600">
                          Attuale: <span className="font-bold text-red-600">{item.current}</span> / Richiesto: <span className="font-semibold">{item.expected}</span>
                        </span>
                        {item.amazon_link && (
                          <a 
                            href={item.amazon_link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            Acquista
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* SECONDA RIGA: Storico Operazioni (full width) */}
        <Card className="border-none shadow-lg mb-6 md:mb-8">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
                <CardTitle className="text-lg md:text-xl">Storico Operazioni</CardTitle>
              </div>
              <Badge variant="outline" className="text-xs md:text-sm cursor-pointer hover:bg-gray-100">
                Vedi tutte →
              </Badge>
            </div>
            <CardDescription className="text-xs md:text-sm">
              Ultime operazioni degli operatori
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : workSessions.length === 0 ? (
              <div className="text-center py-8">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-500 text-sm">Nessuna operazione registrata</p>
                <p className="text-gray-400 text-xs mt-1">Le operazioni appariranno qui</p>
              </div>
            ) : (
              <div className="space-y-2">
                {workSessions.map((session) => (
                  <div 
                    key={session.id}
                    className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full shrink-0 ${
                        session.end_time ? 'bg-green-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-900 truncate">
                          {getApartmentName(session.apartment_id)}
                        </span>
                        <span className="text-xs text-gray-500 hidden md:inline">•</span>
                        <span className="text-xs text-gray-600 truncate hidden md:inline">
                          {getUserName(session.user_id)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">
                        {formatDateTime(session.start_time)}
                      </span>
                      <Badge variant={session.end_time ? "default" : "secondary"} className="text-xs">
                        {session.end_time ? formatDuration(session.start_time, session.end_time) : 'In corso'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}