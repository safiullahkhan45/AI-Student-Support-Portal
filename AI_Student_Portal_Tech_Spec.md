**TECHNICAL SPECIFICATION**

**AI Student Support Portal**

Day-by-Day Developer Task Plan --- Phase 1 & Phase 2

+---+--------------------------------------------------------------------+
|   | **How to use this document**                                       |
|   |                                                                    |
|   | Work through each day in order. Complete all tasks for a day       |
|   | before moving on.                                                  |
|   |                                                                    |
|   | Each day ends with a checkpoint --- do not proceed until it        |
|   | passes.                                                            |
|   |                                                                    |
|   | Days assume full working day availability. If interrupted by       |
|   | client work, pick up exactly where you left off.                   |
|   |                                                                    |
|   | Commit to GitHub at the end of every single day, even if the work  |
|   | feels incomplete.                                                  |
+---+--------------------------------------------------------------------+

**Project Structure**

Set this folder structure up on Day 1 and never deviate from it.

> ai-student-portal/
>
> ├── backend/
>
> │ ├── app/
>
> │ │ ├── api/ \# Route handlers
>
> │ │ ├── core/ \# Config, security, dependencies
>
> │ │ ├── db/ \# Database models and session
>
> │ │ ├── services/ \# Business logic (chat, embeddings, etc.)
>
> │ │ └── schemas/ \# Pydantic request/response models
>
> │ ├── alembic/ \# DB migrations
>
> │ ├── main.py
>
> │ └── requirements.txt
>
> ├── frontend/
>
> │ ├── src/
>
> │ │ ├── components/
>
> │ │ ├── pages/
>
> │ │ ├── hooks/
>
> │ │ └── api/ \# Axios API client
>
> │ └── package.json
>
> ├── docker-compose.yml
>
> └── .env.example

**Environment Variables**

Create a .env file at the root. Share .env.example (with blank values)
in Git --- never commit the real .env.

> \# Database
>
> DATABASE_URL=postgresql://user:password@localhost:5432/student_portal
>
> \# Auth
>
> SECRET_KEY=your-secret-key-min-32-chars
>
> ACCESS_TOKEN_EXPIRE_MINUTES=60
>
> \# Claude API
>
> ANTHROPIC_API_KEY=sk-ant-\...
>
> CLAUDE_MODEL=claude-sonnet-4-20250514
>
> \# Vector Store
>
> CHROMA_PERSIST_PATH=./chroma_db
>
> \# WhatsApp (Phase 3 only --- leave blank for now)
>
> WHATSAPP_API_TOKEN=
>
> WHATSAPP_PHONE_ID=

**Database Schema**

All tables include tenant_id to enforce multi-tenancy. Use Alembic for
all migrations --- never edit the database manually.

**institutions**

  --------------------- ---------------- ---------------------------------
  **Column**            **Type**         **Notes**

  **id**                UUID (PK)        Auto-generated

  **name**              VARCHAR(255)     e.g. Riphah International
                                         University

  **subdomain**         VARCHAR(100)     Unique. e.g. riphah --- used to
                                         identify tenant

  **logo_url**          TEXT             Nullable

  **contact_email**     VARCHAR(255)     

  **is_active**         BOOLEAN          Default true

  **created_at**        TIMESTAMP        Default now()
  --------------------- ---------------- ---------------------------------

**users**

  --------------------- ---------------- ---------------------------------
  **Column**            **Type**         **Notes**

  **id**                UUID (PK)        Auto-generated

  **tenant_id**         UUID (FK)        References institutions.id

  **role**              ENUM             student \| admin \| super_admin

  **full_name**         VARCHAR(255)     

  **email**             VARCHAR(255)     Unique per tenant

  **password_hash**     TEXT             bcrypt hashed

  **roll_number**       VARCHAR(50)      Nullable --- students only

  **is_active**         BOOLEAN          Default true

  **created_at**        TIMESTAMP        Default now()
  --------------------- ---------------- ---------------------------------

