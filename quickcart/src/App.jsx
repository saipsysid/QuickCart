import { useEffect, useMemo, useState } from "react";

const initialProducts = [
  { id: 1, name: "Amul Taaza Milk", brand: "Amul", store: "FreshMart", price: 31, oldPrice: 34, rating: 4.8, sold: "12k+", category: "Dairy", icon: "🥛", tag: "Bestseller" },
  { id: 2, name: "Lay's Classic Salted", brand: "Lay's", store: "Daily Needs", price: 20, oldPrice: 20, rating: 4.7, sold: "18k+", category: "Snacks", icon: "🥔", tag: "Popular" },
  { id: 3, name: "Coca-Cola", brand: "Coca-Cola", store: "SuperSave", price: 40, oldPrice: 45, rating: 4.8, sold: "15k+", category: "Drinks", icon: "🥤", tag: "Top Rated" },
  { id: 4, name: "Aashirvaad Atta 5kg", brand: "Aashirvaad", store: "FreshMart", price: 275, oldPrice: 299, rating: 4.7, sold: "9k+", category: "Staples", icon: "🌾", tag: "Value Pick" },
  { id: 5, name: "Maggi 2-Minute Noodles", brand: "Nestlé", store: "Daily Needs", price: 58, oldPrice: 65, rating: 4.9, sold: "25k+", category: "Instant Food", icon: "🍜", tag: "Bestseller" },
  { id: 6, name: "Dove Daily Shine Shampoo", brand: "Dove", store: "CarePlus", price: 199, oldPrice: 235, rating: 4.6, sold: "7k+", category: "Personal Care", icon: "🧴", tag: "Popular" },
  { id: 7, name: "Fortune Sunflower Oil 1L", brand: "Fortune", store: "SuperSave", price: 145, oldPrice: 160, rating: 4.7, sold: "8k+", category: "Staples", icon: "🫗", tag: "Top Rated" },
  { id: 8, name: "Cadbury Dairy Milk", brand: "Cadbury", store: "Daily Needs", price: 90, oldPrice: 100, rating: 4.9, sold: "21k+", category: "Snacks", icon: "🍫", tag: "Bestseller" },
  { id: 9, name: "Red Bull Energy Drink", brand: "Red Bull", store: "SuperSave", price: 125, oldPrice: 135, rating: 4.6, sold: "6k+", category: "Drinks", icon: "⚡", tag: "Popular" },
  { id: 10, name: "Surf Excel Matic", brand: "Surf Excel", store: "CarePlus", price: 349, oldPrice: 399, rating: 4.5, sold: "5k+", category: "Home Care", icon: "🧺", tag: "Value Pick" },
  { id: 11, name: "Banana - Robusta", brand: "Farm Fresh", store: "FreshMart", price: 55, oldPrice: 65, rating: 4.7, sold: "11k+", category: "Fruits", icon: "🍌", tag: "Fresh Pick" },
  { id: 12, name: "Kissan Mixed Fruit Jam", brand: "Kissan", store: "SuperSave", price: 115, oldPrice: 130, rating: 4.6, sold: "4k+", category: "Breakfast", icon: "🍓", tag: "Popular" }
];

const categories = [
  ["All", "✨"], ["Dairy", "🥛"], ["Snacks", "🍿"], ["Drinks", "🥤"],
  ["Staples", "🌾"], ["Instant Food", "🍜"], ["Personal Care", "🧴"],
  ["Home Care", "🧺"], ["Fruits", "🍌"], ["Breakfast", "🍓"]
];

