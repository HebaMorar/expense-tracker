// Expense Tracker - frontend logic

// PHASE 2
// Your backend from Phase 1 is already running, with real expenses in the
// database (from schema.sql). Build this page directly against it with
// fetch and async/await - there is no in-memory or localStorage stage
// this time, and no sample data file.
//
// A possible structure (change it if you have a better idea):

//const API_URL = "http://localhost:3000/api/expenses";

//خليت الكود يتعرف  على البيئة الي رح ستشغل عليها الموقع شو ماكانت  حسب ال ip
let API_URL;

if (window.location.hostname.includes('ngrok')) {
    // إذا كنت فاتح من رابط ngrok
    API_URL = '/api/expenses'; // أو رابط الـ ngrok كاملاً إذا لزم الأمر
} else if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // إذا كنت عللى localhost
    API_URL = 'http://localhost:3000/api/expenses';
} else {
    // إذا كنت فاتح من الهاتف عبر الـ IP المحلي للكمبيوتر (مثل 192.168.x.x)
    // سيأخذ الاي بي الحالي للجهاز تلقائياً مع بورت السيرفر 3000
    API_URL = `http://${window.location.hostname}:3000/api/expenses`;
}


let allExpense=[];
let expenseChartInstance = null;
//DOM
const tableBody=document.getElementById('tableBody');
const expenseForm = document.getElementById('expenseForm');
const categoryFilter = document.getElementById('categoryFilter');
const categorySelect = document.getElementById('category');
const searchInput = document.getElementById('searchInput');
const dateInput = document.getElementById('date');

if(dateInput){
const today = new Date().toISOString().split('T')[0];
    dateInput.value = today; // يضع تاريخ اليوم
    dateInput.min = today;   // يمنع اختيار أي تاريخ أقدم من اليوم
}
//استخدمت هون ال bootstrab alert   لحتى نظهر ونخفي spinner لما تصير عملية الfetch data 
function toggleSpinner(show) {
    let spinner = document.getElementById('loadingSpinner');
    if (!spinner && show) {
        spinner = document.createElement('div');
        spinner.id = 'loadingSpinner';
        spinner.className = 'text-center my-3';
        spinner.innerHTML = `<div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>`;
        document.querySelector('.container').prepend(spinner);
    }
    if (spinner) {
        spinner.style.display = show ? 'block' : 'none';
    }
}
//alert bootstrab مشان يطلع ؤسائل خطا او نجاح 
function showAlert(message,type='danger'){
let alertContainer = document.getElementById('alertContainer');
    if (!alertContainer) {
        alertContainer = document.createElement('div');
        alertContainer.id = 'alertContainer';
        alertContainer.className = 'container mt-3';
        document.body.insertBefore(alertContainer, document.body.firstChild);
    }
    alertContainer.innerHTML = `
        <div class="alert alert-${type} alert-dismissible fade show shadow-sm rounded-4" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
}
//   - async function getExpenses()          fetch(API_URL), return the JSON
//
async function getExpenses() {
    toggleSpinner(true);
    try {
        const response = await fetch(API_URL);//عملنا fetch وطلبنا الداتا من api-url واستخدما ال async,await 
        if (!response.ok) throw new Error('Failed to fetch data from the server');//cheak fetch 
        const data = await response.json();
        allExpenses = data;
        return data;
    } catch (error) {
        console.error(error);
        showAlert('Error connecting to server to fetch transactions');
        return [];
    } 
    //بوقف ال spinner حتى لو صار مشكلة بعملية ال fetch
    finally {
        toggleSpinner(false);
    }
}
//   - async function addExpense(data)       fetch(API_URL, { method: "POST", ... })

async function addExpense(data) {
    toggleSpinner(true);
    try {//ارسال طلب post to server وبحولها ل json 
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed add Expense ');
        await refresh();//بعمل refresh للتحديث الداتا 
    } catch (error) {
        console.error(error);
        showAlert('Failed save new Expense');
    } finally {
        toggleSpinner(false);
    }
}

//   - async function updateExpense(id,data) fetch(API_URL + "/" + id, { method: "PUT", ... })
async function updateExpense(id, data) {
    toggleSpinner(true);
    try {//رسال طلب put للتعديل باستخدام ال id
        const response = await fetch(`${API_URL}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed update Expense');
        await refresh();
    } catch (error) {
        console.error(error);
        showAlert('Failed update Expense');
    } finally {
        toggleSpinner(false);
    }
}
      
