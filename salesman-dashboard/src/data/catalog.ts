import { Product } from '../domain/types';
export const PRODUCTS: Product[] = [];
export const productMap = new Map<string, Product>();
export function setCatalog(products: Product[]) {
  PRODUCTS.splice(0, PRODUCTS.length, ...products);
  productMap.clear(); products.forEach(p => productMap.set(p.id, p));
}
