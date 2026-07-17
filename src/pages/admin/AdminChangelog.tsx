import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, Send, Plus, Loader2 } from "lucide-react";

type Entry = {
  id: string;
  title: string;
  description: string;
  category: string;
  area: string;
  published_at: string;
};

const CATEGORIES = ["novidade", "melhoria", "correção", "ajuste"];
const AREAS = ["Plataforma", "Admin", "Customer Success", "Academy", "PDA", "PDI", "Comunidade", "Nanda", "Geral"];

const CATEGORY_COLORS: Record<string, string> = {
  novidade: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  melhoria: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  "correção": "bg-blue-500/20 text-blue-300 border-blue-500/30",
  ajuste: "bg-violet-500/20 text-violet-300 border-violet-500/30",
};

export default function AdminChangelog() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("novidade");
  const [area, setArea] = useState("Plataforma");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    (async () => {
      const { data } = await (supabase as any)
        .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      const ok = !!data;
      setIsAdmin(ok);
      if (!ok) navigate("/dashboard");
      else load();
    })();
  }, [user]);

  async function load() {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("platform_changelog")
      .select("*")
      .order("published_at", { ascending: false })
      .limit(200);
    if (error) toast.error("Erro ao carregar changelog");
    setEntries((data as Entry[]) || []);
    setLoading(false);
  }

  async function addEntry() {
    if (!title.trim() || !description.trim()) { toast.error("Preencha título e descrição"); return; }
    const { error } = await (supabase as any).from("platform_changelog").insert({
      title: title.trim(),
      description: description.trim(),
      category, area,
      created_by: user?.id,
    });
    if (error) { toast.error(error.message); return; }
    setTitle(""); setDescription("");
    toast.success("Entrada adicionada");
    load();
  }

  async function removeEntry(id: string) {
    if (!confirm("Remover essa entrada?")) return;
    const { error } = await (supabase as any).from("platform_changelog").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Removida");
    load();
  }

  async function sendNewsletterNow() {
    if (!confirm("Enviar a newsletter agora para todos os @grougp.com.br?")) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-newsletter", { body: {} });
      if (error) throw error;
      toast.success(`Newsletter enviada para ${(data as any)?.sent ?? 0} pessoas`);
    } catch (e: any) {
      toast.error(`Erro: ${e.message || e}`);
    } finally {
      setSending(false);
    }
  }

  async function previewNewsletter() {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("weekly-newsletter", { body: { dryRun: true } });
      if (error) throw error;
      const w = window.open("", "_blank");
      if (w) { w.document.write((data as any).html || ""); w.document.close(); }
    } catch (e: any) {
      toast.error(`Erro: ${e.message || e}`);
    } finally {
      setSending(false);
    }
  }

  if (isAdmin === null) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Novidades da plataforma</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Tudo que for adicionado aqui na semana entra na newsletter de sexta para os @grougp.com.br.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={previewNewsletter} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Pré-visualizar"}
            </Button>
            <Button onClick={sendNewsletterNow} disabled={sending} className="bg-primary">
              {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              Enviar agora
            </Button>
          </div>
        </div>

        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-lg flex items-center gap-2"><Plus className="w-4 h-4" /> Nova entrada</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Título</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Exportação CSV de atividades" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Área</Label>
                <Select value={area} onValueChange={setArea}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AREAS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea
              value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              placeholder="Linguagem leve, explica o que foi feito e o impacto pro usuário."
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={addEntry} className="bg-primary">Adicionar</Button>
          </div>
        </Card>

        <div className="space-y-3">
          <h2 className="font-semibold text-lg">Entradas recentes</h2>
          {loading ? (
            <div className="text-muted-foreground text-sm">Carregando...</div>
          ) : entries.length === 0 ? (
            <div className="text-muted-foreground text-sm">Nenhuma entrada ainda.</div>
          ) : (
            entries.map((e) => (
              <Card key={e.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge variant="outline" className={CATEGORY_COLORS[e.category] || ""}>{e.category}</Badge>
                    <Badge variant="outline">{e.area}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(e.published_at).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground">{e.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{e.description}</p>
                </div>
                <Button size="icon" variant="ghost" onClick={() => removeEntry(e.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
