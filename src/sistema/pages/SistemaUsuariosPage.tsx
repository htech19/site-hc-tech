import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { Shield, User, ShieldCheck, ShieldAlert, Trash2, Pencil } from "lucide-react";

type Usuario = {
  id: string;
  email: string | null;
  nome: string;
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