//   - async function deleteExpense(id)      fetch(API_URL + "/" + id, { method: "DELETE" })
async function deleteExpense(id) {
    //رسالة تاكيد لليوزر اذا بدو يحذف
    if (!confirm('Are you sure you want to delete this transaction?')) return;
    toggleSpinner(true);
    try { // اذا وافق برسل طلب للسيرفر DELETE عشان الحذف 
        const response = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error('Failed delete Expense');
        await refresh();
    } catch (error) {
        console.error(error);
        showAlert('Failed delete Expense');
    } finally {
        toggleSpinner(false);
    }
}
//   - async function refresh()              get the list, then call renderTable and renderSummary
async function refresh() {
    const list = await getExpenses();
    loadCategories(list); // في الصفحة الرئيسية ما تحطيت الcategry في list عملت فانكش عشان اعبي ال categry بشكل تلقائي 
    applyFilter();       // تطبيق الفلتر وعرض الجدول والملخص
}

//loadCategories function ادارة وتعبئة ال categrory dynamiclly من ال api 
function loadCategories(list) {
    if (!categoryFilter || !categorySelect) return;

    const uniqueCategories = [...new Set(list.map(item => item.category))];//بتجيب ال cat من db باستخدام ال set بدون تكرار
    const currentFilterVal = categoryFilter.value;
    const currentSelectVal = categorySelect.value;

    categoryFilter.innerHTML = '<option value="All">All</option>';//تعبئة ال خيارات داخل ال select
    uniqueCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categoryFilter.appendChild(opt);
    });
    if (currentFilterVal) categoryFilter.value = currentFilterVal;

    categorySelect.innerHTML = '';
    uniqueCategories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        categorySelect.appendChild(opt);
    });
    if (currentSelectVal) categorySelect.value = currentSelectVal;
}
//   - renderTable(list)                     build the table rows from the array the API returned
function renderTable(list) {
    if (!tableBody) return;
    tableBody.innerHTML = '';

    if (list.length === 0) {//cheack list
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-4">No transactions found</td></tr>`;
        renderSummary([]);
        return;
    }

    list.forEach(item => {//for عشان امر على كل العناصر  ,لكل عنصر بنشى صف
        const tr = document.createElement('tr');

        const tdTitle = document.createElement('td');//td title
        tdTitle.className = 'fw-medium text-dark';
        tdTitle.textContent = item.title;

        const tdAmount = document.createElement('td');
        tdAmount.className = 'fw-bold text-dark-purple';
        tdAmount.textContent = `${Number(item.amount).toFixed(2)} JOD`; //td amount (float)+ jod عملة 

        const tdCategory = document.createElement('td');//td Category
        const badge = document.createElement('span');
        badge.className = 'badge px-2 py-1';
        badge.style.backgroundColor = '#f3e8f4';
        badge.style.color = '#8F659A';
        badge.textContent = item.category;
        tdCategory.appendChild(badge);

        const tdDate = document.createElement('td');//td Date 
        tdDate.className = 'text-muted';
        tdDate.textContent = item.date ? item.date.split('T')[0] : '--';

        const tdActions = document.createElement('td');//td Actions
        tdActions.className = 'text-center';

        const editBtn = document.createElement('button');//update buuton اذا ضغط على الزر بتم استدعاء دالة التعديل
        editBtn.className = 'btn btn-sm btn-outline-primary me-1';
        editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
        editBtn.onclick = () => {
            const newTitle = prompt('Upadte title', item.title);
            const newAmount = prompt('Update ampunt:', item.amount);
            if (newTitle !== null && newAmount !== null) {
                updateExpense(item.id, {
                    title: newTitle,
                    amount: parseFloat(newAmount),
                    category: item.category,
                    date: item.date
                });
            }
        };

        const deleteBtn = document.createElement('button');//اضافى زر حذف وعمد الضغط بستعدي دالة الحذف 
        deleteBtn.className = 'btn btn-sm btn-outline-danger';
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
        deleteBtn.onclick = () => deleteExpense(item.id);

        tdActions.appendChild(editBtn);
        tdActions.appendChild(deleteBtn);

        tr.appendChild(tdTitle);
        tr.appendChild(tdAmount);
        tr.appendChild(tdCategory);
        tr.appendChild(tdDate);
        tr.appendChild(tdActions);

        tableBody.appendChild(tr);
    });

    renderSummary(list);
}
//   - renderSummary(list)                   update the summary cards
function renderSummary(list) {
    renderChart(list);
    const totalAmountEl = document.getElementById('totalAmount');
    const totalCountEl = document.getElementById('totalCount');
    const expensesCountCardEl = document.getElementById('expensesCountCard');
    const highestExpenseEl = document.getElementById('highestExpense');
    const highestTitleEl = document.getElementById('highestTitle');

    const total = list.reduce((sum, item) => sum + Number(item.amount), 0);//حساب االمحموع لكل عاصر القائمة 

    if (totalAmountEl) totalAmountEl.textContent = `${total.toFixed(2)} JOD`;//عرض المجموع  بالتنسق العشري 
    if (totalCountEl) totalCountEl.textContent = list.length;//total CountEl
    if (expensesCountCardEl) expensesCountCardEl.textContent = list.length;//expensesCountCardEl

    if (list.length > 0) {//highestExpenseEl
        const highest = list.reduce((max, item) => Number(item.amount) > Number(max.amount) ? item : max, list[0]);
        if (highestExpenseEl) highestExpenseEl.textContent = `${Number(highest.amount).toFixed(2)} JOD`;
        if (highestTitleEl) highestTitleEl.textContent = highest.title;
    } else {
        if (highestExpenseEl) highestExpenseEl.textContent = '0.00 JOD';
        if (highestTitleEl) highestTitleEl.textContent = '--';
    }
}
//   - applyFilter()                         re-render with the list filtered by category
const monthFilter = document.getElementById('monthFilter');

