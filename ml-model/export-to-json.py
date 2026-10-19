import importlib
import json
import sys
import joblib

sys.modules.setdefault("_loss", importlib.import_module("sklearn._loss._loss"))

bundle = joblib.load("tank_model.pkl")
model = bundle["model"]

# Extract all TreePredictor nodes into plain JSON arrays
trees = []
for stage in model._predictors:
    tree = stage[0]
    nodes = []
    for n in tree.nodes:
        nodes.append({
            "val": float(n["value"]),
            "feat": int(n["feature_idx"]),
            "thresh": float(n["num_threshold"]),
            "miss_left": bool(n["missing_go_to_left"]),
            "left": int(n["left"]),
            "right": int(n["right"]),
            "leaf": bool(n["is_leaf"]),
        })
    trees.append(nodes)

export_data = {
    "features": bundle["features"],
    "horizon_days": int(bundle["horizon_days"]),
    "tanks": bundle["tanks"],
    "baseline_prediction": float(model._baseline_prediction.ravel()[0]),
    "trees": trees,
}

with open("tank_model.json", "w") as f:
    json.dump(export_data, f)

print(f" Exported {len(trees)} trees and {len(bundle['tanks'])} tanks to tank_model.json")