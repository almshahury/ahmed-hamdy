// script.js - نسخة محدثة تدعم تسجيل الدخول بأدوار مختلفة (admin / agent)

const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!currentUser && window.location.pathname.includes('index.html')) {
  window.location.href = 'login.html';
}

const toggle = document.getElementById('darkModeToggle');
if (toggle) {
  toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', toggle.checked);
    localStorage.setItem('darkMode', toggle.checked);
  });
  const darkMode = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', darkMode);
  toggle.checked = darkMode;
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
});

const menuBtn = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebarMenu');
menuBtn?.addEventListener('click', () => {
  sidebar.classList.toggle('show');
  document.body.classList.toggle('overlay');
});
window.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('show');
    document.body.classList.remove('overlay');
  }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    sidebar?.classList.remove('show');
    document.body.classList.remove('overlay');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'agent1', password: 'agent123', role: 'agent' }
    ]));
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const roles = btn.dataset.roles?.split(',') || [];
    if (roles.length && !roles.includes(currentUser?.role)) {
      btn.style.display = 'none';
    }
  });

  loadEmployees();
  loadShipments();
  loadNotifications();
  renderCharts();
});

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  document.getElementById('toastContainer')?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function loadEmployees() {
  const employees = JSON.parse(localStorage.getItem('employees') || '[]');
  const table = document.getElementById('employeesTable')?.querySelector('tbody');
  if (!table) return;
  table.innerHTML = '';
  employees.forEach(emp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp.name}</td>
      <td>${emp.code}</td>
      <td>${emp.role}</td>
      <td><button class="action-btn" onclick="deleteEmployee('${emp.code}')">🗑️ حذف</button></td>
    `;
    table.appendChild(row);
  });
  fillEmployeeDropdown();
  updateCounts();
}

function deleteEmployee(code) {
  let data = JSON.parse(localStorage.getItem('employees') || '[]');
  data = data.filter(emp => emp.code !== code);
  localStorage.setItem('employees', JSON.stringify(data));
  loadEmployees();
  showToast('تم حذف الموظف');
}

document.getElementById('addEmployeeBtn')?.addEventListener('click', () => {
  const name = document.getElementById('employeeName').value.trim();
  const code = document.getElementById('employeeCode').value.trim();
  const role = document.getElementById('employeeRole')?.value || 'agent';
  if (!name || !code || !role) return showToast('يرجى ملء الحقول');
  const employees = JSON.parse(localStorage.getItem('employees') || '[]');
  employees.push({ name, code, role });
  localStorage.setItem('employees', JSON.stringify(employees));
  document.getElementById('employeeName').value = '';
  document.getElementById('employeeCode').value = '';
  loadEmployees();
  showToast('تمت الإضافة');
});

function fillEmployeeDropdown() {
  const list = JSON.parse(localStorage.getItem('employees') || '[]');
  const dropdown = document.getElementById('shipmentEmployee');
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">اختر الموظف</option>';
  list.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.name;
    opt.text = emp.name;
    dropdown.appendChild(opt);
  });
}

function loadShipments() {
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  const table = document.getElementById('shipmentsTable')?.querySelector('tbody');
  const archiveTable = document.getElementById('archiveTable')?.querySelector('tbody');
  if (!table || !archiveTable) return;
  table.innerHTML = '';
  archiveTable.innerHTML = '';
  shipments.forEach(sh => {
    const row = document.createElement('tr');
    const archiveRow = document.createElement('tr');
    const html = `
      <td>${sh.number}</td>
      <td>${sh.customer}</td>
      <td>${sh.address}</td>
      <td>${sh.employee}</td>
      <td>
        <select onchange="updateShipmentStatus('${sh.number}', this.value)">
          <option ${sh.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
          <option ${sh.status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
          <option ${sh.status === 'ملغاة' ? 'selected' : ''}>ملغاة</option>
        </select>
      </td>
      <td><button class="action-btn" onclick="deleteShipment('${sh.number}')">🗑️ حذف</button></td>
    `;
    if (sh.status !== 'قيد التنفيذ') {
      archiveRow.innerHTML = `
        <td>${sh.number}</td>
        <td>${sh.customer}</td>
        <td>${sh.address}</td>
        <td>${sh.employee}</td>
        <td>${sh.status}</td>
        <td>${sh.date}</td>
      `;
      archiveTable.appendChild(archiveRow);
    } else {
      row.innerHTML = html;
      table.appendChild(row);
    }
  });
  updateCounts();
}

function deleteShipment(number) {
  let data = JSON.parse(localStorage.getItem('shipments') || '[]');
  data = data.filter(s => s.number !== number);
  localStorage.setItem('shipments', JSON.stringify(data));
  loadShipments();
  showToast('تم حذف الشحنة');
}

document.getElementById('addShipmentBtn')?.addEventListener('click', () => {
  const number = document.getElementById('shipmentNumber').value.trim();
  const customer = document.getElementById('customerName').value.trim();
  const address = document.getElementById('shipmentAddress').value.trim();
  const employee = document.getElementById('shipmentEmployee').value;
  const status = 'قيد التنفيذ';
  if (!number || !customer || !address || !employee) return showToast('يرجى ملء البيانات');
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  shipments.push({ number, customer, address, employee, status, date: new Date().toLocaleDateString() });
  localStorage.setItem('shipments', JSON.stringify(shipments));
  document.getElementById('shipmentNumber').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('shipmentAddress').value = '';
  document.getElementById('shipmentEmployee').value = '';
  loadShipments();
  showToast('تمت إضافة الشحنة');
});

function updateShipmentStatus(number, status) {
  const data = JSON.parse(localStorage.getItem('shipments') || '[]');
  const index = data.findIndex(s => s.number === number);
  if (index !== -1) {
    data[index].status = status;
    data[index].date = new Date().toLocaleDateString();
    localStorage.setItem('shipments', JSON.stringify(data));
    loadShipments();
    showToast(`تم تغيير الحالة إلى "${status}"`);
  }
}

function loadNotifications() {
  const list = document.getElementById('notificationList');
  if (!list) return;
  list.innerHTML = '';
  ['✅ شحنة جديدة', '📦 شحنة قيد التنفيذ', '❌ شحنة ملغاة'].forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  });
}

function updateCounts() {
  const emp = JSON.parse(localStorage.getItem('employees') || '[]').length;
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  const archive = shipments.filter(s => s.status !== 'قيد التنفيذ').length;
  document.getElementById('countEmployees')?.textContent = emp;
  document.getElementById('countShipments')?.textContent = shipments.length;
  document.getElementById('countArchived')?.textContent = archive;
}

function renderCharts() {
  const empData = JSON.parse(localStorage.getItem('employees') || '[]');
  const shipData = JSON.parse(localStorage.getItem('shipments') || '[]');

  if (document.getElementById('employeesChart')) {
    new Chart(document.getElementById('employeesChart'), {
      type: 'pie',
      data: {
        labels: empData.map(e => e.name),
        datasets: [{
          data: empData.map(() => 1),
          backgroundColor: ['#d32f2f', '#388e3c', '#1976d2', '#f39c12']
        }]
      }
    });
  }

  if (document.getElementById('shipmentsChart')) {
    const count = { 'قيد التنفيذ': 0, 'تم التوصيل': 0, 'ملغاة': 0 };
    shipData.forEach(s => count[s.status]++);
    new Chart(document.getElementById('shipmentsChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(count),
        datasets: [{
          label: 'الشحنات',
          data: Object.values(count),
          backgroundColor: ['#1976d2', '#2ecc71', '#e74c3c']
        }]
      }
    });
  }
}// script.js - نسخة محدثة تدعم تسجيل الدخول بأدوار مختلفة (admin / agent)

const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!currentUser && window.location.pathname.includes('index.html')) {
  window.location.href = 'login.html';
}

const toggle = document.getElementById('darkModeToggle');
if (toggle) {
  toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', toggle.checked);
    localStorage.setItem('darkMode', toggle.checked);
  });
  const darkMode = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', darkMode);
  toggle.checked = darkMode;
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
});

const menuBtn = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebarMenu');
menuBtn?.addEventListener('click', () => {
  sidebar.classList.toggle('show');
  document.body.classList.toggle('overlay');
});
window.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('show');
    document.body.classList.remove('overlay');
  }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    sidebar?.classList.remove('show');
    document.body.classList.remove('overlay');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'agent1', password: 'agent123', role: 'agent' }
    ]));
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const roles = btn.dataset.roles?.split(',') || [];
    if (roles.length && !roles.includes(currentUser?.role)) {
      btn.style.display = 'none';
    }
  });

  loadEmployees();
  loadShipments();
  loadNotifications();
  renderCharts();
});

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  document.getElementById('toastContainer')?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function loadEmployees() {
  const employees = JSON.parse(localStorage.getItem('employees') || '[]');
  const table = document.getElementById('employeesTable')?.querySelector('tbody');
  if (!table) return;
  table.innerHTML = '';
  employees.forEach(emp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp.name}</td>
      <td>${emp.code}</td>
      <td>${emp.role}</td>
      <td><button class="action-btn" onclick="deleteEmployee('${emp.code}')">🗑️ حذف</button></td>
    `;
    table.appendChild(row);
  });
  fillEmployeeDropdown();
  updateCounts();
}

