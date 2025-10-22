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
import { 
  Home, 
  Plus, 
  Edit, 
  Trash2, 
  Building2, 
  Filter, 
  X,
  Settings,
  ClipboardList,
  Package,
  DoorOpen,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Apartments() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [editingApartment, setEditingApartment] = useState(null);
  const [selectedPropertyFilter, setSelectedPropertyFilter] = useState("all");
  const [formData, setFormData] = useState({
    property_id: "",
    name: "",
    floor: "",
    rooms_count: 1,
    notes: "",
    active: true
  });
  const [rooms, setRooms] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [supplies, setSupplies] = useState([]);

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties(),
    initialData: [],
  });

  const { data: apartments, isLoading } = useQuery({
    queryKey: ['apartments'],
    queryFn: () => apiClient.getApartments(),
    initialData: [],
  });

  const { data: allRooms } = useQuery({
    queryKey: ['rooms'],
    queryFn: () => apiClient.getRooms(),
    initialData: [],
  });

  const { data: allChecklists } = useQuery({
    queryKey: ['checklists'],
    queryFn: () => apiClient.getChecklistItems(),
    initialData: [],
  });

  const { data: allSupplies } = useQuery({
    queryKey: ['supplies'],
    queryFn: () => apiClient.getSupplies(),
    initialData: [],
  });

  const { data: supplyAlerts } = useQuery({
    queryKey: ['supply-alerts'],
    queryFn: () => apiClient.getSupplyAlerts({ is_resolved: false }),
    initialData: [],
  });

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const apartment = await apiClient.createApartment(data.apartmentData);
      
      if (data.rooms && data.rooms.length > 0) {
        for (const room of data.rooms) {
          await apiClient.createRoom({
            apartment_id: apartment.id,
            name: room.name,
            room_type: room.room_type,
            order: room.order
          });
        }
      }
      
      return apartment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      await apiClient.updateApartment(id, data.apartmentData);
      
      const oldRooms = allRooms.filter(r => r.apartment_id === id);
      for (const room of oldRooms) {
        await apiClient.deleteRoom(room.id);
      }
      
      if (data.rooms && data.rooms.length > 0) {
        for (const room of data.rooms) {
          await apiClient.createRoom({
            apartment_id: id,
            name: room.name,
            room_type: room.room_type,
            order: room.order
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setDialogOpen(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const apartmentRooms = allRooms.filter(r => r.apartment_id === id);
      for (const room of apartmentRooms) {
        await apiClient.deleteRoom(room.id);
      }
      
      const apartmentChecklists = allChecklists.filter(c => c.apartment_id === id);
      for (const checklist of apartmentChecklists) {
        await apiClient.deleteChecklistItem(checklist.id);
      }
      
      const apartmentSupplies = allSupplies.filter(s => s.apartment_id === id);
      for (const supply of apartmentSupplies) {
        await apiClient.deleteSupply(supply.id);
      }
      
      await apiClient.deleteApartment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });

  const resetForm = () => {
    setFormData({
      property_id: "",
      name: "",
      floor: "",
      rooms_count: 1,
      notes: "",
      active: true
    });
    setRooms([]);
    setEditingApartment(null);
  };

  const handleEdit = (apartment) => {
    setEditingApartment(apartment);
    setFormData(apartment);
    
    const apartmentRooms = allRooms.filter(r => r.apartment_id === apartment.id);
    setRooms(apartmentRooms.map((r, idx) => ({
      name: r.name,
      room_type: r.room_type,
      order: r.order || idx
    })));
    
    setDialogOpen(true);
  };

  const handleManage = (apartment) => {
    setSelectedApartment(apartment);
    setManageDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      apartmentData: formData,
      rooms: rooms
    };
    
    if (editingApartment) {
      updateMutation.mutate({ id: editingApartment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addRoom = () => {
    setRooms([...rooms, { name: "", room_type: "camera", order: rooms.length }]);
  };

  const removeRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const updateRoom = (index, field, value) => {
    const newRooms = [...rooms];
    newRooms[index] = { ...newRooms[index], [field]: value };
    setRooms(newRooms);
  };

  const getPropertyName = (propertyId) => {
    const property = properties.find(p => p.id === propertyId);
    return property?.name || 'Struttura non trovata';
  };

  const getRoomCount = (apartmentId) => {
    return allRooms.filter(r => r.apartment_id === apartmentId).length;
  };

  const getChecklistCount = (apartmentId) => {
    return allChecklists.filter(c => c.apartment_id === apartmentId).length;
  };

  const getSupplyCount = (apartmentId) => {
    return allSupplies.filter(s => s.apartment_id === apartmentId).length;
  };

  const getApartmentAlerts = (apartmentId) => {
    return supplyAlerts.filter(a => a.apartment_id === apartmentId).length;
  };

  const filteredApartments = selectedPropertyFilter === "all" 
    ? apartments 
    : apartments.filter(apt => apt.property_id === selectedPropertyFilter);

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Appartamenti</h1>
            <p className="text-gray-600">Gestisci appartamenti, stanze, checklist e scorte</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/30"
            disabled={properties.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuovo Appartamento
          </Button>
        </div>

        {properties.length === 0 && (
          <Alert className="mb-6 border-orange-200 bg-orange-50">
            <AlertDescription className="text-orange-800">
              ⚠️ <strong>Attenzione:</strong> Devi prima creare almeno una struttura nella sezione "Strutture" prima di poter aggiungere appartamenti.
            </AlertDescription>
          </Alert>
        )}

        {properties.length > 0 && (
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Filter className="w-5 h-5 text-gray-500" />
                <div className="flex-1">
                  <Label className="mb-2 block">Filtra per Struttura</Label>
                  <Select
                    value={selectedPropertyFilter}
                    onValueChange={setSelectedPropertyFilter}
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
                <div className="text-sm text-gray-600">
                  {filteredApartments.length} appartament{filteredApartments.length !== 1 ? 'i' : 'o'}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))
          ) : filteredApartments.length === 0 ? (
            <Card className="col-span-full border-none shadow-lg">
              <CardContent className="p-12 text-center">
                <Home className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500 text-lg mb-2">
                  {selectedPropertyFilter === "all" 
                    ? "Nessun appartamento creato" 
                    : "Nessun appartamento in questa struttura"}
                </p>
                <p className="text-gray-400 text-sm">
                  Clicca su "Nuovo Appartamento" per iniziare
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApartments.map((apartment) => {
              const alerts = getApartmentAlerts(apartment.id);

              return (
                <Card
                  key={apartment.id}
                  className="border-none shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  <CardHeader className="border-b bg-gradient-to-r from-cyan-50 to-teal-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2 text-lg mb-2">
                          <Home className="w-5 h-5 text-cyan-600" />
                          {apartment.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant={apartment.active ? "success" : "secondary"}
                            className={apartment.active ? "bg-green-100 text-green-700" : ""}
                          >
                            {apartment.active ? "Attivo" : "Non Attivo"}
                          </Badge>
                          {alerts > 0 && (
                            <Badge className="bg-orange-100 text-orange-700">
                              <AlertTriangle className="w-3 h-3 mr-1" />
                              {alerts} alert
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center gap-2 text-sm bg-teal-50 p-2 rounded-lg">
                        <Building2 className="w-4 h-4 text-teal-600" />
                        <span className="text-teal-700 font-medium">
                          {getPropertyName(apartment.property_id)}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div className="bg-blue-50 p-2 rounded">
                          <div className="font-bold text-blue-600">{getRoomCount(apartment.id)}</div>
                          <div className="text-xs text-blue-700">Stanze</div>
                        </div>
                        <div className="bg-purple-50 p-2 rounded">
                          <div className="font-bold text-purple-600">{getChecklistCount(apartment.id)}</div>
                          <div className="text-xs text-purple-700">Checklist</div>
                        </div>
                        <div className="bg-orange-50 p-2 rounded">
                          <div className="font-bold text-orange-600">{getSupplyCount(apartment.id)}</div>
                          <div className="text-xs text-orange-700">Scorte</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleManage(apartment)}
                        className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        Gestisci
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(apartment)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Sei sicuro di voler eliminare questo appartamento e tutti i suoi dati?')) {
                            deleteMutation.mutate(apartment.id);
                          }
                        }}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Dialog Creazione/Modifica Appartamento */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Home className="w-5 h-5 text-cyan-600" />
                {editingApartment ? "Modifica Appartamento" : "Nuovo Appartamento"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informazioni Appartamento</h3>
                <div>
                  <Label htmlFor="property_id">Struttura *</Label>
                  <Select
                    value={formData.property_id}
                    onValueChange={(value) => setFormData({ ...formData, property_id: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona struttura" />
                    </SelectTrigger>
                    <SelectContent>
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
                  <Label htmlFor="name">Nome Appartamento *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="es: App 101, Bilocale Piano 2"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="floor">Piano</Label>
                    <Input
                      id="floor"
                      value={formData.floor}
                      onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                      placeholder="es: 2, PT"
                    />
                  </div>
                  <div>
                    <Label htmlFor="rooms_count">N° Stanze (indicativo)</Label>
                    <Input
                      id="rooms_count"
                      type="number"
                      min="1"
                      value={formData.rooms_count}
                      onChange={(e) => setFormData({ ...formData, rooms_count: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="notes">Note</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Note specifiche..."
                    rows={2}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-semibold text-lg">Stanze</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRoom}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Aggiungi Stanza
                  </Button>
                </div>
                
                {rooms.length === 0 ? (
                  <p className="text-sm text-gray-500 italic text-center py-4">
                    Nessuna stanza configurata. Clicca "Aggiungi Stanza" per iniziare.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {rooms.map((room, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex gap-3 items-start">
                            <div className="flex-1 grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-xs">Nome Stanza *</Label>
                                <Input
                                  value={room.name}
                                  onChange={(e) => updateRoom(index, 'name', e.target.value)}
                                  placeholder="es: Bagno Principale"
                                  required
                                  size="sm"
                                />
                              </div>
                              <div>
                                <Label className="text-xs">Tipo *</Label>
                                <Select
                                  value={room.room_type}
                                  onValueChange={(value) => updateRoom(index, 'room_type', value)}
                                >
                                  <SelectTrigger size="sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="bagno">Bagno</SelectItem>
                                    <SelectItem value="camera">Camera</SelectItem>
                                    <SelectItem value="cucina">Cucina</SelectItem>
                                    <SelectItem value="soggiorno">Soggiorno</SelectItem>
                                    <SelectItem value="ingresso">Ingresso</SelectItem>
                                    <SelectItem value="balcone">Balcone</SelectItem>
                                    <SelectItem value="altro">Altro</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRoom(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-5"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
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
                  {editingApartment ? "Salva Modifiche" : "Crea Appartamento"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog Gestione Appartamento */}
        {selectedApartment && (
          <ManageApartmentDialog
            apartment={selectedApartment}
            open={manageDialogOpen}
            onOpenChange={setManageDialogOpen}
            allRooms={allRooms}
            allChecklists={allChecklists}
            allSupplies={allSupplies}
            queryClient={queryClient}
          />
        )}
      </div>
    </div>
  );
}

// Componente per la gestione completa dell'appartamento
function ManageApartmentDialog({ apartment, open, onOpenChange, allRooms, allChecklists, allSupplies, queryClient }) {
  const [activeTab, setActiveTab] = useState("rooms");
  
  const apartmentRooms = allRooms.filter(r => r.apartment_id === apartment.id);
  const apartmentChecklists = allChecklists.filter(c => c.apartment_id === apartment.id);
  const apartmentSupplies = allSupplies.filter(s => s.apartment_id === apartment.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Gestisci: {apartment.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rooms" className="flex items-center gap-2">
              <DoorOpen className="w-4 h-4" />
              Stanze ({apartmentRooms.length})
            </TabsTrigger>
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Checklist ({apartmentChecklists.length})
            </TabsTrigger>
            <TabsTrigger value="supplies" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Scorte ({apartmentSupplies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="rooms" className="mt-6">
            <RoomsManager 
              apartmentId={apartment.id} 
              rooms={apartmentRooms}
              queryClient={queryClient}
            />
          </TabsContent>

          <TabsContent value="checklist" className="mt-6">
            <ChecklistManager 
              apartmentId={apartment.id} 
              rooms={apartmentRooms}
              checklists={apartmentChecklists}
              queryClient={queryClient}
            />
          </TabsContent>

          <TabsContent value="supplies" className="mt-6">
            <SuppliesManager 
              apartmentId={apartment.id} 
              rooms={apartmentRooms}
              supplies={apartmentSupplies}
              queryClient={queryClient}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Componente per gestire le stanze
function RoomsManager({ apartmentId, rooms, queryClient }) {
  const [newRoom, setNewRoom] = useState({ name: "", room_type: "camera" });
  
  const addRoomMutation = useMutation({
    mutationFn: (data) => apiClient.createRoom({
      ...data,
      apartment_id: apartmentId,
      order: rooms.length
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      setNewRoom({ name: "", room_type: "camera" });
    },
  });

  const deleteRoomMutation = useMutation({
    mutationFn: (id) => apiClient.deleteRoom(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Aggiungi Nuova Stanza</h4>
        <div className="flex gap-3">
          <Input
            placeholder="Nome stanza (es: Bagno Principale)"
            value={newRoom.name}
            onChange={(e) => setNewRoom({ ...newRoom, name: e.target.value })}
          />
          <Select
            value={newRoom.room_type}
            onValueChange={(value) => setNewRoom({ ...newRoom, room_type: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bagno">Bagno</SelectItem>
              <SelectItem value="camera">Camera</SelectItem>
              <SelectItem value="cucina">Cucina</SelectItem>
              <SelectItem value="soggiorno">Soggiorno</SelectItem>
              <SelectItem value="ingresso">Ingresso</SelectItem>
              <SelectItem value="balcone">Balcone</SelectItem>
              <SelectItem value="altro">Altro</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              if (newRoom.name) {
                addRoomMutation.mutate(newRoom);
              }
            }}
            disabled={!newRoom.name || addRoomMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-1" />
            Aggiungi
          </Button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <DoorOpen className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nessuna stanza configurata</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rooms.map((room) => (
            <Card key={room.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <Badge variant="outline" className="mt-1">
                      {room.room_type}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Eliminare questa stanza?')) {
                        deleteRoomMutation.mutate(room.id);
                      }
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente per gestire la checklist
function ChecklistManager({ apartmentId, rooms, checklists, queryClient }) {
  const [newChecklist, setNewChecklist] = useState({
    title: "",
    description: "",
    room_id: null,
    is_mandatory: false
  });
  
  const addChecklistMutation = useMutation({
    mutationFn: (data) => apiClient.createChecklistItem({
      ...data,
      apartment_id: apartmentId,
      order: checklists.length
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      setNewChecklist({ title: "", description: "", room_id: null, is_mandatory: false });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (id) => apiClient.deleteChecklistItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
    },
  });

  const getRoomName = (roomId) => {
    if (!roomId) return "Generale";
    const room = rooms.find(r => r.id === roomId);
    return room?.name || "N/A";
  };

  return (
    <div className="space-y-4">
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Aggiungi Attività alla Checklist</h4>
        <div className="space-y-3">
          <Input
            placeholder="Titolo attività (es: Pulizia Sanitari)"
            value={newChecklist.title}
            onChange={(e) => setNewChecklist({ ...newChecklist, title: e.target.value })}
          />
          <Textarea
            placeholder="Descrizione (opzionale)"
            value={newChecklist.description}
            onChange={(e) => setNewChecklist({ ...newChecklist, description: e.target.value })}
            rows={2}
          />
          <div className="flex gap-3">
            <Select
              value={newChecklist.room_id || ""}
              onValueChange={(value) => setNewChecklist({ ...newChecklist, room_id: value ? parseInt(value) : null })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stanza (opzionale)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Generale</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => {
                if (newChecklist.title) {
                  addChecklistMutation.mutate(newChecklist);
                }
              }}
              disabled={!newChecklist.title || addChecklistMutation.isPending}
            >
              <Plus className="w-4 h-4 mr-1" />
              Aggiungi
            </Button>
          </div>
        </div>
      </div>

      {checklists.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nessuna attività in checklist</p>
        </div>
      ) : (
        <div className="space-y-2">
          {checklists.map((item) => (
            <Card key={item.id} className="border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium mb-2">{item.title}</p>
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {item.is_mandatory && (
                        <Badge className="bg-red-100 text-red-700">Obbligatoria</Badge>
                      )}
                      <Badge variant="outline">
                        {getRoomName(item.room_id)}
                      </Badge>
                      <Badge variant="outline">Ordine: {item.order}</Badge>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Eliminare questa attività?')) {
                        deleteChecklistMutation.mutate(item.id);
                      }
                    }}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Componente per gestire le scorte
function SuppliesManager({ apartmentId, rooms, supplies, queryClient }) {
  const [newSupply, setNewSupply] = useState({
    name: "",
    category: "pulizia",
    current_quantity: 0,
    min_quantity: 1,
    unit: "pz",
    amazon_link: "",
    room_id: ""
  });
  
  const addSupplyMutation = useMutation({
    mutationFn: (data) => apiClient.createSupply({
      ...data,
      apartment_id: apartmentId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setNewSupply({
        name: "",
        category: "pulizia",
        current_quantity: 0,
        min_quantity: 1,
        unit: "pz",
        amazon_link: "",
        room_id: ""
      });
    },
  });

  const deleteSupplyMutation = useMutation({
    mutationFn: (id) => apiClient.deleteSupply(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
    },
  });

  const getRoomName = (roomId) => {
    if (!roomId) return "Generale";
    const room = rooms.find(r => r.id === roomId);
    return room?.name || "N/A";
  };

  const categoryColors = {
    pulizia: "bg-teal-100 text-teal-700",
    igiene: "bg-blue-100 text-blue-700",
    cucina: "bg-orange-100 text-orange-700",
    bagno: "bg-purple-100 text-purple-700",
    altro: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Aggiungi Scorta</h4>
        <div className="space-y-3">
          <Input
            placeholder="Nome prodotto (es: Carta Igienica)"
            value={newSupply.name}
            onChange={(e) => setNewSupply({ ...newSupply, name: e.target.value })}
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Select
              value={newSupply.category}
              onValueChange={(value) => setNewSupply({ ...newSupply, category: value })}
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
            <Input
              type="number"
              placeholder="Qtà"
              value={newSupply.current_quantity}
              onChange={(e) => setNewSupply({ ...newSupply, current_quantity: parseInt(e.target.value) || 0 })}
            />
            <Input
              type="number"
              placeholder="Min"
              value={newSupply.min_quantity}
              onChange={(e) => setNewSupply({ ...newSupply, min_quantity: parseInt(e.target.value) || 1 })}
            />
            <Input
              placeholder="Unità"
              value={newSupply.unit}
              onChange={(e) => setNewSupply({ ...newSupply, unit: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={newSupply.room_id}
              onValueChange={(value) => setNewSupply({ ...newSupply, room_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stanza (opzionale)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={null}>Generale</SelectItem>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Link Amazon (opzionale)"
              value={newSupply.amazon_link}
              onChange={(e) => setNewSupply({ ...newSupply, amazon_link: e.target.value })}
            />
          </div>
          <Button
            onClick={() => {
              if (newSupply.name) {
                addSupplyMutation.mutate(newSupply);
              }
            }}
            disabled={!newSupply.name || addSupplyMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Aggiungi Scorta
          </Button>
        </div>
      </div>

      {supplies.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nessuna scorta registrata</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {supplies.map((supply) => {
            const isLow = supply.current_quantity <= supply.min_quantity;
            return (
              <Card key={supply.id} className={`border ${isLow ? 'border-orange-300 bg-orange-50' : 'border-gray-200'}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium">{supply.name}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={categoryColors[supply.category]}>
                          {supply.category}
                        </Badge>
                        <Badge variant="outline">
                          {getRoomName(supply.room_id)}
                        </Badge>
                        {isLow && (
                          <Badge className="bg-orange-100 text-orange-700">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Bassa
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Eliminare questa scorta?')) {
                          deleteSupplyMutation.mutate(supply.id);
                        }
                      }}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Quantità:</span>
                    <span className={`text-xl font-bold ${isLow ? 'text-orange-600' : 'text-teal-600'}`}>
                      {supply.current_quantity} {supply.unit}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Min: {supply.min_quantity} {supply.unit}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}