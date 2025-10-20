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
import { ClipboardList, Plus, Edit, Trash2, Home, Building2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminChecklists() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState("all");
  const [selectedApartment, setSelectedApartment] = useState("all");
  const [formData, setFormData] = useState({
    apartment_id: "",
    room_id: "",
    description: "",
    category: "pulizia",
    order: 0,
    active: true
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

  const { data: rooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiClient.getRooms(),
    initialData: [],
  });

  const { data: checklistItems, isLoading } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: () => apiClient.getChecklistItems('order'),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: (data) => apiClient.createChecklistItem(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateChecklistItem(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiClient.deleteChecklistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-items'] });
    },
  });

  const resetForm = () => {
    setFormData({
      apartment_id: "",
      room_id: "",
      description: "",
      category: "pulizia",
      order: 0,
      active: true
    });
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const getApartmentName = (apartmentId) => {
    const apt = apartments.find(a => a.id === apartmentId);
    return apt?.name || 'N/A';
  };

  const getRoomName = (roomId) => {
    if (!roomId) return 'Generale';
    const room = rooms.find(r => r.id === roomId);
    return room?.name || 'N/A';
  };

  const filteredApartments = selectedProperty === "all"
    ? apartments
    : apartments.filter(apt => apt.property_id === selectedProperty);

  const filteredItems = checklistItems.filter(item => {
    if (selectedApartment !== "all" && item.apartment_id !== selectedApartment) return false;
    if (selectedApartment === "all" && selectedProperty !== "all") {
      const apt = apartments.find(a => a.id === item.apartment_id);
      if (!apt || apt.property_id !== selectedProperty) return false;
    }
    return true;
  });

  const categoryColors = {
    pulizia: "bg-teal-100 text-teal-700",
    controllo: "bg-blue-100 text-blue-700",
    riordino: "bg-purple-100 text-purple-700",
    altro: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Checklist</h1>
            <p className="text-gray-600">Gestisci le attività per ogni appartamento</p>
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
            Nuova Attività
          </Button>
        </div>

        {apartments.length === 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              ⚠️ <strong>Attenzione:</strong> Devi prima creare almeno un appartamento prima di poter aggiungere attività alla checklist.
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

        <div className="space-y-3">
          {isLoading ? (
            Array(5).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : filteredItems.length === 0 ? (
            <Card className="border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">
                  Nessuna attività nella checklist
                </p>
                <p className="text-gray-400 text-sm">
                  Clicca su "Nuova Attività" per iniziare
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredItems.map((item) => (
              <Card
                key={item.id}
                className="border-none shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={categoryColors[item.category]}>
                          {item.category}
                        </Badge>
                        {!item.active && (
                          <Badge variant="secondary">Non Attiva</Badge>
                        )}
                      </div>
                      <p className="text-gray-900 font-medium mb-2">{item.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Home className="w-4 h-4 text-teal-600" />
                          <span>{getApartmentName(item.apartment_id)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Stanza:</span>
                          <span>{getRoomName(item.room_id)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Sei sicuro di voler eliminare questa attività?')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-600" />
                {editingItem ? "Modifica Attività" : "Nuova Attività"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="apartment_id">Appartamento *</Label>
                <Select
                  value={formData.apartment_id}
                  onValueChange={(value) => setFormData({ ...formData, apartment_id: value, room_id: "" })}
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
                <Label htmlFor="room_id">Stanza (opzionale)</Label>
                <Select
                  value={formData.room_id || ""}
                  onValueChange={(value) => setFormData({ ...formData, room_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Generale (tutte le stanze)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>Generale</SelectItem>
                    {rooms
                      .filter(r => r.apartment_id === formData.apartment_id)
                      .map((room) => (
                        <SelectItem key={room.id} value={room.id}>
                          {room.name} ({room.room_type})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Descrizione Attività *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="es: Pulire i sanitari, Passare l'aspirapolvere"
                  rows={3}
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
                    <SelectItem value="controllo">Controllo</SelectItem>
                    <SelectItem value="riordino">Riordino</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="order">Ordine</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le attività saranno mostrate in ordine crescente
                </p>
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
                  {editingItem ? "Salva Modifiche" : "Crea Attività"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}