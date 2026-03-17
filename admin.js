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
    console.log('Admin panel loaded');
    
    // Cek status login
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const username = localStorage.getItem('adminUsername');
    
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'index.html';
        return;
    }
    
    // Tampilkan nama admin
    document.getElementById('adminName').textContent = username || 'Admin';
    
    // Load data
    loadData();
    
    // Tampilkan section awal
    showSection('dashboard');
    
    // Inisialisasi event listeners
    initEventListeners();
    
    // Set tanggal hari ini untuk form
    document.getElementById('tanggal').valueAsDate = new Date();
});

// =======================
// LOAD DATA
// =======================
function loadData() {
    // Ambil data dari localStorage
    const stored = localStorage.getItem('permohonanData');
    permohonanData = stored ? JSON.parse(stored) : [];
    
    // Jika data kosong, buat data dummy
    if (permohonanData.length === 0) {
        createDummyData();
    }
    
    // Update UI
    updateStats();
    updateRecentPermohonan();
    updatePermohonanTable();
    updateCharts();
}

function createDummyData() {
    const dummyData = [
        {
            id: '1',
            pemohon: 'PT Maju Jaya',
            kegiatan: 'Industri',
            lokasi: 'Kecamatan Amanuban Barat',
            luas: 2.5,
            tanggal: '2026-03-01',
            status: 'Masuk',
            keterangan: 'Permohonan baru'
        },
        {
            id: '2',
            pemohon: 'CV Sejahtera',
            kegiatan: 'Perdagangan',
            lokasi: 'Kecamatan Amanuban Timur',
            luas: 1.2,
            tanggal: '2026-03-02',
            status: 'Diproses',
            keterangan: 'Sedang diverifikasi'
        },
        {
            id: '3',
            pemohon: 'Fanda Farma III',
            kegiatan: 'Apotik',
            lokasi: 'Kecamatan Kota SoE',
            luas: 0.8,
            tanggal: '2026-03-03',
            status: 'Terbit',
            keterangan: 'Selesai'
        },
        {
            id: '4',
            pemohon: 'Yayasan Pendidikan TTS',
            kegiatan: 'Sekolah',
            lokasi: 'Kecamatan Mollo Utara',
            luas: 3.0,
            tanggal: '2026-03-04',
            status: 'Ditolak',
            keterangan: 'Tidak sesuai RDTR'
        },
        {
            id: '5',
            pemohon: 'Hotel SoE Indah',
            kegiatan: 'Hotel',
            lokasi: 'Kecamatan Kota SoE',
            luas: 1.5,
            tanggal: '2026-03-05',
            status: 'Masuk',
            keterangan: 'Menunggu'
        }
    ];
    
    permohonanData = dummyData;
    localStorage.setItem('permohonanData', JSON.stringify(dummyData));
}

// =======================
// STATS UPDATE
// =======================
function updateStats() {
    const masuk = permohonanData.filter(p => p.status === 'Masuk').length;
    const diproses = permohonanData.filter(p => p.status === 'Diproses').length;
    const ditolak = permohonanData.filter(p => p.status === 'Ditolak').length;
    const terbit = permohonanData.filter(p => p.status === 'Terbit').length;
    
    document.getElementById('total-masuk').textContent = masuk;
    document.getElementById('total-diproses').textContent = diproses;
    document.getElementById('total-ditolak').textContent = ditolak;
    document.getElementById('total-terbit').textContent = terbit;
}