function deleteEmployee(code) {
  let data = JSON.parse(localStorage.getItem('employees') || '[]');
  data = data.filter(emp => emp.code !== code);
  localStorage.setItem('employees', JSON.stringify(data));
  loadEmployees();
  showToast('تم حذف الموظف');
}

document.getElementById('addEmployeeBtn')?.addEventListener('click', () => {
  const name = document.getElementById('employeeName').value.trim();
  const code = document.getElementById('employeeCode').value.trim();
  const role = document.getElementById('employeeRole')?.value || 'agent';
  if (!name || !code || !role) return showToast('يرجى ملء الحقول');
  const employees = JSON.parse(localStorage.getItem('employees') || '[]');
  employees.push({ name, code, role });
  localStorage.setItem('employees', JSON.stringify(employees));
  document.getElementById('employeeName').value = '';
  document.getElementById('employeeCode').value = '';
  loadEmployees();
  showToast('تمت الإضافة');
});

function fillEmployeeDropdown() {
  const list = JSON.parse(localStorage.getItem('employees') || '[]');
  const dropdown = document.getElementById('shipmentEmployee');
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">اختر الموظف</option>';
  list.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.name;
    opt.text = emp.name;
    dropdown.appendChild(opt);
  });
}

function loadShipments() {
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  const table = document.getElementById('shipmentsTable')?.querySelector('tbody');
  const archiveTable = document.getElementById('archiveTable')?.querySelector('tbody');
  if (!table || !archiveTable) return;
  table.innerHTML = '';
  archiveTable.innerHTML = '';
  shipments.forEach(sh => {
    const row = document.createElement('tr');
    const archiveRow = document.createElement('tr');
    const html = `
      <td>${sh.number}</td>
      <td>${sh.customer}</td>
      <td>${sh.address}</td>
      <td>${sh.employee}</td>
      <td>
        <select onchange="updateShipmentStatus('${sh.number}', this.value)">
          <option ${sh.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
          <option ${sh.status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
          <option ${sh.status === 'ملغاة' ? 'selected' : ''}>ملغاة</option>
        </select>
      </td>
      <td><button class="action-btn" onclick="deleteShipment('${sh.number}')">🗑️ حذف</button></td>
    `;
    if (sh.status !== 'قيد التنفيذ') {
      archiveRow.innerHTML = `
        <td>${sh.number}</td>
        <td>${sh.customer}</td>
        <td>${sh.address}</td>
        <td>${sh.employee}</td>
        <td>${sh.status}</td>
        <td>${sh.date}</td>
      `;
      archiveTable.appendChild(archiveRow);
    } else {
      row.innerHTML = html;
      table.appendChild(row);
    }
  });
  updateCounts();
}

