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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Package, Plus, Edit, Trash2, ExternalLink, AlertTriangle, Home, ChevronDown, ChevronUp, ShoppingCart, MoreVertical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export default function AdminSupplies() {
  const queryClient = useQueryClient();
  const { selectedPropertyId } = useProperty();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSupply, setEditingSupply] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expandedSupplies, setExpandedSupplies] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    total_quantity: 0,
    unit: "pz",
    category: "generale",
    room: "",
    amazon_link: "",
    notes: ""
  });

  const { data: supplies, isLoading } = useQuery({
    queryKey: ['supplies'],
    queryFn: () => apiClient.getSupplies(),
    initialData: [],
  });

  const { data: apartments } = useQuery({
    queryKey: ['apartments', selectedPropertyId],
    queryFn: () => apiClient.getApartments(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    enabled: !!selectedPropertyId,
    initialData: [],
  });

  // Carica tutte le assegnazioni per tutti gli appartamenti
  const apartmentSuppliesQueries = useQuery({
    queryKey: ['all-apartment-supplies'],
    queryFn: async () => {
      const results = await Promise.all(
        apartments.map(apt => 
          apiClient.getApartmentSupplies(apt.id)
            .then(supplies => ({ apartmentId: apt.id, supplies }))
            .catch(() => ({ apartmentId: apt.id, supplies: [] }))
        )
      );
      return results;
    },
    enabled: apartments.length > 0,
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

  const resetForm = () => {
    setFormData({
      name: "",
      total_quantity: 0,
      unit: "pz",
      category: "generale",
      room: "",
      amazon_link: "",
      notes: ""
    });
    setEditingSupply(null);
  };

  const handleEdit = (supply) => {
    setEditingSupply(supply);
    setFormData({
      name: supply.name,
      total_quantity: supply.total_quantity,
      unit: supply.unit || "pz",
      category: supply.category || "generale",
      room: supply.room || "",
      amazon_link: supply.amazon_link || "",
      notes: supply.notes || ""
    });
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

  const toggleExpanded = (supplyId) => {
    setExpandedSupplies(prev => ({
      ...prev,
      [supplyId]: !prev[supplyId]
    }));
  };

  // Funzione per ottenere le assegnazioni di una specifica scorta
  const getSupplyAssignments = (supplyId) => {
    if (!apartmentSuppliesQueries.data) return [];
    
    const assignments = [];
    apartmentSuppliesQueries.data.forEach(({ apartmentId, supplies }) => {
      const assignment = supplies.find(s => s.supply_id === supplyId);
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

  // Funzione per calcolare le scorte totali richieste
  const getTotalRequiredQuantity = (supplyId) => {
    const assignments = getSupplyAssignments(supplyId);
    return assignments.reduce((sum, a) => sum + a.required_quantity, 0);
  };

  const getApartmentName = (apartmentId) => {
    const apt = apartments.find(a => a.id === apartmentId);
    return apt?.name || 'N/A';
  };

  const filteredSupplies = (selectedCategory === "all"
    ? supplies
    : supplies.filter(supply => supply.category === selectedCategory)
  ).sort((a, b) => a.name.localeCompare(b.name));

  const getCategoryColor = (category) => {
    switch(category) {
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
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Magazzino</h1>
            <p className="text-gray-600">Gestisci il magazzino disponibile per tutti gli appartamenti</p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuova Scorta
          </Button>
        </div>

        <Card className="mb-6 border-none shadow-lg">
          <CardContent className="p-6">
            <div>
              <Label className="mb-2 block">Filtra per Stanza</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
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
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Nome Prodotto</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Stato</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Stanza</TableHead>
                  <TableHead className="font-bold text-gray-900 py-4 px-6">Magazzino Totale</TableHead>
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
                ) : filteredSupplies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 px-6">
                      <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500 text-lg mb-2">
                        Nessuna scorta registrata
                      </p>
                      <p className="text-gray-400 text-sm">
                        Clicca su "Nuova Scorta" per iniziare
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSupplies.map((supply) => {
                    const assignments = getSupplyAssignments(supply.id);
                    const totalAvailable = getTotalRequiredQuantity(supply.id);
                    // Verifica se qualche appartamento ha scorte basse
                    const hasLowStock = assignments.some(a => a.required_quantity <= a.min_quantity);
                    const isExpanded = expandedSupplies[supply.id];

                    return (
                      <React.Fragment key={supply.id}>
                        <TableRow 
                          className={`cursor-pointer hover:bg-teal-50/50 transition-colors ${
                            hasLowStock ? 'bg-orange-50/30' : ''
                          }`}
                          onClick={() => toggleExpanded(supply.id)}
                        >
                          <TableCell className="font-medium py-4 px-6">
                            <div className="flex items-center gap-3">
                              <Package className="w-4 h-4 text-teal-600 flex-shrink-0" />
                              <span>{supply.name}</span>
                              {assignments.length > 0 && (
                                <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-300 text-xs">
                                  <Home className="w-3 h-3 mr-1" />
                                  {assignments.length}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            {hasLowStock && (
                              <Badge className="bg-orange-100 text-orange-700">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                Basso
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <Badge className={getCategoryColor(supply.category)}>
                              {supply.category}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 px-6">
                            <span className={`font-bold ${hasLowStock ? 'text-orange-600' : 'text-teal-600'}`}>
                              {totalAvailable} {supply.unit}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-6 text-right">
                            <div className="flex gap-2 justify-end" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={!supply.amazon_link}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (supply.amazon_link) {
                                    window.open(supply.amazon_link, '_blank', 'noopener,noreferrer');
                                  }
                                }}
                                className={`gap-1 ${
                                  supply.amazon_link 
                                    ? 'bg-orange-500 hover:bg-orange-600 text-white border-orange-600 hover:border-orange-700' 
                                    : 'bg-gray-200 text-gray-400 border-gray-300 cursor-not-allowed'
                                }`}
                                title={supply.amazon_link ? 'Acquista su Amazon' : 'Link Amazon non disponibile'}
                              >
                                <ShoppingCart className="w-4 h-4" />
                                Acquista
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEdit(supply);
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
                                        if (!confirm(`Questa scorta è assegnata a ${assignments.length} appartament${assignments.length > 1 ? 'i' : 'o'}. Sei sicuro di volerla eliminare?`)) {
                                          return;
                                        }
                                      } else if (!confirm('Sei sicuro di voler eliminare questa scorta?')) {
                                        return;
                                      }
                                      deleteMutation.mutate(supply.id);
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
                                          <div className="space-y-1">
                                            <p className="text-sm text-gray-600">
                                              <span className="font-medium">Disponibile:</span>{' '}
                                              <span className="font-bold text-teal-600">
                                                {assignment.required_quantity} {supply.unit}
                                              </span>
                                            </p>
                                            <p className="text-sm text-gray-500">
                                              <span className="font-medium">Minimo:</span>{' '}
                                              {assignment.min_quantity} {supply.unit}
                                            </p>
                                          </div>
                                          {supply.amazon_link && (
                                            <a
                                              href={supply.amazon_link}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 hover:underline mt-2"
                                              onClick={(e) => e.stopPropagation()}
                                            >
                                              <ExternalLink className="w-3 h-3" />
                                              Amazon
                                            </a>
                                          )}
                                        </div>
                                        {assignment.required_quantity <= assignment.min_quantity && (
                                          <Badge variant="outline" className="bg-orange-100 text-orange-700 text-xs ml-2">
                                            Basso
                                          </Badge>
                                        )}
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
                <Package className="w-5 h-5 text-teal-600" />
                {editingSupply ? "Modifica Scorta" : "Nuova Scorta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
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
              <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Stanza</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
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
                  <Label htmlFor="room">Camera</Label>
                  <Input
                    id="room"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    placeholder="es: Bagno, Cucina"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="total_quantity">Quantità Totale</Label>
                  <Input
                    id="total_quantity"
                    type="number"
                    min="0"
                    value={formData.total_quantity}
                    onChange={(e) => setFormData({ ...formData, total_quantity: parseInt(e.target.value) || 0 })}
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
