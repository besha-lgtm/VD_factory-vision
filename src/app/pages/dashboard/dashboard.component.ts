import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import {
  VisionMonitoringService,
  MachineRecord,
  AIAlert,
  DashboardMetrics,
  DatasetBatch
} from '../../services/vision-monitoring.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {

  // Selected filters
  selectedLine = 'all';
  selectedShift = 'current';

  // Subscriptions & data
  private subscriptions = new Subscription();
  records: MachineRecord[] = [];
  alerts: AIAlert[] = [];
  currentBatch?: DatasetBatch;

  // Calculated metrics
  metrics: DashboardMetrics = {
    machinesMonitored: 6,
    machinesRunning: 3,
    runningPercentage: 50,
    linesCount: 6,
    unattendedAlerts: 2,
    stoppedTimeMin: 144
  };

  // Toast feedback state
  toastMessage = '';
  showToast = false;
  private toastTimer: any = null;

  constructor(private monitoringService: VisionMonitoringService) {}

  ngOnInit(): void {
    this.currentBatch = this.monitoringService.getCurrentBatch();

    this.subscriptions.add(
      this.monitoringService.records$.subscribe(records => {
        this.records = records;
        this.updateView();
      })
    );

    this.subscriptions.add(
      this.monitoringService.alerts$.subscribe(alerts => {
        this.alerts = alerts;
        this.updateView();
      })
    );

    this.subscriptions.add(
      this.monitoringService.selectedBatch$.subscribe(batch => {
        this.currentBatch = batch;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    if (this.toastTimer) {
      clearTimeout(this.toastTimer);
    }
  }

  // Filtered lists based on user selection
  get filteredRecords(): MachineRecord[] {
    if (this.selectedLine === 'all') {
      return this.records;
    }
    const lineNum = parseInt(this.selectedLine, 10);
    return this.records.filter(r => r.line === lineNum);
  }

  get filteredAlerts(): AIAlert[] {
    if (this.selectedLine === 'all') {
      return this.alerts;
    }
    const lineNum = parseInt(this.selectedLine, 10);
    return this.alerts.filter(a => a.line === lineNum);
  }

  get openAlertsCount(): number {
    return this.filteredAlerts.filter(a => !a.ack).length;
  }

  onLineFilterChange(): void {
    this.updateView();
    this.triggerToast(`Filtered view for ${this.selectedLine === 'all' ? 'All Lines' : 'Line ' + this.selectedLine}`);
  }

  onShiftFilterChange(): void {
    this.updateView();
    this.triggerToast(`Displaying ${this.selectedShift === 'current' ? 'Current Shift' : 'Previous Shift'} telemetry`);
  }

  // Refresh dashboard and cycle dataset images
  refreshDashboard(): void {
    const nextBatch = this.monitoringService.getNextDatasetBatch();
    this.currentBatch = nextBatch;
    this.updateView();
    this.triggerToast(`↻ Dashboard updated with dataset: ${nextBatch.name}`);
  }

  // Acknowledge alert
  acknowledge(alertId: number): void {
    this.monitoringService.acknowledgeAlert(alertId);
    this.triggerToast(`Alert #${alertId} acknowledged`);
  }

  private updateView(): void {
    const baseMetrics = this.monitoringService.getMetrics(this.selectedLine);
    if (this.selectedShift === 'previous') {
      // Offset slightly for historical shift comparison
      this.metrics = {
        ...baseMetrics,
        stoppedTimeMin: Math.round(baseMetrics.stoppedTimeMin * 1.35)
      };
    } else {
      this.metrics = baseMetrics;
    }
  }

  private triggerToast(message: string): void {
    this.toastMessage = message;
    this.showToast = true;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.showToast = false;
    }, 2800);
  }
}
