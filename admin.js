// Barangay Ibayo-Tipas Admin Portal Logic

const ADMIN_PASSCODE = 'tipas2026';

// Global State
let activeApplications = [];
let activeReklamo = [];
let selectedApplicationIndex = null;
let currentFilterStatus = 'all';

// Default Seed Data
const DEFAULT_APPLICATIONS = [
  {
    trackingCode: 'BIT-2026-10482',
    fullName: 'Juan Miguel Dela Cruz',
    documentType: 'Barangay Clearance',
    docVal: 'clearance',
    phoneNumber: '09171234567',
    address: '#14 Dr. Natividad St., Purok 1, Ibayo-Tipas',
    purpose: 'Local Employment (BGC Taguig)',
    status: 'Ready for Pickup',
    pickupDate: 'Lunes hanggang Biyernes (8:00 AM - 4:30 PM)',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    trackingCode: 'BIT-2026-92817',
    fullName: 'Elena Santos Bautista',
    documentType: 'Certificate of Indigency',
    docVal: 'indigency',
    phoneNumber: '09289876543',
    address: '#22 F. Manalo St., Purok 3, Ibayo-Tipas',
    purpose: 'Medical Assistance / Taguig TLC Care',
    status: 'For Signature',
    pickupDate: 'Miyerkules, Oktubre 7, 2026 (8:00 AM - 4:30 PM)',
    createdAt: new Date(Date.now() - 43200000).toISOString()
  },
  {
    trackingCode: 'BIT-2026-44109',
    fullName: 'Mark Kenneth Ramos',
    documentType: 'First-Time Jobseeker (RA 11261)',
    docVal: 'jobseeker',
    phoneNumber: '09051239876',
    address: '#5 Purok 4, Ibayo-Tipas',
    purpose: 'Fresh Graduate First Job Application',
    status: 'Under Review',
    pickupDate: 'Biyernes, Oktubre 9, 2026 (8:00 AM - 4:30 PM)',
    createdAt: new Date().toISOString()
  },
  {
    trackingCode: 'BIT-2026-78231',
    fullName: 'Rosanna Gomez Mercado',
    documentType: 'Barangay Business Clearance',
    docVal: 'business',
    phoneNumber: '09395556677',
    address: '#8 Dr. Natividad St., Ibayo-Tipas',
    purpose: 'Bakery & Hopia Store Renewal',
    status: 'Released',
    pickupDate: 'Nailabas na',
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

const DEFAULT_REKLAMO = [
  {
    ticketId: 'TICKET-IBAYO-4819',
    fullName: 'Roberto Garcia',
    phoneNumber: '09181112233',
    complaintType: 'Streetlight / Pundidong Ilaw',
    location: 'Dr. Natividad Corner F. Manalo',
    details: 'Dalawang poste ng ilaw ang pundido na nakakadelikado sa mga naglalakad sa gabi.',
    status: 'Forwarded to Engineering / BPSO',
    createdAt: new Date().toISOString()
  },
  {
    ticketId: 'TICKET-IBAYO-6291',
    fullName: 'Teresita Cruz',
    phoneNumber: '09224443322',
    complaintType: 'Basura / Baradong Kanal',
    location: 'Purok 2 malapit sa Creek',
    details: 'May mga naipong basura na humaharang sa daloy ng tubig pag umuulan.',
    status: 'Sanitation Team Dispatched',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// Local Storage Handlers
function loadData() {
  const appsData = localStorage.getItem('ibayo_applications');
  if (appsData) {
    try { activeApplications = JSON.parse(appsData); } catch (e) { activeApplications = DEFAULT_APPLICATIONS; }
  } else {
    activeApplications = DEFAULT_APPLICATIONS;
    saveApplications();
  }

  const reklamoData = localStorage.getItem('ibayo_reklamo');
  if (reklamoData) {
    try { activeReklamo = JSON.parse(reklamoData); } catch (e) { activeReklamo = DEFAULT_REKLAMO; }
  } else {
    activeReklamo = DEFAULT_REKLAMO;
    saveReklamo();
  }
}

function saveApplications() {
  localStorage.setItem('ibayo_applications', JSON.stringify(activeApplications));
}

function saveReklamo() {
  localStorage.setItem('ibayo_reklamo', JSON.stringify(activeReklamo));
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) window.lucide.createIcons();

  loadData();

  // --- Auth Session Check ---
  const loginScreen = document.getElementById('admin-login-screen');
  const loginForm = document.getElementById('admin-login-form');
  const staffNameInput = document.getElementById('admin-staff-name');
  const staffPassInput = document.getElementById('admin-staff-password');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const activeStaffLabel = document.getElementById('active-staff-label');
  const logoutBtn = document.getElementById('admin-logout-btn');

  const savedAuth = sessionStorage.getItem('ibayo_admin_authenticated');
  const savedStaffName = sessionStorage.getItem('ibayo_admin_staff_name');

  if (savedAuth === 'true') {
    loginScreen.classList.add('hidden');
    if (savedStaffName && activeStaffLabel) activeStaffLabel.textContent = savedStaffName;
  }

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const pass = staffPassInput.value.trim();
    const name = staffNameInput.value.trim() || 'Staff Officer';

    if (pass === ADMIN_PASSCODE) {
      sessionStorage.setItem('ibayo_admin_authenticated', 'true');
      sessionStorage.setItem('ibayo_admin_staff_name', name);
      if (activeStaffLabel) activeStaffLabel.textContent = name;
      loginScreen.classList.add('hidden');
      loginErrorMsg.classList.add('hidden');
      showToast(`Maligayang pagdating, ${name}!`);
      renderDashboard();
    } else {
      loginErrorMsg.classList.remove('hidden');
    }
  });

  logoutBtn.addEventListener('click', () => {
    if (confirm('Nais mo bang mag-logout mula sa Admin Portal?')) {
      sessionStorage.removeItem('ibayo_admin_authenticated');
      loginScreen.classList.remove('hidden');
      staffPassInput.value = '';
    }
  });

  // --- Navigation Tabs ---
  const navTabBtns = document.querySelectorAll('.nav-tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  navTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      navTabBtns.forEach(b => {
        b.classList.remove('active', 'bg-blue-600', 'text-white');
        b.classList.add('text-slate-300');
      });
      btn.classList.add('active', 'bg-blue-600', 'text-white');
      btn.classList.remove('text-slate-300');

      tabPanes.forEach(p => p.classList.add('hidden'));
      const activePane = document.getElementById(`tab-content-${targetTab}`);
      if (activePane) activePane.classList.remove('hidden');

      if (window.lucide) window.lucide.createIcons();
    });
  });

  // --- Filter Status Buttons ---
  const statusFilterBtns = document.querySelectorAll('.status-filter-btn');
  statusFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      statusFilterBtns.forEach(b => {
        b.classList.remove('active', 'bg-blue-900', 'text-white');
        b.classList.add('bg-slate-100', 'text-slate-700');
      });
      btn.classList.add('active', 'bg-blue-900', 'text-white');
      btn.classList.remove('bg-slate-100', 'text-slate-700');

      currentFilterStatus = btn.getAttribute('data-status');
      renderApplicationsTable();
    });
  });

  // Search input
  const searchInput = document.getElementById('admin-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      renderApplicationsTable();
    });
  }

  // --- Processing Modal Setup ---
  const processingModal = document.getElementById('processing-modal');
  const closeProcessingBtn = document.getElementById('close-processing-modal');
  const cancelProcessingBtn = document.getElementById('modal-btn-cancel');
  const saveStatusBtn = document.getElementById('modal-btn-save-status');
  const modalStatusSelect = document.getElementById('modal-status-select');
  const modalRemarksInput = document.getElementById('modal-remarks-input');
  const modalPrintCertBtn = document.getElementById('modal-btn-print-cert');

  function openProcessingModal(index) {
    selectedApplicationIndex = index;
    const app = activeApplications[index];
    if (!app) return;

    document.getElementById('modal-app-code').textContent = app.trackingCode;
    document.getElementById('modal-app-name').textContent = app.fullName;
    document.getElementById('modal-app-doc').textContent = app.documentType;
    document.getElementById('modal-app-phone').textContent = app.phoneNumber;
    document.getElementById('modal-app-address').textContent = app.address;
    document.getElementById('modal-app-purpose').textContent = app.purpose;

    modalStatusSelect.value = app.status || 'Under Review';
    modalRemarksInput.value = app.remarks || '';

    processingModal.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  function closeProcessingModal() {
    processingModal.classList.add('hidden');
    selectedApplicationIndex = null;
  }

  if (closeProcessingBtn) closeProcessingBtn.addEventListener('click', closeProcessingModal);
  if (cancelProcessingBtn) cancelProcessingBtn.addEventListener('click', closeProcessingModal);

  saveStatusBtn.addEventListener('click', () => {
    if (selectedApplicationIndex !== null && activeApplications[selectedApplicationIndex]) {
      const newStatus = modalStatusSelect.value;
      const remarks = modalRemarksInput.value.trim();

      activeApplications[selectedApplicationIndex].status = newStatus;
      activeApplications[selectedApplicationIndex].remarks = remarks;
      activeApplications[selectedApplicationIndex].updatedAt = new Date().toISOString();

      saveApplications();
      renderDashboard();
      closeProcessingModal();
      showToast(`Aplikasyon ${activeApplications[selectedApplicationIndex].trackingCode} na-update sa: ${newStatus}`);
    }
  });

  // Print button inside processing modal
  modalPrintCertBtn.addEventListener('click', () => {
    if (selectedApplicationIndex !== null && activeApplications[selectedApplicationIndex]) {
      openPrintCertificate(activeApplications[selectedApplicationIndex]);
    }
  });

  // --- Certificate Print Modal Setup ---
  const printCertModal = document.getElementById('printable-certificate-modal');
  const closePrintCertBtn = document.getElementById('close-print-cert-modal');

  function openPrintCertificate(app) {
    document.getElementById('cert-print-title').textContent = (app.documentType || 'BARANGAY CLEARANCE').toUpperCase();
    document.getElementById('cert-print-code').textContent = `CONTROL NO: ${app.trackingCode}`;
    document.getElementById('cert-print-name').textContent = (app.fullName || 'RESIDENT').toUpperCase();
    document.getElementById('cert-print-address').textContent = app.address || 'Barangay Ibayo-Tipas, Taguig City';
    document.getElementById('cert-print-purpose').textContent = (app.purpose || 'EMPLOYMENT').toUpperCase();

    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('cert-print-date').textContent = new Date().toLocaleDateString('tl-PH', options);

    printCertModal.classList.remove('hidden');
  }

  if (closePrintCertBtn) {
    closePrintCertBtn.addEventListener('click', () => {
      printCertModal.classList.add('hidden');
    });
  }

  // Quick Print Select in Print Station Tab
  const quickPrintSelect = document.getElementById('quick-print-select');
  const btnTriggerQuickPrint = document.getElementById('btn-trigger-quick-print');

  if (btnTriggerQuickPrint) {
    btnTriggerQuickPrint.addEventListener('click', () => {
      const val = quickPrintSelect.value;
      if (!val) {
        showToast('Pumili muna ng aplikante mula sa dropdown.');
        return;
      }
      const app = activeApplications.find(a => a.trackingCode === val);
      if (app) openPrintCertificate(app);
    });
  }

  // --- CSV Export Handlers ---
  const btnExportCsv = document.getElementById('btn-export-csv');
  if (btnExportCsv) {
    btnExportCsv.addEventListener('click', () => {
      exportApplicationsCSV();
    });
  }

  const btnExportReklamoCsv = document.getElementById('btn-export-reklamo-csv');
  if (btnExportReklamoCsv) {
    btnExportReklamoCsv.addEventListener('click', () => {
      exportReklamoCSV();
    });
  }

  // --- Seed Demo Data Handler ---
  const btnSeedData = document.getElementById('btn-seed-data');
  if (btnSeedData) {
    btnSeedData.addEventListener('click', () => {
      if (confirm('I-load ang default sample data para sa testing?')) {
        activeApplications = DEFAULT_APPLICATIONS;
        activeReklamo = DEFAULT_REKLAMO;
        saveApplications();
        saveReklamo();
        renderDashboard();
        showToast('Sample records loaded successfully!');
      }
    });
  }

  // Wipe database
  const btnWipeDb = document.getElementById('btn-wipe-database');
  if (btnWipeDb) {
    btnWipeDb.addEventListener('click', () => {
      if (confirm('Sigurado ka bang nais burahin ang LAHAT ng records? Hindi na ito mababawi.')) {
        activeApplications = [];
        activeReklamo = [];
        saveApplications();
        saveReklamo();
        renderDashboard();
        showToast('Nabura na ang database records.');
      }
    });
  }

  // Google Sheets Webhook settings
  const webhookInput = document.getElementById('settings-webhook-url');
  const btnSaveWebhook = document.getElementById('btn-save-webhook');
  const btnTestWebhook = document.getElementById('btn-test-webhook');

  if (webhookInput) {
    webhookInput.value = localStorage.getItem('ibayo_webhook_url') || '';
  }

  if (btnSaveWebhook) {
    btnSaveWebhook.addEventListener('click', () => {
      const url = webhookInput.value.trim();
      localStorage.setItem('ibayo_webhook_url', url);
      showToast('Google Sheets Webhook URL na-save!');
    });
  }

  if (btnTestWebhook) {
    btnTestWebhook.addEventListener('click', () => {
      const url = webhookInput.value.trim();
      if (!url) {
        showToast('Mangyaring ilagay muna ang Webhook URL.');
        return;
      }
      showToast('Sinusubukan ang koneksyon...');
      fetch(url)
        .then(res => res.json())
        .then(data => {
          showToast(`Konektado! Status: ${data.service || 'Active'}`);
        })
        .catch(err => {
          showToast('Hindi makakonekta. Pakisuri ang Apps Script deployment.');
        });
    });
  }

  // Initial render
  renderDashboard();
});