**knowledge_chunks**

  --------------------- ---------------- ---------------------------------
  **Column**            **Type**         **Notes**

  **id**                UUID (PK)        Auto-generated

  **tenant_id**         UUID (FK)        References institutions.id

  **source_filename**   VARCHAR(255)     Original uploaded file name

  **chunk_index**       INTEGER          Order of chunk within file

  **chunk_text**        TEXT             Raw text of the chunk

  **chroma_id**         VARCHAR(255)     ID used in ChromaDB for retrieval

  **created_at**        TIMESTAMP        Default now()
  --------------------- ---------------- ---------------------------------

**chat_sessions**

  --------------------- ---------------- ---------------------------------
  **Column**            **Type**         **Notes**

  **id**                UUID (PK)        Auto-generated

  **tenant_id**         UUID (FK)        References institutions.id

  **user_id**           UUID (FK)        References users.id

  **created_at**        TIMESTAMP        Default now()
  --------------------- ---------------- ---------------------------------

**chat_messages**

  --------------------- ---------------- ---------------------------------
  **Column**            **Type**         **Notes**

  **id**                UUID (PK)        Auto-generated

  **session_id**        UUID (FK)        References chat_sessions.id

  **role**              ENUM             user \| assistant

  **content**           TEXT             Message body

  **created_at**        TIMESTAMP        Default now()
  --------------------- ---------------- ---------------------------------

**complaints**

  ---------------------- ---------------- ---------------------------------
  **Column**             **Type**         **Notes**

  **id**                 UUID (PK)        Auto-generated

  **tenant_id**          UUID (FK)        References institutions.id

  **student_id**         UUID (FK)        References users.id

  **category**           VARCHAR(100)     e.g. Fee, Result, Hostel,
                                          Academic

  **description**        TEXT             Student\'s complaint text

  **reference_number**   VARCHAR(20)      Unique. Format: COMP-XXXX-YYYY

  **status**             ENUM             open \| in_progress \| resolved

  **admin_note**         TEXT             Nullable --- admin\'s
                                          response/note

  **created_at**         TIMESTAMP        Default now()

  **updated_at**         TIMESTAMP        Auto-updated on change
  ---------------------- ---------------- ---------------------------------

**fee_records**

  --------------------- ---------------- ---------------------------------
  **Column**            **Type**         **Notes**

  **id**                UUID (PK)        Auto-generated

  **tenant_id**         UUID (FK)        References institutions.id

  **roll_number**       VARCHAR(50)      

  **semester**          VARCHAR(50)      e.g. Fall 2024

  **amount_due**        NUMERIC(10,2)    

  **amount_paid**       NUMERIC(10,2)    Default 0

  **due_date**          DATE             

  **challan_url**       TEXT             Nullable --- link to PDF challan

  **created_at**        TIMESTAMP        Default now()
  --------------------- ---------------- ---------------------------------

**result_records**

  --------------------- ---------------- ---------------------------------
  **Column**            **Type**         **Notes**

  **id**                UUID (PK)        Auto-generated

  **tenant_id**         UUID (FK)        References institutions.id

  **roll_number**       VARCHAR(50)      

  **semester**          VARCHAR(50)      e.g. Fall 2024

  **course_code**       VARCHAR(20)      

  **course_name**       VARCHAR(255)     

  **grade**             VARCHAR(5)       e.g. A, B+, C

  **credit_hours**      NUMERIC(3,1)     

  **created_at**        TIMESTAMP        Default now()
  --------------------- ---------------- ---------------------------------

**API Endpoints**

All endpoints are prefixed with /api/v1. All protected routes require
Authorization: Bearer \<token\> header.

**Auth**

  ------------ ------------------------ ---------------------------- ----------
  **Method**   **Endpoint**             **Description**              **Role**

  **POST**     /auth/register           Register a new student       Public
                                        account                      

  **POST**     /auth/login              Login, returns JWT access    Public
                                        token                        

  **GET**      /auth/me                 Get current logged-in user   Any auth
                                        profile                      
  ------------ ------------------------ ---------------------------- ----------

**Institutions (Super Admin)**

  ------------ ------------------------ ---------------------------- ----------
  **Method**   **Endpoint**             **Description**              **Role**

  **POST**     /institutions            Create a new                 Super
                                        institution/tenant           Admin

  **GET**      /institutions            List all institutions        Super
                                                                     Admin

  **GET**      /institutions/{id}       Get single institution       Super
                                        detail                       Admin

  **PATCH**    /institutions/{id}       Update institution details   Super
                                                                     Admin
  ------------ ------------------------ ---------------------------- ----------

