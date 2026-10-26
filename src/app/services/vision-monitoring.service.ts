import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface TimelinePart {
  state: 'run' | 'stop' | 'warn';
  flex: number;
  durationMin: number;
}

export interface MachineRecord {
  id: string;
  name: string;
  line: number;
  state: 'Running' | 'Stopped' | 'Warning';
  operator: 'Present' | 'Absent';
  lightStatus: 'Green' | 'Red';
  imageUrl: string;
  parts: TimelinePart[];
  stoppedTimeMin: number;
}

export interface AIAlert {
  id: number;
  machine: string;
  line: number;
  name: string;
  desc: string;
  type: 'red' | 'yellow' | 'green';
  ack: boolean;
  timeAgo: string;
}

export interface DashboardMetrics {
  machinesMonitored: number;
  machinesRunning: number;
  runningPercentage: number;
  linesCount: number;
  unattendedAlerts: number;
  stoppedTimeMin: number;
}

export interface DatasetBatch {
  id: string;
  name: string;
  description: string;
  images: string[];
}

@Injectable({
  providedIn: 'root'
})
export class VisionMonitoringService {

  // 4 Curated distinct batches of 6 images from src/assets/Dataset/
  readonly datasetBatches: DatasetBatch[] = [
    {
      id: 'batch_1',
      name: 'Shift Alpha: Assembly Workstations (6 Lines)',
      description: 'Primary packaging workstations with operators present and active lines',
      images: [
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_1tswx81tswx81tsw.png',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_630pww630pww630p.png',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_j2l4nij2l4nij2l4.png',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_7vnicx7vnicx7vni.png',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_eomd29eomd29eomd.png',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_j5p1gjj5p1gjj5p1.png'
      ]
    },
    {
      id: 'batch_2',
      name: 'Shift Beta: High-Speed Conveyor Lines (6 Lines)',
      description: 'Conveyor packaging machinery in active motion with operator rotation',
      images: [
        'assets/Dataset/machine/machine_running/AISelect_20260804_205044_Gallery.jpg',
        'assets/Dataset/machine/machine_running/AISelect_20260804_205109_Gallery.jpg',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_1tswx81tswx81tsw.png',
        'assets/Dataset/machine/machine_running/AISelect_20260804_205119_Gallery.jpg',
        'assets/Dataset/machine/machine_running/AISelect_20260804_205127_Gallery.jpg',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_630pww630pww630p.png'
      ]
    },
    {
      id: 'batch_3',
      name: 'Shift Gamma: Inspection & Maintenance (6 Lines)',
      description: 'Mixed operational states, machine idle phases, and stoppage alerts',
      images: [
        'assets/Dataset/machine/machine_idle/IMG-20260804-WA0048(1).jpg',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_j2l4nij2l4nij2l4.png',
        'assets/Dataset/machine/machine_idle/IMG-20260804-WA0048(2).jpg',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_7vnicx7vnicx7vni.png',
        'assets/Dataset/machine/machine_idle/IMG-20260804-WA0048(3).jpg',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_eomd29eomd29eomd.png'
      ]
    },
    {
      id: 'batch_4',
      name: 'Shift Delta: Safety Audit & Lamp Monitoring (6 Lines)',
      description: 'Tower signal lamps and worker attendance surveillance stream',
      images: [
        'assets/Dataset/lamp/light_green/IMG_1040.jpg',
        'assets/Dataset/operator/operator_present/Gemini_Generated_Image_630pww630pww630p.png',
        'assets/Dataset/lamp/light_red/unknown-4qvie1cj-ingestion-848d69cd95-ttl72.jpg',
        'assets/Dataset/machine/machine_running/AISelect_20260804_205044_Gallery.jpg',
        'assets/Dataset/lamp/light_green/IMG_1041.jpg',
        'assets/Dataset/operator/operator_absent/AISelect_20260804_205119_Gallery.jpg'
      ]
    }
  ];

  private currentBatchIndex = 0;

