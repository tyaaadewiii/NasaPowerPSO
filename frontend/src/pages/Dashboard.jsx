// ─────────────────────────────────────────────────────────
// SECTION 1 — IMPORTS
// ─────────────────────────────────────────────────────────
import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip, useMap } from 'react-leaflet';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, ReferenceLine,
} from 'recharts';
import { CloudRain, Info, Layers, Wind, Droplets, Sun, Umbrella } from 'lucide-react';
import 'leaflet/dist/leaflet.css';


// ─────────────────────────────────────────────────────────
// SECTION 2 — CONSTANTS & CONFIG
// ─────────────────────────────────────────────────────────
const WILAYAH_COORDS = {
  Denpasar:   [-8.6705, 115.2126],
  Badung:     [-8.5370, 115.1750],
  Gianyar:    [-8.5442, 115.3255],
  Bangli:     [-8.4543, 115.3547],
  Karangasem: [-8.4463, 115.6125],
  Klungkung:  [-8.5413, 115.4021],
  Buleleng:   [-8.1120, 115.0885],
  Jembrana:   [-8.3560, 114.6410],
  Tabanan:    [-8.5406, 115.1252],
};

const WILAYAH_LIST = Object.keys(WILAYAH_COORDS);

const NAMA_BULAN = [
  'Januari','Februari','Maret','April','Mei','Juni',
  'Juli','Agustus','September','Oktober','November','Desember',
];

const TAHUN_LIST = ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025','2026'];

const TIER_CONFIG = [
  { color: '#ef4444', dot: '#fca5a5', label: 'Tinggi',  range: '> 16 mm' },
  { color: '#f59e0b', dot: '#fcd34d', label: 'Sedang',  range: '6 – 16 mm' },
  { color: '#10b981', dot: '#6ee7b7', label: 'Rendah',  range: '0 – < 6 mm' },
];

const BALI_FACTS = [
  {
    icon: Umbrella, color: '#60a5fa', bg: '#0c1e38', borderColor: '#1e3a6e',
    title: 'Musim Hujan', subtitle: 'Periode Curah Hujan Tinggi',
    desc: 'Curah hujan cenderung tinggi pada periode ini dengan intensitas harian yang meningkat. Rata-rata curah hujan harian dapat berada pada kategori sedang hingga tinggi.',
  },
  {
    icon: Sun, color: '#fbbf24', bg: '#1a1200', borderColor: '#3d2a00',
    title: 'Musim Kering', subtitle: 'Periode Curah Hujan Rendah',
    desc: 'Curah hujan cenderung rendah dengan intensitas harian kecil. Sebagian besar hari berada pada kategori rendah hingga sedang.',
  },
  {
    icon: Wind, color: '#c084fc', bg: '#160d2e', borderColor: '#3b1f6b',
    title: 'Variasi Elevasi', subtitle: 'Pengaruh Topografi Wilayah',
    desc: 'Wilayah pegunungan cenderung memiliki curah hujan harian lebih tinggi dibandingkan pesisir, dipengaruhi oleh faktor topografi dan pergerakan massa udara.',
  },
  {
    icon: Droplets, color: '#34d399', bg: '#011f14', borderColor: '#064e35',
    title: 'Rata-rata Tahunan', subtitle: 'Distribusi Curah Hujan',
    desc: 'Curah hujan menunjukkan variasi antar waktu dan wilayah, dengan rata-rata harian yang berbeda tergantung musim dan lokasi.',
  },
];

const KLIMATOGRAM = [
  { m: 'Jan', mm: 295, s: 'hujan' },
  { m: 'Feb', mm: 270, s: 'hujan' },
  { m: 'Mar', mm: 215, s: 'hujan' },
  { m: 'Apr', mm: 140, s: 'transisi' },
  { m: 'Mei', mm: 85,  s: 'transisi' },
  { m: 'Jun', mm: 50,  s: 'kering' },
  { m: 'Jul', mm: 30,  s: 'kering' },
  { m: 'Agt', mm: 22,  s: 'kering' },
  { m: 'Sep', mm: 38,  s: 'kering' },
  { m: 'Okt', mm: 100, s: 'transisi' },
  { m: 'Nov', mm: 180, s: 'hujan' },
  { m: 'Des', mm: 275, s: 'hujan' },
];