function deleteShipment(number) {
  let data = JSON.parse(localStorage.getItem('shipments') || '[]');
  data = data.filter(s => s.number !== number);
  localStorage.setItem('shipments', JSON.stringify(data));
  loadShipments();
  showToast('تم حذف الشحنة');
}

document.getElementById('addShipmentBtn')?.addEventListener('click', () => {
  const number = document.getElementById('shipmentNumber').value.trim();
  const customer = document.getElementById('customerName').value.trim();
  const address = document.getElementById('shipmentAddress').value.trim();
  const employee = document.getElementById('shipmentEmployee').value;
  const status = 'قيد التنفيذ';
  if (!number || !customer || !address || !employee) return showToast('يرجى ملء البيانات');
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  shipments.push({ number, customer, address, employee, status, date: new Date().toLocaleDateString() });
  localStorage.setItem('shipments', JSON.stringify(shipments));
  document.getElementById('shipmentNumber').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('shipmentAddress').value = '';
  document.getElementById('shipmentEmployee').value = '';
  loadShipments();
  showToast('تمت إضافة الشحنة');
});

function updateShipmentStatus(number, status) {
  const data = JSON.parse(localStorage.getItem('shipments') || '[]');
  const index = data.findIndex(s => s.number === number);
  if (index !== -1) {
    data[index].status = status;
    data[index].date = new Date().toLocaleDateString();
    localStorage.setItem('shipments', JSON.stringify(data));
    loadShipments();
    showToast(`تم تغيير الحالة إلى "${status}"`);
  }
}

