import { Product, Supplier, Review, DiscountRule } from "./types.js";
import {
    calcAvailable,
    calcStockStatus,
    calcAvgRating,
    findSupplierName,
    findDiscountRule,
    isDiscountApplicable,
    calcDiscountedPrice,
    fmtPrice,
    fmtSpecs,
} from "./domain.js";



const suppliers: Supplier[] = [
    { id: "s1", name: "Tech Corp" },
    { id: "s2", name: "Book World" },
];

const products: Product[] = [
    {
        id: "p1",
        name: "Laptop Pro",
        category: "Electronics",
        supplierId: "s1",
        price: 1200,
        warehouseQuantities: [2, 1, 0],
        specs: { cpu: "Intel i7", ram: "16GB" },
    },
    {
        id: "p2",
        name: "USB-C Cable",
        category: "Accessories",
        supplierId: "s1",
        price: 9.5,
        warehouseQuantities: [0, 2, 0],
    },
    {
        id: "p3",
        name: "Clean Code",
        category: "Books",
        supplierId: "s2",
        price: 35,
        warehouseQuantities: [0, 0, 0],
    },
];

const reviews: Review[] = [
    { id: "r1", productId: "p1", rating: 5 },
    { id: "r2", productId: "p1", rating: 4 },
    { id: "r3", productId: "p2", rating: 3 },
];

const discountRules: DiscountRule[] = [
    { id: "d1", category: "Electronics", percent: 10, minRating: 4 },
    { id: "d2", category: "Books", percent: 5 },
    { id: "d3", category: "Accessories", percent: 15, minRating: 4.5 },
];

/* -------------------- OUTPUT FORMATTING -------------------- */

function line(label: string, value: string, labelWidth = 12): string {
    return `${label.padEnd(labelWidth, " ")} ${value}`;
}

/* -------------------- REPORT -------------------- */

console.log("=== Store Analytics ===");
console.log("=".repeat(56));

/*Sorting by name */

const sortedProducts = [...products].sort((a, b) => a.name.localeCompare(b.name));

for (const product of sortedProducts) {
    const supplierName = findSupplierName(product.supplierId, suppliers);

    const available = calcAvailable(product.warehouseQuantities);
    const status = calcStockStatus(available);

    const avgRating = calcAvgRating(product.id, reviews);

    const rule = findDiscountRule(product.category, discountRules);
    const specsText = fmtSpecs(product.specs);

    let priceText = fmtPrice(product.price);

    if (rule && isDiscountApplicable(rule, avgRating)) {
        const discounted = calcDiscountedPrice(product.price, rule.percent);
        priceText = `${fmtPrice(product.price)} -> ${fmtPrice(discounted)}`;
    }

    console.log(`\n${product.name} (${product.category})`);
    console.log("-".repeat(56));
    console.log(line("supplier:", supplierName));
    console.log(line("available:", String(available)));
    console.log(line("status:", status));
    console.log(line("rating:", avgRating === null ? "no reviews" : avgRating.toFixed(2)));
    console.log(line("price:", priceText));

    if (specsText) {
        console.log(line("specs:", specsText));
    }

    console.log("");
}


let countOUT = 0;
let countLOW = 0;
let countIN = 0;

let totalAvailable = 0;

let sumBasePrice = 0;
let minPrice = Number.POSITIVE_INFINITY;
let maxPrice = Number.NEGATIVE_INFINITY;

let sumRatings = 0;
let countRatedProducts = 0;

let countDiscounted = 0;

for (const product of sortedProducts) {
    const available = calcAvailable(product.warehouseQuantities);
    const status = calcStockStatus(available);
    totalAvailable += available;

    if (status === "OUT") countOUT++;
    if (status === "LOW") countLOW++;
    if (status === "IN_STOCK") countIN++;

    sumBasePrice += product.price;
    if (product.price < minPrice) minPrice = product.price;
    if (product.price > maxPrice) maxPrice = product.price;

    const avgRating = calcAvgRating(product.id, reviews);
    if (avgRating !== null) {
        sumRatings += avgRating;
        countRatedProducts++;
    }

    const rule = findDiscountRule(product.category, discountRules);
    if (rule && isDiscountApplicable(rule, avgRating)) {
        countDiscounted++;
    }
}

const totalProducts = sortedProducts.length;

const avgBasePrice = totalProducts === 0 ? 0 : sumBasePrice / totalProducts;
const avgRatingAllRated =
    countRatedProducts === 0 ? null : sumRatings / countRatedProducts;

console.log("\n=== Summary ===");
console.table([
    { metric: "products", value: totalProducts },
    { metric: "OUT", value: countOUT },
    { metric: "LOW", value: countLOW },
    { metric: "IN_STOCK", value: countIN },
    { metric: "available", value: totalAvailable },
    { metric: "discounted", value: countDiscounted },
    { metric: "avg price", value: fmtPrice(avgBasePrice) },
    { metric: "min price", value: minPrice === Infinity ? "-" : fmtPrice(minPrice) },
    { metric: "max price", value: maxPrice === -Infinity ? "-" : fmtPrice(maxPrice) },
    {
        metric: "avg rating",
        value: avgRatingAllRated === null ? "no reviews" : avgRatingAllRated.toFixed(2),
    },
]);

