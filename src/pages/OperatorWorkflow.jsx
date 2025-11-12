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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { 
  Building2,
  Home,
  CheckCircle2,
  Circle,
  Check,
  Package,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Send,
  ExternalLink,
  Box,
  Edit
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

export default function OperatorWorkflow() {
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedProperty, setSelectedProperty] = useState("");
  const [selectedApartment, setSelectedApartment] = useState("");
  const [workSessionId, setWorkSessionId] = useState(null);
  const [finalNotes, setFinalNotes] = useState("");
  const [supplyUpdates, setSupplyUpdates] = useState({});
  const [checklistValues, setChecklistValues] = useState({}); // Per salvare i valori di yes_no e number

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

  const { data: apartmentChecklists } = useQuery({
    queryKey: ['apartment-checklists', selectedApartment],
    queryFn: () => {
      const apartmentValue = typeof selectedApartment === 'object' ? null : selectedApartment;
      const apartmentId = parseInt(apartmentValue);
      return apartmentValue && !isNaN(apartmentId)
        ? apiClient.getApartmentChecklists(apartmentId)
        : Promise.resolve([]);
    },
    initialData: [],
    enabled: !!selectedApartment && typeof selectedApartment !== 'object' && !isNaN(parseInt(selectedApartment)),
  });

  // Estrai le checklist items dalle assegnazioni
  const checklistItems = apartmentChecklists.map(ac => ac.checklist_item).filter(Boolean);

  const { data: apartmentSupplies } = useQuery({
    queryKey: ['apartment-supplies', selectedApartment],
    queryFn: () => {
      const apartmentValue = typeof selectedApartment === 'object' ? null : selectedApartment;
      const apartmentId = parseInt(apartmentValue);
      return apartmentValue && !isNaN(apartmentId)
        ? apiClient.getApartmentSupplies(apartmentId)
        : Promise.resolve([]);
    },
    initialData: [],
    enabled: !!selectedApartment && typeof selectedApartment !== 'object' && !isNaN(parseInt(selectedApartment)),
  });

  const { data: completions, refetch: refetchCompletions } = useQuery({
    queryKey: ['completions', workSessionId],
    queryFn: async () => {
      if (!workSessionId) return [];
      console.log('🔄 Fetching completions for session:', workSessionId);
      // Filtra lato server per work_session_id
      const filtered = await apiClient.getCompletions({
        work_session_id: workSessionId
      });
      console.log('📦 Completions fetched:', filtered.length, filtered);
      return filtered;
    },
    initialData: [],
    enabled: !!workSessionId && !!user,
    staleTime: 0, // I dati sono sempre considerati stale
  });

  // DEBUG: Log stato importante
  React.useEffect(() => {
    console.log('🔍 STATE CHECK:', {
      user: user?.id,
      workSessionId: workSessionId,
      currentStep: currentStep,
      selectedApartment: selectedApartment,
      checklistsCount: checklistItems?.length || 0,
      completionsCount: completions?.length || 0
    });
  }, [user, workSessionId, currentStep, selectedApartment, checklistItems, completions]);

  // Mutation per creare una work session
  const createWorkSessionMutation = useMutation({
    mutationFn: async () => {
      const session = await apiClient.createWorkSession({
        apartment_id: parseInt(selectedApartment),
        notes: null
      });
      return session;
    },
    onSuccess: (session) => {
      setWorkSessionId(session.id);
      setCurrentStep(2);
    },
  });

  const toggleCompletionMutation = useMutation({
    mutationFn: async ({ itemId, completed, item_type, value_bool, value_number }) => {
      console.log('🔘 Toggle mutation called:', { itemId, completed, userId: user?.id, workSessionId, item_type, value_bool, value_number });
      
      if (completed) {
        const completion = completions.find(c => c.checklist_item_id === itemId);
        if (completion) {
          console.log('🗑️ Deleting completion:', completion.id);
          await apiClient.deleteCompletion(completion.id);
        }
      } else {
        console.log('✅ Creating completion...');
        await apiClient.createCompletion({
          checklist_item_id: itemId,
          user_id: user.id,
          work_session_id: workSessionId,
          value_bool: value_bool,
          value_number: value_number
        });
      }
    },
    onSuccess: async () => {
      console.log('✅ Toggle mutation SUCCESS');
      // Invalida e refetch manuale
      await queryClient.invalidateQueries({ queryKey: ['completions', workSessionId] });
      await refetchCompletions();
      console.log('🔄 Refetch completato');
    },
    onError: (error) => {
      console.error('❌ Toggle mutation ERROR:', error);
    },
  });

  const updateSupplyMutation = useMutation({
    mutationFn: async ({ apartmentSupplyId, newQuantity }) => {
      await apiClient.updateApartmentSupply(apartmentSupplyId, { 
        required_quantity: newQuantity 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apartment-supplies'] });
    },
  });

  const completeWorkMutation = useMutation({
    mutationFn: async () => {
      // Salva gli aggiornamenti delle scorte
      const updates = Object.entries(supplyUpdates);
      
      if (updates.length > 0) {
        for (const [apartmentSupplyId, newQuantity] of updates) {
          try {
            await updateSupplyMutation.mutateAsync({ 
              apartmentSupplyId: parseInt(apartmentSupplyId), 
              newQuantity: parseInt(newQuantity) 
            });
          } catch (error) {
            console.error(`Errore aggiornamento scorta ${apartmentSupplyId}:`, error);
          }
        }
      }
      
      // Chiudi la work session con end_time e note finali
      if (workSessionId) {
        await apiClient.updateWorkSession(workSessionId, {
          end_time: new Date().toISOString(),
          notes: finalNotes || null
        });
      }
      
      return true;
    },
    onSuccess: () => {
      // Invalida tutte le query relative a scorte e sessioni per aggiornare l'area admin
      queryClient.invalidateQueries({ queryKey: ['work-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['apartment-supplies'] });
      queryClient.invalidateQueries({ queryKey: ['all-apartment-supplies'] });
      queryClient.invalidateQueries({ queryKey: ['all-apartment-supply-items'] });
      queryClient.invalidateQueries({ queryKey: ['supplies'] });
      setCurrentStep(5); // Step finale di ringraziamento
    },
    onError: (error) => {
      console.error('Errore nel completamento operazione:', error);
      // Anche in caso di errore, procediamo allo step 5
      setCurrentStep(5);
    },
  });

  const isCompleted = (itemId) => {
    return completions.some(c => c.checklist_item_id === itemId);
  };

  const handleToggle = (itemId, item_type = 'check', value_bool = null, value_number = null) => {
    console.log('🖱️ handleToggle clicked:', { itemId, isPending: toggleCompletionMutation.isPending, item_type, value_bool, value_number });
    const completed = isCompleted(itemId);
    console.log('🖱️ isCompleted:', completed);
    toggleCompletionMutation.mutate({ itemId, completed, item_type, value_bool, value_number });
  };
  
  const getChecklistValue = (itemId, item_type) => {
    if (checklistValues[itemId] !== undefined) {
      return checklistValues[itemId];
    }
    // Se c'è una completion, recupera il valore da lì
    const completion = completions.find(c => c.checklist_item_id === itemId);
    if (completion) {
      if (item_type === 'number' && completion.value_number !== null) {
        return completion.value_number;
      }
      if (item_type === 'yes_no' && completion.value_bool !== null) {
        return completion.value_bool;
      }
    }
    // Valore di default in base al tipo
    return item_type === 'yes_no' ? false : null;
  };
  
  const getCurrentNumberValue = (itemId) => {
    const completion = completions.find(c => c.checklist_item_id === itemId);
    return completion?.value_number ?? null;
  };
  
  const setChecklistValue = (itemId, value) => {
    setChecklistValues({ ...checklistValues, [itemId]: value });
  };

  const completedCount = checklistItems.filter(item => isCompleted(item.id)).length;
  const totalChecklistItems = checklistItems.length;
  const checklistProgress = totalChecklistItems > 0 ? (completedCount / totalChecklistItems) * 100 : 0;

  const handleSupplyUpdate = (apartmentSupplyId, value) => {
    setSupplyUpdates({ ...supplyUpdates, [apartmentSupplyId]: value });
  };

  const getSupplyQuantity = (apartmentSupply) => {
    return supplyUpdates[apartmentSupply.id] !== undefined 
      ? supplyUpdates[apartmentSupply.id] 
      : apartmentSupply.required_quantity;
  };

  const isLowStock = (apartmentSupply) => {
    const qty = getSupplyQuantity(apartmentSupply);
    return qty <= apartmentSupply.min_quantity;
  };

  const categoryColors = {
    pulizia: "bg-teal-100 text-teal-700",
    controllo: "bg-blue-100 text-blue-700",
    riordino: "bg-purple-100 text-purple-700",
    altro: "bg-gray-100 text-gray-700"
  };

  const supplyCategoryColors = {
    bagno: "bg-blue-100 text-blue-700",
    "camera da letto": "bg-purple-100 text-purple-700",
    salotto: "bg-teal-100 text-teal-700",
    ingresso: "bg-orange-100 text-orange-700",
    generale: "bg-gray-100 text-gray-700"
  };

  const getSelectedApartmentName = () => {
    const apt = apartments.find(a => a.id === parseInt(selectedApartment));
    return apt?.name || "";
  };

  const getSelectedPropertyName = () => {
    const prop = properties.find(p => p.id === parseInt(selectedProperty));
    return prop?.name || "";
  };

  const totalSteps = 4;
  const overallProgress = ((currentStep - 1) / (totalSteps - 1)) * 100;

  const canProceedToStep2 = selectedProperty && selectedApartment && checklistItems.length > 0;
  const canProceedToStep3 = completedCount === totalChecklistItems && totalChecklistItems > 0;
  const canProceedToStep4 = apartmentSupplies.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 pb-20">
      {/* Progress Bar */}
      {currentStep > 1 && currentStep < 5 && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-md">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Step {currentStep} di {totalSteps}
              </span>
              <span className="text-sm font-medium text-teal-600">
                {Math.round(overallProgress)}%
              </span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>
        </div>
      )}

      <div className={`max-w-2xl mx-auto p-4 ${currentStep > 1 && currentStep < 5 ? 'pt-20' : 'pt-4'}`}>
        {/* STEP 1: Selezione Struttura e Appartamento */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-full mb-4">
                <Home className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Benvenuto!</h1>
              <p className="text-gray-600">Iniziamo selezionando dove lavorare oggi</p>
            </div>

            <Card className="border-none shadow-xl">
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    Seleziona la Struttura
                  </Label>
                  <Select
                    value={selectedProperty}
                    onValueChange={(value) => {
                      setSelectedProperty(value);
                      setSelectedApartment("");
                    }}
                  >
                    <SelectTrigger className="h-14 text-lg">
                      <SelectValue placeholder="Scegli una struttura..." />
                    </SelectTrigger>
                    <SelectContent>
                      {properties.map((property) => {
                        const propertyId = `${property.id}`; // Forza conversione a stringa
                        return (
                          <SelectItem key={property.id} value={propertyId} className="text-lg py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-5 h-5" />
                              {property.name}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {selectedProperty && apartments.length > 0 && (
                  <div className="animate-in slide-in-from-bottom duration-300">
                    <Label className="text-base font-semibold mb-3 block flex items-center gap-2">
                      <Home className="w-5 h-5 text-teal-600" />
                      Seleziona l'Appartamento
                    </Label>
                    <Select
                      value={selectedApartment}
                      onValueChange={setSelectedApartment}
                    >
                      <SelectTrigger className="h-14 text-lg">
                        <SelectValue placeholder="Scegli un appartamento..." />
                      </SelectTrigger>
                      <SelectContent>
                        {apartments.map((apt) => {
                          const apartmentId = `${apt.id}`; // Forza conversione a stringa
                          return (
                            <SelectItem key={apt.id} value={apartmentId} className="text-lg py-3">
                              <div className="flex items-center gap-2">
                                <Home className="w-5 h-5" />
                                {apt.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {selectedApartment && (
                  <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 animate-in slide-in-from-bottom duration-300">
                    <p className="text-sm text-teal-800 font-medium mb-1">Hai selezionato:</p>
                    <p className="text-lg font-bold text-teal-900">{getSelectedPropertyName()} - {getSelectedApartmentName()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedApartment && (
              <Button
                size="lg"
                onClick={() => createWorkSessionMutation.mutate()}
                disabled={!canProceedToStep2 || createWorkSessionMutation.isPending}
                className="w-full h-14 text-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg animate-in slide-in-from-bottom duration-500"
              >
                {createWorkSessionMutation.isPending ? 'Avvio...' : 'Inizia Pulizia'}
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            )}
          </div>
        )}

        {/* STEP 2: Checklist Pulizie */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Card className="border-none shadow-xl bg-gradient-to-r from-teal-500 to-cyan-600 text-white sticky top-20 z-40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-xl font-bold">Checklist Pulizie</h2>
                    <p className="text-teal-100 text-sm">{getSelectedApartmentName()}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">{completedCount}/{totalChecklistItems}</div>
                    <div className="text-sm text-teal-100">completate</div>
                  </div>
                </div>
                <Progress value={checklistProgress} className="h-3 bg-teal-400" />
                <p className="text-sm text-teal-100 mt-2 text-center font-medium">
                  {Math.round(checklistProgress)}% completato
                </p>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {(() => {
                // Raggruppa checklist per stanza (room_name)
                const itemsByRoom = checklistItems.reduce((acc, item) => {
                  const roomName = item.room_name || 'generale';
                  if (!acc[roomName]) acc[roomName] = [];
                  acc[roomName].push(item);
                  return acc;
                }, {});

                return Object.entries(itemsByRoom).map(([roomName, items]) => (
                  <div key={roomName} className="space-y-3">
                    {/* Intestazione Stanza */}
                    <div className="sticky top-36 z-30 bg-gradient-to-r from-cyan-50 to-teal-50 rounded-lg p-3 shadow-md border-l-4 border-teal-500">
                      <div className="flex items-center gap-2">
                        <Home className="w-5 h-5 text-teal-600" />
                        <h3 className="font-bold text-lg text-gray-800 capitalize">{roomName}</h3>
                        <Badge className="bg-teal-100 text-teal-700 ml-auto">
                          {items.filter(item => isCompleted(item.id)).length}/{items.length}
                        </Badge>
                      </div>
                    </div>

                    {/* Checklist Items della Stanza */}
                    {items.map((item) => {
                      const completed = isCompleted(item.id);
                      const itemType = item.item_type || 'check';
                      const currentValue = getChecklistValue(item.id, itemType);
                      
                      return (
                        <Card
                          key={item.id}
                          className={`border-none shadow-lg transition-all duration-300 ${
                            completed ? 'bg-green-50 border-2 border-green-300' : 'hover:shadow-xl'
                          }`}
                        >
                          <CardContent className="p-4">
                            {/* TIPO: CHECK (Semplice Check) */}
                            {itemType === 'check' && (
                              <div className="flex items-start gap-4">
                                <button
                                  onClick={() => handleToggle(item.id, 'check')}
                                  className="flex-shrink-0 mt-1 transition-transform active:scale-90"
                                  disabled={toggleCompletionMutation.isPending}
                                >
                                  {completed ? (
                                    <div className="relative">
                                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                                      <div className="absolute inset-0 animate-ping">
                                        <CheckCircle2 className="w-10 h-10 text-green-400 opacity-75" />
                                      </div>
                                    </div>
                                  ) : (
                                    <Circle className="w-10 h-10 text-gray-300 hover:text-teal-600 transition-colors" />
                                  )}
                                </button>
                                <div className="flex-1">
                                  <p className={`text-lg font-bold mb-1 ${
                                    completed ? 'line-through text-gray-500' : 'text-gray-900'
                                  }`}>
                                    {item.title}
                                  </p>
                                  {item.description && (
                                    <p className={`text-sm ${
                                      completed ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* TIPO: YES_NO (trattato come CHECK normale) */}
                            {itemType === 'yes_no' && (
                              <div className="flex items-start gap-4">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleToggle(item.id, 'check')}
                                  className={`flex-shrink-0 h-10 w-10 rounded-full transition-all ${
                                    completed 
                                      ? 'bg-green-500 hover:bg-green-600 text-white' 
                                      : 'bg-gray-200 hover:bg-gray-300 text-gray-600'
                                  }`}
                                >
                                  {completed ? (
                                    <Check className="h-6 w-6" />
                                  ) : (
                                    <div className="h-4 w-4 rounded border-2 border-gray-400" />
                                  )}
                                </Button>
                                <div className="flex-1">
                                  <p className={`text-lg font-bold mb-1 ${
                                    completed ? 'text-green-700 line-through' : 'text-gray-900'
                                  }`}>
                                    {item.title}
                                  </p>
                                  {item.description && (
                                    <p className="text-sm text-gray-600">
                                      {item.description}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* TIPO: NUMBER (Dotazioni) */}
                            {itemType === 'number' && (() => {
                              const currentNumber = getCurrentNumberValue(item.id);
                              const expectedNumber = item.expected_number;
                              const hasValue = currentNumber !== null;
                              const needsInput = hasValue && currentNumber !== expectedNumber;
                              const isCorrect = hasValue && currentNumber === expectedNumber;
                              
                              return (
                                <div className="flex items-center gap-4">
                                  {/* Icona e titolo */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <Box className="w-5 h-5 text-blue-600 flex-shrink-0" />
                                      <p className={`text-base font-bold ${
                                        isCorrect ? 'text-green-700' : 'text-gray-900'
                                      }`}>
                                        {item.title}
                                      </p>
                                      {expectedNumber && (
                                        <span className="text-xs text-gray-500">
                                          (previsto: {expectedNumber})
                                        </span>
                                      )}
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-gray-500 mt-0.5 ml-7">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {/* Controlli su una riga */}
                                  <div className="flex items-center gap-2">
                                    {!hasValue ? (
                                      // Nessun valore - mostra pulsante conferma o input compatto
                                      expectedNumber ? (
                                        <>
                                          <Button
                                            type="button"
                                            onClick={() => {
                                              handleToggle(item.id, 'number', null, expectedNumber);
                                            }}
                                            className="bg-green-600 hover:bg-green-700 text-white h-9 px-3 text-sm"
                                            title={`Conferma: ${expectedNumber}`}
                                          >
                                            <Check className="w-4 h-4 mr-1" />
                                            {expectedNumber}
                                          </Button>
                                          <Input
                                            id={`number-${item.id}`}
                                            type="number"
                                            value={currentValue || ''}
                                            onChange={(e) => {
                                              const value = parseInt(e.target.value) || null;
                                              setChecklistValue(item.id, value);
                                            }}
                                            onBlur={(e) => {
                                              const value = parseInt(e.target.value) || null;
                                              if (value !== null) {
                                                handleToggle(item.id, 'number', null, value);
                                              }
                                            }}
                                            placeholder="Altro"
                                            className="w-20 h-9 text-center text-sm font-semibold"
                                          />
                                        </>
                                      ) : (
                                        <Input
                                          id={`number-${item.id}`}
                                          type="number"
                                          value={currentValue || ''}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value) || null;
                                            setChecklistValue(item.id, value);
                                          }}
                                          onBlur={(e) => {
                                            const value = parseInt(e.target.value) || null;
                                            if (value !== null) {
                                              handleToggle(item.id, 'number', null, value);
                                            }
                                          }}
                                          placeholder="Numero"
                                          className="w-20 h-9 text-center text-sm font-semibold"
                                        />
                                      )
                                    ) : needsInput ? (
                                      // Valore diverso - mostra input compatto
                                      <>
                                        <Input
                                          id={`number-${item.id}`}
                                          type="number"
                                          value={currentValue || currentNumber || ''}
                                          onChange={(e) => {
                                            const value = parseInt(e.target.value) || null;
                                            setChecklistValue(item.id, value);
                                          }}
                                          onBlur={(e) => {
                                            const value = parseInt(e.target.value) || null;
                                            if (value !== null) {
                                              handleToggle(item.id, 'number', null, value);
                                            }
                                          }}
                                          className="w-20 h-9 text-center text-sm font-semibold border-orange-300"
                                        />
                                        {item.amazon_link && (currentValue || currentNumber) < expectedNumber && (
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => window.open(item.amazon_link, '_blank', 'noopener,noreferrer')}
                                            className="h-9 px-2"
                                            title="Acquista su Amazon"
                                          >
                                            <ExternalLink className="w-4 h-4 text-orange-600" />
                                          </Button>
                                        )}
                                      </>
                                    ) : (
                                      // Valore corretto - mostra conferma compatta
                                      <>
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded border border-green-200">
                                          <Check className="w-4 h-4 text-green-600" />
                                          <span className="text-sm font-semibold text-green-700">
                                            {currentNumber}
                                          </span>
                                        </div>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => {
                                            if (completed) {
                                              handleToggle(item.id, 'number', null, null);
                                            }
                                          }}
                                          className="h-9 w-9"
                                          title="Modifica"
                                        >
                                          <Edit className="w-4 h-4 text-gray-600" />
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>

            <div className="flex gap-3 pt-4 sticky bottom-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setCurrentStep(1);
                  setWorkSessionId(null); // Reset work session quando si torna indietro
                }}
                className="flex-1 h-14"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Indietro
              </Button>
              <Button
                size="lg"
                onClick={() => setCurrentStep(3)}
                disabled={!canProceedToStep3}
                className="flex-1 h-14 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
              >
                Avanti
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Controllo Magazzino */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-in fade-in duration-500">
            <Card className="border-none shadow-xl bg-gradient-to-r from-orange-500 to-red-600 text-white sticky top-20 z-40">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold flex items-center gap-2">
                      <Package className="w-6 h-6" />
                      Controllo Magazzino
                    </h2>
                    <p className="text-orange-100 text-sm mt-1">Aggiorna le quantità dei prodotti</p>
                  </div>
                  <Badge className="bg-white text-orange-600 text-lg px-4 py-2">
                    {apartmentSupplies.length} prodotti
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              {apartmentSupplies.map((apartmentSupply) => {
                const supply = apartmentSupply.supply;
                const currentQty = getSupplyQuantity(apartmentSupply);
                const isLow = currentQty <= apartmentSupply.min_quantity;
                
                return (
                  <Card
                    key={apartmentSupply.id}
                    className={`border-none shadow-lg ${
                      isLow ? 'border-2 border-orange-400 bg-orange-50' : ''
                    }`}
                  >
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-bold text-lg text-gray-900 mb-2">{supply.name}</h3>
                            <div className="flex flex-wrap gap-2">
                              <Badge className={supplyCategoryColors[supply.category]}>
                                {supply.category}
                              </Badge>
                              {isLow && (
                                <Badge className="bg-orange-100 text-orange-700">
                                  <AlertTriangle className="w-3 h-3 mr-1" />
                                  Scorta bassa
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-4">
                          <Label htmlFor={`qty-${apartmentSupply.id}`} className="text-sm font-medium mb-2 block">
                            Quantità Disponibile
                          </Label>
                          <div className="flex items-center gap-3">
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => handleSupplyUpdate(apartmentSupply.id, Math.max(0, currentQty - 1))}
                              className="h-12 w-12 text-xl font-bold"
                            >
                              -
                            </Button>
                            <div className="flex-1 text-center">
                              <div className="text-3xl font-bold text-gray-900">
                                {currentQty}
                              </div>
                              <div className="text-sm text-gray-500">
                                {supply.unit}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="lg"
                              onClick={() => handleSupplyUpdate(apartmentSupply.id, parseInt(currentQty) + 1)}
                              className="h-12 w-12 text-xl font-bold"
                            >
                              +
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Minimo richiesto: {apartmentSupply.min_quantity} {supply.unit}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3 pt-4 sticky bottom-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(2)}
                className="flex-1 h-14"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Indietro
              </Button>
              <Button
                size="lg"
                onClick={() => setCurrentStep(4)}
                className="flex-1 h-14 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
              >
                Avanti
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Note Finali e Completamento */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="border-none shadow-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Sparkles className="w-7 h-7" />
                  Quasi Fatto!
                </h2>
                <p className="text-purple-100 mt-1">Aggiungi eventuali note e completa l'operazione</p>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl">
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label htmlFor="notes" className="text-base font-semibold mb-3 block">
                    Note (opzionale)
                  </Label>
                  <Textarea
                    id="notes"
                    value={finalNotes}
                    onChange={(e) => setFinalNotes(e.target.value)}
                    placeholder="Es: Trovato rubinetto che perde, lampadina da sostituire..."
                    rows={5}
                    className="text-base"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Segnala qui eventuali problemi o osservazioni
                  </p>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <h3 className="font-semibold text-teal-900 mb-2">Riepilogo Operazione:</h3>
                  <ul className="space-y-1 text-sm text-teal-800">
                    <li>✓ Checklist completata: {completedCount}/{totalChecklistItems} attività</li>
                    <li>✓ Magazzino verificato: {apartmentSupplies.length} prodotti</li>
                    <li>✓ Appartamento: {getSelectedApartmentName()}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentStep(3)}
                className="flex-1 h-14"
              >
                <ChevronLeft className="w-5 h-5 mr-2" />
                Indietro
              </Button>
              <Button
                size="lg"
                onClick={() => completeWorkMutation.mutate()}
                disabled={completeWorkMutation.isPending}
                className="flex-1 h-14 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg"
              >
                {completeWorkMutation.isPending ? (
                  "Salvataggio..."
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-2" />
                    Completa Operazione
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 5: Messaggio di Ringraziamento */}
        {currentStep === 5 && (
          <div className="min-h-[80vh] flex items-center justify-center animate-in zoom-in duration-700">
            <Card className="border-none shadow-2xl max-w-md">
              <CardContent className="p-12 text-center">
                <div className="mb-6">
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-14 h-14 text-white" />
                    </div>
                    <div className="absolute inset-0 animate-ping">
                      <div className="w-24 h-24 bg-green-400 rounded-full mx-auto opacity-25"></div>
                    </div>
                  </div>
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-3">
                  Ottimo Lavoro!
                </h2>
                <p className="text-lg text-gray-600 mb-6">
                  Operazione di pulizia completata con successo per <strong>{getSelectedApartmentName()}</strong>
                </p>
                
                <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6 mb-8">
                  <Sparkles className="w-8 h-8 text-teal-600 mx-auto mb-3" />
                  <p className="text-teal-800 font-medium">
                    Grazie per il tuo impegno e professionalità!
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={() => {
                    setCurrentStep(1);
                    setSelectedProperty("");
                    setSelectedApartment("");
                    setWorkSessionId(null); // Reset work session
                    setFinalNotes("");
                    setSupplyUpdates({});
                    queryClient.invalidateQueries();
                  }}
                  className="w-full h-14 text-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700"
                >
                  Nuova Operazione
                  <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}