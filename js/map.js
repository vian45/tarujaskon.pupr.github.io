/**
 * WebGIS RDTR - Sistem Analisis PKKPR
 * map.js versi stabil dengan perbaikan pewarnaan dan penanganan error
 */

// ==================== INISIALISASI PETA ====================

var map = L.map('map', {
    center: [-9.65, 124.3],
    zoom: 9,
    zoomControl: true
});

// ==================== VARIABEL GLOBAL ====================

var rtrwData = null;           // menyimpan data GeoJSON asli
var geoJsonLayer = null;        // layer Leaflet untuk RDTR
var currentPopup = null;        // popup yang sedang aktif
var isDataLoaded = false;       // status loading data

// ==================== BASEMAP ====================

var osm = L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
    }).addTo(map);

var satellite = L.tileLayer(
    'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        maxZoom: 20,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    });

var terrain = L.tileLayer(
    'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
        maxZoom: 17
    });

var darkMode = L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        subdomains: 'abcd',
        maxZoom: 19
    });

var baseMaps = {
    "OpenStreetMap": osm,
    "Satellite": satellite,
    "Terrain": terrain,
    "Dark": darkMode
};

// ==================== LOAD GEOJSON ====================

function loadGeoJSON() {
    console.log("Memuat RDTR GeoJSON...");

    fetch("data/rdtr.geojson")
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} - File tidak ditemukan atau tidak dapat diakses`);
            }
            return response.json();
        })
        .then(data => {
            if (!data || typeof data !== 'object') {
                throw new Error("Data bukan objek JSON yang valid");
            }
            if (data.type !== "FeatureCollection") {
                throw new Error("GeoJSON harus bertipe 'FeatureCollection'");
            }
            if (!Array.isArray(data.features)) {
                throw new Error("Properti 'features' tidak ditemukan atau bukan array");
            }
            if (data.features.length === 0) {
                throw new Error("File GeoJSON tidak memiliki fitur (kosong)");
            }

            rtrwData = data;
            isDataLoaded = true;

            displayGeoJSON(data);
            createLegend(data);
            addOverlayControl();

            console.log(`RDTR berhasil dimuat: ${data.features.length} fitur`);

            window.dispatchEvent(new CustomEvent('rdtr-loaded', { detail: rtrwData }));
        })
        .catch(error => {
            console.error("Error load RDTR:", error);
            alert("Gagal memuat RDTR:\n" + error.message + "\n\nPeriksa path file data/rdtr.geojson dan formatnya.");
        });
}

// ==================== STYLE BERDASARKAN ZONA ====================

function getStyleByZona(zona) {
    var style = {
        weight: 1,
        opacity: 1,
        fillOpacity: 0.6
    };

    if (!zona) {
        return { ...style, color: "#3388ff", fillColor: "#3388ff" };
    }

    var z = zona.toLowerCase();

    var patterns = [
        { pattern: "jalan", color: "#95a5a6" },
        { pattern: "industri", color: "#e74c3c" },
        { pattern: "lindung", color: "#2ecc71" },
        { pattern: "perdagangan", color: "#f39c12" },
        { pattern: "perkantoran", color: "#3498db" },
        { pattern: "perumahan", color: "#9b59b6" },
        { pattern: "campuran", color: "#1abc9c" },
        { pattern: "khusus", color: "#e67e22" },
        { pattern: "lainnya", color: "#7f8c8d" },
        { pattern: "ruang terbuka non hijau", color: "#bdc3c7" },
        { pattern: "sarana pelayanan umum", color: "#2980b9" },
        { pattern: "budidaya", color: "#f39c12" },
        { pattern: "pertanian", color: "#27ae60" },
        { pattern: "perairan", color: "#3498db" }
    ];

    for (var i = 0; i < patterns.length; i++) {
        if (z.includes(patterns[i].pattern)) {
            return {
                ...style,
                color: patterns[i].color,
                fillColor: patterns[i].color
            };
        }
    }

    return { ...style, color: "#3388ff", fillColor: "#3388ff" };
}

// ==================== TAMPILKAN GEOJSON ====================

function displayGeoJSON(data) {
    if (geoJsonLayer) {
        map.removeLayer(geoJsonLayer);
    }

    geoJsonLayer = L.geoJSON(data, {
        style: function (feature) {
            var zona = feature.properties?.ZONA || '';
            return getStyleByZona(zona);
        },
        onEachFeature: function (feature, layer) {
            var props = feature.properties || {};
            layer.bindPopup(createPopupContent(props));
        }
    }).addTo(map);
}

// ==================== POPUP ====================

function createPopupContent(props) {
    var zona = props.ZONA || props.SUBZONA || "Tidak diketahui";

    var html = "<b>Zonasi:</b> " + zona + "<br>";

    for (var key in props) {
        if (props[key] && key !== "ZONA") {
            html += "<b>" + key + ":</b> " + props[key] + "<br>";
        }
    }

    return html;
}

// ==================== LEGENDA ====================

function createLegend(data) {
    if (window.legendControl) {
        map.removeControl(window.legendControl);
        window.legendControl = null;
    }

    var zonaSet = new Set();
    data.features.forEach(function (feature) {
        var zona = feature.properties?.ZONA;
        if (zona) {
            zonaSet.add(zona);
        }
    });

    var uniqueZonas = Array.from(zonaSet).sort();

    if (uniqueZonas.length === 0) {
        console.warn("Tidak ada properti ZONA pada fitur, legenda tidak dibuat.");
        return;
    }

    var legendContent = "<h4>Legenda Zonasi</h4>";

    uniqueZonas.forEach(function (z) {
        var color = getStyleByZona(z).fillColor;
        legendContent +=
            '<div class="legend-item">' +
            '<span class="legend-color" style="background:' + color + '"></span>' +
            z +
            '</div>';
    });

    var legend = L.control({ position: "bottomright" });

    legend.onAdd = function () {
        var div = L.DomUtil.create("div", "legend");
        div.innerHTML = legendContent;
        return div;
    };

    legend.addTo(map);
    window.legendControl = legend;
}

// ==================== OVERLAY CONTROL ====================

function addOverlayControl() {
    var overlayMaps = {
        "RDTR": geoJsonLayer
    };

    if (window.layerControl) {
        window.layerControl.addOverlay(geoJsonLayer, "RDTR");
    } else {
        window.layerControl = L.control.layers(baseMaps, overlayMaps).addTo(map);
    }
}

// ==================== CEK ZONASI (KLIK PETA) ====================

function cekZonasi(e) {
    if (!rtrwData) {
        alert("Data RDTR belum dimuat");
        return;
    }

    var latlng = e.latlng;
    var point = turf.point([latlng.lng, latlng.lat]);
    var found = false;
    var hasil = "";

    for (var i = 0; i < rtrwData.features.length; i++) {
        var feature = rtrwData.features[i];

        try {
            if (turf.booleanPointInPolygon(point, feature)) {
                found = true;
                var props = feature.properties || {};
                var zona = props.ZONA || "Tidak diketahui";

                hasil =
                    "<b>Zona:</b> " + zona + "<br>" +
                    "<b>Lat:</b> " + latlng.lat.toFixed(6) + "<br>" +
                    "<b>Lng:</b> " + latlng.lng.toFixed(6) + "<br>" +
                    "<b>Status:</b> Sesuai RTRW";
                break;
            }
        } catch (err) {
            console.warn("Gagal cek fitur ke-" + i, err);
        }
    }

    if (!found) {
        hasil =
            "<b>Lokasi di luar RDTR</b><br>" +
            "<b>Lat:</b> " + latlng.lat.toFixed(6) + "<br>" +
            "<b>Lng:</b> " + latlng.lng.toFixed(6);
    }

    if (currentPopup) {
        map.closePopup(currentPopup);
    }

    currentPopup = L.popup()
        .setLatLng(latlng)
        .setContent(hasil)
        .openOn(map);
}

// ==================== FUNGSI AKSES DATA ====================

function getRtrwData() {
    return rtrwData;
}

// ==================== EVENT ====================

map.on("click", cekZonasi);

L.control.scale({ imperial: false }).addTo(map);

// ==================== START ====================

document.addEventListener("DOMContentLoaded", function () {
    setTimeout(loadGeoJSON, 500);
});

console.log("map.js siap - versi dengan pewarnaan lengkap dan dukungan event");