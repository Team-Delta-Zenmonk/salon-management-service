# ZenMonk Salon Management Service (`salon-management-service`)

A robust, enterprise-grade multi-tenant backend REST API and real-time event orchestration engine powering the ZenMonk Salon ecosystem (Public storefront, Salon Management Portal, Super Admin Dashboard, and Marketing integrations).

---

## 1. Problem Statement

Salon management operations are fragmented across appointment scheduling, multi-stylist calendars, customer communication, inventory tracking, and payment processing:
- **Salon Owners & Managers** struggle to coordinate real-time staff schedules, service availability, tiered service pricing, inventory consumption, and Stripe payouts in one unified hub.
- **Customers** need an instant, friction-free way to explore salons, book stylists, select customized service slots, and pay securely online.
- **Platform Super Administrators** lack visibility over multi-tenant subscriptions, subscription plans, and platform-wide onboarding metrics.

**`salon-management-service`** solves this by delivering a centralized, scalable backend handling multi-tenant authorization, appointment lifecycle state machines, payment gateway processing (Stripe & Stripe Connect), automated transactional emails, Redis-backed queues/caching, and real-time Socket.IO events.

---

## 2. High-Level Functional Architecture & Request Flow

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer / Staff / Admin
    participant Client as Frontend Client (Port 3000/3001/3003)
    participant API as Express API (:8080)
    participant Auth as Auth & RBAC Middleware
    participant Controller as Business Controllers & Services
    participant DB as PostgreSQL (Sequelize)
    participant Redis as Redis & BullMQ
    participant Stripe as Stripe Payment Gateway
    participant Socket as Socket.IO Server

    Customer->>Client: Perform Action (Book slot, update staff, pay)
    Client->>API: HTTP Request / Bearer Token / Cookie
    API->>Auth: Verify JWT & Tenant Scope
    Auth->>Controller: Route to Controller
    
    alt Slot Availability / Booking Creation
        Controller->>DB: Query stylist schedule & active bookings
        DB-->>Controller: Available slots
        Controller->>Stripe: Create Stripe Checkout / PaymentIntent
        Stripe-->>Controller: Client secret / Checkout session URL
        Controller->>DB: Store pending booking transaction
        Controller-->>Client: Return payment session
        Client->>Customer: Complete Stripe Payment
        Stripe-->>API: Webhook (payment_intent.succeeded)
        API->>DB: Confirm booking status & generate invoice
        API->>Redis: Enqueue BullMQ confirmation email job
        API->>Socket: Emit real-time booking event to salon manager
        Socket-->>Client: Update salon schedule dashboard instantly
    else Read Operations (Catalog, Profile, Dashboards)
        Controller->>Redis: Check Cache
        opt Cache Miss
            Controller->>DB: Fetch from PostgreSQL
            Controller->>Redis: Cache Result
        end
        Controller-->>Client: Return JSON response
    end
```

---

## 3. Tech Stack

- **Runtime:** Node.js (>= 18.x)
- **Framework:** Express 5.x
- **Database & ORM:** PostgreSQL + Sequelize ORM (`sequelize-cli` migrations & seeders)
- **Caching & Queues:** Redis (`ioredis`), BullMQ, `node-cron`
- **Real-time:** Socket.IO
- **Payments:** Stripe & Stripe Connect API
- **Media Storage:** Cloudinary & Multer
- **Email Engine:** Nodemailer & React Email

---

## 4. Setup & Running the Application

### Prerequisites
- Node.js (v18+ or v20+) and npm (for local runs)
- Docker & Docker Compose (for Docker runs and backing services)
- Shared Docker external network (required for Docker setups):
  ```bash
  docker network create salon_management_shared_network 2>/dev/null || true
  ```

### Environment Configuration
Copy the sample environment file:
```bash
cp .env.example .env
```
Key configuration settings:
- `APP_PORT=8080`: Backend server port
- `DB_HOST`: Set to `localhost` (when running locally) or `salon-management-database` (when running inside Docker network)
- `DB_PORT`: `5432` (or `5433` if exposed externally on host)
- `DB_USER=postgres`, `DB_PASSWORD=admin@zm`, `DB_DATABASE=salon_management_db`
- `REDIS_HOST`: Set to `localhost` (when running locally) or `salon-management-redis` (when running inside Docker network)
- `JWT_SECRET`: Secret key for JWT signing

---

### Running with Docker

#### A. Development Mode (Hot-Reload with Mounted Volume)
The included `docker-compose.yml` mounts the repository and runs `dependency-base` with interactive terminal support:

```bash
# 1. Start database, redis, pgadmin, and backend containers
docker compose up -d

# 2. Run database migrations & seeders inside the container
docker compose exec backend npx sequelize-cli db:migrate
docker compose exec backend npx sequelize-cli db:seed:all

