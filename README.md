# Store Web (TypeScript)

Interactive web app for product management:
- shows a product list;
- allows adding and deleting products;
- calculates stock status (`OUT`, `LOW`, `IN_STOCK`);
- supports search and sorting;
- saves data to `localStorage` and restores it after page refresh.

## Tech Stack
- TypeScript
- Vanilla JavaScript (DOM)
- HTML/CSS
- IDE WebStorm

## Run
```bash
npm install
npm run build
npx serve
Ok to proceed? (y) y
```

Then open `index.html` in a browser.

## Project Structure
```text
src/
  app.ts      # main logic, UI render, localStorage
  domain.ts   # business logic and calculations
  types.ts    # TypeScript types
dist/
  app.js      # compiled browser file
index.html    # app page
```

## LocalStorage
- Key: `store_products_v1`
- Load: `loadProducts()`
- Save: `saveProducts()`
- Save is triggered on add, delete, and reset.

## AI Usage

During the development of this project, AI tools were used as an assistant for understanding tasks, generating code structure, and debugging.

The following AI tools were used:

ChatGPT (OpenAI) – for explanations, TypeScript examples, and debugging assistance.

Example Prompts Used

Below are examples of prompts used during development.

### Understanding the task
"Explain how to implement a TypeScript console application that generates a store analytics report.
The report should calculate available stock, average rating, discount rules, and display specifications if available."

### Designing TypeScript types
Help me design TypeScript interfaces for a store project including products, suppliers, reviews, warehouse quantities, and discount rules.

### Implementing calculations
Write TypeScript functions to calculate:
- total available stock from warehouse quantities
- stock status (OUT, LOW, IN_STOCK)
- average product rating
- discounted price based on category and minimum rating.

### Building the web interface
Create a simple TypeScript web application that:
- displays a list of products
- allows adding new products
- calculates stock status
- supports filtering and sorting
- saves data in LocalStorage.

### UI and DOM rendering
Generate TypeScript code that dynamically renders product cards in the DOM
and displays product information including rating, price, stock status, and specifications.

### Debugging
Help debug a TypeScript web application where product deletion and LocalStorage updates are not working correctly.


## Note
UI is generated dynamically inside `render()`, but currently via `innerHTML` template strings.
