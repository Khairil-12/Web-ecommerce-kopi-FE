if (typeof window !== "undefined") window.products = {};

async function fetchProductsFromApi() {
  try {
    const API_URL = "http://127.0.0.1:5000/api/products";

    const res = await fetch(API_URL);
    if (!res.ok) {
      throw new Error(`Failed to fetch products: ${res.status}`);
    }

    const payload = await res.json();

    let items = [];
    if (Array.isArray(payload)) items = payload;
    else if (Array.isArray(payload.data)) items = payload.data;
    else if (Array.isArray(payload.products)) items = payload.products;
    else if (payload?.success && Array.isArray(payload.items))
      items = payload.items;

    const mapping = {};

    items.forEach((p) => {
      const id = p.id ?? p.product_id ?? p._id;
      if (!id) return;

      mapping[id] = {
        id: p.id ?? id,
        name: p.name ?? p.title ?? "",
        category: p.category ?? "",
        description: p.description ?? p.short_description ?? "",
        price: p.price ?? 0,
        stock: p.stock ?? p.quantity ?? 0,
        isAvailable: p.is_available ?? p.available ?? true,

        // Optional fields useful for UI
        badges: p.badges ?? [],
        specs: p.specs ?? p.specification ?? p.specifications ?? [],
        weightOptions: p.weightOptions ?? p.weight_options ?? [],
        pricePer: p.pricePer ?? p.price_per ?? "",
        origin: p.origin ?? "",
        roastLevel: p.roast_level ?? p.roastLevel ?? "",
        process: p.process ?? "",

        // ⬇️ LANGSUNG PAKAI PATH LOCAL
        image: p.image_url || p.image || "/img/no-image.png",
      };
    });

    if (typeof window !== "undefined") window.products = mapping;
    return mapping;
  } catch (err) {
    console.warn("fetchProductsFromApi error:", err);
    return {};
  }
}

if (typeof window !== "undefined") {
  window.fetchProductsFromApi = fetchProductsFromApi;
}
