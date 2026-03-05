import { Product, Supplier, Review, DiscountRule, Specs } from "./types.js";
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

const LS_KEY = "store_products_v1";

/* ---------- initial data ---------- */
const suppliers: Supplier[] = [
    { id: "s1", name: "Tech Corp" },
    { id: "s2", name: "Book World" },
];

const reviews: Review[] = [
    { id: "r1", productId: "p1", rating: 5 },
    { id: "r2", productId: "p1", rating: 4 },
    { id: "r3", productId: "p2", rating: 3 },
];

const discountRules: DiscountRule[] = [
    { id: "d1", category: "Electronics", percent: 10, minRating: 4 },
    { id: "d2", category: "Books", percent: 5 },
];

const initialProducts: Product[] = [
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
        name: "Clean Code",
        category: "Books",
        supplierId: "s2",
        price: 35,
        warehouseQuantities: [0, 2, 0],
    },
];

/* ---------- helpers ---------- */
function parseQuantities(input: string): number[] {
    // "2,1,0" -> [2,1,0]
    const parts = input.split(",").map((s) => s.trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p));
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
        throw new Error("Quantities must be non-negative numbers");
    }
    return nums;
}

function parseSpecs(input: string): Specs | undefined {
    // "cpu=Intel, ram=16GB" -> {cpu:"Intel", ram:"16GB"}
    const text = input.trim();
    if (!text) return undefined;

    const obj: Record<string, string> = {};
    const pairs = text.split(",").map((s) => s.trim()).filter(Boolean);

    for (const pair of pairs) {
        const [k, ...rest] = pair.split("=").map((x) => x.trim());
        const v = rest.join("=").trim();
        if (!k || !v) throw new Error("Specs format: key=value, key=value");
        obj[k] = v;
    }

    return obj;
}

