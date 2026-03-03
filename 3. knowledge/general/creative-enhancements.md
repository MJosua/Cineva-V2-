# Creative Enhancements Research & Plan

> **Goal**: Enhance HOTS with modern communication and intelligence features.

---

## 1. Smart Notification Center (Web)
**Concept**: A centralized hub for all user alerts, not just email.
**Features**:
-   **Real-time Toast**: "Ticket #123 Approved!"
-   **Notification Bell**: Dropdown list of recent activity.
-   **Grouped Alerts**: "3 tickets updated" instead of 3 rows.
-   **Actionable**: Approximate/Reject directly from the notification.

**Implementation**:
-   **Backend**: `socket.io` (Already present!). Add `t_notifications` table.
-   **Frontend**: `NotificationContext` provider + `BellWidget`.
-   **Trigger**: Hook into `TriggerEngine` to emit socket events.

---

## 2. WhatsApp Integration (The "Speedy" Layer)
**Concept**: Critical alerts where users live—on their phones.
**Use Cases**:
-   **Approvals**: "Reply APPROVE 123 to approve ticket."
-   **Urgent Alerts**: "Server Down!"
-   **Status**: "Your laptop is ready for pickup."

**Implementation**:
-   **Provider**: `WhaPi` or `Twilio` (Official API) vs `baileys` (Unofficial/Free).
-   **Backend**: New service `service/integration/whatsappService.js`.
-   **Interaction**: Webhook listener for incoming replies.

---

## 3. AI Helper ("HOTS Copilot")
**Concept**: Intelligent assistance for users and admins.
**Features**:
-   **Smart Triage**: AI suggests category/priority based on description.
-   **Solution Suggestion**: "Similar tickets were solved by restarting the printer."
-   **Sentiment Analysis**: Flag angry users to managers.
-   **SQL Generator**: Admin types "Show tickets by John last week" -> AI writes SQL.

**Implementation**:
-   **API**: OpenAI (GPT-4o-mini) or Gemini Flash (Fast/Cheap).
-   **Integration**: Add `aiService.js` to call API from Custom Functions.
-   **Widget**: `AIChatWidget` for Q&A.

## A. Deep Dive: Cloud vs Local AI

| Feature | Cloud (OpenAI/Gemini) | Local (Ollama + Llama 3) |
| :--- | :--- | :--- |
| **Cost** | Pay-per-token (~$5/mo) | **FREE** (Hardware cost only) |
| **Privacy** | Data leaves server | **100% Private** (Never leaves server) |
| **Setup** | Easy (API Key) | Medium (Install Ollama) |
| **Hardware** | Low (Any server) | High (Needs 8GB+ RAM, preferably GPU) |
| **Capabilities** | State-of-the-art | Good for specific tasks |

### Use Case 1: "Summarize data today"
*   **Query**: "Summarize tickets created today"
*   **Process**:
    1.  Backend runs SQL: `SELECT * FROM t_ticket WHERE date = CURDATE()`
    2.  Send JSON to AI: `Ollama.chat({ model: 'llama3', messages: [{ role: 'user', content: 'Summarize this JSON: ' + json }] })`
    3.  **Result**: "Today we had 5 printer issues, mostly in the HR department."

### Use Case 2: Text-to-SQL
*   **Query**: "Show me tickets from John"
*   **Process**:
    1.  Send Schema to AI: `Table t_ticket has columns id, reason, created_by...`
    2.  Send Prompt: "Write SQL for: tickets from John"
    3.  **Result**: `SELECT * FROM t_ticket WHERE created_by LIKE '%John%'`
    4.  **Security**: Use a **Read-Only Database User** for executing AI-generated queries to prevent `DROP TABLE`.

> **Verdict**: For simple tasks ("Summarize", "Find SQL"), **Local AI (Ollama)** is faster, freer, and more secure.

## B. "Where does the Knowledge live?" (Architecture)
You don't "train" the AI (which is slow/expensive). Instead, you use **Context Injection**.

### 1. For Database Queries (Structured Data)
*   **Source**: A simple `schema.json` file in your project.
*   **Method**: **System Prompt Injection**.
*   **Flow**:
    1.  User asks: "Show tickets from HR."
    2.  System reads `schema.json` (defines `t_tickets` columns).
    3.  System constructs prompt:
        > "You are a SQL Expert. Here is the database schema: [INSERT SCHEMA.JSON]. Write a query for: 'tickets from HR'."
    4.  AI answers.
*   **Storage**: Your existing codebase (`/knowledge/schema.json`).

### 2. For "How To" & History (Unstructured Data)
*   **Source**: Your CMS Pages ("Knowledge Base") + Past Ticket Solutions.
*   **Method**: **RAG (Retrieval-Augmented Generation)**.
*   **Flow**:
    1.  User asks: "How to fix Error 505?"
    2.  System searches Database: `SELECT * FROM t_cms_pages WHERE content LIKE '%Error 505%'`
    3.  System takes top 3 results.
    4.  System constructs prompt:
        > "User asked: 'How to fix Error 505'. Answer using ONLY these 3 usage guides: [INSERT GUIDES]."

---

## 4. Interactive QnA & Knowledge Base

**Concept**: Deflect tickets before they are created.
**Features**:
-   **Type-ahead Search**: As user types "printer", show "How to fix printer".
-   **Contextual Help**: Help icon on every form field.
-   **Video Embeds**: 30s tutorials for common tasks.

**Implementation**:
-   **CMS**: Use your new CMS Page Builder!
    -   Create `knowledge-base` page.
    -   Use `Accordion` block for FAQs.
-   **Search Widget**: `KnowledgeSearchWidget` that queries CMS content.

---

## Combined Strategy: "The Modern Office"
1.  **Morning**: AI summarizes yesterday's issues (Email/WhatsApp).
2.  **Day**: Notifications via Web Sockets.
3.  **Urgent**: WhatsApp alert.
4.  **Self-Service**: QnA Widget covers 30% of simple requests.
