import React, { useState } from "react";
import { apiClient } from "@/components/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  ClipboardList,
  CheckCircle2,
  Circle,
  Home,
  Building2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorChecklist() {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedApartment, setSelectedApartment] = useState("");

  React.useEffect(() => {
    apiClient.getCurrentUser().then(setUser).catch(() => {});
  }, []);

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties({ active: true }),
    initialData: [],
  });

  const { data: apartments } = useQuery({
    queryKey: ['apartments', selectedProperty],
    queryFn: () => selectedProperty
      ? apiClient.getApartments({ property_id: selectedProperty, active: true })
      : Promise.resolve([]),
    initialData: [],
    enabled: !!selectedProperty,
  });

  const { data: checklistItems, isLoading } = useQuery({
    queryKey: ['checklist-items', selectedApartment],
    queryFn: () => selectedApartment
      ? apiClient.getChecklistItems({ apartment_id: selectedApartment, active: true }, 'order')
      : Promise.resolve([]),
    initialData: [],
    enabled: !!selectedApartment,
  });

  const { data: completions } = useQuery({
    queryKey: ['completions', selectedApartment, user?.id],
    queryFn: async () => {
      const apartmentId = parseInt(selectedApartment);
      if (!apartmentId || isNaN(apartmentId) || !user) return [];
      const today = new Date().toISOString().split('T')[0];
      return apiClient.getCompletions({
        apartment_id: apartmentId,
        user_id: user.id // Corretto da operator_id a user_id
      });
    },
    initialData: [],
    enabled: !!selectedApartment && !!user,
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ itemId, completed }) => {
      if (completed) {
        // Trova e elimina il completamento
        const completion = completions.find(c => c.checklist_item_id === itemId);
        if (completion) {
          await apiClient.deleteCompletion(completion.id);
        }
      } else {
        // Crea nuovo completamento
        await apiClient.createCompletion({
          apartment_id: selectedApartment,
          checklist_item_id: itemId,
          operator_id: user.id,
          completed: true,
          completion_date: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] });
    },
  });

  const isCompleted = (itemId) => {
    return completions.some(c => c.checklist_item_id === itemId);
  };

  const handleToggle = (itemId) => {
    const completed = isCompleted(itemId);
    toggleCompletionMutation.mutate({ itemId, completed });
  };

  const completedCount = checklistItems.filter(item => isCompleted(item.id)).length;
  const totalCount = checklistItems.length;

  const categoryColors = {
    pulizia: "bg-teal-100 text-teal-700",
    controllo: "bg-blue-100 text-blue-700",
    riordino: "bg-purple-100 text-purple-700",
    altro: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-teal-600" />
            Checklist Pulizie
          </h1>
          <p className="text-gray-600">
            Seleziona l'appartamento e completa le attività
          </p>
        </div>

        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Struttura</Label>
              <Select
                value={selectedProperty}
                onValueChange={(value) => {
                  setSelectedProperty(value);
                  setSelectedApartment("");
                }}
              >
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Seleziona struttura" />
                </SelectTrigger>
                <SelectContent>
                  {properties.map((property) => {
                    const propertyId = `${property.id}`;
                    return (
                      <SelectItem key={property.id} value={propertyId}>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          {property.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedProperty && apartments.length > 0 && (
              <div>
                <Label className="text-sm font-medium mb-2 block">Appartamento</Label>
                <Select
                  value={selectedApartment}
                  onValueChange={setSelectedApartment}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Seleziona appartamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apt) => {
                      const apartmentId = `${apt.id}`;
                      return (
                        <SelectItem key={apt.id} value={apartmentId}>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            {apt.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedApartment && totalCount > 0 && (
          <Card className="mb-6 border-none shadow-lg bg-gradient-to-r from-teal-500 to-cyan-600">
            <CardContent className="p-6 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm opacity-90 mb-1">Progressi</div>
                  <div className="text-3xl font-bold">{completedCount}/{totalCount}</div>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">
                    {Math.round((completedCount / totalCount) * 100)}%
                  </div>
                  <div className="text-sm opacity-90">Completato</div>
                </div>
              </div>
              <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-white h-full transition-all duration-500"
                  style={{ width: `${(completedCount / totalCount) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedApartment ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">
                Seleziona un appartamento per visualizzare la checklist
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : checklistItems.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">
                Nessuna attività in checklist per questo appartamento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 pb-6">
            {checklistItems.map((item) => {
              const completed = isCompleted(item.id);
              return (
                <Card
                  key={item.id}
                  className={`border-none shadow-lg transition-all duration-300 ${
                    completed ? 'bg-green-50 border-2 border-green-300' : 'hover:shadow-xl'
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <button
                        onClick={() => handleToggle(item.id)}
                        className="flex-shrink-0 mt-1"
                        disabled={toggleCompletionMutation.isPending}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        ) : (
                          <Circle className="w-8 h-8 text-gray-300 hover:text-teal-600 transition-colors" />
                        )}
                      </button>
                      <div className="flex-1">
                        <p className={`text-lg font-medium mb-2 ${
                          completed ? 'line-through text-gray-500' : 'text-gray-900'
                        }`}>
                          {item.description}
                        </p>
                        <Badge className={categoryColors[item.category]}>
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}