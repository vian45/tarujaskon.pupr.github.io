// =======================
// ADMIN JAVASCRIPT - LENGKAP (TANPA DUMMY)
// =======================

// =======================
// GLOBAL VARIABLES
// =======================
let currentSection = 'dashboard';
let permohonanData = [];
let currentPage = 1;
const itemsPerPage = 10;
let chartsInitialized = false;
let statusChart, trendChart;

// =======================
// INITIALIZATION
// =======================
document.addEventListener('DOMContentLoaded', function() {
    console.log('✅ Admin panel loaded');
    
    // Cek status login
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const username = localStorage.getItem('adminUsername');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        console.log('⛔ Tidak login, redirect ke index.html');
        window.location.href = 'index.html';
        return;
    }
    
    // Tampilkan nama admin
    const adminNameElement = document.getElementById('adminName');
    if (adminNameElement) {
        adminNameElement.textContent = username || 'Admin';
    }
    
    // Load data
    loadData();
    
    // Tampilkan section awal
    showSection('dashboard');
    
    // Set tanggal hari ini untuk form
    const today = new Date().toISOString().split('T')[0];
    const tanggalInput = document.getElementById('tanggal');
    if (tanggalInput) tanggalInput.value = today;
    
    // Inisialisasi event listeners
    initEventListeners();
    
    console.log('✅ Admin siap digunakan');
});

// =======================
// LOAD DATA
// =======================
function loadData() {
    // Ambil data dari localStorage
    const stored = localStorage.getItem('permohonanData');
    permohonanData = stored ? JSON.parse(stored) : [];
    
    // Update UI
    updateStats();
    updateRecentPermohonan();
    updatePermohonanTable();
    updateCharts();
}

// =======================
// STATS UPDATE
// =======================
function updateStats() {
    const masuk = permohonanData.filter(p => p.status === 'Masuk').length;
    const diproses = permohonanData.filter(p => p.status === 'Diproses').length;
    const ditolak = permohonanData.filter(p => p.status === 'Ditolak').length;
    const terbit = permohonanData.filter(p => p.status === 'Terbit').length;
    
    const totalMasuk = document.getElementById('total-masuk');
    const totalDiproses = document.getElementById('total-diproses');
    const totalDitolak = document.getElementById('total-ditolak');
    const totalTerbit = document.getElementById('total-terbit');
    
    if (totalMasuk) totalMasuk.textContent = masuk;
    if (totalDiproses) totalDiproses.textContent = diproses;
    if (totalDitolak) totalDitolak.textContent = ditolak;
    if (totalTerbit) totalTerbit.textContent = terbit;
}

// =======================
// RECENT APPLICATIONS
// =======================
function updateRecentPermohonan() {
    const tbody = document.getElementById('recent-permohonan');
    if (!tbody) return;
    
    const recent = [...permohonanData]
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
        .slice(0, 5);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    tbody.innerHTML = recent.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.pemohon)}</td>
            <td>${escapeHtml(item.kegiatan)}</td>
            <td>${escapeHtml(item.lokasi)}</td>
            <td>${item.tanggal}</td>
            <td><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewPermohonan('${item.id}')" title="Lihat">
                    <i class="fas fa-eye"></i>
                </button>
                <button class="action-btn edit" onclick="editPermohonan('${item.id}')" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// =======================
