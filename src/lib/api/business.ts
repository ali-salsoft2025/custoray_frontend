import { apiFetch } from "./client";

export type ProductRow = {
  id: string;
  srNo: number;
  sku: string;
  name: string;
  brandId: string | null;
  categoryId: string | null;
  variantId: string | null;
  status: string;
  productStatus: string;
  lifecycle: string;
  stock: number;
  ordersCount: number;
  costPrice: string;
  salePrice: string;
  imageUrls: string[];
  brand?: { name: string } | null;
  category?: { name: string } | null;
  variant?: { name: string } | null;
};

export async function apiListProducts(params?: { page?: number; limit?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetch<{ items: ProductRow[]; total: number }>(`/products${suffix}`);
}

export async function apiCreateProduct(data: Record<string, unknown>) {
  return apiFetch<ProductRow>("/products", { method: "POST", body: JSON.stringify(data) });
}

export async function apiUpdateProduct(id: string, data: Record<string, unknown>) {
  return apiFetch<ProductRow>(`/products/${id}`, { method: "PATCH", body: JSON.stringify(data) });
}

export async function apiDeleteProduct(id: string) {
  return apiFetch<null>(`/products/${id}`, { method: "DELETE" });
}

export async function apiListBuyers(params?: { page?: number; limit?: number; search?: string }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.search) q.set("search", params.search);
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetch<{ items: unknown[]; total: number }>(`/buyers${suffix}`);
}

export async function apiListOrders(params?: { page?: number; limit?: number }) {
  const q = new URLSearchParams();
  if (params?.page) q.set("page", String(params.page));
  if (params?.limit) q.set("limit", String(params.limit));
  const suffix = q.toString() ? `?${q}` : "";
  return apiFetch<{ items: unknown[]; total: number }>(`/orders${suffix}`);
}

export async function apiDashboardSummary() {
  return apiFetch<{
    revenue: number;
    ordersCount: number;
    productsCount: number;
    buyersCount: number;
    lowStockCount: number;
  }>("/dashboard/summary");
}
