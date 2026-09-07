# Visipak Factory Vision: Dynamic Modular Models Guide

## Overview

The Visipak Factory Vision system uses a **decoupled, modular vision architecture** designed for real-time factory floor monitoring. Instead of a single rigid monolithic classifier, the system separates detection into **three independent models**:

```
                        ┌─────────────────────────────────┐
                        │   Input Image Frame (224x224)   │
                        └───────────────┬─────────────────┘
                                        │
             ┌──────────────────────────┼──────────────────────────┐
             ▼                          ▼                          ▼
   ┌───────────────────┐      ┌───────────────────┐      ┌───────────────────┐
   │  Operator Model   │      │   Product Model   │      │ Machine Light Mod │
   │ (Human Presence)  │      │(Cardboard Package)│      │  (Green Tower)    │
   └─────────┬─────────┘      └─────────┬─────────┘      └─────────┬─────────┘
             ▼                          ▼                          ▼
   Operator: PRESENT/ABSENT    Product: DETECTED/MISSING  Machine: RUNNING/STOPPED
             │                          │                          │
             └──────────────────────────┼──────────────────────────┘
                                        ▼
                      ┌───────────────────────────────────┐
                      │  Multi-Condition Alert Evaluator  │
                      │  (Requires All 3 to be Satisfied) │
                      └───────────────────────────────────┘
```

---

## 1. Model Structure & Locations

Each model is housed in its own folder under `src/assets/models/`:

| Model Name | Path | Target Output | Description |
|---|---|---|---|
| **Operator Detector** | `src/assets/models/operator/` | Operator Presence ($[0.0, 1.0]$) | Detects human workers/operators at the production station |
| **Product Detector** | `src/assets/models/product/` | Product Presence ($[0.0, 1.0]$) | Detects manufactured items/boxes on the conveyor |
| **Machine Light Detector** | `src/assets/models/machine_light/` | Machine Running ($[0.0, 1.0]$) | Detects active green signal tower lamp (running state) |
| *Unified Fallback* | `src/assets/model/` | 3-way sigmoid array | Backward-compatible fallback model |

Each model directory contains:
- `model.json`: TensorFlow.js architecture definition and layer graph.
- `weights.bin`: Trained float32 weight matrices.
- `metadata.json`: Model version, thresholds, input resolution, and descriptive metadata.

---

## 2. Multi-Condition Alert Rules

The system enforces the strict multi-condition requirement:
$$\text{Production Safe \& Operational} \iff \text{Operator Present} \land \text{Product Present} \land \text{Machine Running (Green Light)}$$

If **any condition is absent or fails**, targeted alerts are raised:

1. **Operator Failed**:
   - If machine is running & product is present:
     `Unattended Machine Alert: Machine is running and product is present, but operator is ABSENT!`
   - If machine is stopped:
     `Operator Absence Alert: No operator detected at the production station.`
2. **Product Failed**:
   - `Material Missing Alert: No product detected on the conveyor line!`
3. **Machine Running / Signal Light Failed**:
   - `Machine Inactive Alert: Machine is STOPPED (Signal tower green light is OFF or RED)!`

When **all three conditions pass**, 0 alerts are active, and all checkpoints display green status badges.

---

## 3. How to Retrain Models

A standalone training pipeline is provided at:
```bash
scripts/train_modular_models.js
```

### Quick Retrain:
To retrain all models with updated dataset images:
```bash
node scripts/train_modular_models.js
```

### Adding New Training Images:
1. Place new images in the appropriate folder under `src/assets/Dataset/`:
   - `Dataset/operator/operator_present/` or `operator_absent/`
   - `Dataset/machine/machine_running/` or `machine_idle/`
   - `Dataset/lamp/light_green/` or `light_red/`
2. Update the annotations list in `scripts/train_modular_models.js`:
   ```javascript
   { path: 'src/assets/Dataset/operator/my_new_sample.jpg', op: 1, prod: 1, run: 1 }
   ```
3. Run `node scripts/train_modular_models.js`. The models will automatically update in `src/assets/models/`.

---

## 4. Future Extensibility & Adding New Use Cases

Because the architecture is fully modular, you can easily extend it with new use cases:

### Use Case Examples:
1. **PPE Compliance Model** (`src/assets/models/ppe_detector`):
   - Check if operator is wearing a helmet and high-visibility vest.
2. **Product Defect Model** (`src/assets/models/defect_detector`):
   - Check for torn, crushed, or improperly sealed cardboard boxes.
3. **Zone Intrusion / Danger Zone Model** (`src/assets/models/danger_zone`):
   - Detect hands or objects too close to active machinery rollers.

### Adding a New Model in 3 Simple Steps:
1. **Train the new model**: Add a new `trainModularModel` call in `scripts/train_modular_models.js`.
2. **Load the model** in `src/app/pages/factory-monitoring/factory-monitoring.component.ts`:
   ```typescript
   this.ppeModel = await tf.loadLayersModel('assets/models/ppe_detector/model.json');
   ```
3. **Add the checkpoint** to `detectedStatus` and evaluate custom alerts in `evaluateAlerts()`.

---

## 5. Adding Visual Insights & Localization (Bounding Boxes)

For future phases where you want to draw bounding boxes and heatmaps on the camera canvas:
1. The MobileNet feature backbone produces a spatial feature map ($7 \times 7 \times 1280$).
2. By taking the top feature map activations or attaching a spatial regression head ($[x_{min}, y_{min}, x_{max}, y_{max}]$), you can project bounding boxes directly over the preview image element in the UI.
3. The component already has the `#previewImg` reference and canvas hook (`verifyGreenLightSpectrum`), making it trivial to render an overlay canvas with colored bounding boxes for detected operators and packages.
