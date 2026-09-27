// Barangay Ibayo-Tipas Portal - Interactive Logic & Database Integration

// Configuration: Paste your deployed Google Apps Script Web App URL here
const GOOGLE_SHEETS_WEBHOOK_URL = ''; 

// Admin Access Passcode
const ADMIN_PASSCODE = 'tipas2026';

// Initial Demo Records for Instant Testing
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
    createdAt: new Date().toISOString()
  },
  {
    trackingCode: 'BIT-2026-92817',
    fullName: 'Elena Santos Bautista',
    documentType: 'Certificate of Indigency',
    docVal: 'indigency',
    phoneNumber: '09289876543',
    address: '#22 F. Manalo St., Purok 3, Ibayo-Tipas',
    purpose: 'Medical Assistance / Taguig TLC Care',
    status: 'Processing',
    pickupDate: 'Lunes hanggang Biyernes (8:00 AM - 4:30 PM)',
    createdAt: new Date().toISOString()
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
  }
];

// Local Storage Helper
function getStoredApplications() {
  const data = localStorage.getItem('ibayo_applications');
  if (!data) {
    localStorage.setItem('ibayo_applications', JSON.stringify(DEFAULT_APPLICATIONS));
    return DEFAULT_APPLICATIONS;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_APPLICATIONS;
  }
}

function saveApplications(apps) {
  localStorage.setItem('ibayo_applications', JSON.stringify(apps));
}

function getStoredReklamo() {
  const data = localStorage.getItem('ibayo_reklamo');
  if (!data) {
    localStorage.setItem('ibayo_reklamo', JSON.stringify(DEFAULT_REKLAMO));
    return DEFAULT_REKLAMO;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return DEFAULT_REKLAMO;
  }
}