**Knowledge Base**

  ------------ ------------------------ ---------------------------- ----------
  **Method**   **Endpoint**             **Description**              **Role**

  **POST**     /knowledge/upload        Upload PDF/DOCX/TXT ---      Admin
                                        chunks, embeds, stores in    
                                        ChromaDB                     

  **GET**      /knowledge               List all uploaded documents  Admin
                                        for this tenant              

  **DELETE**   /knowledge/{id}          Delete a document and its    Admin
                                        chunks from ChromaDB         
  ------------ ------------------------ ---------------------------- ----------

**Chat**

  ------------ ------------------------------ ---------------------------- ----------
  **Method**   **Endpoint**                   **Description**              **Role**

  **POST**     /chat/sessions                 Start a new chat session     Student

  **POST**     /chat/sessions/{id}/messages   Send a message, get AI       Student
                                              response                     

  **GET**      /chat/sessions/{id}/messages   Retrieve full message        Student
                                              history for a session        
  ------------ ------------------------------ ---------------------------- ----------

**Fee & Results**

  ------------ ------------------------ ---------------------------- ----------
  **Method**   **Endpoint**             **Description**              **Role**

  **GET**      /fees/lookup             Lookup fee record by         Student
                                        roll_number + semester query 
                                        params                       

  **POST**     /fees/import             Bulk import fee records from Admin
                                        CSV upload                   

  **GET**      /results/lookup          Lookup results by            Student
                                        roll_number + semester query 
                                        params                       

  **POST**     /results/import          Bulk import results from CSV Admin
                                        upload                       
  ------------ ------------------------ ---------------------------- ----------

**Complaints**

  ------------ ------------------------- ---------------------------- ----------
  **Method**   **Endpoint**              **Description**              **Role**

  **POST**     /complaints               Submit a new complaint       Student

  **GET**      /complaints/track/{ref}   Track complaint status by    Public
                                         reference number             

  **GET**      /complaints               List all complaints for the  Admin
                                         tenant                       

  **PATCH**    /complaints/{id}          Update complaint status and  Admin
                                         admin note                   
  ------------ ------------------------- ---------------------------- ----------

**RAG Chatbot Implementation**

This is the most important technical piece. Follow this approach
precisely.

**Step 1 --- Document Ingestion (on upload)**

-   Accept file upload (PDF, DOCX, TXT)

-   Extract raw text --- use PyMuPDF for PDF, python-docx for DOCX

-   Split text into chunks of \~500 tokens with 50-token overlap

-   Generate embeddings using sentence-transformers (all-MiniLM-L6-v2)
    --- free, runs locally, no API cost

-   Store each chunk in ChromaDB with metadata: tenant_id,
    source_filename, chunk_index

-   Save chunk record in PostgreSQL knowledge_chunks table

**Step 2 --- Query Handling (on each student message)**

-   Receive student message

-   Generate embedding for the student\'s message using the same
    sentence-transformers model

-   Query ChromaDB for top 5 most similar chunks filtered by tenant_id

-   Build prompt and send to Claude API --- see prompt template below

-   Stream response back to frontend

-   Save both user message and assistant response to chat_messages table

**Claude Prompt Template**

+---+--------------------------------------------------------------------+
|   | **System Prompt**                                                  |
|   |                                                                    |
|   | You are a helpful student support assistant for                    |
|   | {institution_name}.                                                |
|   |                                                                    |
|   | Answer questions based only on the provided context. If the answer |
|   | is not in the context,                                             |
|   |                                                                    |
|   | say you don\'t have that information and suggest the student       |
|   | contact the admin office.                                          |
|   |                                                                    |
|   | Be concise, friendly, and professional. Do not make up             |
|   | information.                                                       |
+---+--------------------------------------------------------------------+

**User Message Structure**

> Context from knowledge base:
>
> \-\--
>
> {chunk_1_text}
>
> \-\--
>
> {chunk_2_text}
>
> \-\--
>
> {chunk_3_text}
>
> \-\--
>
> Student question: {student_message}

