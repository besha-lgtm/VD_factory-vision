import { Component, ElementRef, OnDestroy, OnInit, ViewChild, ViewChildren, QueryList } from '@angular/core';
import * as tf from '@tensorflow/tfjs';

interface AlertItem {
  type: string;
  typeClass: string;
  text: string;
}

interface ImageAnalysis {
  id: string;
  imageUrl: string | ArrayBuffer;
  isAnalyzing: boolean;
  isAppropriate: boolean | null;
  hasMachine: boolean;
  hasProduct: boolean;
  hasLight: boolean;
  inappropriateMessage: string;
  detectedStatus: {
    machineRunning: boolean;
    productPresent: boolean;
    lightGreen: boolean;
    operatorPresent: boolean;
  };
  alerts: AlertItem[];
}

@Component({
  selector: 'app-factory-monitoring',
  standalone: false,
  templateUrl: './factory-monitoring.component.html',
  styleUrls: ['./factory-monitoring.component.css']
})
export class FactoryMonitoringComponent implements OnInit, OnDestroy {
  @ViewChildren('previewImg') previewImgs!: QueryList<ElementRef<HTMLImageElement>>;
  @ViewChild('videoPlayer') videoPlayer?: ElementRef<HTMLVideoElement>;

  imageAnalyses: ImageAnalysis[] = [];
  inputMode: 'upload' | 'camera' = 'upload';

  // Live Camera stream & recurring 5s timer
  cameraStream: MediaStream | null = null;
  cameraActive = false;
  cameraError = '';
  countdownSeconds = 5;
  private captureTimer: any = null;
  private countdownTimer: any = null;

  // Separate, modular vision models for future scalability & granular insights
  operatorModel: tf.LayersModel | null = null;
  productModel: tf.LayersModel | null = null;
  machineLightModel: tf.LayersModel | null = null;
  unifiedFallbackModel: tf.LayersModel | null = null;

  isModelLoading = true;

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

  ngOnDestroy(): void {
    this.stopCamera();
  }

  switchMode(mode: 'upload' | 'camera'): void {
    if (this.inputMode === mode) return;

    if (this.inputMode === 'camera') {
      this.stopCamera();
    }

    this.inputMode = mode;
    this.imageAnalyses = [];

    if (mode === 'camera') {
      this.startCamera();
    }
  }

  async startCamera(): Promise<void> {
    this.cameraError = '';
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera is not supported in this browser environment.');
      }

