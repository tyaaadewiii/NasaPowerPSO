from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import os

# =========================
# KONFIG
# =========================
BASE_DIR = os.path.dirname(__file__)

# =========================
# KOORDINAT
# =========================
KOORDINAT = {
    'Badung': [-8.5833, 115.1833],
    'Bangli': [-8.2500, 115.3500],
    'Buleleng': [-8.2000, 114.9000],
    'Denpasar': [-8.6500, 115.2167],
    'Gianyar': [-8.4833, 115.3167],
    'Jembrana': [-8.3000, 114.6667],
    'Karangasem': [-8.3500, 115.5333],
    'Klungkung': [-8.5500, 115.4000],
    'Tabanan': [-8.5333, 115.1167],
}

# =========================
# LOAD CSV (SEKALI SAJA)
# =========================
def load_data():
    csv_path = os.path.join(BASE_DIR, 'data', 'Skripsi_PSO.csv')
    df = pd.read_csv(csv_path)

    # Bersihkan data
    df['ds'] = pd.to_datetime(df['ds'], errors='coerce')
    df['wilayah'] = df['wilayah'].astype(str).str.strip()
    df['tipe'] = df['tipe'].astype(str).str.lower().str.strip()

    print("✅ CSV loaded")
    return df

DF = load_data()

# =========================
# LOGIC
# =========================
def get_response(wilayah, tahun, bulan):
    wilayah = wilayah.strip()

    # Filter periode
    mask = (DF['ds'].dt.year == tahun) & (DF['ds'].dt.month == bulan)
    df_period = DF[mask]

    # Filter wilayah
    chart_df = df_period[
        df_period['wilayah'].str.lower() == wilayah.lower()
    ].sort_values('ds')

    # =========================
    # CHART
    # =========================
    chart_res = [
        {
            'ds': row['ds'].strftime('%Y-%m-%d'),
            'wilayah': row['wilayah'],
            'curah_hujan': max(0, float(row['curah_hujan'])),  # anti negatif
            'tipe': row['tipe']  # 🔥 ambil dari CSV (historis / prediksi)
        }
        for _, row in chart_df.iterrows()
    ]

    # =========================
    # SUMMARY
    # =========================
    avg_val = max(0, float(chart_df['curah_hujan'].mean())) if not chart_df.empty else 0
    max_val = max(0, float(chart_df['curah_hujan'].max())) if not chart_df.empty else 0

    is_prediksi = (
        chart_df['tipe'].iloc[0] == 'prediksi'
        if not chart_df.empty else False
    )

    kondisi = 'Basah' if avg_val > 10 else 'Normal' if avg_val > 5 else 'Kering'

    narasi = (
        f"Wilayah {wilayah} cenderung {kondisi} "
        f"dengan rata-rata {avg_val:.2f} mm."
    )

    # =========================
    # MAP
    # =========================
    map_stats = df_period.groupby('wilayah')['curah_hujan'].mean().reset_index()

    map_res = []
    for _, row in map_stats.iterrows():
        w = row['wilayah']
        if w in KOORDINAT:
            map_res.append({
                'wilayah': w,
                'curah_hujan': round(max(0, float(row['curah_hujan'])), 2),
                'lat': KOORDINAT[w][0],
                'lng': KOORDINAT[w][1],
                'is_selected': w.lower() == wilayah.lower(),
            })

    # =========================
    # RETURN
    # =========================
    return {
        'chart': chart_res,
        'map': map_res,
        'summary': {
            'avg': round(avg_val, 2),
            'max': round(max_val, 2),
            'narasi': narasi,
            'is_prediksi': is_prediksi
        },
        'selected_coords': KOORDINAT.get(wilayah, [-8.4095, 115.1889]),
    }

# =========================
# FASTAPI APP
# =========================
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/rainfall")
def api(wilayah: str = "Badung", tahun: int = 2025, bulan: int = 1):
    return get_response(wilayah, tahun, bulan)

# =========================
# SERVE FRONTEND
# =========================
FRONTEND_PATH = os.path.join(BASE_DIR, "../frontend/dist")

if os.path.exists(FRONTEND_PATH):
    app.mount("/", StaticFiles(directory=FRONTEND_PATH, html=True), name="frontend")