function App() {
  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [products, setProducts] = useState(() => {
    try {
      const savedProducts = JSON.parse(localStorage.getItem("quickcart-products"));
      return Array.isArray(savedProducts) ? savedProducts : initialProducts;
    } catch {
      return initialProducts;
    }
  });
  const [sort, setSort] = useState("popular");
  const [showCart, setShowCart] = useState(false);
  const [notice, setNotice] = useState("");
  const [showManager, setShowManager] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [apiStatus, setApiStatus] = useState("checking");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState(emptyProductForm);

  useEffect(() => {
    localStorage.setItem("quickcart-products", JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    let active = true;
    fetch("/api/products")
      .then((response) => {
        if (!response.ok) throw new Error("Product API is unavailable");
        return response.json();
      })
      .then((data) => {
        if (active && Array.isArray(data)) {
          setProducts(data);
          setApiStatus("online");
        }
      })
      .catch(() => {
        if (active) setApiStatus("offline");
      });
    return () => { active = false; };
  }, []);

  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesCategory = category === "All" || p.category === category;
      const text = `${p.name} ${p.brand} ${p.store} ${p.category}`.toLowerCase();
      return matchesCategory && text.includes(search.toLowerCase());
    });

    if (sort === "priceLow") result.sort((a, b) => a.price - b.price);
    if (sort === "priceHigh") result.sort((a, b) => b.price - a.price);
    if (sort === "rating") result.sort((a, b) => b.rating - a.rating);

    return result;
  }, [category, products, search, sort]);

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...current, { ...product, qty: 1 }];
    });
    setNotice(`${product.name} added to cart`);
    setTimeout(() => setNotice(""), 1800);
  }

  function changeQty(id, amount) {
    setCart((current) =>
      current
        .map((item) => item.id === id ? { ...item, qty: item.qty + amount } : item)
        .filter((item) => item.qty > 0)
    );
  }

  function startCreate() {
    setEditingProduct(null);
    setForm(emptyProductForm());
    setFormError("");
  }

  function startEdit(product) {
    setEditingProduct(product);
    setForm({
      ...product,
      price: String(product.price),
      oldPrice: String(product.oldPrice),
      rating: String(product.rating)
    });
    setFormError("");
  }

  async function saveProduct(event) {
    event.preventDefault();
    const price = Number(form.price);
    const oldPrice = Number(form.oldPrice);
    const rating = Number(form.rating);
    if (!form.name.trim() || !form.brand.trim() || !form.store.trim()) {
      setFormError("Product, brand, and store are required.");
      return;
    }
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(oldPrice) || oldPrice < price) {
      setFormError("Enter a valid price and an original price equal to or higher than it.");
      return;
    }
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
      setFormError("Rating must be between 0 and 5.");
      return;
    }

    const product = {
      ...form,
      id: editingProduct?.id ?? Date.now(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      store: form.store.trim(),
      price,
      oldPrice,
      rating,
      sold: form.sold.trim() || "0",
      icon: form.icon.trim() || "🛍️"
    };
    const method = editingProduct ? "PUT" : "POST";
    const endpoint = editingProduct ? `/api/products/${product.id}` : "/api/products";
    let savedProduct = product;
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(product)
      });
      if (!response.ok) throw new Error("The API could not save this product.");
      savedProduct = await response.json();
    } catch {
      setApiStatus("offline");
    }
    setProducts((current) => editingProduct
      ? current.map((item) => item.id === editingProduct.id ? savedProduct : item)
      : [savedProduct, ...current]);
    setShowManager(false);
    setNotice(`${product.name} ${editingProduct ? "updated" : "added"}`);
    window.setTimeout(() => setNotice(""), 1800);
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    try {
      const response = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("The API could not delete this product.");
    } catch {
      setApiStatus("offline");
    }
    setProducts((current) => current.filter((item) => item.id !== product.id));
    setCart((current) => current.filter((item) => item.id !== product.id));
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="nav-inner">
          <div className="logo">
            <span className="logo-mark">Q</span>
            <div><strong>quick<span>cart</span></strong><small>Popular picks. Multiple stores.</small></div>
          </div>

          <div className="location">
            <span>📍</span>
            <div><small>Deliver to</small><b>Hyderabad, Telangana</b></div>
          </div>

          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search popular products, brands or stores..."
            />
            {search && <button onClick={() => setSearch("")}>×</button>}
          </div>

          <button className="cart-button" onClick={() => setShowCart(true)}>
            🛒 <span>Cart</span>
            {cartCount > 0 && <em>{cartCount}</em>}
          </button>
          <button className="manage-button" onClick={() => { startCreate(); setShowManager(true); }}>
            Manage products
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">SMART SHOPPING, LESS SCROLLING</span>
          <h1>Only the products<br /><span>people love.</span></h1>
          <p>We bring together popular products from trusted stores and brands — so you don't have to compare thousands of listings.</p>
          <button className="hero-btn" onClick={() => document.getElementById("products").scrollIntoView({ behavior: "smooth" })}>
            Explore popular picks <span>→</span>
          </button>
          <div className="trust-row">
            <span>✓ Verified stores</span><span>✓ Popularity ranked</span><span>✓ Fast delivery</span>
          </div>
        </div>
        <div className="hero-art">
          <div className="orbit orbit-one"></div>
          <div className="orbit orbit-two"></div>
          <div className="hero-bag">🛍️</div>
          <div className="float-card card-a">⭐ 4.9<br /><small>Top rated</small></div>
          <div className="float-card card-b">🔥 25k+<br /><small>Orders</small></div>
          <div className="float-card card-c">⚡ Fast<br /><small>Delivery</small></div>
        </div>
      </section>

      <main id="products" className="content">
        <div className="section-head">
          <div>
            <span className="section-label">CURATED FOR YOU</span>
            <h2>Popular right now</h2>
            <p>Products selected using ratings, orders and customer demand.</p>
            <span className={`api-status ${apiStatus}`}><i />{apiStatus === "online" ? "Express API connected" : apiStatus === "checking" ? "Connecting to API…" : "Local demo mode · changes saved in this browser"}</span>
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="popular">Sort: Popular</option>
            <option value="rating">Highest rated</option>
            <option value="priceLow">Price: Low to high</option>
            <option value="priceHigh">Price: High to low</option>
          </select>
        </div>

        <div className="categories">
          {categories.map(([name, icon]) => (
            <button key={name} className={category === name ? "active" : ""} onClick={() => setCategory(name)}>
              <span>{icon}</span>{name}
            </button>
          ))}
        </div>

        <div className="result-line">
          <span><b>{filteredProducts.length}</b> popular products found</span>
          {search && <span>Searching for “{search}”</span>}
        </div>

        <div className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              <div className="product-visual">
                <span className="product-tag">{product.tag}</span>
                <div className="product-icon">{product.icon}</div>
                <span className="heart">♡</span>
              </div>
              <div className="product-info">
                <div className="brand-row"><span>{product.brand}</span><span>• {product.store}</span></div>
                <h3>{product.name}</h3>
                <div className="rating-row">
                  <span className="rating">★ {product.rating}</span>
                  <span>{product.sold} sold</span>
                </div>
                <div className="price-row">
                  <div><b>₹{product.price}</b><del>₹{product.oldPrice}</del></div>
                  <button onClick={() => addToCart(product)}>ADD</button>
                </div>
                <button className="edit-product" onClick={() => { startEdit(product); setShowManager(true); }}>Edit product</button>
              </div>
            </article>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="empty">
            <div>🔎</div><h3>No popular products found</h3><p>Try another product, brand or category.</p>
            <button onClick={() => { setSearch(""); setCategory("All"); }}>Clear filters</button>
          </div>
        )}
      </main>

      <section className="why">
        <div><span>01</span><h3>Multiple stores</h3><p>Products from FreshMart, Daily Needs, SuperSave and more in one place.</p></div>
        <div><span>02</span><h3>Popularity first</h3><p>We prioritize products customers actually buy, rate and reorder.</p></div>
        <div><span>03</span><h3>Less decision fatigue</h3><p>Skip endless listings and discover a focused selection of proven picks.</p></div>
      </section>

      <footer>
        <div className="footer-logo">quick<span>cart</span></div>
        <p>A case-study frontend for a multi-store popular-product marketplace.</p>
        <span>© 2026 QuickCart</span>
      </footer>

      {notice && <div className="toast">✓ {notice}</div>}

      {showManager && (
        <div className="overlay manager-overlay" onClick={() => setShowManager(false)}>
          <section className="manager-panel" role="dialog" aria-modal="true" aria-labelledby="manager-title" onClick={(event) => event.stopPropagation()}>
            <div className="drawer-head">
              <div><span className="section-label">PRODUCT CRUD</span><h2 id="manager-title">{editingProduct ? "Edit product" : "Add a product"}</h2></div>
              <button onClick={() => setShowManager(false)} aria-label="Close product manager">×</button>
            </div>
            <p className="manager-intro">Create, update, and remove products from the QuickCart catalog.</p>
            <form className="product-form" onSubmit={saveProduct}>
              <label>Product name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Organic oats" /></label>
              <div className="form-row">
                <label>Brand<input required value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} placeholder="Brand" /></label>
                <label>Store<input required value={form.store} onChange={(event) => setForm({ ...form, store: event.target.value })} placeholder="Store" /></label>
              </div>
              <div className="form-row">
                <label>Price (₹)<input type="number" min="1" step="1" required value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} /></label>
                <label>Original price (₹)<input type="number" min="1" step="1" required value={form.oldPrice} onChange={(event) => setForm({ ...form, oldPrice: event.target.value })} /></label>
              </div>
              <div className="form-row">
                <label>Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{categories.slice(1).map(([name]) => <option key={name}>{name}</option>)}</select></label>
                <label>Rating (0–5)<input type="number" min="0" max="5" step="0.1" required value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} /></label>
              </div>
              <div className="form-row">
                <label>Badge<input value={form.tag} onChange={(event) => setForm({ ...form, tag: event.target.value })} placeholder="Popular" /></label>
                <label>Product emoji<input value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} placeholder="🛍️" /></label>
              </div>
              {formError && <p className="form-error" role="alert">{formError}</p>}
              <button className="save-product" type="submit">{editingProduct ? "Save changes" : "Add product"}</button>
            </form>
            <div className="manager-list">
              <h3>Catalog products <span>{products.length}</span></h3>
              {products.map((product) => (
                <div className="manage-row" key={product.id}>
                  <span>{product.icon}</span><div><b>{product.name}</b><small>{product.brand} · ₹{product.price}</small></div>
                  <button onClick={() => startEdit(product)}>Edit</button>
                  <button className="delete-product" onClick={() => deleteProduct(product)} aria-label={`Delete ${product.name}`}>Delete</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {showCart && (
        <div className="overlay" onClick={() => setShowCart(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-head"><div><span className="section-label">YOUR BAG</span><h2>Shopping cart</h2></div><button onClick={() => setShowCart(false)}>×</button></div>
            {cart.length === 0 ? (
              <div className="cart-empty"><div>🛒</div><h3>Your cart is empty</h3><p>Add some popular picks to get started.</p></div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <span className="cart-icon">{item.icon}</span>
                      <div className="cart-detail"><b>{item.name}</b><small>{item.brand} · ₹{item.price}</small>
                        <div className="qty"><button onClick={() => changeQty(item.id, -1)}>−</button><span>{item.qty}</span><button onClick={() => changeQty(item.id, 1)}>+</button></div>
                      </div>
                      <strong>₹{item.price * item.qty}</strong>
                    </div>
                  ))}
                </div>
                <div className="checkout"><div><span>Total</span><b>₹{cartTotal}</b></div><button onClick={() => alert("Demo checkout — order flow can be connected to a backend.")}>Proceed to checkout →</button></div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;

function emptyProductForm() {
  return {
    name: "",
    brand: "",
    store: "",
    price: "",
    oldPrice: "",
    rating: "4.5",
    sold: "0",
    category: "Dairy",
    icon: "🛍️",
    tag: "Popular"
  };
}
