# Express Backend

This is the separate Express.js backend for the Importila project.

## Setup

1.  Install dependencies:
    ```bash
    npm install
    ```

2.  Environment configuration:
    -   The backend automatically loads environment variables from the root `.env` file (`../.env`).
    -   Ensure `MONGODB_URI`, `CLOUDINARY_...`, `JWT_SECRET` vars are present there.

3.  Run Development Server:
    ```bash
    npm run dev
    ```
    Runs on port 5000 by default.

## API Endpoints Overview

-   **Products**: `/api/products`
-   **Orders**: `/api/orders`
-   **Sliders**: `/api/sliders`
-   **Admin**:
    -   Login: `/api/admin/login`
    -   Stats: `/api/admin/stats`
    -   Check: `/api/admin/check`
-   **Categories**:
    -   List: `/api/categories`
    -   Flat List: `/api/categories/flat`
-   **Combos**: `/api/combos`
-   **Combo Orders**: `/api/comboorder`
-   **Cart**: `/api/cart/validate`
-   **Checkout**: `/api/checkout`
-   **Courier**:
    -   Settings: `/api/settings/courier`
    -   Create Order: `/api/courier/create-order`
    -   Check Status: `/api/courier/check-status`
-   **Menus**: `/api/menus`
-   **Stock**: `/api/stock`
-   **Upload**: `/api/upload`
-   **Settings**: `/api/settings` (General store settings)

## Migration Status

-   [x] Products API
-   [x] Orders API
-   [x] Sliders API
-   [x] Admin Auth & Stats
-   [x] Categories API
-   [x] Combos API
-   [x] Settings (General & Courier)
-   [x] Courier Integration (Steadfast)
-   [x] Cart Validation
-   [x] Checkout Process
-   [x] Menu Management
-   [x] Stock Management
-   [x] File Uploads

All core Next.js API routes have been migrated to this Express application.