function saveReklamo(reklamoList) {
  localStorage.setItem('ibayo_reklamo', JSON.stringify(reklamoList));
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons if available
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Ensure default data exists
  getStoredApplications();
  getStoredReklamo();

  // --- Mobile Sidebar Drawer Toggle ---
  const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
  const mobileSidebarClose = document.getElementById('mobile-sidebar-close');
  const mobileSidebarDrawer = document.getElementById('mobile-sidebar-drawer');
  const mobileSidebarBackdrop = document.getElementById('mobile-sidebar-backdrop');

  function openMobileSidebar() {
    if (mobileSidebarDrawer && mobileSidebarBackdrop) {
      mobileSidebarBackdrop.classList.remove('hidden');
      mobileSidebarDrawer.classList.remove('-translate-x-full');
    }
  }

  function closeMobileSidebar() {
    if (mobileSidebarDrawer && mobileSidebarBackdrop) {
      mobileSidebarBackdrop.classList.add('hidden');
      mobileSidebarDrawer.classList.add('-translate-x-full');
    }
  }

  if (mobileSidebarToggle) {
    mobileSidebarToggle.addEventListener('click', openMobileSidebar);
  }
  if (mobileSidebarClose) {
    mobileSidebarClose.addEventListener('click', closeMobileSidebar);
  }
  if (mobileSidebarBackdrop) {
    mobileSidebarBackdrop.addEventListener('click', closeMobileSidebar);
  }

  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    link.addEventListener('click', closeMobileSidebar);
  });

  // Legacy fallback if mobile-menu-btn exists
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileNav = document.getElementById('mobile-nav');
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('hidden');
    });
  }

  // --- Announcements Filtering & Search ---
  const filterBtns = document.querySelectorAll('.announcement-filter-btn');
  const searchInput = document.getElementById('announcement-search');
  const announcementCards = document.querySelectorAll('.announcement-card');

  function filterAnnouncements() {
    const activeBtn = document.querySelector('.announcement-filter-btn.active');
    const activeCategory = activeBtn ? activeBtn.getAttribute('data-category') : 'all';
    const query = (searchInput ? searchInput.value : '').toLowerCase().trim();

    announcementCards.forEach(card => {
      const cardCategory = card.getAttribute('data-category');
      const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
      const text = card.querySelector('p')?.textContent.toLowerCase() || '';

      const matchesCat = activeCategory === 'all' || cardCategory === activeCategory;
      const matchesSearch = query === '' || title.includes(query) || text.includes(query);

      card.style.display = matchesCat && matchesSearch ? 'flex' : 'none';
    });
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-blue-900', 'text-white');
        b.classList.add('bg-slate-100', 'text-slate-700');
      });
      btn.classList.add('active', 'bg-blue-900', 'text-white');
      btn.classList.remove('bg-slate-100', 'text-slate-700');
      filterAnnouncements();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', filterAnnouncements);
  }

  // --- Document Request Wizard & Modal ---
  const requestModal = document.getElementById('request-modal');
  const openRequestBtns = document.querySelectorAll('.open-request-modal');
  const closeRequestBtns = document.querySelectorAll('.close-request-modal');
  const requestForm = document.getElementById('document-request-form');
  const confirmationView = document.getElementById('request-confirmation-view');
  const formFieldsView = document.getElementById('request-form-fields-view');

  function openModal(defaultDoc = '') {
    if (requestModal) {
      requestModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      if (defaultDoc && document.getElementById('doc-type-select')) {
        document.getElementById('doc-type-select').value = defaultDoc;
        updateDocRequirements(defaultDoc);
      }
    }
  }

  function closeModal() {
    if (requestModal) {
      requestModal.classList.add('hidden');
      document.body.style.overflow = '';
      if (formFieldsView && confirmationView) {
        formFieldsView.classList.remove('hidden');
        confirmationView.classList.add('hidden');
      }
    }
  }

  openRequestBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const docType = btn.getAttribute('data-doc') || '';
      openModal(docType);
    });
  });

  closeRequestBtns.forEach(btn => {
    btn.addEventListener('click', closeModal);
  });

  // Requirements lookup map
  const docRequirements = {
    'clearance': [
      'Valid Government ID or Student ID with Ibayo-Tipas address',
      'Community Tax Certificate (Cedula) for the current year',
      'Proof of billing or lease contract (if recently moved)',
      'Processing fee: ₱50.00 (Standard) or FREE for First-Time Jobseekers'
    ],
    'residency': [
      'Valid ID showing address in Ibayo-Tipas',
      'Proof of stay (at least 6 months residency in the barangay)',
      'Cedula (optional but recommended)',
      'Processing fee: ₱30.00'
    ],
    'indigency': [
      'Valid ID or Barangay Certification',
      'Case Study report or referral (for Medical / DSWD / PAO / Scholarship)',
      'Processing fee: FREE (Walang Bayad)'
    ],
    'business': [
      'DTI Business Name Certificate or SEC Registration',
      'Contract of Lease or Land Title of business premises',
      'Barangay Clearance of Business Owner',
      'Cedula & Previous year Barangay Permit (if renewal)'
    ],
    'id': [
      'Proof of residency in Barangay Ibayo-Tipas (at least 1 year)',
      '1 Valid Government ID / Birth Certificate',
      '1x1 or 2x2 ID picture (can also take photo at the barangay hall)',
      'Emergency contact details'
    ],
    'jobseeker': [
      'Barangay Certification of First-time Jobseeker (under RA 11261)',
      'Signed Oath of Undertaking',
      'Valid ID or School Certificate',
      'Processing fee: 100% LIBRE / FREE'
    ]
  };

  const docTypeSelect = document.getElementById('doc-type-select');
  const reqListContainer = document.getElementById('doc-requirements-list');

  function updateDocRequirements(type) {
    if (!reqListContainer) return;
    const reqs = docRequirements[type] || docRequirements['clearance'];
    reqListContainer.innerHTML = reqs.map(r => `
      <li class="flex items-start gap-2 text-xs text-slate-600">
        <span class="text-emerald-600 font-bold">✓</span>
        <span>${r}</span>
      </li>
    `).join('');
  }

  if (docTypeSelect) {
    docTypeSelect.addEventListener('change', (e) => {
      updateDocRequirements(e.target.value);
    });
    updateDocRequirements(docTypeSelect.value);
  }

  // Handle Form Submission
  if (requestForm) {
    requestForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const fullName = document.getElementById('applicant-name')?.value || 'Resident';
      const docTypeVal = document.getElementById('doc-type-select')?.value || 'clearance';
      const docTypeName = document.getElementById('doc-type-select')?.options[document.getElementById('doc-type-select').selectedIndex]?.text || 'Barangay Document';
      const contactNo = document.getElementById('applicant-phone')?.value || 'N/A';
      const purok = document.getElementById('applicant-address')?.value || 'Ibayo-Tipas, Taguig City';
      const purpose = document.getElementById('applicant-purpose')?.value || 'Personal Record';

      // Generate Reference Code: BIT-2026-XXXXX
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const trackingCode = `BIT-2026-${randomNum}`;

      // Pick next business day
      const today = new Date();
      const pickupDate = new Date(today);
      pickupDate.setDate(today.getDate() + 1);
      const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
      const formattedDate = pickupDate.toLocaleDateString('en-PH', options);
      const pickupString = `${formattedDate} (8:00 AM - 4:30 PM)`;

      // Save to Local Database
      const newApp = {
        trackingCode,
        fullName,
        documentType: docTypeName,
        docVal: docTypeVal,
        phoneNumber: contactNo,
        address: purok,
        purpose,
        status: 'Under Review',
        pickupDate: pickupString,
        createdAt: new Date().toISOString()
      };

      const apps = getStoredApplications();
      apps.unshift(newApp);
      saveApplications(apps);

      // Async Sync with Google Sheets if configured
      if (GOOGLE_SHEETS_WEBHOOK_URL) {
        fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'new_document_request',
            ...newApp
          })
        }).catch(err => console.log('Google Sheets sync notice:', err));
      }

      // Populate confirmation view
      document.getElementById('stub-tracking-code').textContent = trackingCode;
      document.getElementById('stub-name').textContent = fullName;
      document.getElementById('stub-doc').textContent = docTypeName;
      document.getElementById('stub-phone').textContent = contactNo;
      document.getElementById('stub-address').textContent = purok;
      document.getElementById('stub-pickup-date').textContent = pickupString;

      // Switch views
      if (formFieldsView && confirmationView) {
        formFieldsView.classList.add('hidden');
        confirmationView.classList.remove('hidden');
      }

      requestForm.reset();
      showToast(`Tagumpay! Tracking Code: ${trackingCode}`);
    });
  }

  // --- Print Claim Stub ---
  const printStubBtn = document.getElementById('print-stub-btn');
  if (printStubBtn) {
    printStubBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // --- DOCUMENT TRACKER SECTION ---
  const trackerForm = document.getElementById('tracker-form');
  const trackerInput = document.getElementById('tracker-input');
  const trackerResultBox = document.getElementById('tracker-result-box');
  const trackerNotFoundBox = document.getElementById('tracker-not-found-box');

  if (trackerForm && trackerInput) {
    trackerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = trackerInput.value.trim().toUpperCase();

      if (!code) return;

      const apps = getStoredApplications();
      const match = apps.find(a => a.trackingCode.toUpperCase() === code || a.phoneNumber === code);

      if (match) {
        renderTrackingResult(match);
        if (trackerResultBox) trackerResultBox.classList.remove('hidden');
        if (trackerNotFoundBox) trackerNotFoundBox.classList.add('hidden');
      } else {
        if (trackerResultBox) trackerResultBox.classList.add('hidden');
        if (trackerNotFoundBox) trackerNotFoundBox.classList.remove('hidden');
      }
    });
  }

  function renderTrackingResult(app) {
    document.getElementById('track-res-code').textContent = app.trackingCode;
    document.getElementById('track-res-name').textContent = app.fullName;
    document.getElementById('track-res-doc').textContent = app.documentType;
    document.getElementById('track-res-pickup').textContent = app.pickupDate || 'Available during office hours';
    
    // Status Badge & Stepper
    const statusText = app.status || 'Under Review';
    const statusBadge = document.getElementById('track-res-status-badge');
    statusBadge.textContent = statusText;

    // Reset steps
    const step1 = document.getElementById('track-step-1');
    const step2 = document.getElementById('track-step-2');
    const step3 = document.getElementById('track-step-3');
    const step4 = document.getElementById('track-step-4');

    [step1, step2, step3, step4].forEach(s => {
      if (s) {
        s.className = 'flex flex-col items-center text-center';
        s.querySelector('.step-circle').className = 'step-circle w-8 h-8 rounded-full border-2 border-slate-300 bg-white text-slate-400 font-bold text-xs flex items-center justify-center';
        s.querySelector('.step-label').className = 'step-label text-[11px] text-slate-400 mt-1 font-medium';
      }
    });

    function setStepActive(stepEl, num, label) {
      if (!stepEl) return;
      stepEl.querySelector('.step-circle').className = 'step-circle w-8 h-8 rounded-full border-2 border-emerald-500 bg-emerald-500 text-white font-bold text-xs flex items-center justify-center shadow-md';
      stepEl.querySelector('.step-label').className = 'step-label text-[11px] text-emerald-700 mt-1 font-bold';
    }

    setStepActive(step1); // Step 1 is always completed once tracked

    if (statusText === 'Under Review' || statusText === 'Processing' || statusText === 'Sinusuri') {
      setStepActive(step2);
      statusBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800 border border-blue-200';
    } else if (statusText === 'For Signature' || statusText === 'Nilalagdaan') {
      setStepActive(step2);
      setStepActive(step3);
      statusBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase bg-amber-100 text-amber-800 border border-amber-200';
    } else if (statusText === 'Ready for Pickup' || statusText === 'Handa nang Kunin') {
      setStepActive(step2);
      setStepActive(step3);
      setStepActive(step4);
      statusBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse';
    } else if (statusText === 'Released' || statusText === 'Nailabas na') {
      setStepActive(step2);
      setStepActive(step3);
      setStepActive(step4);
      statusBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase bg-slate-100 text-slate-800 border border-slate-300';
    } else {
      statusBadge.className = 'px-3 py-1 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800';
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // --- e-Reklamo / Citizen Helpdesk Form ---
  const complaintForm = document.getElementById('complaint-form');
  if (complaintForm) {
    complaintForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const ticketId = `TICKET-IBAYO-${randomId}`;

      const name = complaintForm.querySelector('input[placeholder*="Juan"]')?.value || 'Anonymous';
      const phone = complaintForm.querySelector('input[type="tel"]')?.value || 'N/A';
      const type = complaintForm.querySelector('select')?.value || 'General Concern';
      const loc = complaintForm.querySelector('input[placeholder*="Dr. Natividad"]')?.value || 'Ibayo-Tipas';
      const details = complaintForm.querySelector('textarea')?.value || '';

      const newReklamo = {
        ticketId,
        fullName: name,
        phoneNumber: phone,
        complaintType: type,
        location: loc,
        details,
        status: 'Forwarded to BPSO Patrol',
        createdAt: new Date().toISOString()
      };

      const reklamoList = getStoredReklamo();
      reklamoList.unshift(newReklamo);
      saveReklamo(reklamoList);

      if (GOOGLE_SHEETS_WEBHOOK_URL) {
        fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'new_reklamo',
            ...newReklamo
          })
        }).catch(err => console.log('Reklamo Google Sheets notice:', err));
      }

      complaintForm.reset();
      showToast(`Ulat naipadala na! Reference Ticket: ${ticketId}. Aksyunan ito ng BPSO Desk.`);
    });
  }

  // --- BARANGAY STAFF / ADMIN PORTAL LOGIC ---
  const openAdminBtn = document.getElementById('open-admin-btn');
  const adminModal = document.getElementById('admin-modal');
  const closeAdminBtn = document.getElementById('close-admin-btn');
  const adminAuthView = document.getElementById('admin-auth-view');
  const adminDashboardView = document.getElementById('admin-dashboard-view');
  const adminPasscodeForm = document.getElementById('admin-passcode-form');
  const adminPasscodeInput = document.getElementById('admin-passcode-input');
  const adminAuthError = document.getElementById('admin-auth-error');

  function openAdmin() {
    if (adminModal) {
      adminModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      // Reset to login screen
      adminAuthView.classList.remove('hidden');
      adminDashboardView.classList.add('hidden');
      if (adminPasscodeInput) adminPasscodeInput.value = '';
      if (adminAuthError) adminAuthError.classList.add('hidden');
    }
  }

  function closeAdmin() {
    if (adminModal) {
      adminModal.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  if (openAdminBtn) openAdminBtn.addEventListener('click', openAdmin);
  if (closeAdminBtn) closeAdminBtn.addEventListener('click', closeAdmin);

  // Authenticate Admin
  if (adminPasscodeForm) {
    adminPasscodeForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const entered = adminPasscodeInput.value.trim();
      if (entered === ADMIN_PASSCODE) {
        adminAuthView.classList.add('hidden');
        adminDashboardView.classList.remove('hidden');
        renderAdminDashboard();
        showToast('Admin Portal Unlocked! Welcome Staff.');
      } else {
        if (adminAuthError) adminAuthError.classList.remove('hidden');
      }
    });
  }

  function renderAdminDashboard() {
    const apps = getStoredApplications();
    const reklamo = getStoredReklamo();

    // Stats
    const totalAppsEl = document.getElementById('admin-stat-total-apps');
    const pendingAppsEl = document.getElementById('admin-stat-pending-apps');
    const readyAppsEl = document.getElementById('admin-stat-ready-apps');
    const totalReklamoEl = document.getElementById('admin-stat-total-reklamo');

    if (totalAppsEl) totalAppsEl.textContent = apps.length;
    if (pendingAppsEl) pendingAppsEl.textContent = apps.filter(a => a.status === 'Under Review' || a.status === 'Processing').length;
    if (readyAppsEl) readyAppsEl.textContent = apps.filter(a => a.status === 'Ready for Pickup').length;
    if (totalReklamoEl) totalReklamoEl.textContent = reklamo.length;

    // Render Table
    const tbody = document.getElementById('admin-apps-tbody');
    if (tbody) {
      if (apps.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-6 text-center text-xs text-slate-400">Walang record sa ngayon.</td></tr>`;
      } else {
        tbody.innerHTML = apps.map((app, index) => `
          <tr class="border-b border-slate-100 hover:bg-slate-50 text-xs">
            <td class="p-3 font-mono font-bold text-blue-900">${app.trackingCode}</td>
            <td class="p-3 font-semibold text-slate-900">${app.fullName}</td>
            <td class="p-3 text-slate-600">${app.documentType}</td>
            <td class="p-3 text-slate-500">${app.phoneNumber}</td>
            <td class="p-3">
              <select class="admin-status-dropdown bg-white border border-slate-300 rounded px-2 py-1 text-xs font-semibold" data-index="${index}">
                <option value="Under Review" ${app.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                <option value="Processing" ${app.status === 'Processing' ? 'selected' : ''}>Processing</option>
                <option value="For Signature" ${app.status === 'For Signature' ? 'selected' : ''}>For Signature</option>
                <option value="Ready for Pickup" ${app.status === 'Ready for Pickup' ? 'selected' : ''}>Ready for Pickup</option>
                <option value="Released" ${app.status === 'Released' ? 'selected' : ''}>Released</option>
              </select>
            </td>
            <td class="p-3 text-right">
              <button class="admin-delete-app text-red-600 hover:text-red-800 font-bold p-1 rounded" data-index="${index}">
                Burahin
              </button>
            </td>
          </tr>
        `).join('');

        // Attach event listeners for status change
        tbody.querySelectorAll('.admin-status-dropdown').forEach(dropdown => {
          dropdown.addEventListener('change', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'), 10);
            apps[idx].status = e.target.value;
            saveApplications(apps);
            showToast(`Status updated to: "${e.target.value}" for ${apps[idx].trackingCode}`);
            renderAdminDashboard();
          });
        });

        // Delete record
        tbody.querySelectorAll('.admin-delete-app').forEach(btn => {
          btn.addEventListener('click', (e) => {
            const idx = parseInt(e.target.getAttribute('data-index'), 10);
            if (confirm(`Sigurado ka bang nais burahin ang ${apps[idx].trackingCode}?`)) {
              apps.splice(idx, 1);
              saveApplications(apps);
              renderAdminDashboard();
              showToast('Na-delete ang aplikasyon.');
            }
          });
        });
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // Export to CSV
  const exportCsvBtn = document.getElementById('admin-export-csv-btn');
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
      const apps = getStoredApplications();
      if (apps.length === 0) {
        showToast('Walang record na ma-export.');
        return;
      }

      let csv = 'Tracking Code,Full Name,Document Type,Phone Number,Address,Purpose,Status,Scheduled Pickup,Created At\n';
      apps.forEach(a => {
        csv += `"${a.trackingCode}","${a.fullName}","${a.documentType}","${a.phoneNumber}","${a.address}","${a.purpose}","${a.status}","${a.pickupDate}","${a.createdAt}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Ibayo-Tipas-Applications-${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Na-export na ang CSV file para sa Excel / Google Sheets!');
    });
  }

  // Reset to Demo Data
  const resetDemoBtn = document.getElementById('admin-reset-demo-btn');
  if (resetDemoBtn) {
    resetDemoBtn.addEventListener('click', () => {
      if (confirm('I-load ang default demo sample records?')) {
        saveApplications(DEFAULT_APPLICATIONS);
        saveReklamo(DEFAULT_REKLAMO);
        renderAdminDashboard();
        showToast('Demo records loaded successfully!');
      }
    });
  }

  // --- Toast Notification Helper ---
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 text-sm font-medium transition-all duration-300';
    toast.innerHTML = `
      <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block shrink-0"></span>
      <span>${message}</span>
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 400);
    }, 4000);
  }

  // --- Copy Hotline Helper ---
  document.querySelectorAll('.copy-hotline').forEach(btn => {
    btn.addEventListener('click', () => {
      const number = btn.getAttribute('data-number');
      if (number) {
        navigator.clipboard.writeText(number).then(() => {
          showToast(`Kinopya ang numero: ${number}`);
        });
      }
    });
  });
});