# 3. Start development server inside container with live reload
docker compose exec backend npm run dev

# (Alternatively, run interactive shell)
docker compose exec backend sh
```

#### B. Production Mode (Optimized Production Docker Image)
To build and run an immutable production image:

```bash
# 1. Build production image targeting the production stage
docker build --target production -t salon-management-service:prod .

# 2. Run the production container connected to the shared network
docker run -d \
  --name salon-management-backend-prod \
  --network salon_management_shared_network \
  -p 8080:8080 \
  --env-file .env \
  salon-management-service:prod

# 3. View production container logs
docker logs -f salon-management-backend-prod

# 4. Stop and remove container when done
docker stop salon-management-backend-prod && docker rm salon-management-backend-prod
```

---

### Running Locally on Host Machine

#### A. Development Mode
1. **Start backing services (PostgreSQL & Redis) in Docker:**
   ```bash
   docker compose up -d database redis pgadmin
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run database migrations & seed default data:**
   ```bash
   npm run up       # Runs Sequelize migrations
   npm run seed     # Seeds initial platform data & super-admin user
   ```

4. **Start the API in development mode (hot-reloading via Nodemon):**
   ```bash
   npm run dev
   ```

5. *(Optional)* **Run React Email template preview:**
   ```bash
   npm run email:dev
   ```

#### B. Production Mode
```bash
npm ci --omit=dev
npm start
```

The API service is accessible on `http://localhost:8080`.

---

## 5. Local Stripe Webhook Integration (Stripe CLI)

When developing locally, incoming Stripe events (such as `payment_intent.succeeded` for subscriptions, storefront bookings, and theme purchases) cannot reach your `localhost:8080` server directly from the public internet. Use the official **Stripe CLI** to forward webhook events directly to your local endpoint.

Official documentation: [https://docs.stripe.com/cli](https://docs.stripe.com/cli)

---

### 1. Install the Stripe CLI (If Not Installed)

If you already have the Stripe CLI installed, skip directly to **[2. Authenticate with Stripe CLI](#2-authenticate-with-stripe-cli)**.

#### Ubuntu / Linux (Debian-based)

**Option A — Via Official APT Repository (Recommended):**
```bash
# 1. Add the Stripe CLI GPG key
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/gpg | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg > /dev/null

# 2. Add the Stripe repository to sources.list
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list

# 3. Update apt and install Stripe CLI
sudo apt update
sudo apt install stripe
```

**Option B — Via Snap:**
```bash
sudo snap install stripe
```

**Option C — Direct Binary / Tarball:**
Download the Linux tarball (`stripe_X.X.X_linux_x86_64.tar.gz`) from [Stripe CLI GitHub Releases](https://github.com/stripe/stripe-cli/releases), extract it, and move the `stripe` binary to `/usr/local/bin/`.

#### Windows

**Option A — Via Scoop (Recommended by Stripe):**
```powershell
scoop bucket add stripe https://github.com/stripe/stripe-cli-scoop-bucket.git
scoop install stripe
```

**Option B — Via Chocolatey:**
```powershell
choco install stripe-cli
```

**Option C — Via Windows Package Manager (winget):**
```powershell
winget install Stripe.StripeCLI
```

**Option D — Manual Zip Download:**
1. Download the Windows zip archive (`stripe_X.X.X_windows_x86_64.zip`) from [Stripe CLI GitHub Releases](https://github.com/stripe/stripe-cli/releases).
2. Extract `stripe.exe` to a folder (e.g., `C:\Program Files\Stripe`).
3. Add that folder to your System `PATH` environment variable.

#### macOS (Optional)
```bash
brew install stripe/stripe-cli/stripe
```

Verify the installation:
```bash
stripe --version
```

---

### 2. Authenticate with Stripe CLI

Run the login command in your terminal:

```bash
stripe login
```

> [!IMPORTANT]
> **Use the Team Member Account Only:**  
> We use a shared team member Stripe account for local development. Please authenticate using your assigned team member credentials rather than a personal account. This ensures your local webhook listener connects to the same test environment matching our backend `.env` keys (`STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY`).

---

### 3. Forward Webhooks to Local Server

With the backend server running on `http://localhost:8080`, run:

```bash
stripe listen --all-snapshot --forward-to localhost:8080/stripe/webhook
```

*(Or standard forwarding: `stripe listen --forward-to localhost:8080/stripe/webhook`)*

#### Webhook Secret Verification
When `stripe listen` starts, it outputs a webhook signing secret:
```text
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
Copy this `whsec_...` value and set it as `STRIPE_WEBHOOK_SECRET` in your `.env` file to verify signed payloads locally:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

