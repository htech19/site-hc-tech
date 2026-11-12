import { products, type Product } from "./store-products";

export const slugifyProduct = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/m\.2/g, "m2")
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// Mapa slug -> produto, garantindo unicidade com o id como desempate
const bySlug = new Map<string, Product>();
const slugById = new Map<Product["id"], string>();

for (const product of products) {
  const base = slugifyProduct(product.name) || `produto-${product.id}`;
  const slug = bySlug.has(base) ? `${base}-${product.id}` : base;
  bySlug.set(slug, product);
  slugById.set(product.id, slug);
}

// URLs antigas já publicadas -> slug definitivo atual (redirecionamento, sem quebrar links)
const LEGACY_SLUGS: Record<string, string> = {
  "ssd-msi-240gb": "ssd-msi-spatium-s270-240gb",
  "ssd-bestoss-240gb-m-2-sata": "ssd-bestoss-240gb-m2-sata",
  "ssd-bestoss-480gb-m-2-sata": "ssd-bestoss-480gb-m2-sata",
};

export const getProductSlug = (product: Product) =>
  slugById.get(product.id) ?? slugifyProduct(product.name);

export const getProductPath = (product: Product) => `/produto/${getProductSlug(product)}`;

export const findProductBySlug = (slug?: string) => {
  if (!slug) return undefined;
  const normalized = slugifyProduct(slug);
  return (
    bySlug.get(slug) ??
    bySlug.get(normalized) ??
    bySlug.get(LEGACY_SLUGS[slug] ?? "") ??
    bySlug.get(LEGACY_SLUGS[normalized] ?? "")
  );
};

