import { DiscountRule, Review, Specs, StockStatus, Supplier } from "./types.js";

export function calcAvailable(quantities: number[]): number {
    return quantities.reduce((sum, q) => sum + q, 0);
}

export function calcStockStatus(available: number): StockStatus {
    if (available === 0) return "OUT";
    if (available <= 2) return "LOW";
    return "IN_STOCK";
}

export function calcAvgRating(productId: string, reviews: Review[]): number | null {
    const list = reviews.filter((r) => r.productId === productId);
    if (list.length === 0) return null;
    const sum = list.reduce((acc, r) => acc + r.rating, 0);
    return sum / list.length;
}

export function findSupplierName(supplierId: string, suppliers: Supplier[]): string {
    const sup = suppliers.find((s) => s.id === supplierId);
    return sup ? sup.name : "Unknown supplier";
}

export function findDiscountRule(category: string, rules: DiscountRule[]): DiscountRule | null {
    return rules.find((r) => r.category === category) ?? null;
}

export function isDiscountApplicable(rule: DiscountRule, avgRating: number | null): boolean {
    if (rule.minRating === undefined) return true;
    if (avgRating === null) return false;
    return avgRating >= rule.minRating;
}

export function calcDiscountedPrice(price: number, percent: number): number {
    return price * (1 - percent / 100);
}

export function fmtPrice(n: number): string {
    return n.toFixed(2);
}

export function fmtSpecs(specs?: Specs): string | null {
    if (!specs) return null;
    const entries = Object.entries(specs);
    if (entries.length === 0) return null;
    return entries.map(([k, v]) => `${k}=${v}`).join(", ");
}

