import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/components/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Home, Loader2, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await apiClient.login(email, password);
      navigate("/Dashboard");
    } catch (err) {
      setError(err.message || "Errore durante il login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-0">
        <CardHeader className="space-y-1 pb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Home className="h-8 w-8 text-teal-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-cyan-500 rounded-full border-2 border-white"></div>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-center text-gray-900">
            TopClean
          </CardTitle>
          <CardDescription className="text-center text-gray-600 text-base">
            Gestione Pulizie Professionali
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="tua@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="bg-white border-gray-300 focus:border-teal-500 focus:ring-teal-500 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white font-semibold shadow-lg transition-all duration-200"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Accesso in corso...
                </>
              ) : (
                <>
                  Accedi
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

