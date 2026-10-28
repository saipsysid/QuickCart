import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import mongoose from "mongoose";

const serverDirectory = path.dirname(fileURLToPath(import.meta.url));
const dataFile = path.join(serverDirectory, "data", "products.json");
let Product;
let writeQueue = Promise.resolve();

const productSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true, trim: true },
  brand: { type: String, required: true, trim: true },
  store: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 1 },
  oldPrice: { type: Number, required: true, min: 1 },
  rating: { type: Number, required: true, min: 0, max: 5 },
  sold: { type: String, default: "0" },
  category: { type: String, required: true },
  icon: { type: String, default: "🛍️" },
  tag: { type: String, default: "Popular" }
}, { timestamps: true, versionKey: false });

async function readFileProducts() {
  return JSON.parse(await readFile(dataFile, "utf8"));
}

async function updateFileProducts(updater) {
  const operation = writeQueue.then(async () => {
    const products = await readFileProducts();
    const { result, nextProducts } = updater(products);
    await writeFile(dataFile, `${JSON.stringify(nextProducts, null, 2)}\n`, "utf8");
    return result;
  });
  writeQueue = operation.catch(() => {});
  return operation;
}

export async function connectMongo(uri) {
  await mongoose.connect(uri);
  Product = mongoose.models.Product || mongoose.model("Product", productSchema);
  if (await Product.countDocuments() === 0) {
    await Product.insertMany(await readFileProducts());
  }
}

export async function listProducts() {
  if (Product) return Product.find().sort({ id: 1 }).lean();
  return readFileProducts();
}

export async function createProduct(product) {
  const id = Date.now();
  if (Product) return Product.create({ ...product, id });
  return updateFileProducts((products) => {
    const created = { ...product, id };
    return { result: created, nextProducts: [created, ...products] };
  });
}

export async function updateProduct(id, product) {
  if (Product) return Product.findOneAndUpdate({ id }, product, { new: true, runValidators: true }).lean();
  return updateFileProducts((products) => {
    const index = products.findIndex((item) => item.id === id);
    if (index === -1) return { result: null, nextProducts: products };
    const updated = { ...products[index], ...product, id };
    const nextProducts = [...products];
    nextProducts[index] = updated;
    return { result: updated, nextProducts };
  });
}

export async function removeProduct(id) {
  if (Product) return Product.findOneAndDelete({ id }).lean();
  return updateFileProducts((products) => {
    const removed = products.find((item) => item.id === id) || null;
    return { result: removed, nextProducts: products.filter((item) => item.id !== id) };
  });
}
