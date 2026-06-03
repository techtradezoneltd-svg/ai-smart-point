import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

interface ProductLite {
  id: string;
  name: string;
  sku?: string | null;
  price: number;
  stock: number;
  category?: string | null;
  expiry_date?: string | null;
  location?: string | null;
}

interface CustomerLite {
  name?: string | null;
  preferred_location?: string | null;
}


interface CartLite {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const mode: "suggest" | "command" = body.mode;
    const cart: CartLite[] = body.cart || [];
    const customer: CustomerLite | null = body.customer || null;
    const nowIso = new Date().toISOString().slice(0, 10);
    const preferredLocation = (customer?.preferred_location || "").toString().trim().toLowerCase() || null;

    // Server-side eligibility: only in-stock and not expired
    const rawProducts: ProductLite[] = (body.products || []).slice(0, 200);
    const products: ProductLite[] = rawProducts.filter((p) => {
      if (!p) return false;
      if ((p.stock ?? 0) <= 0) return false;
      if (p.expiry_date) {
        const exp = new Date(p.expiry_date);
        if (!isNaN(exp.getTime()) && exp < new Date(nowIso)) return false;
      }
      return true;
    }).slice(0, 120);

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "suggest") {
      systemPrompt = `You are a smart POS sales assistant. Suggest up to 4 high-impact upsell/cross-sell/bundle items the cashier should offer the customer.

STRICT RULES (do not violate):
- Only pick products from the provided catalog (use exact id).
- Only suggest products with stock > 0 and NOT expired (expiry_date >= today=${nowIso}).
- If a preferred_location is provided, STRONGLY prefer products whose location matches or contains it; if a product has a location that clearly does NOT match, exclude it.
- Prefer complementary items, frequently bundled goods, higher-margin alternatives, quantity upgrades.
- If cart is empty, suggest top general-purpose items that satisfy the rules above.
- Return STRICT JSON only.`;
      userPrompt = JSON.stringify({
        today: nowIso,
        customer: customer ? { name: customer.name, preferred_location: preferredLocation } : null,
        cart: cart.map((c) => ({ name: c.name, qty: c.quantity, price: c.price })),
        products: products.map((p) => ({
          id: p.id, name: p.name, price: p.price, stock: p.stock,
          category: p.category, expiry_date: p.expiry_date || null, location: p.location || null,
        })),
        schema: {
          suggestions: [
            { product_id: "string (must match a catalog id)", reason: "short pitch (<80 chars)" },
          ],
        },
      });
    } else if (mode === "command") {
      const query: string = body.query || "";
      systemPrompt = `You parse natural-language POS cashier commands into structured cart actions. Match products by name fuzzily against the provided catalog and return EXACT product ids. Supported actions: "add" (with qty), "remove", "set_qty", "clear". Numbers in any language ok (deux=2, two=2, ibiri=2). Return STRICT JSON only, no commentary.`;
      userPrompt = JSON.stringify({
        command: query,
        current_cart: cart.map((c) => ({ id: c.id, name: c.name, qty: c.quantity })),
        products: products.map((p) => ({ id: p.id, name: p.name, sku: p.sku })),
        schema: {
          actions: [
            { type: "add|remove|set_qty|clear", product_id: "string|null", quantity: "number|null" },
          ],
          message: "short confirmation to show cashier",
        },
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
      }),
    });

    if (!aiRes.ok) {
      const text = await aiRes.text();
      console.error("AI gateway error", aiRes.status, text);
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI request failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { raw: content };
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("pos-ai-assistant error", err);
    return new Response(JSON.stringify({ error: err.message || "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
