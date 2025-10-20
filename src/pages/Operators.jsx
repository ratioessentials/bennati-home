import React, { useState } from "react";
import { apiClient } from "@/components/api/apiClient";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Phone, Calendar, Plus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Operators() {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiClient.getUsers('-created_date'),
    initialData: [],
  });

  const operators = users.filter(u => u.role === 'user');
  const admins = users.filter(u => u.role === 'admin');

  const openInviteInstructions = () => {
    setInviteDialogOpen(true);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestione Utenti</h1>
            <p className="text-gray-600">Visualizza e invita operatori nel sistema</p>
          </div>
          <Button
            onClick={openInviteInstructions}
            className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 shadow-lg shadow-teal-500/30"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invita Operatore
          </Button>
        </div>

        <Alert className="mb-6 border-teal-200 bg-teal-50">
          <AlertDescription className="text-teal-800">
            ℹ️ <strong>Info:</strong> Gli operatori riceveranno un'email con le credenziali di accesso dopo l'invito.
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-teal-600" />
              Operatori ({operators.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {isLoading ? (
                Array(3).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))
              ) : operators.length === 0 ? (
                <Card className="col-span-full border-none shadow-lg">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500 text-lg mb-2">Nessun operatore registrato</p>
                    <p className="text-gray-400 text-sm mb-4">
                      Clicca su "Invita Operatore" per aggiungere il primo operatore
                    </p>
                  </CardContent>
                </Card>
              ) : (
                operators.map((operator) => (
                  <Card key={operator.id} className="border-none shadow-lg">
                    <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-cyan-50">
                      <CardTitle className="text-lg">{operator.full_name}</CardTitle>
                      <Badge className="bg-teal-100 text-teal-700 w-fit">Operatore</Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-teal-600" />
                        <span className="truncate">{operator.email}</span>
                      </div>
                      {operator.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-teal-600" />
                          <span>{operator.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>Registrato: {new Date(operator.created_date).toLocaleDateString('it-IT')}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Amministratori ({admins.length})
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {admins.map((admin) => (
                <Card key={admin.id} className="border-none shadow-lg">
                  <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-pink-50">
                    <CardTitle className="text-lg">{admin.full_name}</CardTitle>
                    <Badge className="bg-purple-100 text-purple-700 w-fit">Admin</Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4 text-purple-600" />
                      <span className="truncate">{admin.email}</span>
                    </div>
                    {admin.phone && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-purple-600" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Registrato: {new Date(admin.created_date).toLocaleDateString('it-IT')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-teal-600" />
                Come Invitare un Operatore
              </DialogTitle>
              <DialogDescription>
                Segui questi passaggi per invitare un nuovo operatore alla piattaforma
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <h3 className="font-semibold text-teal-900 mb-3">Procedura:</h3>
                <ol className="space-y-3 text-sm text-teal-800">
                  <li className="flex gap-2">
                    <span className="font-bold">1.</span>
                    <span>Clicca sull'icona <strong>⚙️ Impostazioni</strong> nell'angolo in alto a destra dello schermo</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">2.</span>
                    <span>Nel menu che si apre, seleziona <strong>"Utenti"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">3.</span>
                    <span>Clicca sul pulsante <strong>"Invita Utente"</strong></span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">4.</span>
                    <span>Compila il form con:
                      <ul className="ml-4 mt-1 space-y-1">
                        <li>• Email dell'operatore</li>
                        <li>• Nome completo</li>
                        <li>• Seleziona ruolo: <strong>"User"</strong> (non Admin)</li>
                      </ul>
                    </span>
                  </li>
                  <li className="flex gap-2">
                    <span className="font-bold">5.</span>
                    <span>Clicca <strong>"Invia Invito"</strong></span>
                  </li>
                </ol>
              </div>
              
              <Alert className="border-blue-200 bg-blue-50">
                <AlertDescription className="text-blue-800 text-sm">
                  📧 L'operatore riceverà un'email con un link per creare la password e accedere alla piattaforma.
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}