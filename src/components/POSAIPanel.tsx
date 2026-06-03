import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Send, Loader2, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/hooks/useCurrency";

interface ProductLike {
  id: string;
  name: string;
  sku: string;
  selling_price: number;
  current_stock: number;
  categories?: { name: string } | null;
  is_active: boolean;
  image_url?: string | null;
}

interface CartItemLike {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Suggestion {
  product_id: string;
  reason: string;
}

interface AIAction {
  type: "add" | "remove" | "set_qty" | "clear";
  product_id?: string | null;
  quantity?: number | null;
}

interface POSAIPanelProps {
  cart: CartItemLike[];
  products: ProductLike[];
  onAdd: (product: ProductLike, qty?: number) => void;
  onSetQty: (productId: string, qty: number) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
}

const POSAIPanel: React.FC<POSAIPanelProps> = ({
  cart,
  products,
  onAdd,
  onSetQty,
  onRemove,
  onClear,
}) => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const productMap = new Map(products.map((p) => [p.id, p]));

  const compactProducts = () =>
    products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.selling_price,
      stock: p.current_stock,
      category: p.categories?.name || null,
    }));

  const fetchSuggestions = async () => {
    if (products.length === 0) return;
    setLoadingSuggest(true);
    try {
      const { data, error } = await supabase.functions.invoke("pos-ai-assistant", {
        body: { mode: "suggest", cart, products: compactProducts() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const list: Suggestion[] = (data?.suggestions || []).filter((s: Suggestion) =>
        productMap.has(s.product_id)
      );
      setSuggestions(list.slice(0, 4));
    } catch (e: any) {
      // silent; suggestions are non-critical
      console.warn("AI suggest failed", e?.message);
    } finally {
      setLoadingSuggest(false);
    }
  };

  // Debounced re-fetch on cart change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(), 700);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart.length, cart.map((c) => `${c.id}:${c.quantity}`).join("|"), products.length]);

  const applyActions = (actions: AIAction[]) => {
    let applied = 0;
    for (const a of actions || []) {
      if (a.type === "clear") {
        onClear();
        applied++;
        continue;
      }
      if (!a.product_id) continue;
      const product = productMap.get(a.product_id);
      if (!product) continue;
      if (a.type === "add") {
        const qty = Math.max(1, a.quantity || 1);
        for (let i = 0; i < qty; i++) onAdd(product);
        applied++;
      } else if (a.type === "remove") {
        onRemove(product.id);
        applied++;
      } else if (a.type === "set_qty") {
        const qty = Math.max(0, a.quantity ?? 0);
        onSetQty(product.id, qty);
        applied++;
      }
    }
    return applied;
  };

  const runCommand = async () => {
    const q = query.trim();
    if (!q) return;
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke("pos-ai-assistant", {
        body: { mode: "command", query: q, cart, products: compactProducts() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const actions: AIAction[] = data?.actions || [];
      const applied = applyActions(actions);
      toast({
        title: applied > 0 ? "AI applied" : "Nothing changed",
        description: data?.message || `${applied} action(s) applied`,
      });
      setQuery("");
    } catch (e: any) {
      toast({
        title: "AI error",
        description: e?.message || "Could not run command",
        variant: "destructive",
      });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="border-t border-border bg-muted/30 shrink-0">
      {/* Suggestions */}
      <div className="px-3 py-2 space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            AI Suggestions
          </div>
          {loadingSuggest && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
        </div>
        {suggestions.length === 0 && !loadingSuggest ? (
          <p className="text-[10px] text-muted-foreground italic">
            {cart.length === 0 ? "Add items to see smart suggestions" : "No suggestions right now"}
          </p>
        ) : (
          <div className="space-y-1">
            {suggestions.map((s) => {
              const p = productMap.get(s.product_id);
              if (!p) return null;
              return (
                <button
                  key={s.product_id}
                  onClick={() => onAdd(p)}
                  className="w-full text-left flex items-center gap-2 p-1.5 rounded border bg-card hover:bg-accent transition group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium truncate">{p.name}</span>
                      <Badge variant="secondary" className="h-4 text-[9px] px-1">
                        {formatCurrency(p.selling_price)}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">{s.reason}</p>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-primary opacity-60 group-hover:opacity-100" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* NL Command */}
      <div className="px-3 pb-2 pt-1 border-t border-border/50">
        <div className="flex items-center gap-1.5">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                runCommand();
              }
            }}
            placeholder='e.g. "add 2 cokes and remove bread"'
            disabled={running}
            className="h-8 text-xs"
          />
          <Button
            size="sm"
            onClick={runCommand}
            disabled={running || !query.trim()}
            className="h-8 px-2"
            title="Run AI command"
          >
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default POSAIPanel;