// =======================
// RECENT APPLICATIONS
// =======================
function updateRecentPermohonan() {
    const tbody = document.getElementById('recent-permohonan');
    const recent = [...permohonanData]
        .sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal))
        .slice(0, 5);
    
    if (recent.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    tbody.innerHTML = recent.map((item, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${item.pemohon}</td>
            <td>${item.kegiatan}</td>
            <td>${item.lokasi}</td>
            <td>${item.tanggal}</td>
            <td><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewPermohonan('${item.id}')"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit" onclick="editPermohonan('${item.id}')"><i class="fas fa-edit"></i></button>
            </td>
        </tr>
    `).join('');
}

// =======================
// PERMOHONAN TABLE
// =======================
function updatePermohonanTable() {
    const tbody = document.getElementById('permohonan-table-body');
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let filtered = permohonanData;
    
    if (searchTerm) {
        filtered = filtered.filter(p => 
            p.pemohon.toLowerCase().includes(searchTerm) ||
            p.kegiatan.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        filtered = filtered.filter(p => p.status === statusFilter);
    }
    
    // Pagination
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginated = filtered.slice(start, end);
    
    if (paginated.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center">Tidak ada data</td></tr>';
        return;
    }
    
    tbody.innerHTML = paginated.map((item, index) => `
        <tr>
            <td>${start + index + 1}</td>
            <td>${item.pemohon}</td>
            <td>${item.kegiatan}</td>
            <td>${item.lokasi}</td>
            <td>${item.luas}</td>
            <td>${item.tanggal}</td>
            <td><span class="status-badge ${item.status.toLowerCase()}">${item.status}</span></td>
            <td>
                <button class="action-btn view" onclick="viewPermohonan('${item.id}')"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit" onclick="editPermohonan('${item.id}')"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete" onclick="deletePermohonan('${item.id}')"><i class="fas fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
    
    // Update pagination info
    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    document.getElementById('pageInfo').textContent = `Halaman ${currentPage} dari ${totalPages}`;
}

// =======================
// CHARTS
// =======================
function updateCharts() {
    if (chartsInitialized) {
        statusChart.destroy();
        trendChart.destroy();
    }
    
    // Status Chart (Pie)
    const statusCount = {
        Masuk: permohonanData.filter(p => p.status === 'Masuk').length,
        Diproses: permohonanData.filter(p => p.status === 'Diproses').length,
        Ditolak: permohonanData.filter(p => p.status === 'Ditolak').length,
        Terbit: permohonanData.filter(p => p.status === 'Terbit').length
    };
    
    const statusCtx = document.getElementById('statusChart').getContext('2d');
    statusChart = new Chart(statusCtx, {
        type: 'doughnut',
        data: {
            labels: ['Masuk', 'Diproses', 'Ditolak', 'Terbit'],
            datasets: [{
                data: [statusCount.Masuk, statusCount.Diproses, statusCount.Ditolak, statusCount.Terbit],
                backgroundColor: ['#3498db', '#f39c12', '#e74c3c', '#2ecc71'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
    
    // Trend Chart (Bar) - 30 hari terakhir
    const last30Days = [];
    const counts = [];
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        last30Days.push(dateStr.slice(5)); // MM-DD
        
        const count = permohonanData.filter(p => p.tanggal === dateStr).length;
        counts.push(count);
    }
    
    const trendCtx = document.getElementById('trendChart').getContext('2d');
    trendChart = new Chart(trendCtx, {
        type: 'line',
        data: {
            labels: last30Days,
            datasets: [{
                label: 'Jumlah Permohonan',
                data: counts,
                borderColor: '#0b3d6d',
                backgroundColor: 'rgba(11,61,109,0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    stepSize: 1
                }
            }
        }
    });
    
    chartsInitialized = true;
}

// =======================
// SECTION NAVIGATION
// =======================
function showSection(sectionId) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    document.getElementById(`${sectionId}-section`).classList.add('active');
    
    // Update active menu
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.classList.remove('active');
    });
    event.target.classList.add('active');
    
    // Update page title
    const titles = {
        'dashboard': 'Dashboard',
        'permohonan': 'Data Permohonan',
        'arsip': 'Arsip',
        'statistik': 'Statistik',
        'pengguna': 'Pengguna',
        'pengaturan': 'Pengaturan'
    };
    document.getElementById('page-title').textContent = titles[sectionId];
    
    currentSection = sectionId;
}

// =======================
// PERMOHONAN CRUD
// =======================
function tambahPermohonan() {
    document.getElementById('modalTitle').textContent = 'Tambah Permohonan';
    document.getElementById('permohonanId').value = '';
    document.getElementById('permohonanForm').reset();
    document.getElementById('tanggal').valueAsDate = new Date();
    document.getElementById('permohonanModal').style.display = 'block';
}

function editPermohonan(id) {
    const permohonan = permohonanData.find(p => p.id === id);
    if (!permohonan) return;
    
    document.getElementById('modalTitle').textContent = 'Edit Permohonan';
    document.getElementById('permohonanId').value = permohonan.id;
    document.getElementById('pemohon').value = permohonan.pemohon;
    document.getElementById('kegiatan').value = permohonan.kegiatan;
    document.getElementById('lokasi').value = permohonan.lokasi;
    document.getElementById('luas').value = permohonan.luas;
    document.getElementById('tanggal').value = permohonan.tanggal;
    document.getElementById('status').value = permohonan.status;
    document.getElementById('keterangan').value = permohonan.keterangan || '';
    
    document.getElementById('permohonanModal').style.display = 'block';
}

function viewPermohonan(id) {
    const permohonan = permohonanData.find(p => p.id === id);
    if (!permohonan) return;
    
    alert(`Detail Permohonan:
ID: ${permohonan.id}
Pemohon: ${permohonan.pemohon}
Kegiatan: ${permohonan.kegiatan}
Lokasi: ${permohonan.lokasi}
Luas: ${permohonan.luas} Ha
Tanggal: ${permohonan.tanggal}
Status: ${permohonan.status}
Keterangan: ${permohonan.keterangan || '-'}`);
}

function deletePermohonan(id) {
    if (!confirm('Yakin ingin menghapus permohonan ini?')) return;
    
    permohonanData = permohonanData.filter(p => p.id !== id);
    localStorage.setItem('permohonanData', JSON.stringify(permohonanData));
    
    updateStats();
    updateRecentPermohonan();
    updatePermohonanTable();
    updateCharts();
}

function simpanPermohonan(event) {
    event.preventDefault();
    
    const id = document.getElementById('permohonanId').value;
    const permohonan = {
        id: id || Date.now().toString(),
        pemohon: document.getElementById('pemohon').value,
        kegiatan: document.getElementById('kegiatan').value,
        lokasi: document.getElementById('lokasi').value,
        luas: parseFloat(document.getElementById('luas').value),
        tanggal: document.getElementById('tanggal').value,
        status: document.getElementById('status').value,
        keterangan: document.getElementById('keterangan').value
    };
    
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
    
    closeModal();
    updateStats();
    updateRecentPermohonan();
    updatePermohonanTable();
    updateCharts();
}

function closeModal() {
    document.getElementById('permohonanModal').style.display = 'none';
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
    const totalPages = Math.ceil(permohonanData.length / itemsPerPage);
    if (currentPage < totalPages) {
        currentPage++;
        updatePermohonanTable();
    }
}

// =======================
// EXPORT DATA
// =======================
function exportData() {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    
    let data = permohonanData;
    
    if (searchTerm) {
        data = data.filter(p => 
            p.pemohon.toLowerCase().includes(searchTerm) ||
            p.kegiatan.toLowerCase().includes(searchTerm)
        );
    }
    
    if (statusFilter) {
        data = data.filter(p => p.status === statusFilter);
    }
    
    const csv = [
        ['ID', 'Pemohon', 'Kegiatan', 'Lokasi', 'Luas (Ha)', 'Tanggal', 'Status', 'Keterangan'],
        ...data.map(p => [p.id, p.pemohon, p.kegiatan, p.lokasi, p.luas, p.tanggal, p.status, p.keterangan])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `permohonan_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// =======================
// SIDEBAR TOGGLE
// =======================
function toggleSidebar() {
    document.querySelector('.sidebar').classList.toggle('show');
}

// =======================
// PROFILE FUNCTIONS
// =======================
function showProfile() {
    document.getElementById('profileModal').style.display = 'block';
}

function closeProfileModal() {
    document.getElementById('profileModal').style.display = 'none';
}

function ubahPassword() {
    alert('Fitur ubah password akan segera tersedia');
    closeProfileModal();
}

// =======================
// LOGOUT
// =======================
function logout() {
    if (confirm('Yakin ingin logout?')) {
        localStorage.removeItem('isAdminLoggedIn');
        localStorage.removeItem('adminUsername');
        window.location.href = 'index.html';
    }
}

// =======================
// EVENT LISTENERS
// =======================
function initEventListeners() {
    // Click outside modal
    window.onclick = function(event) {
        const modal = document.getElementById('permohonanModal');
        if (event.target == modal) {
            closeModal();
        }
        const profileModal = document.getElementById('profileModal');
        if (event.target == profileModal) {
            closeProfileModal();
        }
    };
    
    // Escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeProfileModal();
        }
    });
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
    }
});