
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Package,
  Home,
  AlertTriangle,
  Building2,
  CheckCircle2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function OperatorSupplies() {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedApartment, setSelectedApartment] = useState("");
  const [alertDialogOpen, setAlertDialogOpen] = useState(false);
  const [selectedSupply, setSelectedSupply] = useState(null);
  const [alertNotes, setAlertNotes] = useState("");
  const [alertType, setAlertType] = useState("terminato");

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

  const { data: supplies, isLoading } = useQuery({
    queryKey: ['supplies', selectedApartment],
    queryFn: () => selectedApartment
      ? apiClient.getSupplies({ apartment_id: selectedApartment })
      : Promise.resolve([]),
    initialData: [],
    enabled: !!selectedApartment,
  });

  const createAlertMutation = useMutation({
    mutationFn: async (data) => {
      await apiClient.createSupplyAlert(data);
      
      const supply = supplies.find(s => s.id === data.supply_id);
      const apartment = apartments.find(a => a.id === selectedApartment);
      const property = properties.find(p => p.id === selectedProperty);
      
      const admins = await apiClient.getUsers({ role: 'admin' });
      
      for (const admin of admins) {
        await apiClient.integrations.Core.SendEmail({
          to: admin.email,
          subject: `⚠️ Alert Magazzino - ${supply?.name}`,
          body: `
Ciao ${admin.full_name},

Un operatore ha segnalato che una scorta è ${data.alert_type === 'terminato' ? 'TERMINATA' : 'IN ESAURIMENTO'}:

📦 Prodotto: ${supply?.name}
🏢 Struttura: ${property?.name}
🏠 Appartamento: ${apartment?.name}
⚠️ Stato: ${data.alert_type === 'terminato' ? 'Terminato' : 'In Esaurimento'}

${data.notes ? `Note: ${data.notes}` : ''}

${supply?.amazon_link ? `🛒 Link Acquisto: ${supply.amazon_link}` : ''}

---
Perfect House - Sistema di Gestione Pulizie
          `
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-alerts'] });
      setAlertDialogOpen(false);
      setAlertNotes("");
      setSelectedSupply(null);
    },
  });

  const handleReportAlert = (supply) => {
    setSelectedSupply(supply);
    setAlertDialogOpen(true);
  };

  const handleSubmitAlert = async (e) => {
    e.preventDefault();
    if (!user || !selectedSupply) return;
    
    await createAlertMutation.mutateAsync({
      supply_id: selectedSupply.id,
      apartment_id: selectedApartment,
      operator_id: user.id,
      alert_type: alertType,
      notes: alertNotes,
      resolved: false
    });
  };

  const isLowStock = (supply) => {
    return supply.current_quantity <= supply.min_quantity;
  };

  const categoryColors = {
    pulizia: "bg-teal-100 text-teal-700",
    igiene: "bg-blue-100 text-blue-700",
    cucina: "bg-orange-100 text-orange-700",
    bagno: "bg-purple-100 text-purple-700",
    altro: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="p-4 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
            <Package className="w-7 h-7 text-orange-600" />
            Controllo Magazzino
          </h1>
          <p className="text-gray-600">
            Verifica i prodotti e segnala se terminati
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

        {!selectedApartment ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">
                Seleziona un appartamento per visualizzare il magazzino
              </p>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        ) : supplies.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">
                Nessuna scorta registrata per questo appartamento
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3 pb-6">
            {supplies.map((supply) => {
              const lowStock = isLowStock(supply);
              return (
                <Card
                  key={supply.id}
                  className={`border-none shadow-lg ${
                    lowStock ? 'border-2 border-orange-300 bg-orange-50' : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-900">
                            {supply.name}
                          </h3>
                          {lowStock && (
                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                          )}
                        </div>
                        <Badge className={categoryColors[supply.category]}>
                          {supply.category}
                        </Badge>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${
                          lowStock ? 'text-orange-600' : 'text-teal-600'
                        }`}>
                          {supply.current_quantity}
                        </div>
                        <div className="text-sm text-gray-600">
                          {supply.unit}
                        </div>
                      </div>
                    </div>

                    {lowStock && (
                      <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 mb-3">
                        <p className="text-sm text-orange-800 font-medium">
                          ⚠️ Scorta in esaurimento (minimo: {supply.min_quantity} {supply.unit})
                        </p>
                      </div>
                    )}

                    <Button
                      variant={lowStock ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleReportAlert(supply)}
                      className={lowStock 
                        ? "w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white" 
                        : "w-full"
                      }
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Segnala Problema
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Dialog open={alertDialogOpen} onOpenChange={setAlertDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
                Segnala Problema Scorta
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAlert} className="space-y-4">
              <div>
                <Label>Prodotto</Label>
                <p className="font-semibold text-lg">{selectedSupply?.name}</p>
              </div>

              <div>
                <Label htmlFor="alert_type">Tipo di Segnalazione</Label>
                <Select
                  value={alertType}
                  onValueChange={setAlertType}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="terminato">🔴 Terminato</SelectItem>
                    <SelectItem value="in_esaurimento">🟡 In Esaurimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="notes">Note (opzionale)</Label>
                <Textarea
                  id="notes"
                  value={alertNotes}
                  onChange={(e) => setAlertNotes(e.target.value)}
                  placeholder="Aggiungi dettagli..."
                  rows={3}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setAlertDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                  disabled={createAlertMutation.isPending}
                >
                  {createAlertMutation.isPending ? "Invio..." : "Invia Segnalazione"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
