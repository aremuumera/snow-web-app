# Implementation Plan - Deposit, Withdrawal, Calculator, Home, and Transactions Sizing/Flow Alignment

This plan outlines the changes to bring the deposit screen, withdrawal screen, calculator screen, home page layout, and transaction history tables in the web application into complete visual and logic alignment with the mobile application's flows, styling, and APIs.

## User Review Required

> [!IMPORTANT]
> - **KYC Block on Naira Deposits**: Users must have completed KYC Verification (`verify_account === 1`) to view Naira deposit bank details. If unverified, they will see a lock modal directing them to complete their KYC.
> - **Multi-Step Withdrawal Flow**: Withdrawal now runs as a 2-step wizard on the web (Step 1: Account Number & Bank Verification; Step 2: Amount & Description), followed by Pin Confirmation and a Success Receipt screen, matching the exact expo-router flow in the mobile app.

## Proposed Changes

### 1. Sidebar & Navigation
#### [MODIFY] [Sidebar.tsx](file:///Users/user/Documents/atrader/atex-web/src/components/layout/Sidebar.tsx)
- Add "Transactions" page navigation item with the dynamic `history` icon.
- Adjust active/inactive path suffix exceptions so `"history"` icon changes colors dynamically via CSS `currentColor` (rather than appending `-active` to the SVG path).

### 2. Dashboard Home Page
#### [MODIFY] [page.tsx](file:///Users/user/Documents/atrader/atex-web/src/app/dashboard/page.tsx)
- Restructure the top row layout into a flex/grid setup:
  - Left card: **Wallet Balance Card** (displays balance, fund wallet/withdraw buttons, constrained width).
  - Right card: **Promotional Image Slider / Banner** (automatically slides through flyers/banners fetched from the backend `flyers` array in Redux state).
- Replace the simple vertical card list of transactions with a full **Recent Transactions Table** (`<table>`) showing details, reference, status badge, dates, and amounts cleanly.
- Link the quick service icons to their correct routes.

### 3. Naira & Crypto Deposit Screen
#### [MODIFY] [page.tsx](file:///Users/user/Documents/atrader/atex-web/src/app/dashboard/deposit/page.tsx)
- Check user verification status (`verify_account === 1`).
- If unverified, show the Lock screen modal (Verify your account to deposit Naira) with a CTA button to go to KYC settings.
- If verified, show virtual accounts using properties from the login user response: `unique_account`, `unique_account_bank`, and `unique_account_name` (plus `fee` and `deposit_limit`).
- Add note warnings matching the bottom info banner of the mobile app.

### 4. Cash Withdrawal Page
#### [MODIFY] [page.tsx](file:///Users/user/Documents/atrader/atex-web/src/app/dashboard/withdrawal/page.tsx)
- Recreate the multi-step cash withdrawal wizard:
  - **Step 1 (Beneficiary)**: Input 10-digit account number and choose from bank list. Call `useGetAccountNameMutation` when both are valid to resolve the name from API automatically. Offer saved/recent beneficiaries tab.
  - **Step 2 (Amount)**: Input amount with quick presets (1k, 2k, 3k, 4k presets).
  - **Step 3 (Confirmation & Pin)**: Confirm details and enter a 4-digit Transaction Pin.
  - **Step 4 (Receipt)**: Display transaction success receipt details with a "Back to Dashboard" button.

### 5. Rates Calculator
#### [MODIFY] [page.tsx](file:///Users/user/Documents/atrader/atex-web/src/app/dashboard/calculator/page.tsx)
- Recreate tab layout: **Crypto** vs **Gift Card**.
- **Crypto Tab**: Fetch crypto options from `useGetCrptoNetworkQuery`. Let user input amounts and convert instantly into Naira based on `naira_rate`.
- **Gift Card Tab**:
  - Step 1: Category selection dropdown.
  - Step 2: Country / Sub-category dropdown.
  - Step 3: Card type selection.
  - Input amount and quantity.
  - Call `useFetchGiftCardRateMutation` to fetch the live rate and display the total calculated Naira return.

## Verification Plan

### Automated Verification
- Run `npm run build` to verify there are no TypeScript, bundler, or asset errors.

### Manual Verification
- Verify the Balance Card and Flyer slider are rendered side-by-side on desktop screen widths.
- Test the lock verification modal on deposit by toggling user verification in mock states.
- Perform a dummy calculator check on both Crypto and Gift Card tabs to check rate conversions.
