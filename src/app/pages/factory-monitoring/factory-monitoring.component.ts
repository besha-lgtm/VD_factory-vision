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
  model: tf.LayersModel | null = null;
  isModelLoading = true;
  isAnalyzing = false;

  // Ensure these match the exact order/names of classes in your Teachable Machine project
  readonly labels = [
    'machine_running_operator_absent',
    'machine_running_operator_present',
    'machine_stopped',
    'signal_light_red'
  ];

  detectedStatus = {
    machineRunning: false,
    productPresent: false,
    lightGreen: false,
    operatorPresent: false
  };

  alerts: AlertItem[] = [];

  async ngOnInit(): Promise<void> {
    try {
      // Load model from assets folder
      this.model = await tf.loadLayersModel('assets/model/model.json');
      this.isModelLoading = false;
    } catch (error) {
      console.error('Failed to load TFJS model:', error);
      this.isModelLoading = false;
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
    if (!this.model || !this.previewImg) return;

    this.isAnalyzing = true;

    // 1. Convert image element to tensor and normalize dimensions (224x224)
    const imgEl = this.previewImg.nativeElement;
    const tensor = tf.browser.fromPixels(imgEl)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .div(tf.scalar(255))
      .expandDims();

    // 2. Run prediction through the neural network
    const prediction = this.model.predict(tensor) as tf.Tensor;
    const scores = await prediction.data();

    // Free memory allocations
    tensor.dispose();
    prediction.dispose();

    // 3. Find index with highest probability score
    const maxScoreIndex = scores.indexOf(Math.max(...Array.from(scores)));
    const predictedClass = this.labels[maxScoreIndex];

    // 4. Map prediction output to component state
    this.mapPredictionToStatus(predictedClass);

    // 5. Evaluate alerts based on detected state
    this.evaluateAlerts();

    this.isAnalyzing = false;
  }

  private mapPredictionToStatus(predictedClass: string): void {
    switch (predictedClass) {
      case 'machine_running_operator_absent':
        this.detectedStatus = {
          machineRunning: true,
          productPresent: true,
          lightGreen: true,
          operatorPresent: false
        };
        break;

      case 'machine_running_operator_present':
        this.detectedStatus = {
          machineRunning: true,
          productPresent: true,
          lightGreen: true,
          operatorPresent: true
        };
        break;

      case 'signal_light_red':
        this.detectedStatus = {
          machineRunning: false,
          productPresent: true,
          lightGreen: false,
          operatorPresent: true
        };
        break;

      default:
        this.detectedStatus = {
          machineRunning: false,
          productPresent: false,
          lightGreen: false,
          operatorPresent: false
        };
        break;
    }
  }

  private evaluateAlerts(): void {
    this.alerts = [];

    if (this.detectedStatus.machineRunning && !this.detectedStatus.operatorPresent) {
      this.alerts.push({
        type: 'CRITICAL',
        typeClass: 'badge-danger',
        text: 'Unattended Machine Alert: Machine running and product present, but operator is ABSENT!'
      });
    }

    if (!this.detectedStatus.lightGreen) {
      this.alerts.push({
        type: 'WARNING',
        typeClass: 'badge-warning',
        text: 'Signal tower light is RED or OFF.'
      });
    }
  }
}