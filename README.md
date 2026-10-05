# Pooja Store API

Private wholesale ordering API for approved store owners. Customer signup and payment processing are intentionally out of scope.

## Setup with local PostgreSQL

The API needs PostgreSQL running at `localhost:5432`. The current `.env` is configured for the local PostgreSQL service with database `pooja_store`, user `postgres`, and port `5432`.

1. Start the PostgreSQL Windows service if needed:

   ```powershell
   Get-Service postgresql-x64-18
   Start-Service postgresql-x64-18
   ```

2. Install dependencies and generate Prisma Client:

   ```powershell
   npm install
   npm run prisma:generate
   ```

3. Create the database tables:

   ```powershell
   npx prisma migrate dev
   ```

4. Create the development admin and store-owner users:

   ```powershell
   npm run prisma:seed
   ```

5. Start the API in a separate PowerShell window:

   ```powershell
   npm run dev
   ```

Docker is optional. If local PostgreSQL is unavailable, `docker compose up -d` starts a PostgreSQL container using the same connection settings.

The API listens on `http://localhost:4000` by default.

## Development credentials

The development seed reads these values from `.env`:

- Admin: `SEED_ADMIN_PHONE` and `SEED_ADMIN_PASSWORD`
- Store owner: `SEED_STORE_OWNER_PHONE` and `SEED_STORE_OWNER_PASSWORD`

These are development-only credentials. Change or remove them and replace `JWT_SECRET` before production. Never commit `.env` or plaintext passwords into source code.

## Endpoints

- `GET /health`
- `POST /api/auth/login` with `{ "phone": "9876543210", "password": "password" }`
- `GET /api/auth/me` with `Authorization: Bearer <accessToken>`
- `PATCH /api/auth/change-password` changes the authenticated user's password.
- `GET /api/profile` returns the authenticated user's safe profile and store information.
- `PATCH /api/profile` updates name and store/delivery fields for the authenticated user.
- `GET /api/products` returns active products for authenticated users. Admins also receive inactive products.
- `GET /api/products/:id` returns one active product for store owners, or any product for admins.
- `GET /api/products/categories` returns categories that contain at least one active product.
- `POST /api/products` creates a product. Requires `ADMIN`.
- `PATCH /api/products/:id` updates a product. Requires `ADMIN`.
- `DELETE /api/products/:id` deactivates a product by setting `isActive` to `false`. Requires `ADMIN`.
- `POST /api/orders` creates an order for the authenticated store owner and deducts inventory transactionally.
- `GET /api/orders` returns only the authenticated user's orders, newest first.
- `GET /api/orders/:id` returns one order only when it belongs to the authenticated user.
- `GET /api/inventory/:productId/history` returns inventory history. Requires `ADMIN`.

Product creation and updates validate that `price > 0`, `stockQuantity >= 0`,
`minimumOrderQuantity >= 1`, the category exists, and
`minimumOrderQuantity <= stockQuantity`. Product responses include:

```json
{
  "success": true,
  "products": [
    {
      "id": "product-id",
      "name": "Kumkum",
      "description": "Premium Kumkum",
      "price": 80,
      "stockQuantity": 100,
      "minimumOrderQuantity": 10,
      "unit": "packet",
      "imageUrl": null,
      "isActive": true,
      "category": { "id": "category-id", "name": "Kumkum" }
    }
  ]
}
```

Store owners can only read active products and categories. Product mutation
endpoints return HTTP 403 for store owners. `DELETE` is a soft delete so
existing product references are preserved.

Order creation accepts only product IDs and quantities:

```json
{
  "items": [{ "productId": "product-id", "quantity": 10 }]
}
```

The backend retrieves current prices, stock, MOQ, and active status inside a
Serializable PostgreSQL transaction. It creates an order, snapshots product
name and price in order items, atomically deducts stock, and records an
`ORDER` inventory transaction with a negative quantity. Invalid MOQ, inactive
products, insufficient stock, and duplicate product IDs are rejected. The
authenticated JWT subject owns the order; `userId`, prices, totals, and stock
values from the client are ignored.

Authentication failures do not reveal whether a phone number exists. Passwords are stored only as Argon2 hashes.

## Test the API with PowerShell