  // Initial machine records
  private initialRecords: MachineRecord[] = [
    {
      id: 'Line 1',
      name: 'Packaging Line 01',
      line: 1,
      state: 'Running',
      operator: 'Present',
      lightStatus: 'Green',
      imageUrl: 'assets/Dataset/operator/operator_present/Gemini_Generated_Image_1tswx81tswx81tsw.png',
      stoppedTimeMin: 12,
      parts: [
        { state: 'run', flex: 45, durationMin: 180 },
        { state: 'warn', flex: 10, durationMin: 20 },
        { state: 'run', flex: 45, durationMin: 180 }
      ]
    },
    {
      id: 'Line 2',
      name: 'Conveyor Line 02',
      line: 2,
      state: 'Running',
      operator: 'Absent',
      lightStatus: 'Green',
      imageUrl: 'assets/Dataset/operator/operator_present/Gemini_Generated_Image_630pww630pww630p.png',
      stoppedTimeMin: 18,
      parts: [
        { state: 'run', flex: 55, durationMin: 220 },
        { state: 'stop', flex: 15, durationMin: 40 },
        { state: 'run', flex: 30, durationMin: 120 }
      ]
    },
    {
      id: 'Line 3',
      name: 'Carton Sealer 03',
      line: 3,
      state: 'Running',
      operator: 'Present',
      lightStatus: 'Green',
      imageUrl: 'assets/Dataset/operator/operator_present/Gemini_Generated_Image_j2l4nij2l4nij2l4.png',
      stoppedTimeMin: 8,
      parts: [
        { state: 'run', flex: 80, durationMin: 320 },
        { state: 'stop', flex: 5, durationMin: 15 },
        { state: 'run', flex: 15, durationMin: 45 }
      ]
    },
    {
      id: 'Line 4',
      name: 'Stamping Press 04',
      line: 4,
      state: 'Stopped',
      operator: 'Present',
      lightStatus: 'Red',
      imageUrl: 'assets/Dataset/operator/operator_present/Gemini_Generated_Image_7vnicx7vnicx7vni.png',
      stoppedTimeMin: 46,
      parts: [
        { state: 'run', flex: 30, durationMin: 120 },
        { state: 'stop', flex: 40, durationMin: 160 },
        { state: 'warn', flex: 30, durationMin: 100 }
      ]
    },
    {
      id: 'Line 5',
      name: 'Palletizer 05',
      line: 5,
      state: 'Stopped',
      operator: 'Present',
      lightStatus: 'Red',
      imageUrl: 'assets/Dataset/operator/operator_present/Gemini_Generated_Image_eomd29eomd29eomd.png',
      stoppedTimeMin: 34,
      parts: [
        { state: 'run', flex: 50, durationMin: 200 },
        { state: 'warn', flex: 15, durationMin: 45 },
        { state: 'stop', flex: 35, durationMin: 135 }
      ]
    },
    {
      id: 'Line 6',
      name: 'Wrap Master 06',
      line: 6,
      state: 'Stopped',
      operator: 'Present',
      lightStatus: 'Red',
      imageUrl: 'assets/Dataset/operator/operator_present/Gemini_Generated_Image_j5p1gjj5p1gjj5p1.png',
      stoppedTimeMin: 28,
      parts: [
        { state: 'run', flex: 40, durationMin: 160 },
        { state: 'stop', flex: 30, durationMin: 120 },
        { state: 'run', flex: 30, durationMin: 100 }
      ]
    }
  ];

  // Initial alerts
  private initialAlerts: AIAlert[] = [
    {
      id: 1,
      machine: 'Line 2',
      line: 2,
      name: 'Unattended Machine Alert',
      desc: 'Machine is running and product is present, but operator is ABSENT · 4 min',
      type: 'red',
      ack: false,
      timeAgo: '4 min ago'
    },
    {
      id: 2,
      machine: 'Line 4',
      line: 4,
      name: 'Machine Inactive Alert',
      desc: 'Signal tower lamp is RED · Machine stopped on conveyor station',
      type: 'red',
      ack: false,
      timeAgo: '12 min ago'
    },
    {
      id: 3,
      machine: 'Line 5',
      line: 5,
      name: 'Stoppage Warning',
      desc: 'Repeated downtime events registered during current shift',
      type: 'yellow',
      ack: true,
      timeAgo: '28 min ago'
    }
  ];

  private recordsSubject = new BehaviorSubject<MachineRecord[]>(this.initialRecords);
  readonly records$: Observable<MachineRecord[]> = this.recordsSubject.asObservable();

  private alertsSubject = new BehaviorSubject<AIAlert[]>(this.initialAlerts);
  readonly alerts$: Observable<AIAlert[]> = this.alertsSubject.asObservable();

  private selectedBatchSubject = new BehaviorSubject<DatasetBatch>(this.datasetBatches[0]);
  readonly selectedBatch$: Observable<DatasetBatch> = this.selectedBatchSubject.asObservable();

  getCurrentBatch(): DatasetBatch {
    return this.datasetBatches[this.currentBatchIndex];
  }

  getCurrentBatchIndex(): number {
    return this.currentBatchIndex;
  }

  // Cycles to the next dataset batch and returns the 6 images
  getNextDatasetBatch(): DatasetBatch {
    this.currentBatchIndex = (this.currentBatchIndex + 1) % this.datasetBatches.length;
    const batch = this.datasetBatches[this.currentBatchIndex];
    this.selectedBatchSubject.next(batch);
    return batch;
  }

