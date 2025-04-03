const transactions = [];
let sortDirection = 'desc'; // newest first by default

document.getElementById('form').addEventListener('submit', addTransaction);
document.getElementById('sort-btn').addEventListener('click', toggleSort);

function addTransaction(e) {
  e.preventDefault();

  const text = document.getElementById('text').value.trim();
  const amount = parseFloat(document.getElementById('amount').value);
  const category = e.submitter.textContent.split(' ')[1];

  if (text === '' || isNaN(amount)) {
    alert('Please add a text and amount');
  } else {
    const transaction = {
      id: generateID(),
      text,
      amount: category === 'expense' ? -Math.abs(amount) : Math.abs(amount),
      category,
      date: new Date().toISOString(), // Store the current date and time
    };

    transactions.push(transaction);
    
    filterTransactions();
    updateBalance();
    updateIncomeExpenses();
    updateTimeStats();
    updateLocalStorage();
    updateLastUpdate();
    document.getElementById('form').reset();
  }
}

function generateID() {
  return Math.floor(Math.random() * 100000000);
}

function formatDate(dateString) {
  const options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric', 
    hour: '2-digit', 
    minute: '2-digit' 
  };
  return new Date(dateString).toLocaleDateString('en-US', options);
}

function formatTimeAgo(dateString) {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else {
    return formatDate(dateString);
  }
}

function addTransactionDOM(transaction) {
  const sign = transaction.amount < 0 ? '-' : '+';
  const item = document.createElement('li');

  item.classList.add(transaction.amount < 0 ? 'minus' : 'plus');
  
  const formattedDate = formatTimeAgo(transaction.date);
  
  item.innerHTML = `
    <div class="transaction-info">
      <div class="transaction-text">${transaction.text}</div>
      <div class="transaction-amount">${sign} &#8377; ${Math.abs(transaction.amount)}</div>
    </div>
    <div class="transaction-details">
      <span class="transaction-date">${formattedDate}</span>
      <button class="delete-btn" onclick="removeTransaction(${transaction.id})">
        <i data-lucide="badge-x" class="lucide"></i>
      </button>
    </div>
  `;

  document.getElementById('list').appendChild(item);
}

function removeTransaction(id) {
  const index = transactions.findIndex(transaction => transaction.id === id);
  if (index !== -1) {
    transactions.splice(index, 1);
    updateDOM();
    updateBalance();
    updateIncomeExpenses();
    updateTimeStats();
    updateLocalStorage();
    updateLastUpdate();
  }
}

function updateDOM(transactionsToDisplay = transactions) {
  const list = document.getElementById('list');
  list.innerHTML = '';
  
  // Sort transactions by date
  const sortedTransactions = [...transactionsToDisplay].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  sortedTransactions.forEach(addTransactionDOM);
  lucide.createIcons();
}

function updateBalance() {
  const balance = transactions.reduce((acc, transaction) => acc + transaction.amount, 0);
  document.getElementById('balance').innerHTML = `&#8377;${balance.toFixed(2)}`;
}

function updateIncomeExpenses() {
  const amounts = transactions.map(transaction => transaction.amount);
  const income = amounts
    .filter(amount => amount > 0)
    .reduce((acc, amount) => acc + amount, 0);
  const expense = amounts
    .filter(amount => amount < 0)
    .reduce((acc, amount) => acc + amount, 0) * -1;

  document.getElementById('money-plus').innerHTML = `+&#8377;${income.toFixed(2)}`;
  document.getElementById('money-minus').innerHTML = `-&#8377;${expense.toFixed(2)}`;
  lucide.createIcons();
}

function updateTimeStats() {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  // Calculate expenses for different time periods
  const todayExpense = transactions
    .filter(t => t.amount < 0 && new Date(t.date) >= today)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    
  const weekExpense = transactions
    .filter(t => t.amount < 0 && new Date(t.date) >= startOfWeek)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
    
  const monthExpense = transactions
    .filter(t => t.amount < 0 && new Date(t.date) >= startOfMonth)
    .reduce((acc, t) => acc + Math.abs(t.amount), 0);
  
  // Update the DOM
  document.getElementById('today-expense').innerHTML = `&#8377;${todayExpense.toFixed(2)}`;
  document.getElementById('week-expense').innerHTML = `&#8377;${weekExpense.toFixed(2)}`;
  document.getElementById('month-expense').innerHTML = `&#8377;${monthExpense.toFixed(2)}`;
}

function updateLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
}

function filterTransactions() {
  const filterValue = document.getElementById('filter').value;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    
    if (filterValue === 'all') return true;
    if (filterValue === 'income') return transaction.amount > 0;
    if (filterValue === 'expense') return transaction.amount < 0;
    if (filterValue === 'today') return transactionDate >= today;
    if (filterValue === 'this-week') return transactionDate >= startOfWeek;
    if (filterValue === 'this-month') return transactionDate >= startOfMonth;
    return false;
  });
  
  updateDOM(filteredTransactions);
}

function toggleSort() {
  sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
  const icon = document.querySelector('#sort-btn i');
  
  if (sortDirection === 'desc') {
    icon.setAttribute('data-lucide', 'arrow-down');
  } else {
    icon.setAttribute('data-lucide', 'arrow-up');
  }
  
  filterTransactions();
  lucide.createIcons();
}

function updateLastUpdate() {
  const lastUpdate = new Date();
  document.getElementById('last-update').textContent = lastUpdate.toLocaleString();
}

function updateCurrentYear() {
  const currentYear = new Date().getFullYear();
  document.getElementById('current-year').textContent = currentYear;
}

// Initialize the app
function init() {
  const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
  if (localStorageTransactions) {
    transactions.push(...localStorageTransactions);
  }
  updateDOM();
  updateBalance();
  updateIncomeExpenses();
  updateTimeStats();
  updateCurrentYear();
  updateLastUpdate();
  lucide.createIcons();

  // Add event listener for filter dropdown
  document.getElementById('filter').addEventListener('change', filterTransactions);
}

init();