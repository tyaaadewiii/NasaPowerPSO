from urllib.parse import parse_qs
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import pickle
import calendar
import json

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

BASE_DIR = os.path.dirname(__file__)

# =========================
# LOAD MODEL (PKL)
# =========================
def load_models():
    model_dir = os.path.join(BASE_DIR, 'models')
    models = {}

    if not os.path.exists(model_dir):
        print("⚠️ Folder models tidak ditemukan")
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

    print("✅ CSV loaded:", df['wilayah'].unique())
    return df

# =========================
# GLOBAL LOAD
# =========================
MODELS = None
DF = None
LAST_YEAR = 2025
def init_data():
    global MODELS, DF

    if MODELS is None:
        MODELS = load_models()

    if DF is None:
        DF = load_data()
# =========================
# MAIN LOGIC
# =========================
def get_response(wilayah, tahun, bulan):
    wilayah = wilayah.capitalize()

    if wilayah not in MODELS:
        raise Exception(f"Model {wilayah} tidak ditemukan")

    # INIT AMAN
    avg = 0
    max_val = 0
    chart = []

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
            "wilayah": str(w),
            "curah_hujan": float(round(avg_w, 2)) if avg_w else 0.0,
            "lat": float(coords[0]),
            "lng": float(coords[1]),
            "is_selected": True if w == wilayah else False
        })

    return {
        "chart": chart,
        "map": map_res,
        "summary": {
            "avg": float(round(avg, 2)),
            "max": float(round(max_val, 2)),
            "narasi": str(f"Wilayah {wilayah} cenderung {kondisi}"),
            "is_prediksi": True if tahun > LAST_YEAR else False
        },
        "selected_coords": [
            float(KOORDINAT[wilayah][0]),
            float(KOORDINAT[wilayah][1])
        ]
    }

# =========================
# VERCEL HANDLER
# =========================
def handler(request):
    try:
        qs = parse_qs(request.query)

        wilayah = qs.get("wilayah", ["Badung"])[0]
        tahun   = int(qs.get("tahun", [2026])[0])
        bulan   = int(qs.get("bulan", [1])[0])

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(get_response(wilayah, tahun, bulan))
        }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }

# =========================
# FASTAPI LOCAL
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