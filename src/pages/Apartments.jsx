import React, { useState } from "react";
import { apiClient } from "@/components/api/apiClient";
import { useProperty } from "@/contexts/PropertyContext";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  AlertTriangle,
  ExternalLink,
  MoreVertical,
  GripVertical,
  Box
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export default function Apartments() {
  const queryClient = useQueryClient();
  const { selectedPropertyId } = useProperty();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);
  const [selectedApartment, setSelectedApartment] = useState(null);
  const [editingApartment, setEditingApartment] = useState(null);
  const [formData, setFormData] = useState({
    property_id: selectedPropertyId || "",
    name: "",
    floor: "",
    rooms_count: 1,
    notes: "",
    active: true
  });
  
  // Aggiorna property_id quando cambia la struttura selezionata
  React.useEffect(() => {
    if (selectedPropertyId) {
      setFormData(prev => ({ ...prev, property_id: selectedPropertyId }));
    }
  }, [selectedPropertyId]);
  const [rooms, setRooms] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [supplies, setSupplies] = useState([]);

  const { data: properties } = useQuery({
    queryKey: ['properties'],
    queryFn: () => apiClient.getProperties(),
    initialData: [],
  });

  const { data: apartments, isLoading } = useQuery({
    queryKey: ['apartments', selectedPropertyId],
    queryFn: () => apiClient.getApartments(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    enabled: !!selectedPropertyId,
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

  // Query per tutti gli apartment-checklist assignments (per il contatore)
  const { data: allApartmentChecklists } = useQuery({
    queryKey: ['all-apartment-checklist-items', apartments.map(a => a.id).join(',')],
    queryFn: async () => {
      // Fetch apartment checklist items per tutti gli appartamenti con apartment_id
      const allAssignments = [];
      for (const apartment of apartments) {
        const assignments = await apiClient.getApartmentChecklists(apartment.id);
        // Aggiungi apartment_id a ogni assignment per il conteggio
        const assignmentsWithApartmentId = assignments.map(a => ({ ...a, apartment_id: apartment.id }));
        allAssignments.push(...assignmentsWithApartmentId);
      }
      return allAssignments;
    },
    enabled: apartments.length > 0,
    initialData: [],
  });

  // Query per tutti gli apartment-supply assignments (per il contatore)
  const { data: allApartmentSuppliesAssignments } = useQuery({
    queryKey: ['all-apartment-supply-items'],
    queryFn: async () => {
      // Fetch apartment supply items per tutti gli appartamenti
      const allAssignments = [];
      for (const apartment of apartments) {
        const assignments = await apiClient.getApartmentSupplies(apartment.id);
        allAssignments.push(...assignments);
      }
      return allAssignments;
    },
    enabled: apartments.length > 0,
    initialData: [],
  });

  // Non servono più perché ora le scorte sono gestite diversamente

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
      // Elimina stanze
      const apartmentRooms = allRooms.filter(r => r.apartment_id === id);
      for (const room of apartmentRooms) {
        await apiClient.deleteRoom(room.id);
      }
      
      // Elimina checklist
      const apartmentChecklists = allChecklists.filter(c => c.apartment_id === id);
      for (const checklist of apartmentChecklists) {
        await apiClient.deleteChecklistItem(checklist.id);
      }
      
      // Le assegnazioni scorte verranno eliminate automaticamente tramite cascade delete
      await apiClient.deleteApartment(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartments'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
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
    return allApartmentChecklists.filter(ac => ac.apartment_id === apartmentId).length;
  };

  const getSupplyCount = (apartmentId) => {
    return allApartmentSuppliesAssignments.filter(as => as.apartment_id === apartmentId).length;
  };

  // Gli appartamenti sono già filtrati per struttura selezionata dalla query
  const filteredApartments = apartments || [];

  // Mostra messaggio se non è selezionata una struttura
  if (!selectedPropertyId) {
    return (
      <div className="p-6 md:p-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg mb-2">Seleziona una struttura</p>
              <p className="text-gray-400 text-sm">Seleziona una struttura dalla sidebar per visualizzare gli appartamenti</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Appartamenti</h1>
            <p className="text-gray-600">Gestisci appartamenti, stanze, checklist e magazzino</p>
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

        {selectedPropertyId && (
          <Card className="mb-6 border-none shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Building2 className="w-5 h-5 text-teal-600" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Visualizzazione appartamenti per: <span className="font-semibold text-gray-900">
                      {properties.find(p => p.id === selectedPropertyId)?.name || 'Struttura selezionata'}
                    </span>
                  </p>
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
                  {selectedPropertyId 
                    ? "Nessun appartamento in questa struttura" 
                    : "Nessun appartamento creato"}
                </p>
                <p className="text-gray-400 text-sm">
                  Clicca su "Nuovo Appartamento" per iniziare
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredApartments.map((apartment) => {
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
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4 text-gray-600" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(apartment)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Modifica
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm('Sei sicuro di voler eliminare questo appartamento e tutti i suoi dati?')) {
                                deleteMutation.mutate(apartment.id);
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Elimina
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
                          <div className="text-xs text-orange-700">Magazzino</div>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleManage(apartment)}
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                    >
                      <Settings className="w-4 h-4 mr-2" />
                      Gestisci
                    </Button>
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
            queryClient={queryClient}
          />
        )}
      </div>
    </div>
  );
}

// Componente per la gestione completa dell'appartamento
function ManageApartmentDialog({ apartment, open, onOpenChange, allRooms, allChecklists, queryClient }) {
  const [activeTab, setActiveTab] = useState("checklist");
  
  // Carica checklist assegnate dinamicamente
  const { data: apartmentChecklists = [] } = useQuery({
    queryKey: ['apartment-checklists', apartment.id],
    queryFn: () => apiClient.getApartmentChecklists(apartment.id),
    enabled: open, // Carica solo quando il dialog è aperto
  });
  
  // Carica scorte assegnate dinamicamente
  const { data: apartmentSupplies = [] } = useQuery({
    queryKey: ['apartment-supplies', apartment.id],
    queryFn: () => apiClient.getApartmentSupplies(apartment.id),
    enabled: open, // Carica solo quando il dialog è aperto
  });

  // Carica dotazioni assegnate dinamicamente (checklist con item_type === 'number')
  const { data: apartmentDotazioni = [] } = useQuery({
    queryKey: ['apartment-checklists', apartment.id],
    queryFn: () => apiClient.getApartmentChecklists(apartment.id),
    enabled: open, // Carica solo quando il dialog è aperto
    select: (data) => data.filter(ac => ac.checklist_item?.item_type === 'number'), // Filtra solo dotazioni
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-teal-600" />
            Gestisci: {apartment.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="checklist" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Checklist ({apartmentChecklists.length})
            </TabsTrigger>
            <TabsTrigger value="dotazioni" className="flex items-center gap-2">
              <Box className="w-4 h-4" />
              Dotazioni ({apartmentDotazioni.length})
            </TabsTrigger>
            <TabsTrigger value="supplies" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Magazzino ({apartmentSupplies.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="checklist" className="mt-6">
            <ChecklistManager 
              apartmentId={apartment.id} 
              queryClient={queryClient}
            />
          </TabsContent>

          <TabsContent value="dotazioni" className="mt-6">
            <DotazioniManager 
              apartmentId={apartment.id} 
              queryClient={queryClient}
            />
          </TabsContent>

          <TabsContent value="supplies" className="mt-6">
            <SuppliesManager 
              apartmentId={apartment.id} 
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

// Componente per gestire il magazzino dell'appartamento
function SuppliesManager({ apartmentId, queryClient }) {
  const [selectedSupply, setSelectedSupply] = useState("");
  const [assignData, setAssignData] = useState({
    min_quantity: 1
  });
  const [draggedRoom, setDraggedRoom] = useState(null);
  const [roomOrder, setRoomOrder] = useState([]);
  const [suppliesByRoom, setSuppliesByRoom] = useState({});
  
  // Carica scorte globali
  const { data: globalSupplies = [] } = useQuery({
    queryKey: ['global-supplies'],
    queryFn: () => apiClient.getSupplies(),
  });
  
  // Carica scorte assegnate a questo appartamento
  const { data: apartmentSupplies = [], isLoading } = useQuery({
    queryKey: ['apartment-supplies', apartmentId],
    queryFn: () => apiClient.getApartmentSupplies(apartmentId),
  });
  
  // Raggruppa scorte per stanza
  React.useEffect(() => {
    if (apartmentSupplies.length > 0) {
      const grouped = {};
      apartmentSupplies.forEach(as => {
        const roomRaw = as.supply?.room || 'generale';
        // Normalizza il nome della stanza (prima lettera maiuscola per ogni parola)
        const roomName = roomRaw.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        if (!grouped[roomName]) {
          grouped[roomName] = [];
        }
        grouped[roomName].push(as);
      });
      
      setSuppliesByRoom(grouped);
      
      const rooms = Object.keys(grouped);
      const predefinedOrder = ['Bagno', 'Camera da Letto', 'Soggiorno', 'Cucina', 'Ingresso', 'generale'];
      
      if (roomOrder.length === 0) {
        const sortedRooms = rooms.sort((a, b) => {
          const aIndex = predefinedOrder.indexOf(a);
          const bIndex = predefinedOrder.indexOf(b);
          if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setRoomOrder(sortedRooms);
      } else {
        const existingRooms = new Set(roomOrder);
        const newRooms = rooms.filter(r => !existingRooms.has(r));
        const filteredRoomOrder = roomOrder.filter(r => rooms.includes(r));
        if (filteredRoomOrder.length === roomOrder.length) {
          return;
        }
        setRoomOrder([...filteredRoomOrder, ...newRooms]);
      }
    } else {
      setSuppliesByRoom({});
      setRoomOrder([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentSupplies]);
  
  const assignSupplyMutation = useMutation({
    mutationFn: (data) => apiClient.addSupplyToApartment(apartmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-supplies', apartmentId] });
      setSelectedSupply("");
      setAssignData({ min_quantity: 1 });
    },
  });

  const updateSupplyMutation = useMutation({
    mutationFn: ({ id, data }) => apiClient.updateApartmentSupply(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-supplies', apartmentId] });
    },
  });

  const removeSupplyMutation = useMutation({
    mutationFn: (id) => apiClient.removeSupplyFromApartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-supplies', apartmentId] });
    },
  });

  // Drag & Drop per stanze
  const handleRoomDragStart = (e, roomIndex) => {
    setDraggedRoom(roomIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRoomDragOver = (e, roomIndex) => {
    e.preventDefault();
    if (draggedRoom === null || draggedRoom === roomIndex) return;

    const newRoomOrder = [...roomOrder];
    const draggedRoomName = newRoomOrder[draggedRoom];
    newRoomOrder.splice(draggedRoom, 1);
    newRoomOrder.splice(roomIndex, 0, draggedRoomName);

    setDraggedRoom(roomIndex);
    setRoomOrder(newRoomOrder);
  };

  const handleRoomDragEnd = () => {
    setDraggedRoom(null);
  };

  // Scorte globali non ancora assegnate a questo appartamento
  const assignedSupplyIds = apartmentSupplies.map(as => as.supply_id);
  const availableSupplies = globalSupplies.filter(s => !assignedSupplyIds.includes(s.id));

  const roomColors = {
    Bagno: "bg-blue-100 text-blue-700",
    "Camera da Letto": "bg-purple-100 text-purple-700",
    Soggiorno: "bg-teal-100 text-teal-700",
    Cucina: "bg-orange-100 text-orange-700",
    generale: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="space-y-4">
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Assegna Scorta Globale</h4>
        <div className="space-y-3">
          <Select
            value={selectedSupply}
            onValueChange={setSelectedSupply}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona una scorta globale..." />
            </SelectTrigger>
            <SelectContent>
              {availableSupplies.length === 0 ? (
                <SelectItem value="none" disabled>
                  Nessuna scorta disponibile
                </SelectItem>
              ) : (
                availableSupplies.map((supply) => (
                  <SelectItem key={supply.id} value={supply.id.toString()}>
                    {supply.name} - {supply.room || "Generale"} ({supply.total_quantity} {supply.unit} disponibili)
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          {selectedSupply && (
            <div>
              <div className="mb-3 p-2 bg-gray-50 rounded border border-gray-200">
                <Label className="text-xs text-gray-600 mb-1 block">Totale disponibile</Label>
                <div className="text-sm font-semibold text-gray-900">
                  {globalSupplies.find(s => s.id === parseInt(selectedSupply))?.total_quantity || 0} {globalSupplies.find(s => s.id === parseInt(selectedSupply))?.unit || 'pz'}
                </div>
              </div>
              <div>
                <Label className="text-xs">Minimo richiesto</Label>
                <Input
                  type="number"
                  min="1"
                  placeholder="Min"
                  value={assignData.min_quantity}
                  onChange={(e) => setAssignData({ ...assignData, min_quantity: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>
          )}
          
          <Button
            onClick={() => {
              if (selectedSupply) {
                assignSupplyMutation.mutate({
                  supply_id: parseInt(selectedSupply),
                  apartment_id: apartmentId,
                  required_quantity: 0, // Non modificabile dall'utente
                  ...assignData
                });
              }
            }}
            disabled={!selectedSupply || assignSupplyMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assegna Scorta
          </Button>
        </div>
        
        {globalSupplies.length === 0 && (
          <Alert className="mt-3 border-orange-300">
            <AlertDescription className="text-sm">
              ⚠️ Non ci sono prodotti in magazzino. Vai nella sezione "Magazzino" per crearne.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      ) : roomOrder.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nessuna scorta assegnata a questo appartamento</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {roomOrder.map((roomName, roomIndex) => {
            const roomSupplies = suppliesByRoom[roomName] || [];
            const isRoomDragging = draggedRoom === roomIndex;
            
            return (
              <AccordionItem
                key={roomName}
                value={roomName}
                className={`border border-gray-200 rounded-lg mb-3 ${isRoomDragging ? 'opacity-50' : ''}`}
                draggable
                onDragStart={(e) => handleRoomDragStart(e, roomIndex)}
                onDragOver={(e) => handleRoomDragOver(e, roomIndex)}
                onDragEnd={handleRoomDragEnd}
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <Badge className={roomColors[roomName] || "bg-gray-100 text-gray-700"}>
                        {roomName}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({roomSupplies.length} scorte)
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 mt-2">
                    {roomSupplies.map((apartmentSupply) => {
                      const supply = apartmentSupply.supply;
                      
                      return (
                        <Card key={apartmentSupply.id} className="border border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-teal-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{supply.name}</p>
                              </div>
                              <div className="w-32">
                                <Label className="text-xs text-gray-600 mb-1 block">Totale disponibile</Label>
                                <div className="text-sm font-semibold text-gray-600">
                                  {supply.total_quantity || 0} {supply.unit}
                                </div>
                              </div>
                              <div className="w-32">
                                <Label className="text-xs text-gray-600 mb-1 block">Minimo richiesto</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={apartmentSupply.min_quantity}
                                  onChange={(e) => {
                                    const newValue = parseInt(e.target.value) || 0;
                                    updateSupplyMutation.mutate({
                                      id: apartmentSupply.id,
                                      data: { min_quantity: newValue }
                                    });
                                  }}
                                  className="h-8 text-center text-sm"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Rimuovere questa scorta dall\'appartamento?')) {
                                    removeSupplyMutation.mutate(apartmentSupply.id);
                                  }
                                }}
                                className="text-red-600 hover:bg-red-50 flex-shrink-0 h-8 w-8"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

// Componente per gestire le dotazioni dell'appartamento
function DotazioniManager({ apartmentId, queryClient }) {
  const [selectedDotazione, setSelectedDotazione] = useState("");
  const [draggedRoom, setDraggedRoom] = useState(null);
  const [roomOrder, setRoomOrder] = useState([]);
  const [dotazioniByRoom, setDotazioniByRoom] = useState({});
  
  // Carica dotazioni globali (solo item_type === 'number')
  const { data: globalChecklists = [] } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: () => apiClient.getChecklistItems(),
  });
  
  const globalDotazioni = globalChecklists.filter(c => c.item_type === 'number');
  
  // Carica dotazioni assegnate a questo appartamento
  const { data: apartmentChecklists = [], isLoading } = useQuery({
    queryKey: ['apartment-checklists', apartmentId],
    queryFn: () => apiClient.getApartmentChecklists(apartmentId),
  });
  
  // Filtra solo le dotazioni
  const apartmentDotazioni = apartmentChecklists.filter(ac => ac.checklist_item?.item_type === 'number');
  
  // Raggruppa dotazioni per stanza
  React.useEffect(() => {
    if (apartmentDotazioni.length > 0) {
      const grouped = {};
      apartmentDotazioni.forEach(ad => {
        const roomRaw = ad.checklist_item?.room_name || 'generale';
        // Normalizza il nome della stanza (prima lettera maiuscola per ogni parola)
        const roomName = roomRaw.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
        if (!grouped[roomName]) {
          grouped[roomName] = [];
        }
        grouped[roomName].push(ad);
      });
      
      // Ordina dotazioni all'interno di ogni stanza per order
      Object.keys(grouped).forEach(room => {
        grouped[room].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      setDotazioniByRoom(grouped);
      
      const rooms = Object.keys(grouped);
      const predefinedOrder = ['Bagno', 'Camera da Letto', 'Soggiorno', 'Cucina', 'Ingresso', 'generale'];
      
      if (roomOrder.length === 0) {
        const sortedRooms = rooms.sort((a, b) => {
          const aIndex = predefinedOrder.indexOf(a);
          const bIndex = predefinedOrder.indexOf(b);
          if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
          if (aIndex === -1) return 1;
          if (bIndex === -1) return -1;
          return aIndex - bIndex;
        });
        setRoomOrder(sortedRooms);
      } else {
        const existingRooms = new Set(roomOrder);
        const newRooms = rooms.filter(r => !existingRooms.has(r));
        const filteredRoomOrder = roomOrder.filter(r => rooms.includes(r));
        if (filteredRoomOrder.length === roomOrder.length) {
          return;
        }
        setRoomOrder([...filteredRoomOrder, ...newRooms]);
      }
    } else {
      setDotazioniByRoom({});
      setRoomOrder([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentDotazioni]);
  
  const assignDotazioneMutation = useMutation({
    mutationFn: (data) => apiClient.addChecklistToApartment(apartmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-checklists', apartmentId] });
      setSelectedDotazione("");
    },
  });

  const removeDotazioneMutation = useMutation({
    mutationFn: (id) => apiClient.removeChecklistFromApartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-checklists', apartmentId] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (currentRoomOrder, currentDotazioniByRoom) => {
      const rooms = currentRoomOrder || roomOrder;
      const dotazioni = currentDotazioniByRoom || dotazioniByRoom;
      
      let globalOrder = 0;
      for (const room of rooms) {
        const roomDotazioni = dotazioni[room] || [];
        for (const dotazione of roomDotazioni) {
          await apiClient.updateApartmentChecklistOrder(dotazione.id, globalOrder);
          globalOrder++;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-checklists', apartmentId] });
    },
  });

  // Drag & Drop per stanze
  const handleRoomDragStart = (e, roomIndex) => {
    setDraggedRoom(roomIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRoomDragOver = (e, roomIndex) => {
    e.preventDefault();
    if (draggedRoom === null || draggedRoom === roomIndex) return;

    const newRoomOrder = [...roomOrder];
    const draggedRoomName = newRoomOrder[draggedRoom];
    newRoomOrder.splice(draggedRoom, 1);
    newRoomOrder.splice(roomIndex, 0, draggedRoomName);

    setDraggedRoom(roomIndex);
    setRoomOrder(newRoomOrder);
  };

  const handleRoomDragEnd = () => {
    if (draggedRoom !== null) {
      setRoomOrder(currentRoomOrder => {
        setDotazioniByRoom(currentDotazioni => {
          updateOrderMutation.mutate(currentRoomOrder, currentDotazioni);
          return currentDotazioni;
        });
        return currentRoomOrder;
      });
    }
    setDraggedRoom(null);
  };

  // Dotazioni globali non ancora assegnate a questo appartamento
  const assignedDotazioneIds = apartmentDotazioni.map(ac => ac.checklist_item_id);
  const availableDotazioni = globalDotazioni.filter(d => !assignedDotazioneIds.includes(d.id));

  const roomColors = {
    Bagno: "bg-blue-100 text-blue-700",
    "Camera da Letto": "bg-purple-100 text-purple-700",
    Soggiorno: "bg-teal-100 text-teal-700",
    Cucina: "bg-orange-100 text-orange-700",
    generale: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Assegna Dotazione Globale</h4>
        <div className="space-y-3">
          <Select
            value={selectedDotazione}
            onValueChange={setSelectedDotazione}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona una dotazione globale..." />
            </SelectTrigger>
            <SelectContent>
              {availableDotazioni.length === 0 ? (
                <SelectItem value="none" disabled>
                  Nessuna dotazione disponibile
                </SelectItem>
              ) : (
                availableDotazioni.map((dotazione) => (
                  <SelectItem key={dotazione.id} value={dotazione.id.toString()}>
                    {dotazione.title} {dotazione.room_name && `- ${dotazione.room_name}`} {dotazione.expected_number && `(${dotazione.expected_number} previsti)`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => {
              if (selectedDotazione) {
                assignDotazioneMutation.mutate({
                  checklist_item_id: parseInt(selectedDotazione),
                  apartment_id: apartmentId
                });
              }
            }}
            disabled={!selectedDotazione || assignDotazioneMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assegna Dotazione
          </Button>
        </div>
        
        {globalDotazioni.length === 0 && (
          <Alert className="mt-3 border-blue-300">
            <AlertDescription className="text-sm">
              ⚠️ Non ci sono dotazioni globali. Vai nella sezione "Dotazioni" per crearne.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      ) : roomOrder.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Box className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nessuna dotazione assegnata a questo appartamento</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {roomOrder.map((roomName, roomIndex) => {
            const roomDotazioni = dotazioniByRoom[roomName] || [];
            const isRoomDragging = draggedRoom === roomIndex;
            
            return (
              <AccordionItem
                key={roomName}
                value={roomName}
                className={`border border-gray-200 rounded-lg mb-3 ${isRoomDragging ? 'opacity-50' : ''}`}
                draggable
                onDragStart={(e) => handleRoomDragStart(e, roomIndex)}
                onDragOver={(e) => handleRoomDragOver(e, roomIndex)}
                onDragEnd={handleRoomDragEnd}
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <Badge className={roomColors[roomName] || "bg-gray-100 text-gray-700"}>
                        {roomName}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({roomDotazioni.length} dotazioni)
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 mt-2">
                    {roomDotazioni.map((apartmentDotazione) => {
                      const dotazione = apartmentDotazione.checklist_item;
                      
                      return (
                        <Card key={apartmentDotazione.id} className="border border-gray-200">
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              <Box className="w-4 h-4 text-blue-600 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{dotazione.title}</p>
                                {dotazione.description && (
                                  <p className="text-xs text-gray-500 mt-1">{dotazione.description}</p>
                                )}
                              </div>
                              {dotazione.expected_number && (
                                <div className="text-sm font-semibold text-blue-600">
                                  {dotazione.expected_number} previsti
                                </div>
                              )}
                              {dotazione.amazon_link && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(dotazione.amazon_link, '_blank', 'noopener,noreferrer')}
                                  className="flex items-center gap-1 h-8"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Amazon
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Rimuovere questa dotazione dall\'appartamento?')) {
                                    removeDotazioneMutation.mutate(apartmentDotazione.id);
                                  }
                                }}
                                className="text-red-600 hover:bg-red-50 flex-shrink-0 h-8 w-8"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

// Componente per gestire le checklist dell'appartamento
function ChecklistManager({ apartmentId, queryClient }) {
  const [selectedChecklist, setSelectedChecklist] = useState("");
  const [draggedRoom, setDraggedRoom] = useState(null);
  const [draggedChecklist, setDraggedChecklist] = useState(null);
  const [roomOrder, setRoomOrder] = useState([]);
  const [checklistsByRoom, setChecklistsByRoom] = useState({});
  
  // Carica checklist globali (escludi le dotazioni)
  const { data: globalChecklists = [] } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: () => apiClient.getChecklistItems(),
  });
  
  const globalChecklistsFiltered = globalChecklists.filter(c => c.item_type !== 'number');
  
  // Carica checklist assegnate a questo appartamento (escludi le dotazioni)
  const { data: apartmentChecklists = [], isLoading } = useQuery({
    queryKey: ['apartment-checklists', apartmentId],
    queryFn: () => apiClient.getApartmentChecklists(apartmentId),
  });
  
  const apartmentChecklistsFiltered = apartmentChecklists.filter(ac => ac.checklist_item?.item_type !== 'number');

  // Raggruppa checklist per stanza e ordina
  React.useEffect(() => {
    if (apartmentChecklistsFiltered.length > 0) {
      // Raggruppa per stanza
      const grouped = {};
      apartmentChecklistsFiltered.forEach(ac => {
        const roomName = ac.checklist_item?.room_name || 'generale';
        if (!grouped[roomName]) {
          grouped[roomName] = [];
        }
        grouped[roomName].push(ac);
      });
      
      // Ordina checklist all'interno di ogni stanza per order
      Object.keys(grouped).forEach(room => {
        grouped[room].sort((a, b) => (a.order || 0) - (b.order || 0));
      });
      
      setChecklistsByRoom(grouped);
      
      // Determina l'ordine delle stanze basato sull'ordine globale delle checklist
      // Le stanze vengono ordinate in base all'ordine della prima checklist di ogni stanza
      const rooms = Object.keys(grouped);
      
      // Se non c'è un ordine salvato, determina l'ordine dall'ordine globale delle checklist
      if (roomOrder.length === 0) {
        // Trova l'ordine minimo per ogni stanza
        const roomMinOrder = {};
        rooms.forEach(room => {
          const minOrder = Math.min(...grouped[room].map(c => c.order || 0));
          roomMinOrder[room] = minOrder;
        });
        
        // Ordina le stanze per ordine minimo
        const sortedRooms = rooms.sort((a, b) => roomMinOrder[a] - roomMinOrder[b]);
        setRoomOrder(sortedRooms);
      } else {
        // Mantieni l'ordine esistente, aggiungi eventuali nuove stanze alla fine
        const existingRooms = new Set(roomOrder);
        const newRooms = rooms.filter(r => !existingRooms.has(r));
        // Filtra anche le stanze che non esistono più
        const filteredRoomOrder = roomOrder.filter(r => rooms.includes(r));
        // Mantieni l'ordine esistente solo se tutte le stanze esistono ancora
        if (filteredRoomOrder.length === roomOrder.length) {
          // L'ordine è già corretto, non cambiare nulla
          return;
        }
        setRoomOrder([...filteredRoomOrder, ...newRooms]);
      }
    } else {
      setChecklistsByRoom({});
      setRoomOrder([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apartmentChecklistsFiltered]);
  
  const assignChecklistMutation = useMutation({
    mutationFn: (data) => apiClient.addChecklistToApartment(apartmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-checklists', apartmentId] });
      setSelectedChecklist("");
    },
  });

  const removeChecklistMutation = useMutation({
    mutationFn: (id) => apiClient.removeChecklistFromApartment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-checklists', apartmentId] });
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (currentRoomOrder, currentChecklistsByRoom) => {
      // Aggiorna l'ordine di tutte le checklist basato sull'ordine delle stanze
      // Usa i valori passati come parametri per evitare problemi di closure
      const rooms = currentRoomOrder || roomOrder;
      const checklists = currentChecklistsByRoom || checklistsByRoom;
      
      let globalOrder = 0;
      for (const room of rooms) {
        const roomChecklists = checklists[room] || [];
        for (const checklist of roomChecklists) {
          await apiClient.updateApartmentChecklistOrder(checklist.id, globalOrder);
          globalOrder++;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-checklists', apartmentId] });
    },
  });

  // Drag & Drop per stanze
  const handleRoomDragStart = (e, roomIndex) => {
    setDraggedRoom(roomIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleRoomDragOver = (e, roomIndex) => {
    e.preventDefault();
    if (draggedRoom === null || draggedRoom === roomIndex) return;

    const newRoomOrder = [...roomOrder];
    const draggedRoomName = newRoomOrder[draggedRoom];
    newRoomOrder.splice(draggedRoom, 1);
    newRoomOrder.splice(roomIndex, 0, draggedRoomName);

    setDraggedRoom(roomIndex);
    setRoomOrder(newRoomOrder);
  };

  const handleRoomDragEnd = () => {
    if (draggedRoom !== null) {
      // Aggiorna l'ordine globale delle checklist basato sul nuovo ordine delle stanze
      // Usa una funzione che accede ai valori più recenti di entrambi gli stati
      setRoomOrder(currentRoomOrder => {
        setChecklistsByRoom(currentChecklists => {
          // Aggiorna l'ordine nel database usando i valori aggiornati
          updateOrderMutation.mutate(currentRoomOrder, currentChecklists);
          return currentChecklists;
        });
        return currentRoomOrder;
      });
    }
    setDraggedRoom(null);
  };

  // Drag & Drop per checklist all'interno di una stanza
  const handleChecklistDragStart = (e, roomName, checklistIndex) => {
    setDraggedChecklist({ roomName, index: checklistIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleChecklistDragOver = (e, roomName, checklistIndex) => {
    e.preventDefault();
    if (!draggedChecklist || draggedChecklist.roomName !== roomName || draggedChecklist.index === checklistIndex) return;

    const newChecklists = [...checklistsByRoom[roomName]];
    const draggedItem = newChecklists[draggedChecklist.index];
    newChecklists.splice(draggedChecklist.index, 1);
    newChecklists.splice(checklistIndex, 0, draggedItem);

    setChecklistsByRoom(prev => ({
      ...prev,
      [roomName]: newChecklists
    }));
    setDraggedChecklist({ roomName, index: checklistIndex });
  };

  const handleChecklistDragEnd = () => {
    if (draggedChecklist) {
      // Ricalcola l'ordine globale delle checklist
      // Usa una funzione che accede ai valori più recenti di entrambi gli stati
      setChecklistsByRoom(currentChecklists => {
        setRoomOrder(currentRoomOrder => {
          updateOrderMutation.mutate(currentRoomOrder, currentChecklists);
          return currentRoomOrder;
        });
        return currentChecklists;
      });
    }
    setDraggedChecklist(null);
  };

  // Checklist globali non ancora assegnate a questo appartamento
  const assignedChecklistIds = apartmentChecklistsFiltered.map(ac => ac.checklist_item_id);
  const availableChecklists = globalChecklistsFiltered.filter(c => !assignedChecklistIds.includes(c.id));

  const roomColors = {
    Bagno: "bg-blue-100 text-blue-700",
    "Camera da Letto": "bg-purple-100 text-purple-700",
    Soggiorno: "bg-teal-100 text-teal-700",
    Cucina: "bg-orange-100 text-orange-700",
    generale: "bg-gray-100 text-gray-700"
  };

  return (
    <div className="space-y-4">
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
        <h4 className="font-semibold mb-3">Assegna Checklist Globale</h4>
        <div className="space-y-3">
          <Select
            value={selectedChecklist}
            onValueChange={setSelectedChecklist}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleziona una checklist globale..." />
            </SelectTrigger>
            <SelectContent>
              {availableChecklists.length === 0 ? (
                <SelectItem value="none" disabled>
                  Nessuna checklist disponibile
                </SelectItem>
              ) : (
                availableChecklists.map((checklist) => (
                  <SelectItem key={checklist.id} value={checklist.id.toString()}>
                    {checklist.title} {checklist.room_name && `- ${checklist.room_name}`}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => {
              if (selectedChecklist) {
                assignChecklistMutation.mutate({
                  checklist_item_id: parseInt(selectedChecklist),
                  apartment_id: apartmentId
                });
              }
            }}
            disabled={!selectedChecklist || assignChecklistMutation.isPending}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Assegna Checklist
          </Button>
        </div>
        
        {globalChecklists.length === 0 && (
          <Alert className="mt-3 border-teal-300">
            <AlertDescription className="text-sm">
              ⚠️ Non ci sono checklist globali. Vai nella sezione "Checklist" per crearne.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
        </div>
      ) : roomOrder.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <ClipboardList className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>Nessuna checklist assegnata a questo appartamento</p>
        </div>
      ) : (
        <Accordion type="multiple" className="w-full">
          {roomOrder.map((roomName, roomIndex) => {
            const roomChecklists = checklistsByRoom[roomName] || [];
            const isRoomDragging = draggedRoom === roomIndex;
            
            return (
              <AccordionItem
                key={roomName}
                value={roomName}
                className={`border border-gray-200 rounded-lg mb-3 ${isRoomDragging ? 'opacity-50' : ''}`}
                draggable
                onDragStart={(e) => handleRoomDragStart(e, roomIndex)}
                onDragOver={(e) => handleRoomDragOver(e, roomIndex)}
                onDragEnd={handleRoomDragEnd}
              >
                <AccordionTrigger className="px-4 hover:no-underline">
                  <div className="flex items-center gap-3 w-full">
                    {/* Drag Handle per Stanza */}
                    <div 
                      className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    {/* Nome Stanza */}
                    <div className="flex-1 flex items-center gap-2">
                      <Badge className={roomColors[roomName] || "bg-gray-100 text-gray-700"}>
                        {roomName}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        ({roomChecklists.length} checklist)
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-2 mt-2">
                    {roomChecklists.map((apartmentChecklist, checklistIndex) => {
                      const checklist = apartmentChecklist.checklist_item;
                      const isChecklistDragging = draggedChecklist?.roomName === roomName && draggedChecklist?.index === checklistIndex;
                      
                      return (
                        <Card
                          key={apartmentChecklist.id}
                          className={`border border-gray-200 transition-all ${isChecklistDragging ? 'opacity-50 scale-95' : 'hover:shadow-md'}`}
                          draggable
                          onDragStart={(e) => handleChecklistDragStart(e, roomName, checklistIndex)}
                          onDragOver={(e) => handleChecklistDragOver(e, roomName, checklistIndex)}
                          onDragEnd={handleChecklistDragEnd}
                        >
                          <CardContent className="p-3">
                            <div className="flex items-center gap-3">
                              {/* Drag Handle per Checklist */}
                              <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600">
                                <GripVertical className="w-4 h-4" />
                              </div>
                              
                              {/* Nome Checklist */}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 text-sm">{checklist.title}</p>
                                {checklist.description && (
                                  <p className="text-xs text-gray-500 mt-1">{checklist.description}</p>
                                )}
                              </div>
                              
                              {/* Elimina */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm('Rimuovere questa checklist dall\'appartamento?')) {
                                    removeChecklistMutation.mutate(apartmentChecklist.id);
                                  }
                                }}
                                className="text-red-600 hover:bg-red-50 flex-shrink-0 h-8 w-8"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}