// PERMOHONAN TABLE
// =======================
function updatePermohonanTable() {
    const tbody = document.getElementById('permohonan-table-body');
    if (!tbody) return;
    
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let filtered = permohonanData;
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.pemohon.toLowerCase().includes(searchTerm) ||
            p.kegiatan.toLowerCase().includes(searchTerm) ||
            p.lokasi.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Pagination
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage > totalPages) currentPage = totalPages || 1;
    
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    
    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center">Tidak ada data</td></tr>';
    } else {
        tbody.innerHTML = paginated.map((item, index) => `
            <tr>
                <td>${start + index + 1}</td>
                <td>${escapeHtml(item.pemohon)}</td>
                <td>${escapeHtml(item.kegiatan)}</td>
                <td>${escapeHtml(item.lokasi)}</td>
                <td>${item.luas.toFixed(2)}</td>
                <td>${item.tanggal}</td>
                <td><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></td>
                <td>
                    <button class="action-btn view" onclick="viewPermohonan('${item.id}')" title="Lihat">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="action-btn edit" onclick="editPermohonan('${item.id}')" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete" onclick="deletePermohonan('${item.id}')" title="Hapus">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }
    
    // Update pagination info
    const pageInfo = document.getElementById('pageInfo');
    if (pageInfo) {
        pageInfo.textContent = `Halaman ${currentPage} dari ${totalPages || 1}`;
    }
    
    // Update pagination buttons
    const prevBtn = document.querySelector('.page-btn:first-child');
    const nextBtn = document.querySelector('.page-btn:last-child');
    
    if (prevBtn) {
        prevBtn.disabled = currentPage <= 1;
    }
    if (nextBtn) {
        nextBtn.disabled = currentPage >= totalPages;
    }
}

// =======================
// ESCAPE HTML (security)
// =======================
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =======================
// CHARTS
// =======================
function updateCharts() {
    if (!document.getElementById('statusChart') || !document.getElementById('trendChart')) {
        console.warn('⚠️ Elemen chart tidak ditemukan');
        return;
    }
    
    if (chartsInitialized) {
        if (statusChart) statusChart.destroy();
        if (trendChart) trendChart.destroy();
    }
    
    // Status Chart (Pie)
    const statusCount = {
        Masuk: permohonanData.filter(p => p.status === 'Masuk').length,
        Diproses: permohonanData.filter(p => p.status === 'Diproses').length,
        Ditolak: permohonanData.filter(p => p.status === 'Ditolak').length,
        Terbit: permohonanData.filter(p => p.status === 'Terbit').length
    };
    
    try {
        const statusCtx = document.getElementById('statusChart').getContext('2d');
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Masuk', 'Diproses', 'Ditolak', 'Terbit'],
                datasets: [{
                    data: [statusCount.Masuk, statusCount.Diproses, statusCount.Ditolak, statusCount.Terbit],
                    backgroundColor: ['#3498db', '#f39c12', '#e74c3c', '#2ecc71'],
                    borderWidth: 0,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { size: 11 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.raw || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    } catch (e) {
        console.error('❌ Error membuat status chart:', e);
    }
    
    // Trend Chart - 7 hari terakhir
    try {
        const last7Days = [];
        const counts = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            last7Days.push(dateStr.slice(5)); // MM-DD
            
            const count = permohonanData.filter(p => p.tanggal === dateStr).length;
            counts.push(count);
        }
        
        const trendCtx = document.getElementById('trendChart').getContext('2d');
        trendChart = new Chart(trendCtx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Jumlah Permohonan',
                    data: counts,
                    borderColor: '#0b3d6d',
                    backgroundColor: 'rgba(11,61,109,0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#0b3d6d',
                    pointBorderColor: 'white',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        stepSize: 1,
                        grid: { color: 'rgba(0,0,0,0.05)' }
                    },
                    x: {
                        grid: { display: false }
                    }
                },
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: true }
                }
            }
        });
        
        chartsInitialized = true;
    } catch (e) {
        console.error('❌ Error membuat trend chart:', e);
    }
}

// =======================
// SECTION NAVIGATION
// =======================
function showSection(sectionId) {
    if (!sectionId) return;
    
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const selectedSection = document.getElementById(`${sectionId}-section`);
    if (selectedSection) {
        selectedSection.classList.add('active');
    } else {
        console.warn(`⚠️ Section ${sectionId}-section tidak ditemukan`);
    }
    
    // Update active menu
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('onclick')?.includes(sectionId)) {
            link.classList.add('active');
        }
    });
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'permohonan': 'Data Permohonan',
        'arsip': 'Arsip',
        'statistik': 'Statistik',
        'pengguna': 'Pengguna',
        'pengaturan': 'Pengaturan'
    };
    
    const pageTitle = document.getElementById('page-title');
    if (pageTitle) {
        pageTitle.textContent = titles[sectionId] || 'Dashboard';
    }
    
    currentSection = sectionId;
    console.log(`📍 Navigasi ke: ${sectionId}`);
}

// =======================
// PERMOHONAN CRUD
// =======================
function tambahPermohonan() {
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Tambah Permohonan';
    
    document.getElementById('permohonanId').value = '';
    document.getElementById('permohonanForm').reset();
    
    const today = new Date().toISOString().split('T')[0];
    const tanggalInput = document.getElementById('tanggal');
    if (tanggalInput) tanggalInput.value = today;
    
    openModal('permohonanModal');
}

function editPermohonan(id) {
    const permohonan = permohonanData.find(p => p.id === id);
    if (!permohonan) {
        alert('Data tidak ditemukan');
        return;
    }
    
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) modalTitle.textContent = 'Edit Permohonan';
    
    document.getElementById('permohonanId').value = permohonan.id;
    document.getElementById('pemohon').value = permohonan.pemohon;
    document.getElementById('kegiatan').value = permohonan.kegiatan;
    document.getElementById('lokasi').value = permohonan.lokasi;
    document.getElementById('luas').value = permohonan.luas;
    document.getElementById('tanggal').value = permohonan.tanggal;
    document.getElementById('status').value = permohonan.status;
    document.getElementById('keterangan').value = permohonan.keterangan || '';
    
    openModal('permohonanModal');
}

function viewPermohonan(id) {
    const permohonan = permohonanData.find(p => p.id === id);
    if (!permohonan) {
        alert('Data tidak ditemukan');
        return;
    }
    
    const message = `
        📋 DETAIL PERMOHONAN
        ====================
        ID: ${permohonan.id}
        Pemohon: ${permohonan.pemohon}
        Kegiatan: ${permohonan.kegiatan}
        Lokasi: ${permohonan.lokasi}
        Luas: ${permohonan.luas} Ha
        Tanggal: ${permohonan.tanggal}
        Status: ${permohonan.status}
        Keterangan: ${permohonan.keterangan || '-'}
    `;
    
    alert(message);
}

function deletePermohonan(id) {
    if (!confirm('⚠️ Yakin ingin menghapus permohonan ini?')) return;
    
    permohonanData = permohonanData.filter(p => p.id !== id);
    localStorage.setItem('permohonanData', JSON.stringify(permohonanData));
    
    updateStats();
    updateRecentPermohonan();
    updatePermohonanTable();
    updateCharts();
    
    alert('✅ Permohonan berhasil dihapus');
}

function simpanPermohonan(event) {
    event.preventDefault();
    
    const id = document.getElementById('permohonanId').value;
    const permohonan = {
        id: id || Date.now().toString(),
        pemohon: document.getElementById('pemohon').value,
        kegiatan: document.getElementById('kegiatan').value,
        lokasi: document.getElementById('lokasi').value,
        luas: parseFloat(document.getElementById('luas').value) || 0,
        tanggal: document.getElementById('tanggal').value,
        status: document.getElementById('status').value,
        keterangan: document.getElementById('keterangan').value
    };
    
    // Validasi
    if (!permohonan.pemohon || !permohonan.kegiatan || !permohonan.lokasi || !permohonan.luas || !permohonan.tanggal) {
        alert('❌ Semua field harus diisi');
        return;
    }
    
    if (id) {
        // Update existing
        const index = permohonanData.findIndex(p => p.id === id);
        if (index !== -1) {
            permohonanData[index] = permohonan;
        }
    } else {
        // Add new
        permohonanData.push(permohonan);
    }
    
    localStorage.setItem('permohonanData', JSON.stringify(permohonanData));
    
    closeModal('permohonanModal');
    updateStats();
    updateRecentPermohonan();
    updatePermohonanTable();
    updateCharts();
    
    alert('✅ Data berhasil disimpan');
}

// =======================
// FILTER & SEARCH
// =======================
function filterPermohonan() {
    currentPage = 1;
    updatePermohonanTable();
}

// =======================
// PAGINATION
// =======================
function prevPage() {
    if (currentPage > 1) {
        currentPage--;
        updatePermohonanTable();
    }
}

function nextPage() {
    const filtered = getFilteredData();
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePermohonanTable();
    }
}

function getFilteredData() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let filtered = permohonanData;
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.pemohon.toLowerCase().includes(searchTerm) ||
            p.kegiatan.toLowerCase().includes(searchTerm) ||
            p.lokasi.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    return filtered;
}

// =======================
// EXPORT DATA
// =======================
function exportData() {
    const filtered = getFilteredData();
    
    if (filtered.length === 0) {
        alert('Tidak ada data untuk diekspor');
        return;
    }
    
    // Buat CSV
    const headers = ['ID', 'Pemohon', 'Kegiatan', 'Lokasi', 'Luas (Ha)', 'Tanggal', 'Status', 'Keterangan'];
    const rows = filtered.map(p => [
        p.id,
        p.pemohon,
        p.kegiatan,
        p.lokasi,
        p.luas,
        p.tanggal,
        p.status,
        p.keterangan || ''
    ]);
    
    const csvContent = [headers, ...rows]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
    
    // Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `permohonan_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    alert(`✅ Data berhasil diekspor (${filtered.length} records)`);
}

// =======================
// MODAL FUNCTIONS
// =======================
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
    }
}