**Phase 1 --- Day-by-Day Plan**

Foundation. 5 days. By the end you will have a working login,
multi-tenant database, knowledge base upload, and React shells.

+----------+-----------------------------------------------------------+
| **Day    | -   Initialise FastAPI project with folder structure as   |
| 1**      |     defined above                                         |
|          |                                                           |
| Project  | -   Set up PostgreSQL locally using Docker                |
| Setup &  |     (docker-compose.yml)                                  |
| Auth     |                                                           |
|          | -   Configure Alembic for migrations                      |
|          |                                                           |
|          | -   Create institutions and users tables via Alembic      |
|          |     migration                                             |
|          |                                                           |
|          | -   Implement bcrypt password hashing utility             |
|          |                                                           |
|          | -   Build POST /auth/register endpoint --- creates        |
|          |     student user for a given tenant_id                    |
|          |                                                           |
|          | -   Build POST /auth/login endpoint --- validates         |
|          |     credentials, returns JWT                              |
|          |                                                           |
|          | -   Build GET /auth/me endpoint --- decodes JWT, returns  |
|          |     user profile                                          |
|          |                                                           |
|          | -   Write middleware to extract tenant_id from JWT on all |
|          |     protected routes                                      |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 1 Checkpoint**                                               |
|   |                                                                    |
|   | Run these manually via Postman or curl:                            |
|   |                                                                    |
|   | POST /auth/register → 201 with user object                         |
|   |                                                                    |
|   | POST /auth/login → 200 with access_token                           |
|   |                                                                    |
|   | GET /auth/me with Bearer token → 200 with user profile             |
|   |                                                                    |
|   | GET /auth/me with no token → 401 Unauthorized                      |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Build POST /institutions endpoint --- creates a new   |
| 2**      |     tenant (super admin only)                             |
|          |                                                           |
| Super    | -   Build GET /institutions and GET /institutions/{id}    |
| Admin &  |     endpoints                                             |
| Inst     |                                                           |
| itutions | -   Add role-based access control dependency --- reusable |
|          |     function that checks user role                        |
|          |                                                           |
|          | -   Seed the database with one test institution and one   |
|          |     test student + one test admin user                    |
|          |                                                           |
|          | -   Write a simple seed script (seed.py) that can be      |
|          |     re-run to reset test data                             |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 2 Checkpoint**                                               |
|   |                                                                    |
|   | POST /institutions with super_admin token → 201 with institution   |
|   |                                                                    |
|   | POST /institutions with student token → 403 Forbidden              |
|   |                                                                    |
|   | Seed script runs cleanly and creates predictable test data         |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Install dependencies: PyMuPDF, python-docx,           |
| 3**      |     sentence-transformers, chromadb                       |
|          |                                                           |
| K        | -   Build text extraction utility --- accepts file        |
| nowledge |     bytes + mime type, returns plain text string          |
| Base     |                                                           |
| Upload   | -   Build chunking utility --- splits text into \~500     |
|          |     token chunks with 50 token overlap                    |
|          |                                                           |
|          | -   Set up ChromaDB client --- one collection per tenant  |
|          |     (collection name = tenant_id)                         |
|          |                                                           |
|          | -   Build embedding utility using sentence-transformers   |
|          |     all-MiniLM-L6-v2                                      |
|          |                                                           |
|          | -   Build POST /knowledge/upload endpoint ---             |
|          |     orchestrates extract → chunk → embed → store          |
|          |                                                           |
|          | -   Save chunk records to knowledge_chunks PostgreSQL     |
|          |     table                                                 |
|          |                                                           |
|          | -   Build GET /knowledge endpoint --- lists uploaded      |
|          |     documents for the tenant                              |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 3 Checkpoint**                                               |
|   |                                                                    |
|   | Upload a real university fee policy PDF via POST /knowledge/upload |
|   |                                                                    |
|   | Check PostgreSQL --- knowledge_chunks table should have multiple   |
|   | rows for that tenant                                               |
|   |                                                                    |
|   | Check ChromaDB --- query the tenant collection and confirm chunks  |
|   | are retrievable                                                    |
|   |                                                                    |
|   | GET /knowledge returns the uploaded document in the list           |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Initialise React app with Vite + TailwindCSS          |
| 4**      |                                                           |
|          | -   Set up React Router with these routes: /login,        |
| React    |     /portal (student), /admin, /admin/complaints,         |
| App      |     /admin/knowledge                                      |
| Shell    |                                                           |
|          | -   Build Axios API client with JWT interceptor ---       |
|          |     attaches token to all requests automatically          |
|          |                                                           |
|          | -   Build Login page --- email + password form, calls     |
|          |     /auth/login, stores token in memory (not              |
|          |     localStorage)                                         |
|          |                                                           |
|          | -   Build auth context --- stores user profile, role, and |
|          |     tenant after login                                    |
|          |                                                           |
|          | -   Build protected route wrapper --- redirects to /login |
|          |     if not authenticated                                  |
|          |                                                           |
|          | -   Build Student Portal shell --- top nav with user      |
|          |     name, empty main area, logout button                  |
|          |                                                           |
|          | -   Build Admin Dashboard shell --- sidebar nav with      |
|          |     links, empty content area, logout button              |
|          |                                                           |
|          | -   Route to correct shell based on user role after login |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 4 Checkpoint**                                               |
|   |                                                                    |
|   | Login as student → redirected to Student Portal shell              |
|   |                                                                    |
|   | Login as admin → redirected to Admin Dashboard shell               |
|   |                                                                    |
|   | Accessing /portal without login → redirected to /login             |
|   |                                                                    |
|   | Logout clears token and redirects to /login                        |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Set up a DigitalOcean Droplet or Railway project      |
| 5**      |     (whichever is faster)                                 |
|          |                                                           |
| Deploy   | -   Configure PostgreSQL on staging --- either managed DB |
| to       |     or Docker on the Droplet                              |
| Staging  |                                                           |
|          | -   Configure environment variables on staging server     |
|          |                                                           |
|          | -   Set up ChromaDB persistent storage on staging         |
|          |                                                           |
|          | -   Deploy backend --- confirm all Day 1-3 endpoints work |
|          |     on staging URL                                        |
|          |                                                           |
|          | -   Deploy frontend --- confirm login and shell routing   |
|          |     works on staging URL                                  |
|          |                                                           |
|          | -   Run seed script on staging to create test             |
|          |     institution + users                                   |
|          |                                                           |
|          | -   Tag GitHub release as v0.1.0-phase1                   |
+----------+-----------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✓ End of Phase Checkpoint**                                         |
|                                                                       |
| Phase 1 complete. You can log in as student or admin on a live        |
| staging URL. Knowledge base upload works. The app shell is navigable. |
| Share the staging URL internally for review before starting Phase 2.  |
+-----------------------------------------------------------------------+