Keep `npm run dev` running in one terminal. Open a second terminal in the `backend` folder.

Check that the API is alive:

```powershell
Invoke-RestMethod http://localhost:4000/health | ConvertTo-Json
```

Log in with the seeded store-owner account. Replace the placeholder values with the values in your local `.env`:

```powershell
$login = Invoke-RestMethod -Method Post `
	-Uri http://localhost:4000/api/auth/login `
	-ContentType 'application/json' `
	-Body (@{ phone = '<SEED_STORE_OWNER_PHONE>'; password = '<SEED_STORE_OWNER_PASSWORD>' } | ConvertTo-Json)

$login | ConvertTo-Json -Depth 5
$token = $login.data.accessToken
```

The response should contain `success: true`, an `accessToken`, and a user with role `STORE_OWNER`.

Test the protected endpoint with that token:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/api/auth/me `
	-Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 5
```

Test an invalid password. It should return HTTP 401 with code `INVALID_CREDENTIALS`:

```powershell
try {
	Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login `
		-ContentType 'application/json' `
		-Body (@{ phone = '<SEED_STORE_OWNER_PHONE>'; password = 'wrong-password' } | ConvertTo-Json)
} catch {
	$_.ErrorDetails.Message
}
```

### Read products as a store owner

Use the `$token` created by the login example above:

```powershell
$products = Invoke-RestMethod -Uri http://localhost:4000/api/products `
	-Headers @{ Authorization = "Bearer $token" }

$products | ConvertTo-Json -Depth 6
```

Read the available categories:

```powershell
Invoke-RestMethod -Uri http://localhost:4000/api/products/categories `
	-Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 5
```

Read one product:

```powershell
$productId = $products.products[0].id
Invoke-RestMethod -Uri "http://localhost:4000/api/products/$productId" `
	-Headers @{ Authorization = "Bearer $token" } | ConvertTo-Json -Depth 6
```

### Admin product management

Log in with the seeded admin credentials to obtain an admin token:

```powershell
$adminLogin = Invoke-RestMethod -Method Post `
	-Uri http://localhost:4000/api/auth/login `
	-ContentType 'application/json' `
	-Body (@{ phone = '<SEED_ADMIN_PHONE>'; password = '<SEED_ADMIN_PASSWORD>' } | ConvertTo-Json)

$adminToken = $adminLogin.data.accessToken
$adminHeaders = @{ Authorization = "Bearer $adminToken" }
```

Create a product. `categoryId` must belong to an existing category, and the
MOQ cannot be greater than the stock quantity:

```powershell
$categories = Invoke-RestMethod -Uri http://localhost:4000/api/products/categories `
	-Headers $adminHeaders
$categoryId = $categories.categories[0].id

$newProduct = Invoke-RestMethod -Method Post `
	-Uri http://localhost:4000/api/products `
	-Headers $adminHeaders `
	-ContentType 'application/json' `
	-Body (@{
		categoryId = $categoryId
		name = 'Test Kumkum'
		description = 'Wholesale test product'
		price = 80
		stockQuantity = 100
		minimumOrderQuantity = 10
		unit = 'packet'
		imageUrl = $null
	} | ConvertTo-Json)

$newProduct | ConvertTo-Json -Depth 6
$newProductId = $newProduct.product.id
```

Update stock, price, or MOQ:

```powershell
Invoke-RestMethod -Method Patch `
	-Uri "http://localhost:4000/api/products/$newProductId" `
	-Headers $adminHeaders `
	-ContentType 'application/json' `
	-Body (@{ stockQuantity = 150; minimumOrderQuantity = 10 } | ConvertTo-Json) |
	ConvertTo-Json -Depth 6
```

Deactivate the product without permanently deleting it:

```powershell
Invoke-RestMethod -Method Delete `
	-Uri "http://localhost:4000/api/products/$newProductId" `
	-Headers $adminHeaders | ConvertTo-Json -Depth 6
```

Verify that a store owner cannot create products:

```powershell
try {
	Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/products `
		-Headers @{ Authorization = "Bearer $token" } `
		-ContentType 'application/json' -Body '{}'
} catch {
	$_.ErrorDetails.Message
}
```

The expected response is HTTP 403 with error code `FORBIDDEN`.
