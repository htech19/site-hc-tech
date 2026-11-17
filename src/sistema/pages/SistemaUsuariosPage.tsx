import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Shield, User, ShieldCheck, ShieldAlert, Trash2, Pencil } from "lucide-react";

type Usuario = {
  id: string;
  email: string | null;
  nome: string;
  cpf_cnpj: string | null;
  telefone: string | null;
  avatar_url: string | null;
  role: string;
  created_at: string;
  updated_at: string;
};

type ModalUsuarioProps = {
  usuario?: Usuario | null;
  onClose: () => void;
  onSalvo: () => void;
};

function ModalUsuario({ usuario, onClose, onSalvo }: ModalUsuarioProps) {
  const [nome, setNome] = useState(usuario?.nome || "");
  const [email, setEmail] = useState(usuario?.email || "");
  const [cpfCnpj, setCpfCnpj] = useState(usuario?.cpf_cnpj || "");
  const [telefone, setTelefone] = useState(usuario?.telefone || "");
  const [role, setRole] = useState(usuario?.role || "user");
  const [saving, setSaving] = useState(false);

  const salvar = async () => {
    setSaving(true);
    if (usuario) {
      const { error } = await supabase.from("user_roles").update({ nome, cpf_cnpj: cpfCnpj || null, role }).eq("user_id", usuario.id);
      if (error) {
        toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
        setSaving(false);
        return;
      }
    } else {
      const { data: newUser, error: err } = await supabase.auth.admin.createUser({
        email,
        password: "senha_temporaria_123!",
        email_confirmated: true,
      });
      if (err) {
        toast({ title: "Erro ao criar usuário", description: err.message, variant: "destructive" });
        setSaving(false);
        return;
      }
      await supabase.from("user_roles").insert({
        user_id: newUser.user.id,
        nome,
        cpf_cnpj: cpfCnpj || null,
        role,
      });
    }
    toast({ title: "Usuário salvo com sucesso" });
    setSaving(false);
    onClose();
    onSalvo();
  };

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>{usuario ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <Input placeholder="Nome completo" value={nome} onChange={e => setNome(e.target.value)} />
        <Input placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        <Input placeholder="CPF ou CNPJ" value={cpfCnpj} onChange={e => setCpfCnpj(e.target.value.replace(/\D/g, '').slice(0, 14))} maxLength={14} />
        <Input placeholder="Telefone (opcional)" value={telefone} onChange={e => setTelefone(e.target.value)} type="tel" />
        <select value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded p-2">
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
          <option value="user">Usuário</option>
          <option value="manager">Gerente</option>
          <option value="viewer">Visualizador</option>
        </select>
      </div>
      <Button onClick={salvar} disabled={saving} className="w-full">
        {saving ? "Salvando..." : "Salvar"}
      </Button>
    </DialogContent>
  );
}