  setBatchByIndex(index: number): DatasetBatch {
    this.currentBatchIndex = index % this.datasetBatches.length;
    const batch = this.datasetBatches[this.currentBatchIndex];
    this.selectedBatchSubject.next(batch);
    return batch;
  }

  // Synchronize dashboard state when inference finishes in Factory Monitoring
  updateFromInference(imageAnalyses: any[]): void {
    if (!imageAnalyses || imageAnalyses.length === 0) return;

    const currentRecords = [...this.recordsSubject.getValue()];
    const newAlerts: AIAlert[] = [];
    let alertIdCounter = 1;

    imageAnalyses.forEach((analysis, idx) => {
      const lineNum = idx + 1;
      const isRunning = analysis.detectedStatus?.machineRunning ?? false;
      const isOperatorPresent = analysis.detectedStatus?.operatorPresent ?? true;
      const isLightGreen = analysis.detectedStatus?.lightGreen ?? false;

      const state: 'Running' | 'Stopped' | 'Warning' =
        isRunning ? (isOperatorPresent ? 'Running' : 'Warning') : 'Stopped';

      const stoppedTime = isRunning ? Math.floor(Math.random() * 15 + 5) : Math.floor(Math.random() * 40 + 25);

      // Generate realistic timeline parts reflecting new state
      const parts: TimelinePart[] = isRunning
        ? [
            { state: 'run', flex: 70, durationMin: 280 },
            { state: isOperatorPresent ? 'run' : 'warn', flex: 15, durationMin: 45 },
            { state: 'run', flex: 15, durationMin: 55 }
          ]
        : [
            { state: 'run', flex: 35, durationMin: 140 },
            { state: 'stop', flex: 45, durationMin: 160 },
            { state: 'warn', flex: 20, durationMin: 80 }
          ];

      const record: MachineRecord = {
        id: `Line ${lineNum}`,
        name: `Packaging Line 0${lineNum}`,
        line: lineNum,
        state,
        operator: isOperatorPresent ? 'Present' : 'Absent',
        lightStatus: isLightGreen ? 'Green' : 'Red',
        imageUrl: typeof analysis.imageUrl === 'string' ? analysis.imageUrl : '',
        parts,
        stoppedTimeMin: stoppedTime
      };

      currentRecords[idx] = record;

      // Extract alerts
      if (analysis.alerts && analysis.alerts.length > 0) {
        analysis.alerts.forEach((alertItem: any) => {
          newAlerts.push({
            id: alertIdCounter++,
            machine: `Line ${lineNum}`,
            line: lineNum,
            name: alertItem.text.split(':')[0] || 'AI Detection Alert',
            desc: alertItem.text,
            type: alertItem.type === 'CRITICAL' ? 'red' : 'yellow',
            ack: false,
            timeAgo: 'Just now'
          });
        });
      }
    });

    this.recordsSubject.next(currentRecords);
    if (newAlerts.length > 0) {
      this.alertsSubject.next(newAlerts);
    }
  }

  // Acknowledge an alert by ID
  acknowledgeAlert(alertId: number): void {
    const alerts = this.alertsSubject.getValue().map(alert => {
      if (alert.id === alertId) {
        return { ...alert, ack: true };
      }
      return alert;
    });
    this.alertsSubject.next(alerts);
  }

  // Calculate high-level KPIs based on optional line filter
  getMetrics(filterLine: string = 'all'): DashboardMetrics {
    const allRecords = this.recordsSubject.getValue();
    const filteredRecords = filterLine === 'all'
      ? allRecords
      : allRecords.filter(r => r.line === parseInt(filterLine, 10));

    const total = filteredRecords.length || 1;
    const running = filteredRecords.filter(r => r.state === 'Running').length;
    const runningPct = Math.round((running / total) * 100);

    const allAlerts = this.alertsSubject.getValue();
    const filteredAlerts = filterLine === 'all'
      ? allAlerts
      : allAlerts.filter(a => a.line === parseInt(filterLine, 10));
    const unattended = filteredAlerts.filter(a => !a.ack).length;

    const stoppedTotal = filteredRecords.reduce((acc, r) => acc + r.stoppedTimeMin, 0);

    return {
      machinesMonitored: filteredRecords.length,
      machinesRunning: running,
      runningPercentage: runningPct,
      linesCount: new Set(filteredRecords.map(r => r.line)).size,
      unattendedAlerts: unattended,
      stoppedTimeMin: stoppedTotal
    };
  }
}