**Phase 2 --- Day-by-Day Plan**

Core features. 9 days. By the end you will have a fully demoable product
--- chatbot, fee/result lookup, and complaint management all working.

+----------+-----------------------------------------------------------+
| **Day    | -   Create chat_sessions and chat_messages tables via     |
| 6**      |     Alembic migration                                     |
|          |                                                           |
| AI       | -   Build POST /chat/sessions endpoint --- creates new    |
| Chatbot  |     session for authenticated student                     |
| ---      |                                                           |
| Backend  | -   Build the RAG retrieval service --- takes tenant_id + |
|          |     query string, returns top 5 chunks from ChromaDB      |
|          |                                                           |
|          | -   Build the Claude API service --- takes system         |
|          |     prompt + context chunks + message history, calls      |
|          |     Claude, returns response text                         |
|          |                                                           |
|          | -   Build POST /chat/sessions/{id}/messages endpoint ---  |
|          |     orchestrates: save user message → retrieve chunks →   |
|          |     call Claude → save assistant message → return         |
|          |     response                                              |
|          |                                                           |
|          | -   Build GET /chat/sessions/{id}/messages endpoint ---   |
|          |     returns full message history                          |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 6 Checkpoint**                                               |
|   |                                                                    |
|   | Upload a document to knowledge base (if not already done from Day  |
|   | 3)                                                                 |
|   |                                                                    |
|   | POST /chat/sessions → creates session                              |
|   |                                                                    |
|   | POST /chat/sessions/{id}/messages with a question related to the   |
|   | document → returns a relevant AI answer                            |
|   |                                                                    |
|   | POST /chat/sessions/{id}/messages with an off-topic question → AI  |
|   | says it doesn\'t have that info                                    |
|   |                                                                    |
|   | GET /chat/sessions/{id}/messages → returns both messages in order  |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Build ChatWindow component --- message list with user |
| 7**      |     and assistant bubbles styled differently              |
|          |                                                           |
| AI       | -   Build MessageInput component --- text input + send    |
| Chatbot  |     button, handles Enter key                             |
| ---      |                                                           |
| Frontend | -   On Student Portal load --- auto-create a chat session |
|          |     via POST /chat/sessions                               |
|          |                                                           |
|          | -   On message send --- POST to                           |
|          |     /chat/sessions/{id}/messages, append response to      |
|          |     message list                                          |
|          |                                                           |
|          | -   Add typing indicator while waiting for Claude         |
|          |     response                                              |
|          |                                                           |
|          | -   Add empty state --- friendly prompt asking the        |
|          |     student what they need help with                      |
|          |                                                           |
|          | -   Make chat window scrollable with auto-scroll to       |
|          |     latest message                                        |
|          |                                                           |
|          | -   Test with the real knowledge base on staging ---      |
|          |     confirm the full flow end to end                      |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 7 Checkpoint**                                               |
|   |                                                                    |
|   | Open Student Portal → chat window loads with empty state           |
|   |                                                                    |
|   | Type a question about fees or a policy → get a relevant answer     |
|   | within 5 seconds                                                   |
|   |                                                                    |
|   | Ask an unrelated question → AI politely says it doesn\'t know      |
|   |                                                                    |
|   | Refresh page → chat session persists and history reloads           |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Create fee_records table via Alembic migration        |
| 8**      |                                                           |
|          | -   Build POST /fees/import endpoint --- accepts CSV      |
| Fee      |     file, parses rows, bulk inserts into fee_records for  |
| Lookup   |     the tenant                                            |
| ---      |                                                           |
| Backend  | -   CSV expected columns: roll_number, semester,          |
| & CSV    |     amount_due, amount_paid, due_date, challan_url        |
| Import   |                                                           |
|          | -   Add validation --- skip rows with missing roll_number |
|          |     or semester, return count of imported vs skipped      |
|          |                                                           |
|          | -   Build GET /fees/lookup endpoint --- query params:     |
|          |     roll_number + semester, returns fee record or 404     |
|          |                                                           |
|          | -   Build a sample fees CSV with 5-10 fake records for    |
|          |     testing                                               |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 8 Checkpoint**                                               |
|   |                                                                    |
|   | Import the sample CSV via POST /fees/import as admin → returns     |
|   | import summary                                                     |
|   |                                                                    |
|   | GET /fees/lookup?roll_number=CS-001&semester=Fall+2024 → returns   |
|   | correct fee record                                                 |
|   |                                                                    |
|   | GET /fees/lookup with unknown roll number → 404 with clear message |
|   |                                                                    |
|   | Import CSV as student → 403 Forbidden                              |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Create result_records table via Alembic migration     |
| 9**      |                                                           |
|          | -   Build POST /results/import and GET /results/lookup    |
| Result   |     endpoints --- same pattern as fees                    |
| Lookup   |                                                           |
| ---      | -   Add GPA calculation logic --- weighted average based  |
| Backend  |     on grade points and credit hours                      |
| &        |                                                           |
| Frontend | -   GET /results/lookup returns list of course results +  |
| for      |     calculated GPA for that semester                      |
| Fee +    |                                                           |
| Result   | -   Build Fee Lookup tab in Student Portal --- roll       |
|          |     number + semester inputs, show fee status card on     |
|          |     submit                                                |
|          |                                                           |
|          | -   Fee card shows: amount due, amount paid, outstanding  |
|          |     balance, due date, and challan download link if       |
|          |     available                                             |
|          |                                                           |
|          | -   Build Result Lookup tab in Student Portal --- roll    |
|          |     number + semester inputs, show results table + GPA on |
|          |     submit                                                |
|          |                                                           |
|          | -   Build Admin Knowledge page --- list of uploaded       |
|          |     documents with delete button, upload new document     |
|          |     form                                                  |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 9 Checkpoint**                                               |
|   |                                                                    |
|   | Student enters roll number + semester → sees correct fee status    |
|   | card                                                               |
|   |                                                                    |
|   | Student enters roll number + semester → sees results table with    |
|   | GPA calculated correctly                                           |
|   |                                                                    |
|   | Admin uploads a new document from the Knowledge page --- it        |
|   | appears in the list                                                |
|   |                                                                    |
|   | Admin deletes a document --- it disappears from the list           |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Create complaints table via Alembic migration         |
| 10**     |                                                           |
|          | -   Build reference number generator --- format           |
| C        |     COMP-{4-char-tenant-prefix}-{random-6-digits}, e.g.   |
| omplaint |     COMP-RIPH-847291                                      |
| Su       |                                                           |
| bmission | -   Build POST /complaints endpoint --- creates           |
| ---      |     complaint, auto-generates reference number, returns   |
| Backend  |     it to student                                         |
|          |                                                           |
|          | -   Build GET /complaints/track/{ref} endpoint ---        |
|          |     public, no auth required, returns status + admin_note |
|          |                                                           |
|          | -   Build GET /complaints endpoint --- admin only,        |
|          |     returns all complaints for tenant with filters        |
|          |     (status, category)                                    |
|          |                                                           |
|          | -   Build PATCH /complaints/{id} endpoint --- admin       |
|          |     updates status and/or admin_note                      |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 10 Checkpoint**                                              |
|   |                                                                    |
|   | POST /complaints as student → 201 with reference number in         |
|   | response                                                           |
|   |                                                                    |
|   | GET /complaints/track/{ref} with that reference → returns status   |
|   | \'open\'                                                           |
|   |                                                                    |
|   | GET /complaints as admin → returns the complaint in the list       |
|   |                                                                    |
|   | PATCH /complaints/{id} as admin with status \'in_progress\' →      |
|   | confirmed in database                                              |
|   |                                                                    |
|   | GET /complaints/track/{ref} again → status now shows               |
|   | \'in_progress\'                                                    |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Build Complaint Submission tab in Student Portal ---  |
| 11**     |     category dropdown + description textarea + submit     |
|          |     button                                                |
| C        |                                                           |
| omplaint | -   On submit success --- show reference number           |
| UI ---   |     prominently with copy button and instructions to save |
| Student  |     it                                                    |
| & Admin  |                                                           |
|          | -   Build Complaint Tracker in Student Portal ---         |
|          |     reference number input, shows status and admin note   |
|          |     when found                                            |
|          |                                                           |
|          | -   Build Admin Complaints page --- table of all          |
|          |     complaints with columns: reference, category, student |
|          |     name, status, date submitted                          |
|          |                                                           |
|          | -   Add status filter dropdown and category filter to     |
|          |     admin complaints table                                |
|          |                                                           |
|          | -   Add row click → complaint detail panel --- shows full |
|          |     description, current status, admin note input, and    |
|          |     status update dropdown                                |
|          |                                                           |
|          | -   Admin saves status update → optimistic UI update in   |
|          |     the table                                             |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 11 Checkpoint**                                              |
|   |                                                                    |
|   | Student submits a complaint → reference number appears on screen   |
|   |                                                                    |
|   | Student tracks that reference → sees correct status                |
|   |                                                                    |
|   | Admin sees the complaint in their dashboard                        |
|   |                                                                    |
|   | Admin updates status to \'resolved\' with a note → student         |
|   | tracking shows updated status and note                             |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Build Fee Import section in Admin Dashboard --- file  |
| 12**     |     upload input for CSV, import button, shows import     |
|          |     summary after upload                                  |
| CSV      |                                                           |
| Import   | -   Build Result Import section in Admin Dashboard ---    |
| UI &     |     same pattern                                          |
| Admin    |                                                           |
| P        | -   Add basic form validation on all frontend forms ---   |
| olishing |     required fields, minimum lengths                      |
|          |                                                           |
|          | -   Add loading states to all API calls --- no button     |
|          |     should be clickable while a request is in flight      |
|          |                                                           |
|          | -   Add error handling --- API errors should show a clear |
|          |     inline message, not a blank screen or console error   |
|          |                                                           |
|          | -   Add empty states to all list views --- admin          |
|          |     complaint table, knowledge base list                  |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 12 Checkpoint**                                              |
|   |                                                                    |
|   | Upload fee CSV from admin UI → success message with import count   |
|   |                                                                    |
|   | Upload malformed CSV → clear error message, nothing crashes        |
|   |                                                                    |
|   | All forms prevent double submission while loading                  |
|   |                                                                    |
|   | Empty complaint list shows friendly empty state message            |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Go through every Student Portal screen on a 375px     |
| 13**     |     wide viewport (iPhone SE)                             |
|          |                                                           |
| Mobile   | -   Fix any layout breaks --- nav, chat window, fee card, |
| Respon   |     results table, complaint form                         |
| siveness |                                                           |
| & Final  | -   Results table should horizontally scroll on mobile    |
| Polish   |     rather than overflow                                  |
|          |                                                           |
|          | -   Chat input should stay fixed at bottom of screen on   |
|          |     mobile                                                |
|          |                                                           |
|          | -   Go through Admin Dashboard on tablet viewport (768px) |
|          |                                                           |
|          | -   Fix any admin layout issues --- sidebar should        |
|          |     collapse or stack on smaller screens                  |
|          |                                                           |
|          | -   Run through the complete student journey end-to-end   |
|          |     on mobile and fix anything that feels clunky          |
+----------+-----------------------------------------------------------+

