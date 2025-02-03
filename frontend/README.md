# Home Budgeting App

## Problem Statement
Managing household expenses can be overwhelming, and people often struggle to create a budget and track their spending.

## Solution
A Home Budgeting App that allows users to track their household expenses, create budgets, and save money by staying within their budget.

## Features
- **User Registration**: Users can register to start tracking their budget.
- **Login**: Users can log in to manage their budget and expenses.
- **Add Expense**: Users can add expenses to track where their money is going.
- **View Expenses**: Users can see a list of their expenses.
- **Set Budget**: Users can set budgets for different categories (e.g., groceries, entertainment).
- **View Budget Status**: Users can see how much they have spent against their budget.
- **Edit Expense**: Users can edit or delete an expense entry.
- **Track Savings**: Users can track how much they have saved in a month.
- **View Reports**: Users can view reports on their spending habits.
- **Change Password**: Users can change their password for security purposes.

## Data Models
### User Model
- **user_id** (Primary Key)
- **email** (Unique)
- **password** (Hashed)

### Expense Model
- **expense_id** (Primary Key)
- **user** (Foreign Key to User)
- **category** (e.g., food, rent, utilities)
- **amount**
- **date**

### Budget Model
- **budget_id** (Primary Key)
- **user** (Foreign Key to User)
- **category**
- **limit**
- **current_spent**

## Technologies Used
- **Frontend**: React (Vite) with Tailwind CSS
- **Backend**: Flask
- **Database**: PostgreSQL / SQLite

## Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/home-budget-app.git
   cd home-budget-app
   ```
2. Install dependencies:
   ```bash
   npm install  # For frontend
   pip install -r requirements.txt  # For backend
   ```
3. Run the backend:
   ```bash
   flask run
   ```
4. Run the frontend:
   ```bash
   npm run dev

   ```
### Record Cast Link
https://drive.google.com/file/d/1qXUMAJGnLI4agWk8LxzMNAy8EOcJGOcw/view


## Usage
1. Register and log in to your account.
2. Add your expenses and categorize them.
3. Set budgets for different categories.
4. Monitor your spending and savings.
5. View detailed reports on your expenses.

## Contributing
Feel free to submit pull requests or report issues.

## License
MIT License

