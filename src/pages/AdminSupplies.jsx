import React, { useState } from "react";
import { apiClient } from "@/components/api/apiClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Edit, Trash2, Home, Building2, Filter, AlertTriangle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminSupplies() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [selectedApartment, setSelectedApartment] = useState("all");
  const [formData, setFormData] = useState({
    apartment_id: "",
    room_id: "",
    name: "",
    category: "pulizia",
    current_quantity: 0,
    min_quantity: 1,
    unit: "pz",
    amazon_link: "",
    notes: ""
  });

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties({ active: true }),
    initialData: [],
  });

  const { data: apartments } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => apiClient.getApartments({ active: true }),
    initialData: [],
  });

  const { data: supplies, isLoading } = useQuery({
    queryKey: ['supplies'],
    queryFn: () => apiClient.getSupplies('-created_date'),
    initialData: [],
  });

  const { data: supplyAlerts } = useQuery({
    queryKey: ['supply-alerts'],
    queryFn: () => apiClient.getSupplyAlerts({ resolved: false }),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createSupply(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateSupply(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteSupply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });

  const resolveAlertMutation = useMutation({
    mutationFn: (alertId) => apiClient.resolveSupplyAlert(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supply-alerts'] });
    },
  });

  const resetForm = () => {
    setFormData({
      apartment_id: "",
      room_id: "",
      name: "",
      category: "pulizia",
      current_quantity: 0,
      min_quantity: 1,
      unit: "pz",
      amazon_link: "",
      notes: ""
    });
    setEditingSupply(null);
  };

  const handleEdit = (supply) => {
    setEditingSupply(supply);
    setFormData(supply);
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingSupply) {
      updateMutation.mutate({ id: editingSupply.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getApartmentName = (apartmentId) => {
    const apt = apartments.find(a => a.id === apartmentId);
    return apt?.name || 'N/A';
  };

  const filteredApartments = selectedProperty === "all"
    ? apartments
    : apartments.filter(apt => apt.property_id === selectedProperty);

  const filteredSupplies = supplies.filter(supply => {
    if (selectedApartment !== "all" && supply.apartment_id !== selectedApartment) return false;
    if (selectedApartment === "all" && selectedProperty !== "all") {
      const apt = apartments.find(a => a.id === supply.apartment_id);
      if (!apt || apt.property_id !== selectedProperty) return false;
    }
    return true;
  });

  const isLowStock = (supply) => {
    return supply.current_quantity <= supply.min_quantity;
  };

  const hasAlert = (supplyId) => {
    return supplyAlerts.some(alert => alert.supply_id === supplyId);
  };

  const categoryColors = {
    pulizia: "bg-teal-100 text-teal-700",
    igiene: "bg-blue-100 text-blue-700",
    cucina: "bg-orange-100 text-orange-700",
    bagno: "bg-purple-100 text-purple-700",
    altro: "bg-gray-100 text-gray-700"
  };

  const unresolvedAlerts = supplyAlerts.length;

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Scorte</h1>
            <p className="text-gray-600">Gestisci i prodotti per ogni appartamento</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/30"
            disabled={apartments.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuova Scorta
          </Button>
        </div>

        {unresolvedAlerts > 0 && (
          <Alert className="mb-6 border-orange-300 bg-gradient-to-r from-orange-50 to-red-50">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <AlertDescription className="text-orange-900">
              <strong>{unresolvedAlerts} segnalazion{unresolvedAlerts > 1 ? 'i' : 'e'} di scorte</strong> da gestire.
              Controlla le scorte evidenziate qui sotto.
            </AlertDescription>
          </Alert>
        )}

        {apartments.length === 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              ⚠️ <strong>Attenzione:</strong> Devi prima creare almeno un appartamento prima di poter aggiungere scorte.
            </AlertDescription>
          </Alert>
        )}

        {apartments.length > 0 && (
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="mb-2 block">Filtra per Struttura</Label>
                  <Select
                    value={selectedProperty}
                    onValueChange={(value) => {
                      setSelectedProperty(value);
                      setSelectedApartment("all");
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Tutte le Strutture
                        </div>
                      </SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            {property.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="mb-2 block">Filtra per Appartamento</Label>
                  <Select
                    value={selectedApartment}
                    onValueChange={setSelectedApartment}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4" />
                          Tutti gli Appartamenti
                        </div>
                      </SelectItem>
                      {filteredApartments.map((apt) => (
                        <SelectItem key={apt.id} value={apt.id}>
                          <div className="flex items-center gap-2">
                            <Home className="w-4 h-4" />
                            {apt.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : filteredSupplies.length === 0 ? (
            <Card className="col-span-full border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">
                  Nessuna scorta registrata
                </p>
                <p className="text-gray-400 text-sm">
                  Clicca su "Nuova Scorta" per iniziare
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSupplies.map((supply) => {
              const lowStock = isLowStock(supply);
              const alert = hasAlert(supply.id);
              return (
                <Card
                  key={supply.id}
                  className={`border-none shadow-lg hover:shadow-xl transition-all duration-300 ${
                    alert ? 'border-2 border-orange-400 bg-orange-50' : ''
                  }`}
                >
                  <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-cyan-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2 flex items-center gap-2">
                          <Package className="w-5 h-5 text-teal-600" />
                          {supply.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge className={categoryColors[supply.category]}>
                            {supply.category}
                          </Badge>
                          {alert && (
                            <Badge className="bg-orange-100 text-orange-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              Segnalato
                            </Badge>
                          )}
                          {lowStock && !alert && (
                            <Badge className="bg-yellow-100 text-yellow-700">
                              Scorta bassa
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm bg-teal-50 p-2 rounded-lg">
                        <Home className="w-4 h-4 text-teal-600" />
                        <span className="text-teal-700 font-medium">
                          {getApartmentName(supply.apartment_id)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Quantità:</span>
                        <span className={`text-xl font-bold ${
                          lowStock ? 'text-orange-600' : 'text-teal-600'
                        }`}>
                          {supply.current_quantity} {supply.unit}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {supply.min_quantity} {supply.unit}
                      </div>
                      {supply.amazon_link && (
                        <a
                          href={supply.amazon_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Link Amazon
                        </a>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(supply)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifica
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Sei sicuro di voler eliminare questa scorta?')) {
                            deleteMutation.mutate(supply.id);
                          }
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {alert && (
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const alertToResolve = supplyAlerts.find(a => a.supply_id === supply.id);
                          if (alertToResolve) {
                            resolveAlertMutation.mutate(alertToResolve.id);
                          }
                        }}
                      >
                        Segna come Gestito
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5 text-teal-600" />
                {editingSupply ? "Modifica Scorta" : "Nuova Scorta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="apartment_id">Appartamento *</Label>
                <Select
                  value={formData.apartment_id}
                  onValueChange={(value) => setFormData({ ...formData, apartment_id: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona appartamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {apartments.map((apt) => (
                      <SelectItem key={apt.id} value={apt.id}>
                        {apt.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Nome Prodotto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="es: Carta Igienica, Detergente Bagno"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pulizia">Pulizia</SelectItem>
                    <SelectItem value="igiene">Igiene</SelectItem>
                    <SelectItem value="cucina">Cucina</SelectItem>
                    <SelectItem value="bagno">Bagno</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="current_quantity">Quantità Attuale</Label>
                  <Input
                    id="current_quantity"
                    type="number"
                    min="0"
                    value={formData.current_quantity}
                    onChange={(e) => setFormData({ ...formData, current_quantity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="min_quantity">Min</Label>
                  <Input
                    id="min_quantity"
                    type="number"
                    min="0"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unità</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="pz"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="amazon_link">Link Amazon (opzionale)</Label>
                <Input
                  id="amazon_link"
                  type="url"
                  value={formData.amazon_link}
                  onChange={(e) => setFormData({ ...formData, amazon_link: e.target.value })}
                  placeholder="https://www.amazon.it/..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Inserisci il link Amazon per riordino rapido
                </p>
              </div>
              <div>
                <Label htmlFor="notes">Note</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Note aggiuntive..."
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingSupply ? "Salva Modifiche" : "Crea Scorta"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}