+---+--------------------------------------------------------------------+
|   | **Day 13 Checkpoint**                                              |
|   |                                                                    |
|   | Complete student journey on mobile: login → chat → fee lookup →    |
|   | result lookup → complaint submission → complaint tracking          |
|   |                                                                    |
|   | No horizontal scroll on any screen except the results table        |
|   |                                                                    |
|   | All tap targets are at least 44px tall                             |
|   |                                                                    |
|   | Admin dashboard usable on a tablet                                 |
+---+--------------------------------------------------------------------+

+----------+-----------------------------------------------------------+
| **Day    | -   Deploy latest backend and frontend to staging         |
| 14**     |                                                           |
|          | -   Run full seed script on staging --- fresh             |
| Staging  |     institution, admin user, student user                 |
| Deploy,  |                                                           |
| Testing  | -   Upload 2-3 real-looking documents to knowledge base   |
| &        |                                                           |
| Release  | -   Import sample fee and result CSVs                     |
|          |                                                           |
|          | -   Do a complete walkthrough of every feature as both    |
|          |     student and admin --- note any bugs                   |
|          |                                                           |
|          | -   Fix any bugs found during walkthrough                 |
|          |                                                           |
|          | -   Write a short demo script (1 page) --- what to click  |
|          |     and in what order to show the product to a university |
|          |                                                           |
|          | -   Tag GitHub release as v0.2.0-phase2                   |
|          |                                                           |
|          | -   Share staging URL and demo script with Safiullah for  |
|          |     review                                                |
+----------+-----------------------------------------------------------+

+-----------------------------------------------------------------------+
| **✓ End of Phase Checkpoint**                                         |
|                                                                       |
| Phase 2 complete. You now have a fully demoable product at a live     |
| staging URL. The chatbot answers questions from real documents, fee   |
| and result lookup work, and the complaint system is end-to-end        |
| functional. This is ready to show to a pilot university.              |
+-----------------------------------------------------------------------+

**Daily Habits**

Follow these every single working day on this project, without
exception.

-   Commit to GitHub at end of day with a clear commit message
    describing what was done

-   Never leave a broken state in the main branch --- commit to a
    feature branch if work is incomplete

-   Test every endpoint you write on the same day you write it --- do
    not leave testing for later

-   If you are blocked for more than 30 minutes on something, flag it
    immediately rather than spending a full day stuck

-   Keep the .env.example file updated whenever you add a new
    environment variable
