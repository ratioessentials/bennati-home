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
  ClipboardList, 
  Plus, 
  Edit, 
  Trash2, 
  MoreVertical,
  ExternalLink,
  AlertTriangle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminDotazioni() {
  const queryClient = useQueryClient();
  const { selectedPropertyId } = useProperty();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState("all");
  const [expandedChecklists, setExpandedChecklists] = useState({});
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    room_name: "",
    is_mandatory: false,
    order: 0,
    item_type: "number",
    expected_number: null,
    amazon_link: ""
  });

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: () => apiClient.getChecklistItems(),
    initialData: [],
  });

  // Filtra solo le dotazioni (item_type === 'number')
  const dotazioni = checklists.filter(c => c.item_type === 'number');

  const { data: apartments } = useQuery({
    queryKey: ['apartments', selectedPropertyId],
    queryFn: () => apiClient.getApartments(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    enabled: !!selectedPropertyId,
    initialData: [],
  });

  // Carica tutte le assegnazioni per tutti gli appartamenti
  const apartmentChecklistsQueries = useQuery({
    queryKey: ['all-apartment-checklists'],
    queryFn: async () => {
      const results = await Promise.all(
        apartments.map(apt => 
          apiClient.getApartmentChecklists(apt.id)
            .then(checklists => ({ apartmentId: apt.id, checklists }))
            .catch(() => ({ apartmentId: apt.id, checklists: [] }))
        )
      );
      return results;
    },
    enabled: apartments.length > 0,
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
      title: "",
      description: "",
      room_name: "",
      is_mandatory: false,
      order: 0,
      item_type: "number",
      expected_number: null,
      amazon_link: ""
    });
    setEditingChecklist(null);
  };

  const handleEdit = (checklist) => {
    setEditingChecklist(checklist);
    setFormData({
      title: checklist.title,
      description: checklist.description || "",
      room_name: checklist.room_name || "",
      is_mandatory: checklist.is_mandatory,
      order: checklist.order,
      item_type: "number",
      expected_number: checklist.expected_number || null,
      amazon_link: checklist.amazon_link || ""
    });
    setDialogOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingChecklist) {
      updateMutation.mutate({ id: editingChecklist.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const toggleExpanded = (checklistId) => {
    setExpandedChecklists(prev => ({
      ...prev,
      [checklistId]: !prev[checklistId]
    }));
  };

  // Funzione per ottenere le assegnazioni di una specifica checklist
  const getChecklistAssignments = (checklistId) => {
    if (!apartmentChecklistsQueries.data) return [];
    
    const assignments = [];
    apartmentChecklistsQueries.data.forEach(({ apartmentId, checklists }) => {
      const assignment = checklists.find(c => c.checklist_item_id === checklistId);
      if (assignment) {
        const apartment = apartments.find(a => a.id === apartmentId);
        assignments.push({
          apartment,
          ...assignment
        });
      }
    });
    return assignments;
  };

  const getFilteredChecklists = () => {
    let filtered = dotazioni;
    
    // Filtra per stanza
    if (selectedRoom !== "all") {
      filtered = filtered.filter(checklist => checklist.room_name === selectedRoom);
    }
    
    // Ordina
    return filtered.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return a.title.localeCompare(b.title);
    });
  };
  
  const filteredChecklists = getFilteredChecklists();

  const getCategoryColor = (category) => {
    const normalizedCategory = category?.toLowerCase() || '';
    switch(normalizedCategory) {
      case 'bagno':
        return 'bg-blue-100 text-blue-700';
      case 'camera da letto':
        return 'bg-purple-100 text-purple-700';
      case 'salotto':
        return 'bg-teal-100 text-teal-700';
      case 'ingresso':
        return 'bg-orange-100 text-orange-700';
      case 'generale':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dotazioni</h1>
            <p className="text-gray-600">Gestisci le dotazioni degli appartamenti</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuova Dotazione
          </Button>
        </div>

        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-6">
            <div>
              <Label className="mb-2 block">Filtra per Stanza</Label>
              <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le Stanze</SelectItem>
                  <SelectItem value="bagno">Bagno</SelectItem>
                  <SelectItem value="camera da letto">Camera da Letto</SelectItem>
                  <SelectItem value="salotto">Salotto</SelectItem>
                  <SelectItem value="ingresso">Ingresso</SelectItem>
                  <SelectItem value="generale">Generale</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-teal-50 to-cyan-50 hover:from-teal-50 hover:to-cyan-50">
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Nome</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Stanza</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Numero Previsto</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Assegnazioni</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 px-6 text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="py-4 px-6"><Skeleton className="h-6 w-40" /></TableCell>
                      <TableCell className="py-4 px-6"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="py-4 px-6"><Skeleton className="h-6 w-24" /></TableCell>
                      <TableCell className="py-4 px-6"><Skeleton className="h-6 w-20" /></TableCell>
                      <TableCell className="py-4 px-6"><Skeleton className="h-6 w-20" /></TableCell>
                    </TableRow>
                  ))
                ) : filteredChecklists.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 px-6">
                      <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-lg mb-2">
                        Nessuna dotazione registrata
                      </p>
                      <p className="text-gray-400 text-sm">
                        Clicca su "Nuova Dotazione" per iniziare
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredChecklists.map((checklist) => {
                    const assignments = getChecklistAssignments(checklist.id);
                    const isExpanded = expandedChecklists[checklist.id];

                    return (
                      <React.Fragment key={checklist.id}>
                        <TableRow 
                          className="cursor-pointer hover:bg-teal-50/50 transition-colors"
                          onClick={() => toggleExpanded(checklist.id)}
                        >
                          <TableCell className="font-medium py-4 px-6">
                            <div className="flex items-center gap-3">
                              <ClipboardList className="w-4 h-4 text-teal-600 flex-shrink-0" />
                              <span>{checklist.title}</span>
                              {assignments.length > 0 && (
                                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 text-xs">
                                  {assignments.length}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {checklist.room_name && (
                              <Badge className={getCategoryColor(checklist.room_name)}>
                                {checklist.room_name}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="font-semibold text-teal-600">
                              {checklist.expected_number || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className="text-gray-600">
                              {assignments.length} appartament{assignments.length !== 1 ? 'i' : 'o'}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right">
                            <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(checklist);
                                    }}
                                    className="cursor-pointer"
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Modifica
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (assignments.length > 0) {
                                        if (!confirm(`Questa dotazione è assegnata a ${assignments.length} appartament${assignments.length > 1 ? 'i' : 'o'}. Sei sicuro di volerla eliminare?`)) {
                                          return;
                                        }
                                      } else if (!confirm('Sei sicuro di voler eliminare questa dotazione?')) {
                                        return;
                                      }
                                      deleteMutation.mutate(checklist.id);
                                    }}
                                    className="text-red-600 focus:text-red-600 cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Elimina
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                        {/* Accordion Row */}
                        {isExpanded && assignments.length > 0 && (
                          <TableRow className="bg-gray-50">
                            <TableCell colSpan={5} className="p-0">
                              <div className="p-6 space-y-3">
                                <div className="flex items-center gap-2 mb-4">
                                  <Home className="w-5 h-5 text-teal-600" />
                                  <h4 className="font-semibold text-gray-900">
                                    Appartamenti Assegnati ({assignments.length})
                                  </h4>
                                </div>
                                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {assignments.map((assignment) => (
                                    <div 
                                      key={assignment.id}
                                      className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                          <p className="font-semibold text-gray-900 mb-2">
                                            {assignment.apartment?.name}
                                          </p>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-teal-600" />
                {editingChecklist ? "Modifica Dotazione" : "Nuova Dotazione"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Nome Dotazione *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="es: Asciugamani, Cuscini"
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Descrizione</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrizione opzionale"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="room_name">Stanza</Label>
                <Select
                  value={formData.room_name}
                  onValueChange={(value) => setFormData({ ...formData, room_name: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleziona stanza" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bagno">Bagno</SelectItem>
                    <SelectItem value="camera da letto">Camera da Letto</SelectItem>
                    <SelectItem value="salotto">Salotto</SelectItem>
                    <SelectItem value="ingresso">Ingresso</SelectItem>
                    <SelectItem value="generale">Generale</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="expected_number">Numero Previsto *</Label>
                <Input
                  id="expected_number"
                  type="number"
                  min="1"
                  value={formData.expected_number || ""}
                  onChange={(e) => setFormData({ ...formData, expected_number: parseInt(e.target.value) || null })}
                  placeholder="es: 4"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amazon_link">Link Amazon (opzionale)</Label>
                <Input
                  id="amazon_link"
                  type="url"
                  value={formData.amazon_link}
                  onChange={(e) => setFormData({ ...formData, amazon_link: e.target.value })}
                  placeholder="https://amazon.it/..."
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Annulla
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                >
                  {editingChecklist ? "Salva Modifiche" : "Crea Dotazione"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

