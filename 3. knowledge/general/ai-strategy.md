# Local AI Strategy: Beyond SQL

> **Goal**: Make Ollama a "Smart Office Assistant" that understands context, not just a SQL generator.

---

## 1. What else can Ollama do? (Capabilities)

### A. Smart Triage & Routing
*   **Input**: "My laptop screen is flickering."
*   **AI Task**: Classify category (`Hardware`), Sub-category (`Laptop`), Priority (`Medium`).
*   **Action**: Auto-assign to "IT Support" team.

### B. Sentiment Monitoring
*   **Input**: "I've been waiting 3 days! This is unacceptable!"
*   **AI Task**: Detect sentiment (`Angry/Urgent`).
*   **Action**: Flag ticket as "High Priority" + Alert Manager via WhatsApp.

### C. Response Drafting (Agent Assist)
*   **Input**: Ticket #123 (forgot password).
*   **AI Task**: Draft polite reply.
*   **Output**: "Dear User, I can help reset your password. Please provide your employee ID..."

### D. Workflow Prediction
*   **Input**: "New employee John Doe starting Monday."
*   **AI Task**: Recognize intent (`Onboarding`).
*   **Action**: Suggest triggering the "New Joiner Workflow" (Asset allocation, Email creation).

### E. Data Summarization (Morning Briefing)
*   **Input**: Yesterday's tickets.
*   **AI Task**: Summarize trends.
*   **Output**: "Yesterday was busy. 5 printer issues in HR. 1 Critical server alert (Resolved)."

---

## 2. Managing "Office Knowledge" (Context Strategy)

To make the AI understand your *current* office condition, you need **Context Layers**.
**Location**: All context files are located in `/basic info/` for easy access.

### Layer 1: Identity (System Prompt)
**"Who am I?"**
*   **File**: `/basic info/ai-identity.txt` + `ai-rules.txt`
*   **Content**: Role, Tone, and Safety Rules.
    > "You are HOTS... You cannot delete data..."

### Layer 2: Structure (The Map)
**"How is data organized?"**
*   **File**: `/basic info/ai-schema.json`
*   **Content**: Database tables, columns, and relationships.

### Layer 3: Operational State (The Pulse)
**"What is happening RIGHT NOW?"**
*   **Source**: `/basic info/system_status_template.json` (Dynamic in production).
*   **Content**:
    *   "Printer-HR is OUT OF ORDER."
    *   "Internet connection is SLOW today."
*   **Usage**: Inject this into the prompt so AI answers: *"I can't assign this to Budi, he is on leave."*

### Layer 4: Domain Wisdom (The Library)
**"How do we do things here?"**
*   **Source**: `/basic info/glossary.json` & CMS Pages.
*   **Content**:
    *   "SOP: How to approve purchase orders."
    *   "Glossary: 'PC-01' means The Main Server."

---

## 3. Implementation Example: "Context Injection"

When you send a prompt to Ollama, you combine these layers:

```javascript
/* Pseudocode */
const identity = fs.readFile('./basic info/ai-identity.txt');
const rules = fs.readFile('./basic info/ai-rules.txt');
const schema = fs.readFile('./basic info/ai-schema.json');
const glossary = fs.readFile('./basic info/glossary.json');
const userQuery = "My internet is slow";

const fullPrompt = `
  SYSTEM: ${identity}
  RULES: ${rules}
  GLOSSARY: ${glossary}
  
  USER QUERY: "${userQuery}"
  
  INSTRUCTION: Answer the user.
`;
```

## 4. Preparation Checklist
1.  [x] **Schema**: `ai-schema.json` (Done).
2.  [x] **Identity**: `ai-identity.txt` & `ai-rules.txt` (Done).
3.  [x] **Glossary**: `glossary.json` (Done).
4.  [x] **Status Board**: `system_status_template.json` (Done).