const KLIMA_COLOR  = { hujan: '#60a5fa', kering: '#fbbf24', transisi: '#c084fc' };
const KLIMA_LEGEND = [['hujan','Musim Hujan'],['transisi','Transisi'],['kering','Musim Kering']];
const MAP_BOUNDS   = [[-9.0, 114.4], [-7.8, 115.8]];


// ─────────────────────────────────────────────────────────
// SECTION 3 — UTILITIES
// ─────────────────────────────────────────────────────────
function getRainfallTier(val) {
  if (val >= 16) return { label: 'Tinggi', color: '#ef4444' };
  if (val >= 6)  return { label: 'Sedang', color: '#f59e0b' };
  return { label: 'Rendah', color: '#10b981' };
}

function toChartPoint(row) {
  return { hari: new Date(row.ds).getDate(), curah_hujan: row.curah_hujan };
}


// ─────────────────────────────────────────────────────────
// SECTION 4 — GLOBAL CSS
// ─────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap');
  body { background: #060e1a; margin: 0; }

  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.35} }

  .sel {
    background: #f8fafc;
    border: 1.5px solid #e2e8f0;
    border-radius: 8px;
    padding: 7px 28px 7px 11px;
    color: #1e293b;
    font-size: 13px;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer;
    outline: none;
    appearance: none;
    -webkit-appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='9' height='5'%3E%3Cpath d='M0 0l4.5 5L9 0z' fill='%2394a3b8'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 9px center;
    transition: border-color .15s;
    width: 100%;
    max-width: 180px;
  }
  .sel:focus  { border-color: #22c55e; }
  .sel option { background: #fff; color: #1e293b; }

  .leaflet-popup-content-wrapper {
    background: #0c1526 !important;
    border: 1px solid #1e3a5f !important;
    border-radius: 10px !important;
    color: #e2e8f0 !important;
    box-shadow: 0 8px 28px rgba(0,0,0,.7) !important;
    font-family: 'Sora', sans-serif !important;
  }
  .leaflet-popup-tip        { background: #0c1526 !important; }
  .leaflet-control-zoom     { display: none !important; }
  .leaflet-control-attribution { font-size: 9px !important; opacity: .4 !important; }

  /* ── Responsive breakpoints ── */

  /* Mobile: <= 640px */
  @media (max-width: 640px) {
    .top-panel-grid      { grid-template-columns: 1fr !important; }
    .main-content-grid   { grid-template-columns: 1fr !important; }
    .stat-grid           { grid-template-columns: 1fr 1fr !important; }
    .filter-row          { flex-direction: column !important; align-items: stretch !important; }
    .filter-row .sel     { max-width: 100% !important; }
    .filter-row button   { width: 100% !important; }
    .wilayah-title       { font-size: 24px !important; }
    .nav-title           { font-size: 14px !important; }
    .klima-legend-row    { flex-direction: column !important; gap: 6px !important; }
    .info-bali-section   { padding: 32px 14px 40px !important; }
    .facts-grid          { grid-template-columns: 1fr !important; }
    .map-chart-section   { padding: 12px 12px 0 !important; }
  }

  /* Tablet: 641px – 1024px */
  @media (min-width: 641px) and (max-width: 1024px) {
    .top-panel-grid      { grid-template-columns: 1fr 1fr !important; }
    .top-panel-grid > :last-child { grid-column: 1 / -1 !important; }
    .main-content-grid   { grid-template-columns: 1fr !important; }
    .wilayah-title       { font-size: 28px !important; }
    .facts-grid          { grid-template-columns: 1fr 1fr !important; }
    .map-chart-section   { padding: 14px 14px 0 !important; }
  }

  /* Large desktop: > 1280px */
  @media (min-width: 1281px) {
    .top-panel-grid    { grid-template-columns: 220px 220px 1fr !important; }
    .main-content-grid { grid-template-columns: 1fr 1fr !important; }
  }
`;


// ─────────────────────────────────────────────────────────
// SECTION 5 — SMALL / SHARED COMPONENTS
// ─────────────────────────────────────────────────────────
function ChangeView({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.flyTo(center, 11); }, [center]);
  return null;
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  const tier  = getRainfallTier(value);
  return (
    <div style={{
      background: '#0a1628', border: `1px solid ${tier.color}40`,
      borderRadius: 10, padding: '10px 14px', fontFamily: "'Sora', sans-serif",
    }}>
      <p style={{ fontSize: 10, color: '#64748b', letterSpacing: '0.12em', marginBottom: 4 }}>
        HARI KE-{label}
      </p>
      <p style={{ fontSize: 15, fontWeight: 700, color: tier.color }}>
        {value.toFixed(2)}{' '}
        <span style={{ fontSize: 11, color: '#475569', fontWeight: 400 }}>mm</span>
      </p>
    </div>
  );
}

function StatCard({ label, value, tier }) {
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${tier.color}44`,
      borderRadius: 10, padding: '11px 14px', boxShadow: `0 2px 12px ${tier.color}33`,
    }}>
      <div style={{
        fontFamily: "'Sora', sans-serif", fontSize: 8, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: '#94a3b8', marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: "'Sora', sans-serif", fontSize: 26, fontWeight: 800,
        color: tier.color, lineHeight: 1,
      }}>
        {value}
        <span style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8', marginLeft: 2 }}>mm</span>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }) {
  return (
    <div style={{ flex: '1 1 120px', minWidth: 0 }}>
      <div style={{
        fontFamily: "'Sora', sans-serif", fontSize: 8, fontWeight: 700,
        letterSpacing: '0.2em', textTransform: 'uppercase',
        color: '#94a3b8', marginBottom: 4,
      }}>
        {label}
      </div>
      <select className="sel" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(({ value: v, label: t }) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
// SECTION 6 — SECTION COMPONENTS
// ─────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav style={{
      background: '#0d203c', padding: '0 16px', height: 52,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'fixed', top: 0, left: 0, width: '100%', zIndex: 9999,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8,
          background: 'linear-gradient(135deg,#22c55e,#0d9488)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <CloudRain size={16} color="#fff" />
        </div>
        <span className="nav-title" style={{
          fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16,
          color: '#f1f5f9', letterSpacing: '0.03em',
        }}>
          BaliRain <span style={{ color: '#50ec9c' }}>Prophet</span>
        </span>
      </div>
      <div style={{
        width: 6, height: 6, borderRadius: '50%',
        background: '#22c55e', boxShadow: '0 0 6px #22c55e',
        animation: 'pulse 2s infinite',
      }} />
    </nav>
  );
}

function TopPanel({ input, query, onInputChange, onFetch, loading, summary, avgTier, maxTier }) {
  const filterFields = [
    { label: 'Wilayah', key: 'wilayah', options: WILAYAH_LIST.map(w => ({ value: w, label: w })) },
    { label: 'Tahun',   key: 'tahun',   options: TAHUN_LIST.map(y => ({ value: y, label: y })) },
    {
      label: 'Bulan', key: 'bulan',
      options: NAMA_BULAN.map((b, i) => ({ value: i + 1, label: b })),
    },
  ];

  return (
    <div style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
      <div style={{ width: '100%', padding: '14px 16px' }}>
        <div
          className="top-panel-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 190px 1fr',
            gap: 14,
          }}
        >
          {/* Kartu panduan */}
          <div style={{
            background: '#f0fdf4', border: '1px solid #bbf7d0',
            borderRadius: 12, padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <Info size={14} color="#16a34a" />
              <span style={{
                fontFamily: "'Sora', sans-serif", fontSize: 13, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase', color: '#15803d',
              }}>Panduan</span>
            </div>
            <p style={{ fontSize: 13.5, color: '#166534', lineHeight: 1.65 }}>
              Pilih wilayah, tahun, dan bulan lalu tekan{' '}
              <strong style={{ fontWeight: 700 }}>Perbarui</strong> untuk memuat data.
            </p>
            <p style={{ fontSize: 13.5, color: '#166534', lineHeight: 1.65, marginTop: 8 }}>
              Peta menampilkan batas wilayah terpilih sesuai intensitas curah hujan.
            </p>
          </div>

          {/* Kartu kategori */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
              <Layers size={14} color="#64748b" />
              <span style={{
                fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase', color: '#64748b',
              }}>Kategori Rata-Rata</span>
            </div>
            {TIER_CONFIG.map(({ color, dot, label, range }) => (
              <div key={label} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '7px 0', borderBottom: '1px solid #f1f5f9',
              }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: color, boxShadow: `0 0 0 3px ${dot}88`, flexShrink: 0,
                }} />
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 12, fontWeight: 600, color: '#334155' }}>
                  {label}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94a3b8' }}>{range}</span>
              </div>
            ))}
          </div>

          {/* Panel filter + statistik */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '16px 18px',
            display: 'flex', flexDirection: 'column', gap: 10,
          }}>
            {/* Baris dropdown */}
            <div
              className="filter-row"
              style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}
            >
              {filterFields.map(({ label, key, options }) => (
                <FilterSelect
                  key={key} label={label} value={input[key]}
                  options={options} onChange={val => onInputChange(key, val)}
                />
              ))}
              <button
                onClick={onFetch}
                disabled={loading}
                style={{
                  background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8,
                  padding: '7px 18px',
                  fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 11.5,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  cursor: loading ? 'wait' : 'pointer',
                  boxShadow: '0 2px 8px #16a34a44',
                  opacity: loading ? 0.75 : 1, transition: 'opacity .15s',
                  flexShrink: 0, alignSelf: 'flex-end',
                  whiteSpace: 'nowrap',
                }}
              >
                {loading ? 'Memuat…' : 'Perbarui'}
              </button>
            </div>

            {/* Badge status data */}
            <div>
              <span style={{
                fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 700,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                padding: '3px 10px', borderRadius: 20,
                background: summary?.is_prediksi ? '#fff7ed' : '#f0fdf4',
                color:      summary?.is_prediksi ? '#c2410c' : '#15803d',
                border:     `1px solid ${summary?.is_prediksi ? '#fed7aa' : '#bbf7d0'}`,
              }}>
                {summary?.is_prediksi ? '⬡ Data Prediksi' : '◉ Data Historis NASA'}
              </span>
            </div>

            {/* Nama wilayah + narasi */}
            <div>
              <div
                className="wilayah-title"
                style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 34, fontWeight: 800,
                  color: '#0f172a', letterSpacing: '-0.01em', lineHeight: 1.1,
                }}
              >
                {query.wilayah}
              </div>
              <p style={{
                fontSize: 12.5, fontStyle: 'italic', color: '#94a3b8',
                lineHeight: 1.55, fontWeight: 300, marginTop: 3,
              }}>
                "{summary?.narasi}"
              </p>
            </div>

            {/* Kartu statistik */}
            <div
              className="stat-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
            >
              <StatCard label="Rata-rata Harian" value={summary?.avg} tier={avgTier} />
              <StatCard label="Curah Tertinggi"  value={summary?.max} tier={maxTier} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MapSection({ latlng, wilayah, avgVal, tier }) {
  return (
    <div style={{
      background: '#064e35', border: '1px solid #0e2040',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{ padding: '10px 14px 6px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ffffff',
        }}>◎ Distribusi Spasial</span>
        <span style={{
          marginLeft: 'auto', fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700,
          color: tier.color, background: `${tier.color}18`, padding: '2px 10px', borderRadius: 20,
        }}>
          {tier.label} · {avgVal} mm
        </span>
      </div>
      <div style={{ height: '420px' }}>
        <MapContainer
          center={[-8.45, 115.2]} zoom={10} minZoom={9} maxZoom={12}
          maxBounds={MAP_BOUNDS} maxBoundsViscosity={1.0}
          touchZoom={false} doubleClickZoom={false} zoomControl={false} keyboard={false}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
          <ChangeView center={latlng} />
          <CircleMarker
            center={latlng} radius={14}
            pathOptions={{ color: '#ffffff', fillColor: tier.color, fillOpacity: 1, weight: 2 }}
          >
            <LeafletTooltip permanent direction="top">
              <div style={{
                background: '#ffffff', padding: '8px 12px', borderRadius: 10,
                textAlign: 'center', border: `1px solid ${tier.color}55`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
              }}>
                <div style={{ fontWeight: 700 }}>{wilayah}</div>
                <div style={{ color: tier.color, fontWeight: 800, fontSize: 14 }}>{avgVal} mm</div>
                <div style={{
                  fontSize: 10, marginTop: 4, padding: '2px 8px', borderRadius: 10,
                  background: tier.color, color: '#fff',
                }}>
                  {tier.label}
                </div>
              </div>
            </LeafletTooltip>
          </CircleMarker>
        </MapContainer>
      </div>
    </div>
  );
}

function ChartSection({ chartData, bulanIndex, tahun, wilayah, summary, tier, maxY }) {
  return (
    <div style={{
      background: '#ffffff', border: '1px solid #0e2040',
      borderRadius: 12, padding: '12px 14px',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8, flexShrink: 0, flexWrap: 'wrap' }}>
        <span style={{
          fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 900,
          letterSpacing: '0.2em', textTransform: 'uppercase', color: '#1e4d7b',
        }}>◎ Tren Harian</span>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#000000' }}>
          {NAMA_BULAN[bulanIndex]} {tahun} · {wilayah}
        </span>
      </div>
      <div style={{ width: '100%', minHeight: '350px' }}>
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <AreaChart data={chartData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={tier.color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={tier.color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="2 5" stroke="#0c2040" vertical={false} />
            <XAxis dataKey="hari" tick={{ fontSize: 10, fill: '#334155', fontFamily: "'DM Sans',sans-serif" }} axisLine={false} tickLine={false} />
            <YAxis domain={[0, maxY]} allowDecimals={false} tickFormatter={(value) => value.toFixed(0)} tick={{ fontSize: 10, fill: '#000000', fontFamily: "'DM Sans',sans-serif" }} 
              axisLine={false} tickLine={false} unit=" mm" />
            <ReferenceLine
              y={summary?.avg} stroke={tier.color} strokeDasharray="4 4" strokeOpacity={0.45}
              label={{ value: `avg ${summary?.avg}mm`, position: 'insideTopRight', fontSize: 10, fill: tier.color, fontFamily: "'Sora',sans-serif" }}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone" dataKey="curah_hujan" stroke={tier.color} strokeWidth={2}
              fill="url(#chartGradient)"
              dot={({ cx, cy, payload }) => {
                const dotTier = getRainfallTier(payload.curah_hujan);
                return (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4}
                    fill={dotTier.color} stroke="#ffffff" strokeWidth={1.5} />
                );
              }}
              activeDot={{ r: 6, fill: tier.color, stroke: '#0c1526', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InfoBali() {
  return (
    <section
      className="info-bali-section"
      style={{
        background: '#ffffff', borderTop: '1px solid #0c2040',
        padding: '48px 20px 56px',
      }}
    >
      <div style={{ width: '100%' }}>
        <div style={{ marginBottom: 30 }}>
          <h2 style={{
            fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800,
            color: '#067316', marginBottom: 6, lineHeight: 1.2,
          }}>
            Pola Curah Hujan Bali
          </h2>
          <p style={{
            fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: '#475569',
            fontWeight: 300, lineHeight: 1.6, maxWidth: 540,
          }}>
            Bali memiliki iklim tropis dengan dua musim yang dipengaruhi angin muson
            dan topografi pulau dari pesisir hingga pegunungan.
          </p>
        </div>

        {/* Kartu fakta iklim */}
        <div
          className="facts-grid"
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))',
            gap: 12, marginBottom: 28,
          }}
        >
          {BALI_FACTS.map(({ icon: Icon, color, bg, borderColor, title, subtitle, desc }) => (
            <div key={title} style={{
              background: bg, border: `1px solid ${borderColor}`,
              borderRadius: 14, padding: '18px 18px 20px',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: `${color}18`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 12,
              }}>
                <Icon size={16} color={color} />
              </div>
              <div style={{
                fontFamily: "'Sora', sans-serif", fontSize: 14, fontWeight: 700,
                color: '#e2e8f0', marginBottom: 2,
              }}>{title}</div>
              <div style={{
                fontFamily: "'Sora', sans-serif", fontSize: 9, fontWeight: 700,
                color, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
              }}>{subtitle}</div>
              <p style={{
                fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#ebeff4',
                lineHeight: 1.65, fontWeight: 300,
              }}>{desc}</p>
            </div>
          ))}
        </div>

        {/* Klimatogram */}
        <div style={{
          background: '#0d203c', border: '1px solid #0e2040',
          borderRadius: 14, padding: '18px 18px 12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <span style={{
              fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase', color: '#ffffff',
            }}>Klimatogram</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#ffffff' }}>
              Rata-rata curah hujan bulanan Bali (mm)
            </span>
            <div
              className="klima-legend-row"
              style={{ marginLeft: 'auto', display: 'flex', gap: 14, flexWrap: 'wrap' }}
            >
              {KLIMA_LEGEND.map(([key, lbl]) => (
                <span key={key} style={{
                  fontFamily: "'Sora', sans-serif", fontSize: 10, fontWeight: 600,
                  color: KLIMA_COLOR[key], display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: KLIMA_COLOR[key], display: 'inline-block',
                  }} />
                  {lbl}
                </span>
              ))}
            </div>
          </div>

          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={KLIMATOGRAM} margin={{ top: 10, right: 12, left: 20, bottom: 0 }}>
                <defs>
                  {Object.entries(KLIMA_COLOR).map(([key, color]) => (
                    <linearGradient key={key} id={`klimaGrad_${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={color} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke="#0c2040" vertical={false} />
                <XAxis dataKey="m" tick={{ fontSize: 11, fill: '#ffffff', fontFamily: "'DM Sans',sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#ffffff', fontFamily: "'DM Sans',sans-serif" }} axisLine={false} tickLine={false} unit=" mm" width={10} />
                <Tooltip
                  contentStyle={{ background: '#0d1b2a', border: '1px solid #1e3a5f', borderRadius: 8 }}
                  labelStyle={{ color: '#ffffff', fontFamily: "'Sora',sans-serif", fontSize: 11 }}
                  itemStyle={{ fontSize: 12 }}
                  formatter={v => [`${v} mm`, 'Curah Hujan']}
                />
                <Area
                  type="monotone" dataKey="mm" strokeWidth={2}
                  stroke="#60a5fa" fill="url(#klimaGrad_hujan)"
                  dot={({ cx, cy, payload }) => (
                    <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={3.5}
                      fill={KLIMA_COLOR[payload.s]} stroke="#0c1526" strokeWidth={1.5} />
                  )}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}


// ─────────────────────────────────────────────────────────
// SECTION 7 — MAIN DASHBOARD
// ─────────────────────────────────────────────────────────
const INITIAL_INPUT = { wilayah: 'Badung', tahun: '2026', bulan: '1' };
const INITIAL_DATA  = { chart: [], map: [], summary: { avg: 0, max: 0, narasi: '', is_prediksi: false } };

const Dashboard = () => {
  const [input,   setInput]   = useState(INITIAL_INPUT);
  const [data,    setData]    = useState(INITIAL_DATA);
  const [query,   setQuery] = useState(INITIAL_INPUT);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { wilayah, tahun, bulan } = query;

      const res = await fetch(`http://localhost:8000/api/rainfall?wilayah=${wilayah}&tahun=${tahun}&bulan=${bulan}`);
      if (!res.ok) {
        throw new Error("Response tidak OK");
      }

      const text = await res.text();

      if (text.startsWith("<")) {
        console.error("API RETURN HTML:", text);
        throw new Error("API salah (return HTML, bukan JSON)");
      }

      const json = JSON.parse(text);
      setData(json);

    } catch (err) {
      console.error('[Dashboard] Gagal memuat data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [query]);

  const toNumber = (v) => parseFloat(String(v).replace(',', '.').trim()) || 0;

  const avgValNum = toNumber(data.summary?.avg);
  const maxValNum = toNumber(data.summary?.max);
  const maxY = Math.max(20, Math.ceil(maxValNum / 5) * 5);

  const avgTier = getRainfallTier(avgValNum);
  const maxTier = getRainfallTier(maxValNum);
  const latlng    = WILAYAH_COORDS[query.wilayah];
  const chartData = (data.chart ?? []).map(toChartPoint);
 
  const handleInputChange = (key, value) => setInput(prev => ({ ...prev, [key]: value }));

  return (
    <>
      <style>{GLOBAL_CSS}</style>
      <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#ffffff', minHeight: '100vh', color: '#1e293b' }}>

      <Navbar />

      <div style={{ paddingTop: '60px' }}>

        <TopPanel
          input={input}
          query={query}
          onInputChange={handleInputChange}
          onFetch={() => setQuery(input)} 
          loading={loading}
          summary={data.summary}
          avgTier={avgTier}
          maxTier={maxTier}
        />

        {/* Peta + Chart */}
        <div className="map-chart-section" style={{ width: '100%', padding: '20px 16px 0', marginTop: '12px', boxSizing: 'border-box' }}>
          <div
            className="main-content-grid"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}
          >
            <MapSection latlng={latlng} wilayah={query.wilayah} avgVal={avgValNum} tier={avgTier} />
            <ChartSection
              chartData={chartData}
              bulanIndex={+query.bulan - 1}
              tahun={query.tahun}
              wilayah={query.wilayah}
              summary={data.summary}
              tier={avgTier}
              maxY={maxY}
            />
          </div>
        </div>

        <InfoBali />

      </div>
    </div>
    </>
  );
};

export default Dashboard;