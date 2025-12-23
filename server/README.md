# Fresh Grocer Backend

Simple Express + MongoDB backend for the Fresh Grocer frontend.

Setup

1. Copy `.env.example` to `.env` and adjust values.
2. From this `server` folder run:

```bash
npm install
npm run dev
```

This starts the API server on `http://localhost:5000` by default.

API Endpoints

- `GET /api/products` - list products
- `GET /api/products/:id` - get product
- `POST /api/products` - create product
- `PUT /api/products/:id` - update product
- `DELETE /api/products/:id` - delete product

- `GET /api/categories` - list categories
- `POST /api/categories` - create category
- `PUT /api/categories/:id` - update category
- `DELETE /api/categories/:id` - delete category

- `POST /api/auth/register` - register
- `POST /api/auth/login` - login

Notes

- The frontend expects an environment variable `VITE_API_URL` (defaults to `http://localhost:5000`).
- Use MongoDB running locally or provide a `MONGO_URI` in `.env`.
