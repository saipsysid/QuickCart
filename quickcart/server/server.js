import express from "express";
import { EventEmitter } from "node:events";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  connectMongo,
  createProduct,
  listProducts,
  removeProduct,
  updateProduct
} from "./productStore.js";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const productEvents = new EventEmitter();
const port = Number(process.env.PORT) || 3001;
const categories = ["Dairy", "Snacks", "Drinks", "Staples", "Instant Food", "Personal Care", "Home Care", "Fruits", "Breakfast"];
const productFields = ["name", "brand", "store", "price", "oldPrice", "rating", "sold", "category", "icon", "tag"];

app.set("view engine", "ejs");
app.set("views", path.join(serverDirectory, "views"));
app.use(express.json({ limit: "20kb" }));
app.use(express.static(path.resolve(serverDirectory, "..", "..", "public")));
app.use((request, response, next) => {
  const startedAt = Date.now();
  response.on("finish", () => {
    console.info(`${request.method} ${request.path} ${response.statusCode} ${Date.now() - startedAt}ms`);
  });
  next();
});

productEvents.on("product:changed", (event) => {
  const logFile = path.join(serverDirectory, "data", "events.log");
  appendFile(logFile, `${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n`, "utf8")
    .catch((error) => console.error("Unable to write product event log:", error));
});

function validateProduct(request, response, next) {
  const body = request.body || {};
  const price = Number(body.price);
  const oldPrice = Number(body.oldPrice);
  const rating = Number(body.rating);
  const valid = body.name?.trim()
    && body.brand?.trim()
    && body.store?.trim()
    && Number.isFinite(price)
    && price > 0
    && Number.isFinite(oldPrice)
    && oldPrice >= price
    && Number.isFinite(rating)
    && rating >= 0
    && rating <= 5
    && categories.includes(body.category);

  if (!valid) return response.status(400).json({ error: "Provide valid product details, pricing, rating, and category." });
  request.product = Object.fromEntries(productFields.map((field) => [field, body[field]]));
  request.product.name = body.name.trim();
  request.product.brand = body.brand.trim();
  request.product.store = body.store.trim();
  request.product.price = price;
  request.product.oldPrice = oldPrice;
  request.product.rating = rating;
  next();
}

function productId(request, response, next) {
  const id = Number(request.params.id);
  if (!Number.isSafeInteger(id) || id < 1) return response.status(400).json({ error: "Product id must be a positive integer." });
  request.productId = id;
  next();
}

app.get("/api/health", (_request, response) => response.json({ status: "ok", storage: process.env.MONGO_URI ? "mongodb" : "json-file" }));

app.get("/api/products", async (_request, response, next) => {
  try {
    response.json(await listProducts());
  } catch (error) {
    next(error);
  }
});

app.post("/api/products", validateProduct, async (request, response, next) => {
  try {
    const product = await createProduct(request.product);
    productEvents.emit("product:changed", { action: "created", productId: product.id, name: product.name });
    response.status(201).json(product);
  } catch (error) {
    next(error);
  }
});

app.put("/api/products/:id", productId, validateProduct, async (request, response, next) => {
  try {
    const product = await updateProduct(request.productId, request.product);
    if (!product) return response.status(404).json({ error: "Product not found." });
    productEvents.emit("product:changed", { action: "updated", productId: product.id, name: product.name });
    response.json(product);
  } catch (error) {
    next(error);
  }
});

app.delete("/api/products/:id", productId, async (request, response, next) => {
  try {
    const product = await removeProduct(request.productId);
    if (!product) return response.status(404).json({ error: "Product not found." });
    productEvents.emit("product:changed", { action: "deleted", productId: product.id, name: product.name });
    response.status(204).end();
  } catch (error) {
    next(error);
  }
});

app.get("/catalog", async (_request, response, next) => {
  try {
    response.render("catalog", { products: await listProducts() });
  } catch (error) {
    next(error);
  }
});

app.use((error, _request, response, _next) => {
  console.error("Request failed:", error);
  response.status(500).json({ error: "The server could not complete the request." });
});

async function startServer() {
  await mkdir(path.join(serverDirectory, "data"), { recursive: true });
  if (process.env.MONGO_URI) await connectMongo(process.env.MONGO_URI);
  app.listen(port, () => console.info(`QuickCart API listening at http://localhost:${port}`));
}

startServer().catch((error) => {
  console.error("QuickCart server failed to start:", error);
  process.exitCode = 1;
});