      this.cameraStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: false
      });
      this.cameraActive = true;

      // Allow DOM to render the video element, then attach stream
      setTimeout(() => {
        if (this.videoPlayer && this.videoPlayer.nativeElement) {
          const video = this.videoPlayer.nativeElement;
          video.srcObject = this.cameraStream;
          video.onloadedmetadata = () => {
            video.play().catch(e => console.warn('Video play error:', e));
            // Immediate first capture, then start 5s auto-capture loop
            this.captureFrame();
            this.startAutoCapture();
          };
        }
      }, 150);
    } catch (err: any) {
      console.error('Camera error:', err);
      this.cameraError = err.message || 'Could not access camera. Please allow camera permissions.';
      this.cameraActive = false;
    }
  }

  stopCamera(): void {
    if (this.captureTimer) {
      clearInterval(this.captureTimer);
      this.captureTimer = null;
    }
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Track stop error:', e);
        }
      });
      this.cameraStream = null;
    }
    if (this.videoPlayer && this.videoPlayer.nativeElement) {
      this.videoPlayer.nativeElement.srcObject = null;
    }
    this.cameraActive = false;
    this.countdownSeconds = 5;
  }

  startAutoCapture(): void {
    if (this.captureTimer) clearInterval(this.captureTimer);
    if (this.countdownTimer) clearInterval(this.countdownTimer);

    this.countdownSeconds = 5;
    this.countdownTimer = setInterval(() => {
      if (this.countdownSeconds > 1) {
        this.countdownSeconds--;
      } else {
        this.countdownSeconds = 5;
      }
    }, 1000);

    this.captureTimer = setInterval(() => {
      this.captureFrame();
      this.countdownSeconds = 5;
    }, 5000);
  }

  captureFrame(): void {
    if (!this.cameraActive || !this.videoPlayer || !this.videoPlayer.nativeElement) return;
    const video = this.videoPlayer.nativeElement;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');

    const newAnalysis = this.createEmptyAnalysis(dataUrl);
    // Overwrite for camera mode, we just want the latest active frame
    this.imageAnalyses = [newAnalysis];

    // Run inference directly on canvas
    this.runModelInference(newAnalysis.id, canvas);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = () => {
          if (reader.result) {
            const newAnalysis = this.createEmptyAnalysis(reader.result);
            this.imageAnalyses.push(newAnalysis);
          }
        };
        reader.readAsDataURL(file);
      });
      // Clear input so same files can be chosen again
      input.value = '';
    }
  }
  
  removeImage(id: string): void {
    this.imageAnalyses = this.imageAnalyses.filter(img => img.id !== id);
  }

  clearImages(): void {
    this.imageAnalyses = [];
  }

  createEmptyAnalysis(imageUrl: string | ArrayBuffer): ImageAnalysis {
    return {
      id: Math.random().toString(36).substring(2, 9),
      imageUrl,
      isAnalyzing: false,
      isAppropriate: null,
      hasMachine: false,
      hasProduct: false,
      hasLight: false,
      inappropriateMessage: '',
      detectedStatus: {
        machineRunning: false,
        productPresent: false,
        lightGreen: false,
        operatorPresent: false
      },
      alerts: []
    };
  }

  async runModelInference(id: string, sourceCanvas?: HTMLCanvasElement): Promise<void> {
    const analysis = this.imageAnalyses.find(a => a.id === id);
    if (!analysis) return;

    const hasModularModels = this.operatorModel && this.productModel && this.machineLightModel;
    if (!hasModularModels && !this.unifiedFallbackModel) return;

    let imgEl: HTMLImageElement | HTMLCanvasElement | null = sourceCanvas || null;
    
    // Find the rendered img element if we didn't pass a canvas
    if (!imgEl && this.previewImgs) {
      const imgElements = this.previewImgs.toArray();
      const matchingImg = imgElements.find(el => el.nativeElement.id === 'img-' + id);
      if (matchingImg) {
        imgEl = matchingImg.nativeElement;
      }
    }

    if (!imgEl) return;

    analysis.isAnalyzing = true;

    try {
      // 1. Convert image element/canvas to tensor and normalize dimensions (224x224x3)
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

      // 3. Robust domain validation using both visual metrics and neural model outputs
      const validation = this.validateImageComponents(imgEl, {
        opScore,
        prodScore,
        lightScore,
        spectralGreenDetected
      });

      analysis.hasMachine = validation.hasMachine;
      analysis.hasProduct = validation.hasProduct;
      analysis.hasLight = validation.hasLight;
      analysis.isAppropriate = validation.isAppropriate;
      analysis.inappropriateMessage = validation.message;

      // If image is inappropriate (missing machine, product, or light), do NOT generate analysis
      if (!analysis.isAppropriate) {
        analysis.alerts = [];
        analysis.detectedStatus = {
          machineRunning: false,
          productPresent: false,
          lightGreen: false,
          operatorPresent: false
        };
        console.warn(`Image ${id} rejected:`, validation.message);
        return;
      }

      // 4. Map model outputs to component state
      const isOperatorPresent = opScore >= 0.5;
      const isProductPresent = prodScore >= 0.5;
      const isLightGreen = lightScore >= 0.5;
      const isMachineRunning = isLightGreen;

      analysis.detectedStatus = {
        machineRunning: isMachineRunning,
        productPresent: isProductPresent,
        lightGreen: isLightGreen,
        operatorPresent: isOperatorPresent
      };

      console.log(`Dynamic Vision Inference Results (${id}):`, {
        operator: `${(opScore * 100).toFixed(1)}% (${isOperatorPresent ? 'PRESENT' : 'ABSENT'})`,
        product: `${(prodScore * 100).toFixed(1)}% (${isProductPresent ? 'DETECTED' : 'MISSING'})`,
        machineLight: `${(lightScore * 100).toFixed(1)}% (${isLightGreen ? 'GREEN / RUNNING' : 'RED / STOPPED'})`
      });

      // 5. Evaluate multi-condition alert requirements
      this.evaluateAlerts(analysis);
    } catch (err) {
      console.error(`Inference error on ${id}:`, err);
    } finally {
      analysis.isAnalyzing = false;
    }
  }

  /**
   * Auxiliary pixel analysis to verify vivid green signal tower illumination
   */
  private verifyGreenLightSpectrum(imgEl: HTMLImageElement | HTMLCanvasElement): boolean {
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
   */
  private evaluateAlerts(analysis: ImageAnalysis): void {
    analysis.alerts = [];

    const isOperator = analysis.detectedStatus.operatorPresent;
    const isProduct = analysis.detectedStatus.productPresent;
    const isGreenLight = analysis.detectedStatus.lightGreen;
    const isMachineRunning = analysis.detectedStatus.machineRunning;

    // Condition 1: Operator Presence Check
    if (!isOperator) {
      if (isMachineRunning && isProduct) {
        analysis.alerts.push({
          type: 'CRITICAL',
          typeClass: 'badge-danger',
          text: 'Unattended Machine Alert: Machine is running and product is present, but operator is ABSENT!'
        });
      } else {
        analysis.alerts.push({
          type: 'CRITICAL',
          typeClass: 'badge-danger',
          text: 'Operator Absence Alert: No operator detected at the production station.'
        });
      }
    }

    // Condition 2: Product Presence Check
    if (!isProduct) {
      analysis.alerts.push({
        type: 'WARNING',
        typeClass: 'badge-warning',
        text: 'Material Missing Alert: No product detected on the conveyor line!'
      });
    }

    // Condition 3: Machine Running / Signal Light Check
    if (!isGreenLight || !isMachineRunning) {
      analysis.alerts.push({
        type: 'CRITICAL',
        typeClass: 'badge-danger',
        text: 'Machine Inactive Alert: Machine is STOPPED (Signal tower green light is OFF or RED)!'
      });
    }
  }

  /**
   * Validates that the image contains the components our model was trained on
   */
  private validateImageComponents(
    source: HTMLImageElement | HTMLCanvasElement,
    scores: { opScore: number; prodScore: number; lightScore: number; spectralGreenDetected: boolean }
  ): {
    isAppropriate: boolean;
    hasMachine: boolean;
    hasProduct: boolean;
    hasLight: boolean;
    message: string;
  } {
    try {
      const sampleWidth = 160;
      const sampleHeight = 160;
      const canvas = document.createElement('canvas');
      canvas.width = sampleWidth;
      canvas.height = sampleHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        return { isAppropriate: true, hasMachine: true, hasProduct: true, hasLight: true, message: '' };
      }

      ctx.drawImage(source, 0, 0, sampleWidth, sampleHeight);
      const imgData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
      const data = imgData.data;

      // Check for extreme dark or obstructed lens
      let totalLuma = 0;
      for (let i = 0; i < data.length; i += 4) {
        totalLuma += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }
      const meanLuma = totalLuma / (sampleWidth * sampleHeight);
      if (meanLuma < 15) {
        return {
          isAppropriate: false,
          hasMachine: false,
          hasProduct: false,
          hasLight: false,
          message: 'Inappropriate image: Frame is too dark or camera is covered. Machine and signal light cannot be detected.'
        };
      }

      // Check for close-up face/selfie in central 60% of frame
      let centralPixels = 0;
      let skinPixels = 0;
      const cxMin = Math.floor(sampleWidth * 0.2);
      const cxMax = Math.floor(sampleWidth * 0.8);
      const cyMin = Math.floor(sampleHeight * 0.15);
      const cyMax = Math.floor(sampleHeight * 0.85);

      for (let y = cyMin; y < cyMax; y++) {
        for (let x = cxMin; x < cxMax; x++) {
          const idx = (y * sampleWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          centralPixels++;
          const maxVal = Math.max(r, g, b);
          const minVal = Math.min(r, g, b);
          if (r > 95 && g > 40 && b > 20 && (maxVal - minVal > 15) && Math.abs(r - g) > 15 && r > g && r > b) {
            skinPixels++;
          }
        }
      }
      const isSelfieFace = (skinPixels / (centralPixels || 1)) > 0.18;

      // 1. Signal Light
      let signalLightPixels = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const isGreen = (g > 125 && g > r * 1.25 && g > b * 1.15);
        const isRed = (r > 130 && r > g * 1.3 && r > b * 1.3);
        const isAmber = (r > 150 && g > 105 && b < 95 && r > g * 1.1);
        if (isGreen || isRed || isAmber) {
          signalLightPixels++;
        }
      }
      const hasLight = !isSelfieFace && (scores.spectralGreenDetected || signalLightPixels >= 3 || scores.lightScore >= 0.35);

      // 2. Machine
      let edgeCount = 0;
      const edgeThreshold = 32;
      for (let y = 1; y < sampleHeight - 1; y += 2) {
        for (let x = 1; x < sampleWidth - 1; x += 2) {
          const idx = (y * sampleWidth + x) * 4;
          const idxRight = (y * sampleWidth + (x + 1)) * 4;
          const idxDown = ((y + 1) * sampleWidth + x) * 4;

          const luma = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          const lumaRight = 0.299 * data[idxRight] + 0.587 * data[idxRight + 1] + 0.114 * data[idxRight + 2];
          const lumaDown = 0.299 * data[idxDown] + 0.587 * data[idxDown + 1] + 0.114 * data[idxDown + 2];

          const grad = Math.abs(luma - lumaRight) + Math.abs(luma - lumaDown);
          if (grad > edgeThreshold) {
            edgeCount++;
          }
        }
      }
      const sampledPoints = ((sampleHeight - 2) / 2) * ((sampleWidth - 2) / 2);
      const edgeRatio = edgeCount / sampledPoints;

      let metalGreyPoints = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (Math.abs(r - g) < 22 && Math.abs(g - b) < 22 && Math.abs(r - b) < 22 && r > 35 && r < 215) {
          metalGreyPoints++;
        }
      }
      const metalGreyRatio = metalGreyPoints / (sampleWidth * sampleHeight);

      const hasMachine = !isSelfieFace && (edgeRatio >= 0.040 || metalGreyRatio >= 0.15 || (scores.prodScore >= 0.35 && scores.lightScore >= 0.35));

      // 3. Product
      let productPoints = 0;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        if (r > 80 && r < 225 && g > 60 && g < 190 && b > 30 && b < 145 && r > g && g > b) {
          productPoints++;
        }
      }
      const hasProduct = !isSelfieFace && (productPoints >= 10 || scores.prodScore >= 0.35 || (hasMachine && edgeRatio >= 0.055));

      // Overall requirement
      let isAppropriate = hasMachine && hasProduct && hasLight;

      // Temporal smoothing for live camera
      if (this.inputMode === 'camera' && this.imageAnalyses.length > 0 && this.imageAnalyses[0].isAppropriate === true) {
        if (hasMachine && (hasProduct || hasLight)) {
          isAppropriate = true;
        }
      }

      let message = '';
      if (!isAppropriate) {
        const missing: string[] = [];
        if (!hasMachine) missing.push('Machine');
        if (!hasProduct) missing.push('Product');
        if (!hasLight) missing.push('Signal Light');
        message = isSelfieFace
          ? 'Inappropriate image: Face/selfie detected. Please point camera towards the machine, product, and signal light.'
          : `Inappropriate image. Missing required elements: ${missing.join(', ')}. Images must contain machine, product, and signal light.`;
      }

      return {
        isAppropriate,
        hasMachine,
        hasProduct,
        hasLight,
        message
      };
    } catch (e) {
      console.warn('Error during image validation:', e);
      return { isAppropriate: true, hasMachine: true, hasProduct: true, hasLight: true, message: '' };
    }
  }
}