function applyFilter() {
    const selectedCategory = categoryFilter ? categoryFilter.value : 'All';
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedMonth = monthFilter ? monthFilter.value : ''; // بصيغة YYYY-MM

    const filtered = allExpenses.filter(item => {
        const matchesCategory = (selectedCategory === 'All' || item.category === selectedCategory);
        const matchesSearch = item.title.toLowerCase().includes(searchTerm);
        // التحقق مما إذا كان تاريخ المصروف يبدأ بنفس الشهر المختار
        const matchesMonth = selectedMonth ? item.date.startsWith(selectedMonth) : true;
        return matchesCategory && matchesSearch && matchesMonth;
    });

    renderTable(filtered);
}

if (monthFilter) monthFilter.addEventListener('change', applyFilter);

//
let sortDirection = false; // لتحديد اتجاه الترتيب (تصاعدي/تنازلي)

function sortTable(column) {
    sortDirection = !sortDirection;
    allExpenses.sort((a, b) => {
        let valA = a[column];
        let valB = b[column];
        if (column === 'amount') {
            valA = Number(valA);
            valB = Number(valB);
        }
        return sortDirection ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
    applyFilter(); // إعادة عرض الجدول بالترتيب الجديد مع الحفاظ على الفلاتر
}

//
function exportToCSV() {
    if (allExpenses.length === 0) {//cheack اذا القاائمة فارغة اولا
        showAlert('No data available to export');
        return;
    }
    // بناء محتوى ملف الـ CSV
    let csvContent = "data:text/csv;charset=utf-8,Title,Amount,Category,Date\n";//header
    allExpenses.forEach(item => {
        csvContent += `"${item.title}",${item.amount},"${item.category}",${item.date ? item.date.split('T')[0] : ''}\n`;//تمر على كل العناصر  
    });

    // إنشاء رابط وهمي والنقر عليه  لتحميل الملف
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "expenses_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
// Don't forget:
//   - Show a Bootstrap spinner while a request is in flight.
//   - Wrap every fetch call in try/catch, and show a Bootstrap alert on failure.
//   - After add, edit, or delete, call refresh() so the page always shows
//     what the server actually saved - never update the table by hand.
//   - The API is at http://localhost:3000/api/expenses (see the Roadmap).




if (expenseForm) {
    expenseForm.addEventListener('submit', async (e) => {
        e.preventDefault();// لما تصير عملية الارسال المصفحة ما تعمل efresh 
        const newExpense = {//حمعنا اللداتا ل عشان ال chart
            title: document.getElementById('title').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: categorySelect.value,
            date: document.getElementById('date').value
        };
        await addExpense(newExpense);
        expenseForm.reset();//ال input بصير فارغ 
        if (dateInput) dateInput.valueAsDate = new Date();//لما تصير عملية حذف ال input بنعاود نهيئ التاريخ ليكون تاريخ اليوم 
    });
}

if (categoryFilter) {
    categoryFilter.addEventListener('change', applyFilter);
}

if (searchInput) {
    searchInput.addEventListener('input', applyFilter);
}


function renderChart(list) {
    const canvasElement = document.getElementById('expenseChart');
    if (!canvasElement) return;

    // تجميع المصاريف حسب Category
    const categoryTotals = {};
    list.forEach(item => {
        const cat = item.category || 'Other';
        const amt = Number(item.amount) || 0;
        categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
    });

    const labels = Object.keys(categoryTotals);
    const dataValues = Object.values(categoryTotals);

    // إذا كان الرسم مفعلاً مسبقا نقوم بتحديث
    if (expenseChartInstance) {
        expenseChartInstance.destroy();
    }

    const backgroundColors = [
        '#8F659A', '#b388be', '#d1b3db', '#e6d0ed', '#6a4575', '#4d2e54'
    ];

    expenseChartInstance = new Chart(canvasElement, {
        type: 'doughnut', // رسم بياني دائري 
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                }
            }
        }
    });
}

//dark mode
if (localStorage.getItem('darkMode') === 'true') {
    document.body.classList.add('dark-mode');
    updateDarkModeIcon(true);
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDark); // حفظ الخيار
    updateDarkModeIcon(isDark);
}

function updateDarkModeIcon(isDark) {
    const btn = document.getElementById('darkModeBtn');
    if (btn) {
        btn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
    }
}
refresh();//كل ما تنفتح الصفحة بعمل fetch api , update chart , update categry 