export default function SistemaUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");

  const carregarUsuarios = async () => {
    setLoading(true);
    const { data: authUsers } = await supabase.auth.admin.listUsers();
    const { data: userRoles } = await supabase.from("user_roles").select("*");
    const rolesMap = new Map(userRoles?.map(ur => [ur.user_id, ur]) || []);

    const usuariosListados: Usuario[] = (authUsers?.users || []).map(u => ({
      id: u.id,
      email: u.email,
      nome: u.user_metadata?.nome || u.email?.split("@")[0] || "",
      telefone: u.phone,
      avatar_url: u.user_metadata?.avatar_url || null,
      role: rolesMap.get(u.id)?.role || u.user_metadata?.role || "user",
      created_at: u.created_at,
      updated_at: u.updated_at,
    }));

    setUsuarios(usuariosListados);
    setLoading(false);
  };

  useEffect(() => {
    carregarUsuarios();
  }, []);

  const usuariosFiltrados = usuarios.filter(u => 
    u.nome.toLowerCase().includes(busca.toLowerCase()) || 
    u.email?.toLowerCase().includes(busca.toLowerCase())
  );

  const excluirUsuario = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir este usuário?")) return;
    await supabase.auth.admin.deleteUser(id);
    toast({ title: "Usuário excluído" });
    carregarUsuarios();
  };

  const roleCores: Record<string, { bg: string; text: string; icon: typeof Shield }> = {
    admin: { bg: "bg-red-500/10", text: "text-red-600", icon: ShieldAlert },
    super_admin: { bg: "bg-purple-500/10", text: "text-purple-600", icon: ShieldCheck },
    manager: { bg: "bg-blue-500/10", text: "text-blue-600", icon: Shield },
    user: { bg: "bg-green-500/10", text: "text-green-600", icon: User },
    viewer: { bg: "bg-gray-500/10", text: "text-gray-600", icon: User },
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestão de Usuários</h1>
        <Button onClick={() => { setUsuarioEditando(null); setMostrarModal(true); }}>
          <Shield className="h-4 w-4 mr-2" /> Novo Usuário
        </Button>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 w-full max-w-md m-4">
            <DialogHeader>
              <DialogTitle>{usuarioEditando ? "Editar Usuário" : "Novo Usuário"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input 
                placeholder="Nome completo *" 
                value={usuarioEditando?.nome || ""} 
                onChange={e => setUsuarioEditando({ ...(usuarioEditando || {}), nome: e.target.value } as Usuario)} 
              />
              <Input 
                placeholder="E-mail *" 
                value={usuarioEditando?.email || ""} 
                onChange={e => setUsuarioEditando({ ...(usuarioEditando || {}), email: e.target.value } as Usuario)} 
                type="email" 
              />
              <Input 
                placeholder="CPF ou CNPJ" 
                value={usuarioEditando?.cpf_cnpj || ""} 
                onChange={e => {
                  const valor = e.target.value.replace(/\D/g, '').slice(0, 14);
                  setUsuarioEditando({ ...((usuarioEditando || {}) as Usuario), cpf_cnpj: valor });
                }} 
                maxLength={14}
              />
              <Input 
                placeholder="Telefone (opcional)" 
                value={usuarioEditando?.telefone || ""} 
                onChange={e => setUsuarioEditando({ ...(usuarioEditando || {}), telefone: e.target.value } as Usuario)} 
                type="tel" 
              />
              <select 
                value={usuarioEditando?.role || "user"} 
                onChange={e => setUsuarioEditando({ ...(usuarioEditando || {}), role: e.target.value } as Usuario)}
                className="w-full border rounded p-2 bg-background"
              >
                <option value="admin">Admin</option>
                <option value="super_admin">Super Admin</option>
                <option value="manager">Gerente</option>
                <option value="user">Usuário</option>
                <option value="viewer">Visualizador</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button onClick={async () => {
                if (!usuarioEditando?.nome || !usuarioEditando?.email) {
                  toast({ title: "Preencha nome e e-mail", variant: "destructive" });
                  return;
                }
                setSaving(true);
                try {
                  if (usuarioEditando.id) {
                    const { error } = await supabase.from("user_roles").update({ 
                      nome: usuarioEditando.nome, 
                      cpf_cnpj: usuarioEditando.cpf_cnpj || null, 
                      role: usuarioEditando.role 
                    }).eq("user_id", usuarioEditando.id);
                    if (error) throw error;
                  } else {
                    const { data: newUser, error: err } = await supabase.auth.admin.createUser({
                      email: usuarioEditando.email,
                      password: "senha_temporaria_123!",
                      email_confirmated: true,
                    });
                    if (err) throw err;
                    await supabase.from("user_roles").insert({
                      user_id: newUser.user.id,
                      nome: usuarioEditando.nome,
                      cpf_cnpj: usuarioEditando.cpf_cnpj || null,
                      role: usuarioEditando.role,
                    });
                  }
                  toast({ title: "Usuário salvo com sucesso!" });
                  setMostrarModal(false);
                  carregarUsuarios();
                } catch (error: any) {
                  toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
                } finally {
                  setSaving(false);
                }
              }} disabled={saving || !usuarioEditando?.nome || !usuarioEditando?.email}>
                {saving ? "Salvando..." : "Salvar"}
              </Button>
              <Button variant="outline" onClick={() => setMostrarModal(false)}>Cancelar</Button>
            </div>
          </div>
        </div>
      )}

      <Input placeholder="Buscar por nome ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-sm" />

      <Card>
        <CardHeader>
          <CardTitle>Usuários ({usuariosFiltrados.length})</CardTitle>
          <CardDescription>Total de {usuariosFiltrados.length} usuário(s) cadastrado(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <div className="space-y-3">
              {usuariosFiltrados.map(u => {
                const { bg, text, icon: Icon } = roleCores[u.role] || roleCores.user;
                return (
                  <div key={u.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{u.nome}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                        <p className="text-xs text-muted-foreground">{u.telefone}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={`${bg} ${text} border-0`}>
                        <Icon className="h-3 w-3 mr-1" />
                        {u.role.replace("_", " ").toUpperCase()}
                      </Badge>
                      <Button variant="ghost" size="sm" onClick={() => { setUsuarioEditando(u); setMostrarModal(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => excluirUsuario(u.id)} className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
