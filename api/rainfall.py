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

# =========================
# LOAD MODEL (PKL)
# =========================
def load_models():
    base_dir = os.path.dirname(__file__)
    model_dir = os.path.join(base_dir, 'models')

    models = {}

    if not os.path.exists(model_dir):
        print("⚠️ Folder models tidak ditemukan:", model_dir)
        return models

    for file in os.listdir(model_dir):
        if file.endswith(".pkl"):
            wilayah = file.replace(".pkl", "").capitalize()
            with open(os.path.join(model_dir, file), "rb") as f:
                models[wilayah] = pickle.load(f)

    print("✅ Models loaded:", list(models.keys()))
    return models


# =========================
# LOAD DATA CSV
# =========================
def load_data():
    base_dir = os.path.dirname(__file__)
    csv_path = os.path.join(base_dir, 'data', 'Skripsi_PSO.csv')

    if not os.path.exists(csv_path):
        print("⚠️ CSV tidak ditemukan:", csv_path)
        return {}

    df = pd.read_csv(csv_path)
    df['ds'] = pd.to_datetime(df['ds'])
    df['wilayah'] = df['wilayah'].str.capitalize()

    data_dict = {}
    for w in df['wilayah'].unique():
        data_dict[w] = df[df['wilayah'] == w]

    print("✅ CSV loaded:", list(data_dict.keys()))
    return data_dict


# =========================
# GLOBAL LOAD (1x saja)
# =========================
MODELS = load_models()
DATA   = load_data()

print("📊 DATA:", list(DATA.keys()))
print("🤖 MODELS:", list(MODELS.keys()))


# =========================
# MAIN LOGIC
# =========================
def get_response(wilayah, tahun, bulan):
    wilayah = wilayah.capitalize()

    if wilayah not in MODELS:
        raise Exception(f"Model {wilayah} tidak ditemukan")

    model = MODELS[wilayah]

    # ===== CHART (PKL) =====
    days = calendar.monthrange(tahun, bulan)[1]

    future = pd.date_range(
        start=f"{tahun}-{bulan:02d}-01",
        periods=days
    )

    future_df = pd.DataFrame({"ds": future})

    forecast = model.predict(future_df)[["ds", "yhat"]]

    chart_res = [
        {
            "ds": row["ds"].strftime("%Y-%m-%d"),
            "wilayah": wilayah,
            "curah_hujan": float(row["yhat"]),
            "tipe": "prediksi"
        }
        for _, row in forecast.iterrows()
    ]

    avg_val = float(forecast["yhat"].mean())
    max_val = float(forecast["yhat"].max())

    kondisi = "Basah" if avg_val > 10 else "Normal" if avg_val > 5 else "Kering"

    # ===== MAP (CSV) =====
    map_res = []

    for w, coords in KOORDINAT.items():
        if w in DATA:
            df_w = DATA[w]

            df_filtered = df_w[
                (df_w['ds'].dt.year == tahun) &
                (df_w['ds'].dt.month == bulan)
            ]

            avg = float(df_filtered["curah_hujan"].mean()) if not df_filtered.empty else 0

            map_res.append({
                "wilayah": w,
                "curah_hujan": round(avg, 2),
                "lat": coords[0],
                "lng": coords[1],
                "is_selected": w == wilayah
            })

    return {
        "chart": chart_res,
        "map": map_res,
        "summary": {
            "avg": round(avg_val, 2),
            "max": round(max_val, 2),
            "narasi": f"Wilayah {wilayah} cenderung {kondisi}",
            "is_prediksi": True
        },
        "selected_coords": KOORDINAT.get(wilayah)
    }


# =========================
# VERCEL HANDLER (WAJIB)
# =========================
def handler(request):
    try:
        wilayah = request.args.get("wilayah", "Badung")
        tahun   = int(request.args.get("tahun", 2026))
        bulan   = int(request.args.get("bulan", 1))

        result = get_response(wilayah, tahun, bulan)

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(result)
        }

    except Exception as e:
        print("❌ ERROR:", str(e))

        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({"error": str(e)})
        }


if __name__ == "__main__":
    print("\n=== TEST LOCAL ===")

    try:
        res = get_response("Badung", 2026, 1)

        print("✔ Chart:", len(res["chart"]))
        print("✔ Map:", len(res["map"]))
        print("✔ Summary:", res["summary"])

    except Exception as e:
        print("❌ ERROR LOCAL:", e)