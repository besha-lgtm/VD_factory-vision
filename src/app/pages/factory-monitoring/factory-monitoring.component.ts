import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

interface AlertItem {
  type: string;
  typeClass: string;
  text: string;
}

@Component({
  selector: 'app-factory-monitoring',
  standalone: false,
  templateUrl: './factory-monitoring.component.html',
  styleUrls: ['./factory-monitoring.component.css']
})
export class FactoryMonitoringComponent implements OnInit {
  @ViewChild('previewImg') previewImg!: ElementRef<HTMLImageElement>;

  selectedImage: string | ArrayBuffer | null = null;

  // Separate, modular vision models for future scalability & granular insights
  operatorModel: tf.LayersModel | null = null;
  productModel: tf.LayersModel | null = null;
  machineLightModel: tf.LayersModel | null = null;
  unifiedFallbackModel: tf.LayersModel | null = null;

  isModelLoading = true;
  isAnalyzing = false;

  detectedStatus = {
    machineRunning: false,
    productPresent: false,
    lightGreen: false,
    operatorPresent: false
  };

  alerts: AlertItem[] = [];

  async ngOnInit(): Promise<void> {
    try {
      // Load all three modular models in parallel
      const [opModel, prodModel, lightModel] = await Promise.all([
        tf.loadLayersModel('assets/models/operator/model.json'),
        tf.loadLayersModel('assets/models/product/model.json'),
        tf.loadLayersModel('assets/models/machine_light/model.json')
      ]);

      this.operatorModel = opModel;
      this.productModel = prodModel;
      this.machineLightModel = lightModel;
      this.isModelLoading = false;
      console.log('✓ All 3 modular vision models loaded successfully.');
    } catch (error) {
      console.warn('Failed loading modular models, attempting combined fallback model:', error);
      try {
        this.unifiedFallbackModel = await tf.loadLayersModel('assets/model/model.json');
        this.isModelLoading = false;
        console.log('✓ Fallback combined vision model loaded successfully.');
      } catch (err2) {
        console.error('Critical: Failed to load vision models:', err2);
        this.isModelLoading = false;
      }
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.selectedImage = reader.result;
      };

      reader.readAsDataURL(file);
    }
  }

  async runModelInference(): Promise<void> {
    const hasModularModels = this.operatorModel && this.productModel && this.machineLightModel;
    if ((!hasModularModels && !this.unifiedFallbackModel) || !this.previewImg) return;

    this.isAnalyzing = true;

    try {
      // 1. Convert image element to tensor and normalize dimensions (224x224x3)
      const imgEl = this.previewImg.nativeElement;
      const tensor = tf.browser.fromPixels(imgEl)
        .resizeNearestNeighbor([224, 224])
        .toFloat()
        .div(tf.scalar(255))
        .expandDims() as tf.Tensor4D;

      let opScore = 0;
      let prodScore = 0;
      let lightScore = 0;

      // 2. Run inference through modular models or unified fallback
      if (hasModularModels && this.operatorModel && this.productModel && this.machineLightModel) {
        const opPred = this.operatorModel.predict(tensor) as tf.Tensor;
        const prodPred = this.productModel.predict(tensor) as tf.Tensor;
        const lightPred = this.machineLightModel.predict(tensor) as tf.Tensor;

        const [opData, prodData, lightData] = await Promise.all([
          opPred.data(),
          prodPred.data(),
          lightPred.data()
        ]);

        opScore = opData[0];
        prodScore = prodData[0];
        lightScore = lightData[0];

        opPred.dispose();
        prodPred.dispose();
        lightPred.dispose();
      } else if (this.unifiedFallbackModel) {
        const pred = this.unifiedFallbackModel.predict(tensor) as tf.Tensor;
        const predData = await pred.data();
        opScore = predData[0];
        prodScore = predData[1];
        lightScore = predData[2];
        pred.dispose();
      }

      // Free memory allocations
      tensor.dispose();

      // Auxiliary signal light color verification for edge cases
      const spectralGreenDetected = this.verifyGreenLightSpectrum(imgEl);
      if (spectralGreenDetected && lightScore < 0.5) {
        lightScore = 0.95;
      }

      // 3. Map model outputs to component state
      const isOperatorPresent = opScore >= 0.5;
      const isProductPresent = prodScore >= 0.5;
      const isLightGreen = lightScore >= 0.5;
      // Machine running status is determined by Green Machine Light
      const isMachineRunning = isLightGreen;

      this.detectedStatus = {
        machineRunning: isMachineRunning,
        productPresent: isProductPresent,
        lightGreen: isLightGreen,
        operatorPresent: isOperatorPresent
      };

      console.log('Dynamic Vision Inference Results:', {
        operator: `${(opScore * 100).toFixed(1)}% (${isOperatorPresent ? 'PRESENT' : 'ABSENT'})`,
        product: `${(prodScore * 100).toFixed(1)}% (${isProductPresent ? 'DETECTED' : 'MISSING'})`,
        machineLight: `${(lightScore * 100).toFixed(1)}% (${isLightGreen ? 'GREEN / RUNNING' : 'RED / STOPPED'})`
      });

      // 4. Evaluate multi-condition alert requirements
      this.evaluateAlerts();
    } catch (err) {
      console.error('Inference error:', err);
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Auxiliary pixel analysis to verify vivid green signal tower illumination
   */
  private verifyGreenLightSpectrum(imgEl: HTMLImageElement): boolean {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      canvas.width = 120;
      canvas.height = 120;
      ctx.drawImage(imgEl, 0, 0, 120, 120);
      const imgData = ctx.getImageData(0, 0, 120, 120);
      const data = imgData.data;

      let greenPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        // Green indicator lamp signature: luminous green with G significantly higher than R and B
        if (g > 135 && g > r * 1.35 && g > b * 1.25) {
          greenPixels++;
        }
      }
      return greenPixels >= 8;
    } catch {
      return false;
    }
  }

  /**
   * Evaluates all three conditions:
   *   Condition 1: Operator Present
   *   Condition 2: Product Present
   *   Condition 3: Machine Running / Green Machine Light
   * 
   * If any one condition fails or is absent, clearly identifies the failed condition and raises an alert.
   * If all three are satisfied, no failure alert is raised.
   */
  private evaluateAlerts(): void {
    this.alerts = [];

    const isOperator = this.detectedStatus.operatorPresent;
    const isProduct = this.detectedStatus.productPresent;
    const isGreenLight = this.detectedStatus.lightGreen;
    const isMachineRunning = this.detectedStatus.machineRunning;

    // Condition 1: Operator Presence Check
    if (!isOperator) {
      if (isMachineRunning && isProduct) {
        this.alerts.push({
          type: 'CRITICAL',
          typeClass: 'badge-danger',
          text: 'Unattended Machine Alert: Machine is running and product is present, but operator is ABSENT!'
        });
      } else {
        this.alerts.push({
          type: 'CRITICAL',
          typeClass: 'badge-danger',
          text: 'Operator Absence Alert: No operator detected at the production station.'
        });
      }
    }

    // Condition 2: Product Presence Check
    if (!isProduct) {
      this.alerts.push({
        type: 'WARNING',
        typeClass: 'badge-warning',
        text: 'Material Missing Alert: No product detected on the conveyor line!'
      });
    }

    // Condition 3: Machine Running / Signal Light Check
    if (!isGreenLight || !isMachineRunning) {
      this.alerts.push({
        type: 'CRITICAL',
        typeClass: 'badge-danger',
        text: 'Machine Inactive Alert: Machine is STOPPED (Signal tower green light is OFF or RED)!'
      });
    }
  }
}