// src/types.ts

// Чтобы не путаться в строках
export type ID = string;

// Категории можно оставить строкой (гибко) или сделать union, если список фиксирован
export type Category = string;

// Статус склада по правилам задания
export type StockStatus = "OUT" | "LOW" | "IN_STOCK";

// Specs: key=value пары (cpu=..., ram=...)
export type Specs = Record<string, string>;

// Поставщик
export interface Supplier {
    id: ID;
    name: string;
}

// Отзыв (если хочешь хранить пользователя — можно добавить author)
export interface Review {
    id: ID;
    productId: ID;
    rating: number; // обычно 1..5
    comment?: string;
    createdAt?: string; // ISO строка, опционально
}

// Правило скидки по категории
export interface DiscountRule {
    id: ID;
    category: Category;
    percent: number;      // например 10 = -10%
    minRating?: number;   // если задано, скидка только при avgRating >= minRating
}

// Товар
export interface Product {
    id: ID;
    name: string;
    category: Category;
    supplierId: ID;
    price: number;                 // базовая цена
    warehouseQuantities: number[]; // остатки по складам, например [2,0,5]
    specs?: Specs;                 // если нет — поле отсутствует
}

// Полезный тип для готового отчёта (то, что ты вычисляешь)
export interface ProductAnalytics {
    product: Product;
    supplier: Supplier | null;

    available: number;
    stockStatus: StockStatus;

    avgRating: number | null;      // null => "no reviews"
    discountRule: DiscountRule | null;

    discountedPrice: number | null; // null => скидка не применена
}

// Общий контейнер данных (удобно для хранения в одном месте)
export interface StoreData {
    products: Product[];
    suppliers: Supplier[];
    reviews: Review[];
    discountRules: DiscountRule[];
}