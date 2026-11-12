import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface SystemUser {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  last_sign_in_at: string | null;
  role?: string;
}

export function SystemUserManager() {
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Usar auth.admin.listUsers() via Edge Function ou API direta
      // Por enquanto, usamos a tabela 'user_roles' que existe no types
      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .order('user_id');
      
      if (error) throw error;
      
      // Buscar dados do auth.users via RPC ou usar dados disponíveis
      // Para produção, isso deve ser feito via Edge Function com service_role
      setUsers((userRoles || []).map(ur => ({
        id: ur.user_id,
        email: '',
        created_at: new Date().toISOString(),
        email_confirmed_at: null,
        last_sign_in_at: null,
        role: ur.role
      })));
    } catch (e: any) {
      toast({ title: "Erro ao carregar usuários", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const inviteUser = async () => {
    if (!email) {
      toast({ title: "Informe o e-mail", variant: "destructive" });
      return;
    }
    try {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
      toast({ title: "Convite enviado", description: `Convite enviado para ${email}` });
      setEmail("");
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro ao convidar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail para convite" type="email" />
        <Button onClick={inviteUser} disabled={loading}>Convidar Usuário</Button>
      </div>
      
      <div className="grid gap-4">
        {loading ? <p>Carregando...</p> : users.map(user => (
          <Card key={user.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">{user.email}</p>
                <p className="text-sm text-muted-foreground">Criado: {new Date(user.created_at).toLocaleDateString()}</p>
              </div>
              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role || 'user'}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
