import { products, type Product } from "./store-products";

export const slugifyProduct = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
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

export const getProductSlug = (product: Product) =>
  slugById.get(product.id) ?? slugifyProduct(product.name);

export const getProductPath = (product: Product) => `/produto/${getProductSlug(product)}`;

export const findProductBySlug = (slug?: string) => {
  if (!slug) return undefined;
  return bySlug.get(slug) ?? bySlug.get(slugifyProduct(slug));
};
