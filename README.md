# HITHATA IDAK — A Safe Place to Talk (හිතට ඉඩක්)

> **"A Safe Place to Talk, When You Need Someone to Listen."**  
> **"You Deserve to Be Heard."**

**Hithata Idak** is a free, privacy-focused, human-to-human emotional listening and peer support web platform tailored for Sinhala- and English-speaking individuals, initially focused on Sri Lanka. 

The service provides a safe, welcoming online space where people experiencing loneliness, relationship heartache, family pressure, academic strain, or overwhelming feelings can share their thoughts and receive compassionate emotional listening from trained human volunteers.

---

## 1. Core Principles & Safeguards

- **Real Human Support:** Real, empathetic human volunteers. No automated bots, generic therapy chatbots, or algorithmic substitutes for human empathy.
- **Support Boundaries:** Hithata Idak is an **emotional listening and peer-support service**, *not* a medical, diagnostic, psychotherapeutic, or emergency response service. Volunteers do not prescribe medication, diagnose mental illnesses, or replace licensed clinicians.
- **Immediate Crisis Safeguards:** Prominently surfaces the **1926 Sri Lanka National Mental Health Helpline (Toll-Free, 24/7)**, the National Institute of Mental Health (NIMH), and Sumithrayo (011 269 2909) across all pages.
- **Honest Volunteer Availability:** Displays live supporter availability based on real volunteer presence in the database (`Supporters Available`, `All Supporters Busy`, `Currently Offline`). Never displays artificial online presence.
- **Controlled Closed-Pilot Mode:** The application features a dedicated, transparent banner indicating pilot phase status until volunteer cohorts undergo full verification and clinical oversight.

---

## 2. Privacy & Security Architecture

1. **Complete Anonymity:** Visitors never enter a full name, email address, phone number, home address, or social media handle to start chatting.
2. **Unpredictable Ticket References:** Cryptographically random alphanumeric references (e.g. `HID-7F2K9M`) using non-confusing character sets. Never sequential.
3. **Private Recovery Credential System:**
   - A private high-entropy key (`REC-XXXX-XXXX-XXXX`) is generated and shown **once** to the visitor.
   - The ticket reference alone **never** grants access to conversation messages.
   - Only a salted HMAC-SHA256 verifier hash is stored on the server—plaintext recovery codes are never stored.
4. **Encrypted at Rest (AES-256-GCM):**
   - Every conversation message is encrypted using AES-256-GCM with a 12-byte initialization vector (IV) and 16-byte authentication tag.
   - Message text is never stored in plaintext in the database and never logged to server consoles or analytics.
5. **Permanent Data Shredding (PDPA Compliance):**
   - In accordance with the **Sri Lankan Personal Data Protection Act (PDPA No. 9 of 2022)**, visitors can close their conversation and request immediate data deletion.
   - Executing deletion permanently shreds encrypted messages, initialization vectors, authentication tags, and access credentials from the server.
6. **Role-Based Volunteer Authorization:**
   - Volunteers can only view waiting queue tickets or tickets assigned to themselves. They cannot browse other volunteers' private chats.
   - Privileged administrative and supervisory actions are logged to a privacy-preserving audit trail (zero message content logged).

---

## 3. Technology Stack

- **Frontend:** Next.js (App Router), React 19, TypeScript, Tailwind CSS, Lucide icons.
- **Backend:** Next.js Server Route Handlers, Node.js Crypto (AES-256-GCM, HMAC-SHA256, scrypt password hashing).
- **Database:** SQLite via Node.js native `DatabaseSync` (with WAL mode, 30s busy timeout, and relational foreign keys) in development/local environments, with ready migration pathways to PostgreSQL / Neon via `DATABASE_URL`.
- **Validation:** Zod schemas on all API endpoints.

---

## 4. Platform Structure

### Public Pages (5 Core Pages)
1. **Home (`/`)**: Scenic hero with natural light, trust indicators, "You Don't Have to Carry Everything Alone" (6 topic cards), "How It Works" (4 transparent steps), "Why Hithata Idak?", and team message.
2. **Start Chat (`/chat`)**: Core anonymous messaging system. Language selector (Sinhala, English, Singlish), preference selector, live volunteer availability status, real-time message stream, typing indicators, one-time recovery key banner, "Resume Conversation" flow, and post-chat feedback/data deletion.
3. **Our Story (`/story`)**: Why we exist, mission & vision, 5 core values (Compassion, Respect, Privacy, Inclusivity, Responsibility), transparent team governance notes, and a working volunteer expression-of-interest onboarding form.
4. **Safety & Privacy (`/safety`)**: 10 detailed policy sections, Sri Lanka PDPA grounding, emergency hotlines (1926 / Sumithrayo), child/teen safeguarding, and a direct incident reporting form.
5. **Help & Resources (`/resources`)**: 8 evidence-informed self-care guide articles with full reader modal, 10-point FAQ accordion, verified emergency hotlines directory, and general contact/feedback form.