// Main Dashboard Renderer
function renderDashboard() {
  updateKPIMetrics();
  renderApplicationsTable();
  renderReklamoTable();
  populateQuickPrintSelect();
}

// Update KPI Counters
function updateKPIMetrics() {
  const total = activeApplications.length;
  const underReview = activeApplications.filter(a => a.status === 'Under Review').length;
  const signature = activeApplications.filter(a => a.status === 'For Signature').length;
  const ready = activeApplications.filter(a => a.status === 'Ready for Pickup').length;
  const released = activeApplications.filter(a => a.status === 'Released').length;

  document.getElementById('kpi-total-apps').textContent = total;
  document.getElementById('kpi-review-apps').textContent = underReview;
  document.getElementById('kpi-signature-apps').textContent = signature;
  document.getElementById('kpi-ready-apps').textContent = ready;
  document.getElementById('kpi-released-apps').textContent = released;

  // Sidebar badge
  const pendingBadge = document.getElementById('badge-total-pending');
  if (pendingBadge) pendingBadge.textContent = underReview + signature;

  const reklamoBadge = document.getElementById('badge-total-reklamo');
  if (reklamoBadge) reklamoBadge.textContent = activeReklamo.length;
}

// Render Applications Table
function renderApplicationsTable() {
  const tbody = document.getElementById('admin-applications-table-body');
  const emptyState = document.getElementById('table-empty-state');
  const query = (document.getElementById('admin-search-input')?.value || '').toLowerCase().trim();

  const filtered = activeApplications.filter(app => {
    const matchesStatus = currentFilterStatus === 'all' || app.status === currentFilterStatus;
    const matchesSearch = !query || 
      app.trackingCode.toLowerCase().includes(query) || 
      app.fullName.toLowerCase().includes(query) || 
      app.phoneNumber.toLowerCase().includes(query);

    return matchesStatus && matchesSearch;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  tbody.innerHTML = filtered.map((app) => {
    const realIndex = activeApplications.findIndex(a => a.trackingCode === app.trackingCode);
    
    // Status Badge Styling
    let badgeClass = 'bg-slate-100 text-slate-800';
    if (app.status === 'Under Review') badgeClass = 'bg-amber-100 text-amber-800 border border-amber-200';
    else if (app.status === 'Processing') badgeClass = 'bg-blue-100 text-blue-800 border border-blue-200';
    else if (app.status === 'For Signature') badgeClass = 'bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold';
    else if (app.status === 'Ready for Pickup') badgeClass = 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-black animate-pulse';
    else if (app.status === 'Released') badgeClass = 'bg-purple-100 text-purple-800 border border-purple-200';
    else if (app.status === 'Rejected') badgeClass = 'bg-red-100 text-red-800 border border-red-200';

    return `
      <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
        <td class="p-3.5 font-mono font-bold text-blue-900">${app.trackingCode}</td>
        <td class="p-3.5">
          <div class="font-bold text-slate-900 text-sm">${app.fullName}</div>
          <div class="text-[10px] text-slate-400">Nilagdaan: ${new Date(app.createdAt).toLocaleDateString()}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-800">${app.documentType}</div>
          <div class="text-[11px] text-slate-500 truncate max-w-xs">${app.purpose}</div>
        </td>
        <td class="p-3.5">
          <div class="font-semibold text-slate-700">${app.phoneNumber}</div>
          <div class="text-[11px] text-slate-400 truncate max-w-xs">${app.address}</div>
        </td>
        <td class="p-3.5">
          <span class="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${badgeClass}">
            ${app.status || 'Under Review'}
          </span>
        </td>
        <td class="p-3.5 text-[11px] text-slate-600">
          ${app.pickupDate || 'Office hours'}
        </td>
        <td class="p-3.5 text-right">
          <div class="inline-flex items-center gap-1.5">
            <button onclick="openProcessModalByIndex(${realIndex})" class="bg-blue-900 hover:bg-blue-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-all flex items-center gap-1">
              <i data-lucide="edit-3" class="w-3.5 h-3.5"></i>
              <span>Proseso</span>
            </button>
            <button onclick="deleteAppByIndex(${realIndex})" title="Burahin" class="text-slate-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  if (window.lucide) window.lucide.createIcons();
}

// Expose process modal opener to window
window.openProcessModalByIndex = function(index) {
  selectedApplicationIndex = index;
  const app = activeApplications[index];
  if (!app) return;

  document.getElementById('modal-app-code').textContent = app.trackingCode;
  document.getElementById('modal-app-name').textContent = app.fullName;
  document.getElementById('modal-app-doc').textContent = app.documentType;
  document.getElementById('modal-app-phone').textContent = app.phoneNumber;
  document.getElementById('modal-app-address').textContent = app.address;
  document.getElementById('modal-app-purpose').textContent = app.purpose;

  document.getElementById('modal-status-select').value = app.status || 'Under Review';
  document.getElementById('modal-remarks-input').value = app.remarks || '';

  document.getElementById('processing-modal').classList.remove('hidden');
  if (window.lucide) window.lucide.createIcons();
};

window.deleteAppByIndex = function(index) {
  const app = activeApplications[index];
  if (confirm(`Sigurado ka bang nais burahin ang aplikasyon ni ${app.fullName} (${app.trackingCode})?`)) {
    activeApplications.splice(index, 1);
    saveApplications();
    renderDashboard();
    showToast('Aplikasyon nabura na.');
  }
};

// Render e-Reklamo Table
function renderReklamoTable() {
  const tbody = document.getElementById('admin-reklamo-table-body');
  if (!tbody) return;

  if (activeReklamo.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="p-8 text-center text-xs text-slate-400">Walang naitalang reklamo.</td></tr>`;
    return;
  }

  tbody.innerHTML = activeReklamo.map((item, index) => `
    <tr class="hover:bg-slate-50 transition-colors border-b border-slate-100">
      <td class="p-3.5 font-mono font-bold text-rose-800">${item.ticketId}</td>
      <td class="p-3.5">
        <div class="font-bold text-slate-900">${item.fullName}</div>
        <div class="text-[11px] text-slate-500">${item.phoneNumber}</div>
      </td>
      <td class="p-3.5">
        <span class="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
          ${item.complaintType}
        </span>
      </td>
      <td class="p-3.5 text-xs text-slate-700">${item.location}</td>
      <td class="p-3.5 text-xs text-slate-600 max-w-xs truncate">${item.details}</td>
      <td class="p-3.5">
        <select onchange="updateReklamoStatus(${index}, this.value)" class="bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold">
          <option value="Under Review" ${item.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
          <option value="Dispatched Patrol" ${item.status === 'Dispatched Patrol' ? 'selected' : ''}>Dispatched Patrol</option>
          <option value="For Lupon Hearing" ${item.status === 'For Lupon Hearing' ? 'selected' : ''}>For Lupon Hearing</option>
          <option value="Resolved" ${item.status === 'Resolved' ? 'selected' : ''}>Resolved / Naaksyunan</option>
        </select>
      </td>
      <td class="p-3.5 text-right">
        <button onclick="deleteReklamoByIndex(${index})" class="text-slate-400 hover:text-red-600 p-1">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
      </td>
    </tr>
  `).join('');

  if (window.lucide) window.lucide.createIcons();
}

window.updateReklamoStatus = function(index, newStatus) {
  if (activeReklamo[index]) {
    activeReklamo[index].status = newStatus;
    saveReklamo();
    showToast(`Status ng ${activeReklamo[index].ticketId} ginawang: ${newStatus}`);
  }
};

window.deleteReklamoByIndex = function(index) {
  if (confirm('Burahin ang reklamo na ito?')) {
    activeReklamo.splice(index, 1);
    saveReklamo();
    renderDashboard();
    showToast('Reklamo nabura na.');
  }
};

// Populate Quick Print Select in Print Station
function populateQuickPrintSelect() {
  const select = document.getElementById('quick-print-select');
  if (!select) return;

  select.innerHTML = '<option value="">-- Pumili ng Aplikante --</option>' + 
    activeApplications.map(app => `
      <option value="${app.trackingCode}">
        ${app.trackingCode} - ${app.fullName} (${app.documentType})
      </option>
    `).join('');
}

// Export Applications to CSV
function exportApplicationsCSV() {
  if (activeApplications.length === 0) {
    showToast('Walang record na ma-export.');
    return;
  }

  let csv = 'Tracking Code,Full Name,Document Type,Phone Number,Address,Purpose,Status,Scheduled Pickup,Created At\n';
  activeApplications.forEach(a => {
    csv += `"${a.trackingCode}","${a.fullName}","${a.documentType}","${a.phoneNumber}","${a.address}","${a.purpose}","${a.status}","${a.pickupDate}","${a.createdAt}"\n`;
  });

  downloadBlob(csv, `Barangay-Ibayo-Tipas-Applications-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  showToast('Na-download ang masterlist CSV para sa Excel!');
}

// Export Reklamo to CSV
function exportReklamoCSV() {
  if (activeReklamo.length === 0) {
    showToast('Walang blotter record na ma-export.');
    return;
  }

  let csv = 'Ticket ID,Full Name,Phone Number,Complaint Type,Location,Details,Status,Created At\n';
  activeReklamo.forEach(r => {
    csv += `"${r.ticketId}","${r.fullName}","${r.phoneNumber}","${r.complaintType}","${r.location}","${r.details}","${r.status}","${r.createdAt}"\n`;
  });

  downloadBlob(csv, `Barangay-Ibayo-Tipas-Blotter-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv;charset=utf-8;');
  showToast('Na-download ang blotter CSV para sa Excel!');
}

function downloadBlob(content, filename, contentType) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Toast Notification
function showToast(message) {
  const container = document.getElementById('admin-toast-container') || document.body;
  const toast = document.createElement('div');
  toast.className = 'bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 text-xs font-semibold mb-2 pointer-events-auto transition-all duration-300';
  toast.innerHTML = `
    <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 shrink-0"></span>
    <span>${message}</span>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 400);
  }, 3500);
}