function closeProfileModal() {
    closeModal('profileModal');
}

// =======================
// SIDEBAR TOGGLE
// =======================
function toggleSidebar() {
    document.querySelector('.sidebar')?.classList.toggle('show');
}

// =======================
// PROFILE FUNCTIONS
// =======================
function showProfile() {
    const username = localStorage.getItem('adminUsername') || 'admin';
    
    document.getElementById('profileUsername').textContent = username;
    document.getElementById('profileName').textContent = 'Administrator';
    document.getElementById('profileEmail').textContent = 'admin@pupr.tts.go.id';
    
    const lastLogin = localStorage.getItem('lastLogin') || '-';
    document.getElementById('lastLogin').textContent = lastLogin;
    
    openModal('profileModal');
}

function ubahPassword() {
    alert('🔧 Fitur ubah password akan segera tersedia');
    closeProfileModal();
}

// =======================
// LOGOUT
// =======================
function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('lastLogin');
        window.location.href = 'index.html';
    }
}

// =======================
// EVENT LISTENERS
// =======================
function initEventListeners() {
    // Click outside modal to close
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    };
    
    // Escape key to close modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        }
    });
    
    // Handle window resize for responsive sidebar
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            document.querySelector('.sidebar')?.classList.remove('show');
        }
    });
    
    console.log('✅ Event listeners initialized');
}