function loadNotifications() {
  const list = document.getElementById('notificationList');
  if (!list) return;
  list.innerHTML = '';
  ['✅ شحنة جديدة', '📦 شحنة قيد التنفيذ', '❌ شحنة ملغاة'].forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  });
}

function updateCounts() {
  const emp = JSON.parse(localStorage.getItem('employees') || '[]').length;
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  const archive = shipments.filter(s => s.status !== 'قيد التنفيذ').length;
  document.getElementById('countEmployees')?.textContent = emp;
  document.getElementById('countShipments')?.textContent = shipments.length;
  document.getElementById('countArchived')?.textContent = archive;
}

function renderCharts() {
  const empData = JSON.parse(localStorage.getItem('employees') || '[]');
  const shipData = JSON.parse(localStorage.getItem('shipments') || '[]');

  if (document.getElementById('employeesChart')) {
    new Chart(document.getElementById('employeesChart'), {
      type: 'pie',
      data: {
        labels: empData.map(e => e.name),
        datasets: [{
          data: empData.map(() => 1),
          backgroundColor: ['#d32f2f', '#388e3c', '#1976d2', '#f39c12']
        }]
      }
    });
  }

  if (document.getElementById('shipmentsChart')) {
    const count = { 'قيد التنفيذ': 0, 'تم التوصيل': 0, 'ملغاة': 0 };
    shipData.forEach(s => count[s.status]++);
    new Chart(document.getElementById('shipmentsChart'), {
      type: 'bar// script.js - نسخة محدثة تدعم تسجيل الدخول بأدوار مختلفة (admin / agent)

const currentUser = JSON.parse(localStorage.getItem('loggedInUser'));
if (!currentUser && window.location.pathname.includes('index.html')) {
  window.location.href = 'login.html';
}

const toggle = document.getElementById('darkModeToggle');
if (toggle) {
  toggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode', toggle.checked);
    localStorage.setItem('darkMode', toggle.checked);
  });
  const darkMode = localStorage.getItem('darkMode') === 'true';
  document.body.classList.toggle('dark-mode', darkMode);
  toggle.checked = darkMode;
}

document.getElementById('logoutBtn')?.addEventListener('click', () => {
  localStorage.removeItem('loggedInUser');
  window.location.href = 'login.html';
});

const menuBtn = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebarMenu');
menuBtn?.addEventListener('click', () => {
  sidebar.classList.toggle('show');
  document.body.classList.toggle('overlay');
});
window.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target)) {
    sidebar.classList.remove('show');
    document.body.classList.remove('overlay');
  }
});

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.tab + 'Tab').classList.add('active');
    sidebar?.classList.remove('show');
    document.body.classList.remove('overlay');
  });
});