function uid(prefix = "p"): string {
    return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function isSortBy(value: string): value is "name" | "price" | "available" {
    return value === "name" || value === "price" || value === "available";
}

/* ---------- localStorage ---------- */
function loadProducts(): Product[] {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [...initialProducts];

    try {
        const parsed = JSON.parse(raw) as Product[];
        return Array.isArray(parsed) ? parsed : [...initialProducts];
    } catch {
        return [...initialProducts];
    }
}

function saveProducts(nextProducts: Product[]): void {
    localStorage.setItem(LS_KEY, JSON.stringify(nextProducts));
}

/* ---------- state ---------- */
let products: Product[] = loadProducts();
let query = "";
let sortBy: "name" | "price" | "available" = "name";

/* ---------- render ---------- */
function render(): void {
    const app = document.getElementById("app");
    if (!app) return;

    // filter + sort
    let view = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
    view = [...view].sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "price") return a.price - b.price;
        return calcAvailable(a.warehouseQuantities) - calcAvailable(b.warehouseQuantities);
    });

    app.innerHTML = `
    <div class="row">
      <input id="search" placeholder="Search by name..." value="${escapeHtml(query)}" />
      <select id="sort">
        <option value="name" ${sortBy === "name" ? "selected" : ""}>Sort: name</option>
        <option value="price" ${sortBy === "price" ? "selected" : ""}>Sort: price</option>
        <option value="available" ${sortBy === "available" ? "selected" : ""}>Sort: available</option>
      </select>
      <button id="reset">Reset to initial</button>
    </div>

    <h2>Add product</h2>
    <div class="row">
      <input id="name" placeholder="Name" />
      <input id="category" placeholder="Category (e.g. Books)" />
      <input id="price" placeholder="Price (e.g. 12.99)" />
      <input id="supplierId" placeholder="Supplier ID (s1/s2)" />
      <input id="qty" placeholder="Quantities (e.g. 2,1,0)" />
      <input id="specs" placeholder="Specs (e.g. cpu=i7, ram=16GB) (optional)" />
      <button id="add">Add</button>
    </div>
    <div id="msg" class="muted"></div>

    <h2>Products</h2>
    <div class="grid">
      ${view.map(renderCard).join("")}
    </div>
  `;

    (document.getElementById("search") as HTMLInputElement).addEventListener("input", (e) => {
        const input = e.target as HTMLInputElement;
        query = input.value;
        const caret = input.selectionStart ?? query.length;
        render();
        const nextInput = document.getElementById("search") as HTMLInputElement | null;
        if (nextInput) {
            nextInput.focus();
            nextInput.setSelectionRange(caret, caret);
        }
    });

    (document.getElementById("sort") as HTMLSelectElement).addEventListener("change", (e) => {
        const value = (e.target as HTMLSelectElement).value;
        if (isSortBy(value)) {
            sortBy = value;
        }
        render();
    });

    document.getElementById("reset")!.addEventListener("click", () => {
        products = [...initialProducts];
        saveProducts(products);
        render();
    });

    document.getElementById("add")!.addEventListener("click", () => {
        const msg = document.getElementById("msg")!;
        msg.textContent = "";

        try {
            const name = (document.getElementById("name") as HTMLInputElement).value.trim();
            const category = (document.getElementById("category") as HTMLInputElement).value.trim();
            const priceStr = (document.getElementById("price") as HTMLInputElement).value.trim();
            const supplierId = (document.getElementById("supplierId") as HTMLInputElement).value.trim();
            const qtyStr = (document.getElementById("qty") as HTMLInputElement).value.trim();
            const specsStr = (document.getElementById("specs") as HTMLInputElement).value;

            if (!name) {
                msg.textContent = "Name is required";
                return;
            }
            if (!category) {
                msg.textContent = "Category is required";
                return;
            }
            if (!supplierId) {
                msg.textContent = "Supplier ID is required";
                return;
            }

            const price = Number(priceStr);
            if (!Number.isFinite(price) || price <= 0) {
                msg.textContent = "Price must be a number > 0";
                return;
            }

            const warehouseQuantities = parseQuantities(qtyStr);
            const specs = parseSpecs(specsStr);

            const newProduct: Product = {
                id: uid("p"),
                name,
                category,
                supplierId,
                price,
                warehouseQuantities,
                ...(specs ? { specs } : {}),
            };

            products = [newProduct, ...products];
            saveProducts(products);

            msg.textContent = "Added";
            render();
        } catch (err) {
            msg.textContent = err instanceof Error ? err.message : "Error";
        }
    });

    app.querySelectorAll<HTMLButtonElement>(".delete-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.dataset.id;
            if (!id) return;
            products = products.filter((p) => p.id !== id);
            saveProducts(products);
            render();
        });
    });
}

function renderCard(p: Product): string {
    const available = calcAvailable(p.warehouseQuantities);
    const status = calcStockStatus(available);
    const avgRating = calcAvgRating(p.id, reviews);

    const rule = findDiscountRule(p.category, discountRules);
    const discounted =
        rule && isDiscountApplicable(rule, avgRating)
            ? calcDiscountedPrice(p.price, rule.percent)
            : null;

    const priceText =
        discounted === null
            ? fmtPrice(p.price)
            : `${fmtPrice(p.price)} -> ${fmtPrice(discounted)}`;

    const specsText = fmtSpecs(p.specs) ?? "";

    return `
    <div class="card">
      <div><b>${escapeHtml(p.name)}</b></div>
      <div class="muted">
        ${escapeHtml(p.category)} | supplier: ${escapeHtml(findSupplierName(p.supplierId, suppliers))}
      </div>

      <div style="margin-top:6px">
        <span class="pill">available: ${available}</span>
        <span class="pill">status: ${status}</span>
      </div>

      <div style="margin-top:6px">
        rating: ${avgRating === null ? "no reviews" : avgRating.toFixed(2)}
      </div>

      <div>price: ${priceText}</div>

      ${specsText ? `<div class="muted">specs: ${escapeHtml(specsText)}</div>` : ""}

      <div style="margin-top:8px">
        <button class="delete-btn" data-id="${p.id}">Delete</button>
      </div>
    </div>
  `;
}

function escapeHtml(s: string): string {
    return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* ---------- start ---------- */
render();