// =======================
// AUTO REFRESH (untuk sinkronisasi antar tab)
// =======================
window.addEventListener('storage', function(e) {
    if (e.key === 'permohonanData') {
        permohonanData = JSON.parse(e.newValue || '[]');
        updateStats();
        updateRecentPermohonan();
        updatePermohonanTable();
        updateCharts();
        console.log('🔄 Data diperbarui dari tab lain');
    }
});

// =======================
// FORMAT HELPERS
// =======================
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
}

function formatRupiah(angka) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(angka);
}

// =======================
// DEBUG FUNCTIONS
// =======================
function reloadData() {
    console.log('🔄 Reload data...');
    loadData();
}

function clearData() {
    if (confirm('⚠️ Hapus semua data? (tidak bisa dikembalikan)')) {
        localStorage.removeItem('permohonanData');
        permohonanData = [];
        updateStats();
        updateRecentPermohonan();
        updatePermohonanTable();
        updateCharts();
        console.log('✅ Semua data dihapus');
    }
}

// =======================
// EXPOSE FUNCTIONS TO GLOBAL SCOPE
// =======================
window.showSection = showSection;
window.tambahPermohonan = tambahPermohonan;
window.editPermohonan = editPermohonan;
window.viewPermohonan = viewPermohonan;
window.deletePermohonan = deletePermohonan;
window.simpanPermohonan = simpanPermohonan;
window.closeModal = closeModal;
window.closeProfileModal = closeProfileModal;
window.filterPermohonan = filterPermohonan;
window.prevPage = prevPage;
window.nextPage = nextPage;
window.exportData = exportData;
window.toggleSidebar = toggleSidebar;
window.showProfile = showProfile;
window.ubahPassword = ubahPassword;
window.logout = logout;
window.reloadData = reloadData;
window.clearData = clearData;

console.log('✅ Admin JavaScript berhasil dimuat (tanpa dummy data)');