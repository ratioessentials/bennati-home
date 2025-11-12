import React, { useState } from "react";
import { apiClient } from "@/components/api/apiClient";
import { useProperty } from "@/contexts/PropertyContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Calendar, Clock, Home, CheckCircle2, User, ChevronRight, UserPlus, Trash2, Eye, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function Operators() {
  const { selectedPropertyId } = useProperty();
  const [selectedSession, setSelectedSession] = useState(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addOperatorDialogOpen, setAddOperatorDialogOpen] = useState(false);
  const [editOperatorDialogOpen, setEditOperatorDialogOpen] = useState(false);
  const [deleteSessionDialogOpen, setDeleteSessionDialogOpen] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [editingOperator, setEditingOperator] = useState(null);
  const [newOperator, setNewOperator] = useState({
    name: "",
    email: "",
    password: ""
  });
  const [editOperatorData, setEditOperatorData] = useState({
    name: "",
    email: "",
    password: ""
  });
  
  const queryClient = useQueryClient();
  
  const { data: workSessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ['work-sessions'],
    queryFn: () => apiClient.getWorkSessions({}),
    staleTime: 0, // I dati sono sempre considerati stale
    cacheTime: 0, // Non conserva cache
    refetchOnMount: 'always', // Ricarica sempre quando il componente viene montato
  });

  const { data: completions = [] } = useQuery({
    queryKey: ['all-completions'],
    queryFn: () => apiClient.getCompletions({}),
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers(),
  });

  const { data: apartments = [] } = useQuery({
    queryKey: ['apartments', selectedPropertyId],
    queryFn: () => apiClient.getApartments(selectedPropertyId ? { property_id: selectedPropertyId } : {}),
    enabled: !!selectedPropertyId,
  });
  
  // Filtra le work sessions per appartamenti della struttura selezionata
  const apartmentIds = React.useMemo(() => {
    return apartments.map(apt => apt.id);
  }, [apartments]);
  
  const filteredWorkSessions = React.useMemo(() => {
    if (!selectedPropertyId || apartmentIds.length === 0) return [];
    return workSessions.filter(session => apartmentIds.includes(session.apartment_id));
  }, [workSessions, apartmentIds, selectedPropertyId]);

  const { data: checklistItems = [] } = useQuery({
    queryKey: ['checklist-items'],
    queryFn: () => apiClient.getChecklistItems({}),
  });

  // Ordina le work sessions per data di inizio decrescente
  const sortedSessions = React.useMemo(() => {
    return [...filteredWorkSessions].sort((a, b) => 
      new Date(b.start_time) - new Date(a.start_time)
    );
  }, [filteredWorkSessions]);

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user?.name || 'Operatore Sconosciuto';
  };

  const getApartmentName = (apartmentId) => {
    const apartment = apartments.find(a => a.id === apartmentId);
    return apartment?.name || 'Appartamento Sconosciuto';
  };

  // Mutation per creare operatore
  const createOperatorMutation = useMutation({
    mutationFn: async (operatorData) => {
      return await apiClient.createUser({
        ...operatorData,
        role: 'operator'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setAddOperatorDialogOpen(false);
      setNewOperator({ name: "", email: "", password: "" });
      toast.success("Operatore creato con successo!");
    },
    onError: (error) => {
      toast.error(`Errore nella creazione: ${error.message}`);
    },
  });

  // Mutation per aggiornare operatore
  const updateOperatorMutation = useMutation({
    mutationFn: async ({ userId, data }) => {
      return await apiClient.updateUser(userId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setEditOperatorDialogOpen(false);
      setEditingOperator(null);
      setEditOperatorData({ name: "", email: "", password: "" });
      toast.success("Operatore aggiornato con successo!");
    },
    onError: (error) => {
      toast.error(`Errore nell'aggiornamento: ${error.message}`);
    },
  });

  // Mutation per eliminare operatore
  const deleteOperatorMutation = useMutation({
    mutationFn: async (userId) => {
      return await apiClient.deleteUser(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success("Operatore eliminato con successo!");
    },
    onError: (error) => {
      toast.error(`Errore nell'eliminazione: ${error.message}`);
    },
  });

  // Mutation per eliminare work session
  const deleteWorkSessionMutation = useMutation({
    mutationFn: async (sessionId) => {
      return await apiClient.deleteWorkSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['work-sessions']);
      setDeleteSessionDialogOpen(false);
      setSessionToDelete(null);
      toast.success("Operazione eliminata con successo!");
    },
    onError: (error) => {
      toast.error(`Errore nell'eliminazione: ${error.message}`);
    },
  });

  const handleCreateOperator = () => {
    if (!newOperator.name || !newOperator.email || !newOperator.password) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    createOperatorMutation.mutate(newOperator);
  };

  const handleEditOperator = (operator) => {
    setEditingOperator(operator);
    setEditOperatorData({
      name: operator.name,
      email: operator.email,
      password: "" // Password vuota, verrà aggiornata solo se inserita
    });
    setEditOperatorDialogOpen(true);
  };

  const handleUpdateOperator = () => {
    if (!editOperatorData.name || !editOperatorData.email) {
      toast.error("Nome ed email sono obbligatori");
      return;
    }
    
    // Prepara i dati da inviare (escludi password se vuota)
    const dataToSend = {
      name: editOperatorData.name,
      email: editOperatorData.email,
    };
    
    if (editOperatorData.password) {
      dataToSend.password = editOperatorData.password;
    }
    
    updateOperatorMutation.mutate({ 
      userId: editingOperator.id, 
      data: dataToSend 
    });
  };

  const operators = users.filter(u => u.role === 'operator' || u.role === 'user');

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Operazioni</h1>
          <p className="text-gray-600">Gestisci lo storico delle pulizie e gli operatori</p>
        </div>

        <Tabs defaultValue="storico" className="w-full">
          <TabsList className="grid w-full md:w-auto grid-cols-2 mb-6">
            <TabsTrigger value="storico" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Storico Pulizie
            </TabsTrigger>
            <TabsTrigger value="operatori" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Operatori
            </TabsTrigger>
          </TabsList>

          {/* TAB STORICO PULIZIE */}
          <TabsContent value="storico" className="space-y-4">
            <Card className="border-none shadow-lg">
              <CardContent className="p-6">
                {loadingSessions ? (
                  <div className="space-y-3">
                    {Array(5).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : sortedSessions.length === 0 ? (
                  <div className="p-12 text-center">
                    <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg mb-2">Nessuna operazione registrata</p>
                    <p className="text-gray-400 text-sm">
                      Le operazioni completate dagli operatori appariranno qui
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gradient-to-r from-teal-50 to-cyan-50">
                        <TableHead className="font-semibold text-gray-700">Appartamento</TableHead>
                        <TableHead className="font-semibold text-gray-700">Nome Operatore</TableHead>
                        <TableHead className="font-semibold text-gray-700">Data Operazione</TableHead>
                        <TableHead className="font-semibold text-gray-700">Tempo Effettivo</TableHead>
                        <TableHead className="font-semibold text-gray-700 text-center">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedSessions.map((session) => {
                        // Il backend salva in UTC, aggiungiamo 2 ore per Europe/Rome
                        const sessionDate = new Date(new Date(session.start_time).getTime() + (2 * 60 * 60 * 1000));
                        
                        // Calcola durata in secondi
                        const durationSeconds = session.end_time 
                          ? Math.round((new Date(session.end_time) - new Date(session.start_time)) / 1000)
                          : null;
                        
                        // Formatta durata
                        const formatDuration = (seconds) => {
                          if (seconds < 60) {
                            return `${seconds} secondi`;
                          }
                          const minutes = Math.floor(seconds / 60);
                          const remainingSeconds = seconds % 60;
                          if (remainingSeconds === 0) {
                            return `${minutes} minuti`;
                          }
                          return `${minutes}m ${remainingSeconds}s`;
                        };
                        
                        return (
                          <TableRow 
                            key={session.id} 
                            className="hover:bg-teal-50/50 transition-colors"
                          >
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Home className="w-4 h-4 text-teal-600" />
                                {getApartmentName(session.apartment_id)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <User className="w-4 h-4 text-gray-500" />
                                {getUserName(session.user_id)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <div>
                                  <div className="font-medium">
                                    {sessionDate.toLocaleDateString('it-IT', { 
                                      day: 'numeric',
                                      month: 'long',
                                      year: 'numeric'
                                    })}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {sessionDate.toLocaleTimeString('it-IT', { 
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {durationSeconds !== null ? (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="font-medium">{formatDuration(durationSeconds)}</span>
                                </div>
                              ) : (
                                <Badge className="bg-blue-100 text-blue-700">In corso</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setDetailDialogOpen(true);
                                  }}
                                  className="hover:bg-teal-100"
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  Dettagli
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSessionToDelete(session);
                                    setDeleteSessionDialogOpen(true);
                                  }}
                                  className="hover:bg-red-100 text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Elimina
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB OPERATORI */}
          <TabsContent value="operatori" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <Badge className="bg-blue-100 text-blue-700 text-lg px-4 py-2">
                {operators.length} Operatori
              </Badge>
              <Button
                onClick={() => setAddOperatorDialogOpen(true)}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Aggiungi Operatore
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operators.map((operator) => (
                <Card key={operator.id} className="border-none shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="bg-teal-100 rounded-full p-3">
                        <User className="w-6 h-6 text-teal-600" />
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditOperator(operator)}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (window.confirm(`Sei sicuro di voler eliminare l'operatore ${operator.name}?`)) {
                              deleteOperatorMutation.mutate(operator.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-3">{operator.name}</h3>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-4 h-4 text-gray-500" />
                        <span className="truncate">{operator.email}</span>
                      </div>
                      
                      {operator.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="w-4 h-4 text-gray-500" />
                          <span>{operator.phone}</span>
                        </div>
                      )}
                      
                      {operator.created_at && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span>
                            Registrato il {new Date(operator.created_at).toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <Badge className="mt-4 bg-green-100 text-green-700">
                      {operator.role === 'operator' ? 'Operatore' : 'Utente'}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialog Dettaglio Operazione */}
        <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-600" />
                Dettaglio Operazione
              </DialogTitle>
              <DialogDescription>
                Riepilogo completo dell'attività completata
              </DialogDescription>
            </DialogHeader>
            
            {selectedSession && (() => {
              const sessionCompletions = completions.filter(c => c.work_session_id === selectedSession.id);
              const duration = selectedSession.end_time 
                ? Math.round((new Date(selectedSession.end_time) - new Date(selectedSession.start_time)) / 60000)
                : null;
              
              return (
                <div className="space-y-6">
                  {/* Info Generali */}
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Operazione</p>
                      <p className="font-semibold text-lg">Operazione #{selectedSession.id}</p>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Data</p>
                        <p className="font-semibold flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          {new Date(selectedSession.start_time).toLocaleDateString('it-IT', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            timeZone: 'Europe/Rome'
                          })}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Orario Inizio</p>
                        <p className="font-semibold flex items-center gap-2">
                          <Clock className="w-4 h-4 text-teal-600" />
                          {new Date(selectedSession.start_time).toLocaleTimeString('it-IT', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            timeZone: 'Europe/Rome'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    {selectedSession.end_time && (
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Orario Fine</p>
                          <p className="font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-teal-600" />
                            {new Date(selectedSession.end_time).toLocaleTimeString('it-IT', { 
                              hour: '2-digit', 
                              minute: '2-digit',
                              timeZone: 'Europe/Rome'
                            })}
                          </p>
                        </div>
                        
                        {duration && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">Durata</p>
                            <p className="font-semibold">{duration} minuti</p>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Operatore</p>
                        <p className="font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-teal-600" />
                          {getUserName(selectedSession.user_id)}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Appartamento</p>
                        <p className="font-semibold flex items-center gap-2">
                          <Home className="w-4 h-4 text-teal-600" />
                          {getApartmentName(selectedSession.apartment_id)}
                        </p>
                      </div>
                    </div>
                    
                    {selectedSession.notes && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Note</p>
                        <p className="text-sm italic bg-white rounded p-2 border border-gray-200">
                          {selectedSession.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Attività Completate */}
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Attività Completate ({sessionCompletions.length})
                    </h3>
                    <div className="space-y-2">
                      {sessionCompletions.map((completion) => {
                        const item = checklistItems.find(i => i.id === completion.checklist_item_id);
                        return (
                          <div key={completion.id} className="bg-white border rounded-lg p-3">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="font-medium">{item?.title || completion.checklist_item_title || `Attività #${completion.checklist_item_id}`}</span>
                              {item?.is_mandatory && (
                                <Badge className="bg-orange-100 text-orange-700 text-xs">
                                  Obbligatoria
                                </Badge>
                              )}
                            </div>
                            {item?.description && (
                              <p className="text-sm text-gray-600 mt-1 ml-6">{item.description}</p>
                            )}
                            {completion.notes && (
                              <p className="text-sm text-gray-500 italic mt-1 ml-6">Note: {completion.notes}</p>
                            )}
                          </div>
                        );
                      })}
                      {sessionCompletions.length === 0 && (
                        <p className="text-gray-500 text-sm text-center py-4">Nessuna attività completata</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Dialog Aggiungi Operatore */}
        <Dialog open={addOperatorDialogOpen} onOpenChange={setAddOperatorDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                Aggiungi Nuovo Operatore
              </DialogTitle>
              <DialogDescription>
                Crea un nuovo account per un operatore
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={newOperator.name}
                  onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })}
                  placeholder="Mario Rossi"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={newOperator.email}
                  onChange={(e) => setNewOperator({ ...newOperator, email: e.target.value })}
                  placeholder="mario.rossi@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={newOperator.password}
                  onChange={(e) => setNewOperator({ ...newOperator, password: e.target.value })}
                  placeholder="Minimo 6 caratteri"
                  className="mt-1"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setAddOperatorDialogOpen(false);
                    setNewOperator({ name: "", email: "", password: "" });
                  }}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleCreateOperator}
                  disabled={createOperatorMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                >
                  {createOperatorMutation.isPending ? "Creazione..." : "Crea Operatore"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Modifica Operatore */}
        <Dialog open={editOperatorDialogOpen} onOpenChange={setEditOperatorDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-blue-600" />
                Modifica Operatore
              </DialogTitle>
              <DialogDescription>
                Aggiorna i dati dell'operatore {editingOperator?.name}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome Completo *</Label>
                <Input
                  id="edit-name"
                  value={editOperatorData.name}
                  onChange={(e) => setEditOperatorData({ ...editOperatorData, name: e.target.value })}
                  placeholder="Mario Rossi"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-email">Email *</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editOperatorData.email}
                  onChange={(e) => setEditOperatorData({ ...editOperatorData, email: e.target.value })}
                  placeholder="mario.rossi@example.com"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="edit-password">Nuova Password (opzionale)</Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={editOperatorData.password}
                  onChange={(e) => setEditOperatorData({ ...editOperatorData, password: e.target.value })}
                  placeholder="Lascia vuoto per non modificare"
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lascia vuoto se non vuoi cambiare la password
                </p>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditOperatorDialogOpen(false);
                    setEditingOperator(null);
                    setEditOperatorData({ name: "", email: "", password: "" });
                  }}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  onClick={handleUpdateOperator}
                  disabled={updateOperatorMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                >
                  {updateOperatorMutation.isPending ? "Aggiornamento..." : "Aggiorna Operatore"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog Conferma Eliminazione Operazione */}
        <Dialog open={deleteSessionDialogOpen} onOpenChange={setDeleteSessionDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Conferma Eliminazione
              </DialogTitle>
              <DialogDescription>
                Sei sicuro di voler eliminare questa operazione?
              </DialogDescription>
            </DialogHeader>
            
            {sessionToDelete && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Home className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Appartamento:</span>
                  <span>{getApartmentName(sessionToDelete.apartment_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Operatore:</span>
                  <span>{getUserName(sessionToDelete.user_id)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-red-600" />
                  <span className="font-medium">Data:</span>
                  <span>
                    {(() => {
                      const adjustedDate = new Date(new Date(sessionToDelete.start_time).getTime() + (2 * 60 * 60 * 1000));
                      return adjustedDate.toLocaleDateString('it-IT', { 
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      });
                    })()}
                  </span>
                </div>
              </div>
            )}

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
              <p className="text-sm text-yellow-800">
                ⚠️ Questa azione è irreversibile. Verranno eliminate anche tutte le attività completate associate a questa operazione.
              </p>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setDeleteSessionDialogOpen(false);
                  setSessionToDelete(null);
                }}
                className="flex-1"
              >
                Annulla
              </Button>
              <Button
                onClick={() => deleteWorkSessionMutation.mutate(sessionToDelete.id)}
                disabled={deleteWorkSessionMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteWorkSessionMutation.isPending ? "Eliminazione..." : "Elimina Operazione"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}