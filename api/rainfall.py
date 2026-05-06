from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import pandas as pd
import os
import pickle
import calendar

# =========================
# KONFIG
# =========================
BASE_DIR = os.path.dirname(__file__)
LAST_YEAR = 2025

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
# LOAD MODEL
# =========================
def load_models():
    model_dir = os.path.join(BASE_DIR, 'models')
    models = {}

    if not os.path.exists(model_dir):
        print("⚠️ models tidak ditemukan")
        return models

    for file in os.listdir(model_dir):
        if file.endswith(".pkl"):
            wilayah = file.replace(".pkl", "").capitalize()
            with open(os.path.join(model_dir, file), "rb") as f:
                models[wilayah] = pickle.load(f)

    print("✅ Models:", list(models.keys()))
    return models

# =========================
# LOAD CSV
# =========================
def load_data():
    csv_path = os.path.join(BASE_DIR, 'data', 'Skripsi_PSO.csv')

    if not os.path.exists(csv_path):
        print("⚠️ CSV tidak ditemukan")
        return pd.DataFrame()

    df = pd.read_csv(csv_path)
    df['ds'] = pd.to_datetime(df['ds'])
    df['wilayah'] = df['wilayah'].str.capitalize()

    print("✅ CSV loaded")
    return df

# =========================
# INIT GLOBAL
# =========================
MODELS = None
DF = None

def init_data():
    global MODELS, DF

    if MODELS is None:
        MODELS = load_models()

    if DF is None:
        DF = load_data()

# =========================
# LOGIC
# =========================
def get_response(wilayah, tahun, bulan):
    wilayah = wilayah.capitalize()

    if wilayah not in MODELS:
        raise Exception(f"Model {wilayah} tidak ditemukan")

    chart = []
    avg = 0
    max_val = 0

    # =========================
    # HISTORIS
    # =========================
    if tahun <= LAST_YEAR:
        df_filtered = DF[
            (DF['wilayah'] == wilayah) &
            (DF['ds'].dt.year == tahun) &
            (DF['ds'].dt.month == bulan)
        ]

        chart = [
            {
                "ds": row["ds"].strftime("%Y-%m-%d"),
                "curah_hujan": float(row["curah_hujan"]),
                "wilayah": wilayah,
                "tipe": "historis"
            }
            for _, row in df_filtered.iterrows()
        ]

        if not df_filtered.empty:
            avg = float(df_filtered["curah_hujan"].mean())
            max_val = float(df_filtered["curah_hujan"].max())

    # =========================
    # PREDIKSI
    # =========================
    else:
        model = MODELS[wilayah]

        days = calendar.monthrange(tahun, bulan)[1]

        future = pd.date_range(
            start=f"{tahun}-{bulan:02d}-01",
            periods=days
        )

        future_df = pd.DataFrame({"ds": future})
        forecast = model.predict(future_df)[["ds", "yhat"]]

        chart = [
            {
                "ds": row["ds"].strftime("%Y-%m-%d"),
                "curah_hujan": float(row["yhat"]),
                "wilayah": wilayah,
                "tipe": "prediksi"
            }
            for _, row in forecast.iterrows()
        ]

        avg = float(forecast["yhat"].mean())
        max_val = float(forecast["yhat"].max())

    kondisi = "Basah" if avg > 10 else "Normal" if avg > 5 else "Kering"

    # =========================
    # MAP
    # =========================
    map_res = []

    for w, coords in KOORDINAT.items():
        df_w = DF[
            (DF['wilayah'] == w) &
            (DF['ds'].dt.year == tahun) &
            (DF['ds'].dt.month == bulan)
        ]

        avg_w = df_w["curah_hujan"].mean() if not df_w.empty else 0

        map_res.append({
            "wilayah": w,
            "curah_hujan": round(float(avg_w), 2) if avg_w else 0.0,
            "lat": coords[0],
            "lng": coords[1],
            "is_selected": w == wilayah
        })

    return {
        "chart": chart,
        "map": map_res,
        "summary": {
            "avg": round(avg, 2),
            "max": round(max_val, 2),
            "narasi": f"Wilayah {wilayah} cenderung {kondisi}",
            "is_prediksi": tahun > LAST_YEAR
        },
        "selected_coords": KOORDINAT[wilayah]
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
def api(wilayah: str = "Badung", tahun: int = 2026, bulan: int = 1):
    init_data()
    return get_response(wilayah, tahun, bulan)

# =========================
# SERVE FRONTEND
# =========================
from fastapi.responses import FileResponse

FRONTEND_PATH = os.path.join(BASE_DIR, "../frontend/dist")

if os.path.exists(FRONTEND_PATH):
    app.mount("/", StaticFiles(directory=FRONTEND_PATH, html=True), name="frontend")