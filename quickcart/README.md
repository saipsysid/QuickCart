# QuickCart — Popular Products Marketplace

A full-stack case study demonstrating React product management and a Node/Express API.

## Concept
QuickCart combines products from multiple stores and companies but intentionally shows a curated selection of popular products. Popularity is represented through ratings, sales/orders and product tags.

## Technologies
- HTML5 — page structure
- CSS3 — responsive layout, cards, animations and drawer
- JavaScript — filtering, sorting and cart logic
- React.js — functional components, state, props, effects, and controlled forms
- Vite — development/build tool
- Node.js and Express — REST API, middleware, events, and asynchronous file I/O
- MongoDB with Mongoose — optional persistent storage and schema validation
- EJS — server-rendered catalog page

## Features
- Responsive modern marketplace UI
- Search products, brands and stores
- Category filtering
- Popular/rating/price sorting
- Product cards with store, rating and popularity information
- Add to cart
- Quantity controls
- Cart drawer and total calculation
- Product create, read, update, and delete with client/server validation
- Browser persistence when the API is offline; JSON-file persistence in the server
- Optional MongoDB storage selected with `MONGO_URI`
- EJS server-rendered catalog at `/catalog`
- Empty-search state
- Responsive mobile layout

## Run
1. Install Node.js and open this folder in a terminal.
2. Run `npm install`.
3. In one terminal, run `npm run server`.
4. In another terminal, run `npm run dev`.
5. Open the local URL shown by Vite.

The Express API listens on port `3001`; Vite proxies `/api` and `/catalog` to it. Without a MongoDB URI, products are persisted asynchronously in `server/data/products.json` and change events are appended to `server/data/events.log`. To use MongoDB instead, set `MONGO_URI` before starting the server; Mongoose creates/validates the product schema and seeds an empty collection from the catalog JSON. The app also runs in browser-only demo mode if the API is stopped.

Useful endpoints: `GET /api/health`, `GET /api/products`, `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id`, and `GET /catalog`.

This is a frontend case-study/demo. The checkout button is intentionally a demo and does not process real payments.
