# 📬 MelMe - Your Personal & Professional Email Management System

Welcome to **MelMe**! Whether you are a business owner, a freelancer, or someone who just loves keeping their digital life organized, MelMe is built to give you complete control over your custom emails, domains, and private mailboxes. 

---

## 🤔 What is MelMe?

MelMe is a modern, all-in-one email routing and mailbox management platform. Imagine having your own personal digital post office:
- You can bring your own custom web addresses (like `hello@yourwebsite.com`).
- You can create multiple "aliases" (like `support@`, `sales@`, `newsletter@`) and decide exactly where those emails should go.
- You can either **forward** these emails directly to your everyday personal email (like Gmail or Yahoo), OR you can route them into dedicated **Mailboxes** inside MelMe.
- MelMe features a beautifully designed **My Mailbox** app, where you can read, reply, and manage your emails just like you would on any popular email service, without cluttering your personal inbox.

In simple terms, MelMe helps you look professional with custom email addresses while keeping your actual personal inbox clean, organized, and secure.

---

## 🎯 Why was this system built?

Managing custom domain emails often requires paying for expensive monthly subscriptions for every single user or inbox (like Google Workspace or Office 365). On top of that, setting up email forwarding and keeping track of multiple alias addresses across different platforms can be incredibly technical, confusing, and messy. 

MelMe was built to solve this by providing:
1. **Cost-Efficiency:** Manage multiple domains, unlimited aliases, and distinct mailboxes all from a single account without paying per-user fees.
2. **Privacy & Security:** Hide your real personal email address behind aliases. If a website starts spamming you, just turn off or delete the alias!
3. **Simplicity:** A beautifully simple, non-technical dashboard to manage everything from domain settings to reading your daily emails.
4. **Independent Mailboxes:** The ability to create a "Mailbox" with its own unique username and password. You can give this login to a team member or employee so they can handle emails, without giving them access to your main admin dashboard.

---

## 💻 Tech Stack

While MelMe is designed to be incredibly easy for anyone to use, under the hood it is powered by cutting-edge, enterprise-grade technology to ensure it is fast, secure, and highly reliable:

* **Frontend & Backend:** [Next.js](https://nextjs.org/) - For a lightning-fast, seamless user experience.
* **Database:** PostgreSQL with [Prisma](https://www.prisma.io/) - To securely store users, mailboxes, and email logs.
* **Email Infrastructure:** [AWS SES](https://aws.amazon.com/ses/) (Amazon Simple Email Service) - For reliable receiving and sending of emails globally.
* **Storage:** [AWS S3](https://aws.amazon.com/s3/) - For securely storing your email attachments.
* **Authentication:** [Better-Auth](https://better-auth.com/) & Passkeys - For bank-level security, Two-Factor Authentication (2FA), and passwordless logins.
* **Styling & UI:** Tailwind CSS, Radix UI, and Framer Motion - For a beautiful, accessible, and smoothly animated interface.

---

## 🗺️ Platform Overview & Features

MelMe is divided into a few key areas. Here is a breakdown of all the pages and what you can do on them:

### 1. Security & Authentication Pages
Secure access to your MelMe account.
* **`/login` & `/register`:** Create your main admin account or log in securely.
* **`/forget-password` & `/reset-password`:** Easily recover your account if you forget your password.
* **`/2fa` (Two-Factor Authentication):** An extra layer of security requiring a temporary code from your phone to log in.

### 2. Admin Dashboard
The command center for the account owner.
* **`/domains` (Domains):** Add your custom web domains. MelMe guides you simply on how to verify them so you can start sending and receiving emails on your own domain.
* **`/aliases` (Aliases):** Create unlimited email addresses for your domains. You can set them to forward to your personal email, or route them directly into a MelMe Mailbox.
* **`/mailboxes` (Mailboxes):** Create standalone inboxes. For example, you can create a "Support Team" mailbox with its own unique password, entirely separate from your admin account.
* **`/profile` (Profile):** Manage your personal details, turn on Two-Factor Authentication, and manage Passkeys (using your fingerprint or face to log in).

### 3. 💌 My Mailbox (The Core Experience)
This is the heart of MelMe for everyday use. A user or team member can log directly into a specific Mailbox to read and send emails, completely separated from the Admin Dashboard. 

* **`/my-mailbox/inbox` (Inbox):** 
  * The main page where all incoming emails arrive.
  * Read complete email threads, view rich HTML content, and easily download file attachments.
  * See the exact status of your emails in real-time.
* **`/my-mailbox/sent` (Sent):** 
  * Keep track of every reply and email you have sent out from this specific mailbox.
* **`/my-mailbox/settings` (Mailbox Settings):** 
  * Customize how your mailbox behaves. 
  * Set your "Sender Name" (e.g., "John from Support") so people know exactly who the email is from.
  * Manage mailbox tags, display names, and descriptions to stay organized.
* **`/my-mailbox/reset-password`:** 
  * Easily and securely update the password for this specific mailbox whenever needed.

*(Note: Step-by-step tutorials and images covering each section will be added here soon!)*

---

### 🚀 Getting Started for Developers

If you are a developer looking to run MelMe locally to contribute or test:

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```
2. Set up your `.env` file with your PostgreSQL database URL, AWS credentials, and Auth secrets.
3. Run database migrations:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000](http://localhost:3000) in your browser.

---
*Built with ❤️ to make custom email management an absolute breeze.*