document.addEventListener('DOMContentLoaded', () => {
  if (!localStorage.getItem('users')) {
    localStorage.setItem('users', JSON.stringify([
      { username: 'admin', password: 'admin123', role: 'admin' },
      { username: 'agent1', password: 'agent123', role: 'agent' }
    ]));
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    const roles = btn.dataset.roles?.split(',') || [];
    if (roles.length && !roles.includes(currentUser?.role)) {
      btn.style.display = 'none';
    }
  });

  loadEmployees();
  loadShipments();
  loadNotifications();
  renderCharts();
});

function showToast(msg) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerText = msg;
  document.getElementById('toastContainer')?.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function loadEmployees() {
  const employees = JSON.parse(localStorage.getItem('employees') || '[]');
  const table = document.getElementById('employeesTable')?.querySelector('tbody');
  if (!table) return;
  table.innerHTML = '';
  employees.forEach(emp => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${emp.name}</td>
      <td>${emp.code}</td>
      <td>${emp.role}</td>
      <td><button class="action-btn" onclick="deleteEmployee('${emp.code}')">🗑️ حذف</button></td>
    `;
    table.appendChild(row);
  });
  fillEmployeeDropdown();
  updateCounts();
}

function deleteEmployee(code) {
  let data = JSON.parse(localStorage.getItem('employees') || '[]');
  data = data.filter(emp => emp.code !== code);
  localStorage.setItem('employees', JSON.stringify(data));
  loadEmployees();
  showToast('تم حذف الموظف');
}

document.getElementById('addEmployeeBtn')?.addEventListener('click', () => {
  const name = document.getElementById('employeeName').value.trim();
  const code = document.getElementById('employeeCode').value.trim();
  const role = document.getElementById('employeeRole')?.value || 'agent';
  if (!name || !code || !role) return showToast('يرجى ملء الحقول');
  const employees = JSON.parse(localStorage.getItem('employees') || '[]');
  employees.push({ name, code, role });
  localStorage.setItem('employees', JSON.stringify(employees));
  document.getElementById('employeeName').value = '';
  document.getElementById('employeeCode').value = '';
  loadEmployees();
  showToast('تمت الإضافة');
});

function fillEmployeeDropdown() {
  const list = JSON.parse(localStorage.getItem('employees') || '[]');
  const dropdown = document.getElementById('shipmentEmployee');
  if (!dropdown) return;
  dropdown.innerHTML = '<option value="">اختر الموظف</option>';
  list.forEach(emp => {
    const opt = document.createElement('option');
    opt.value = emp.name;
    opt.text = emp.name;
    dropdown.appendChild(opt);
  });
}

function loadShipments() {
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  const table = document.getElementById('shipmentsTable')?.querySelector('tbody');
  const archiveTable = document.getElementById('archiveTable')?.querySelector('tbody');
  if (!table || !archiveTable) return;
  table.innerHTML = '';
  archiveTable.innerHTML = '';
  shipments.forEach(sh => {
    const row = document.createElement('tr');
    const archiveRow = document.createElement('tr');
    const html = `
      <td>${sh.number}</td>
      <td>${sh.customer}</td>
      <td>${sh.address}</td>
      <td>${sh.employee}</td>
      <td>
        <select onchange="updateShipmentStatus('${sh.number}', this.value)">
          <option ${sh.status === 'قيد التنفيذ' ? 'selected' : ''}>قيد التنفيذ</option>
          <option ${sh.status === 'تم التوصيل' ? 'selected' : ''}>تم التوصيل</option>
          <option ${sh.status === 'ملغاة' ? 'selected' : ''}>ملغاة</option>
        </select>
      </td>
      <td><button class="action-btn" onclick="deleteShipment('${sh.number}')">🗑️ حذف</button></td>
    `;
    if (sh.status !== 'قيد التنفيذ') {
      archiveRow.innerHTML = `
        <td>${sh.number}</td>
        <td>${sh.customer}</td>
        <td>${sh.address}</td>
        <td>${sh.employee}</td>
        <td>${sh.status}</td>
        <td>${sh.date}</td>
      `;
      archiveTable.appendChild(archiveRow);
    } else {
      row.innerHTML = html;
      table.appendChild(row);
    }
  });
  updateCounts();
}

function deleteShipment(number) {
  let data = JSON.parse(localStorage.getItem('shipments') || '[]');
  data = data.filter(s => s.number !== number);
  localStorage.setItem('shipments', JSON.stringify(data));
  loadShipments();
  showToast('تم حذف الشحنة');
}

document.getElementById('addShipmentBtn')?.addEventListener('click', () => {
  const number = document.getElementById('shipmentNumber').value.trim();
  const customer = document.getElementById('customerName').value.trim();
  const address = document.getElementById('shipmentAddress').value.trim();
  const employee = document.getElementById('shipmentEmployee').value;
  const status = 'قيد التنفيذ';
  if (!number || !customer || !address || !employee) return showToast('يرجى ملء البيانات');
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  shipments.push({ number, customer, address, employee, status, date: new Date().toLocaleDateString() });
  localStorage.setItem('shipments', JSON.stringify(shipments));
  document.getElementById('shipmentNumber').value = '';
  document.getElementById('customerName').value = '';
  document.getElementById('shipmentAddress').value = '';
  document.getElementById('shipmentEmployee').value = '';
  loadShipments();
  showToast('تمت إضافة الشحنة');
});

function updateShipmentStatus(number, status) {
  const data = JSON.parse(localStorage.getItem('shipments') || '[]');
  const index = data.findIndex(s => s.number === number);
  if (index !== -1) {
    data[index].status = status;
    data[index].date = new Date().toLocaleDateString();
    localStorage.setItem('shipments', JSON.stringify(data));
    loadShipments();
    showToast(`تم تغيير الحالة إلى "${status}"`);
  }
}

function loadNotifications() {
  const list = document.getElementById('notificationList');
  if (!list) return;
  list.innerHTML = '';
  ['✅ شحنة جديدة', '📦 شحنة قيد التنفيذ', '❌ شحنة ملغاة'].forEach(msg => {
    const li = document.createElement('li');
    li.textContent = msg;
    list.appendChild(li);
  });
}

function updateCounts() {
  const emp = JSON.parse(localStorage.getItem('employees') || '[]').length;
  const shipments = JSON.parse(localStorage.getItem('shipments') || '[]');
  const archive = shipments.filter(s => s.status !== 'قيد التنفيذ').length;
  document.getElementById('countEmployees')?.textContent = emp;
  document.getElementById('countShipments')?.textContent = shipments.length;
  document.getElementById('countArchived')?.textContent = archive;
}

function renderCharts() {
  const empData = JSON.parse(localStorage.getItem('employees') || '[]');
  const shipData = JSON.parse(localStorage.getItem('shipments') || '[]');

  if (document.getElementById('employeesChart')) {
    new Chart(document.getElementById('employeesChart'), {
      type: 'pie',
      data: {
        labels: empData.map(e => e.name),
        datasets: [{
          data: empData.map(() => 1),
          backgroundColor: ['#d32f2f', '#388e3c', '#1976d2', '#f39c12']
        }]
      }
    });
  }

  if (document.getElementById('shipmentsChart')) {
    const count = { 'قيد التنفيذ': 0, 'تم التوصيل': 0, 'ملغاة': 0 };
    shipData.forEach(s => count[s.status]++);
    new Chart(document.getElementById('shipmentsChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(count),
        datasets: [{
          label: 'الشحنات',
          data: Object.values(count),
          backgroundColor: ['#1976d2', '#2ecc71', '#e74c3c']
        }]
      }
    });
  }
}',
      data: {
        labels: Object.keys(count),
        datasets: [{
          label: 'الشحنات',
          data: Object.values(count),
          backgroundColor: ['#1976d2', '#2ecc71', '#e74c3c']
        }]
      }
    });
  }
}