### Protected Supporter & Admin Dashboard (`/portal`)
- **Portal Login (`/portal/login`)**: Role-based authentication and MFA flow.
- **Queue & Active Chats Console**: Live visitor-supporter messaging, real-time typing indicators, empathetic prompt cheatsheet, priority/safety flagging, assignment controls, and ticket closure.
- **Volunteer Guidelines**: Complete operational handbook on nonjudgmental listening, boundaries, and crisis escalation.
- **Incident Reports Queue**: Supervisor triage for user reports.
- **Privacy & Deletion Requests**: 1-click execution of permanent message shredding.
- **Volunteer Onboarding Review**: Review and manage applicant status from the Our Story form.
- **Team Management (Admin)**: Add approved volunteers and assign roles.
- **Platform Settings & Audit Logs**: Configure operating hours, pilot status, and review privacy-preserving administrative audit logs.

---

## 5. Getting Started & Local Development

### Prerequisites
- Node.js 22+ or Node.js 24+
- npm 10+

### Installation
```bash
# Clone the repository
git clone <repo-url>
cd "Mental Health Web"

# Install dependencies
npm install

# Run automated security and logic test suite
npm test

# Start local development server
npm run dev
```

Visit `http://localhost:3000` to explore the public platform.

---

## 6. Seed Credentials for Portal Testing

The local database is automatically initialized and seeded with test accounts for each role:

| Role | Email | Password |
|---|---|---|
| **Volunteer Supporter** | `supporter@hithataidak.lk` | `SupporterSafePassword2026!` |
| **Senior Supervisor** | `supervisor@hithataidak.lk` | `SupervisorSafePassword2026!` |
| **Lead Administrator** | `admin@hithataidak.lk` | `AdminSafePassword2026!` |

Access the dashboard at `http://localhost:3000/portal/login`. Use the pre-filled shortcuts on the login page for rapid switching.

---

## 7. Running Automated Tests

The platform includes an automated security test suite verifying:
- Unpredictable ticket reference generation
- Recovery credential verification (asserting ticket reference alone fails)
- AES-256-GCM encryption and decryption in English and Sinhala Unicode
- Message ordering and lifecycle
- Permanent data shredding
- Role-based volunteer authentication and password salting
- Real-time availability calculation

```bash
npm test
```

---

## 8. Launch-Readiness & Governance Checklist

| Requirement | Status | Notes |
|---|---|---|
| 5 Public Responsive Pages | Completed | WCAG 2.2 AA compliant, responsive layout, soothing palette |
| Anonymous Ticket System | Completed | Crypto-random reference, recovery key, hash verifier |
| AES-256-GCM Encryption | Completed | Authenticated encryption at rest for all messages |
| Real Supporter Messaging | Completed | Typing indicators, status badges, assignment console |
| Supporter & Admin Dashboard | Completed | Role-based controls, guidelines, reports, settings |
| Emergency Hotlines (1926) | Completed | Prominent on every page with direct call links |
| Sinhala, English, Singlish Input | Completed | Native Unicode and Singlish support in chat |
| Data Deletion Workflow | Completed | Permanent cryptographic shredding upon request |
| Formal Clinical Oversight | Pending Review | Must be finalized with registered clinicians prior to public pilot |
| Volunteer Cohort Screening | In Progress | Requires background checks and interview protocol |
| Legal Policy Review | Pending Review | Formal legal sign-off against Sri Lankan PDPA Gazette |

---

*Hithata Idak — Built with compassion. Designed for trust. Protecting every conversation.*

## Recent interface and chat improvements

- Home now follows the supplied sunrise/lavender reference, with topic links that preselect the chat topic.
- `/chat` supports a topic choice or the visitor's own words, with bounded polling, recoverable network errors, independent tab sessions, and a scrollable message history.
- `/donate` explains voluntary support for Hithata Idak. Its WhatsApp link asks the team for current donation details using the configured support number; it opens a conversation and does not take a payment. No bank account, card form, tax benefit, or allocation guarantee is invented. Chat access remains free regardless of whether a visitor gives.
- For optional WhatsApp support, set `NEXT_PUBLIC_WHATSAPP_NUMBER` in `.env.local` to the real support number in international format (country code, no leading local zero). Restart the development server after changing it and rebuild for production. With no configured number, the interface explains that web chat is available. Opening WhatsApp shares the visitor's WhatsApp phone number with the support account; conversation contents are not forwarded automatically.
- Supporter availability is based on recent portal presence. An open supporter portal refreshes its presence; stale presence expires after 90 seconds. Never assume a reply is immediate.
- `npm test` runs isolated in-memory security/system checks. With a local development server running, `npx tsx tests/chat-api-suite.ts` verifies visitor/supporter messaging, per-tab authorization, typing, recovery, closure, and deletion. It creates and cleans up only its own test conversations.
- `public/images/ATTRIBUTION.md` records the official hospital photo source; `public/images/GENERATION.md` records the generated landscape prompt.

## Admin workflow verification (2026-11-04)

The portal includes working conversation assignment/reply controls, incident and volunteer application review with notes, volunteer activation/approval controls, feedback, settings, privacy requests, and audit history. Account suspension/revocation invalidates existing sessions. Application approval and creating a volunteer login remain separate actions.

Implemented authentication is email/password. MFA and self-service password recovery are not implemented. Retention days are a saved policy value; scheduled automatic cleanup is not configured. Process requested deletions through the portal.

After a production build, run `npx tsx tests/admin-api-suite.ts` for nine isolated HTTP workflow checks. The suite starts its own temporary server with an in-memory database and does not change live records.

The short English introduction video and subtitles are in `output/video/`. Readability screenshots are in `output/qa/`.
