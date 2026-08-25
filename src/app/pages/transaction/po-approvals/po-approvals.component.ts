import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { PoDataService } from '../../../services/po-data.service';
import { ApprovalPriority, ApprovalRequest, PurchaseOrder } from '../../../models/po.models';

/**
 * po-approvals.component
 * ─────────────────────────────────────────────────────────────
 * Full routed screen at /transaction/po-approval. Unlike before,
 * this is no longer a presentational component driven by @Input —
 * it reads and writes purchase orders straight from PoDataService,
 * since it can be opened directly (via sidebar) with no parent
 * component to hand it data.
 */

type FilterKey = 'all' | 'high' | 'due' | 'overdue';
type SortKey = 'priority' | 'due' | 'requested';

@Component({
  selector: 'app-po-approvals',
  standalone: false,
  templateUrl: './po-approvals.component.html',
  styleUrls: ['./po-approvals.component.css']
})
export class PoApprovalsComponent implements OnInit, OnDestroy {

  requests: ApprovalRequest[] = [];
  approvedToday = 0;
  rejectedToday = 0;

  activeFilter: FilterKey = 'all';
  sortKey: SortKey = 'priority';

  filteredRequests: ApprovalRequest[] = [];

  // Decision popup state (inline confirm + remarks, replaces a native confirm())
  decisionMode: 'approve' | 'reject' | null = null;
  decisionTarget: ApprovalRequest | null = null;
  decisionRemarks = '';

  private sub = new Subscription();

  constructor(private poDataService: PoDataService, private router: Router) {}

  ngOnInit(): void {
    this.sub.add(
      this.poDataService.purchaseOrders$.subscribe(orders => {
        this.requests = this.mapToApprovalRequests(orders);
        this.applyFilterAndSort();
      })
    );
    this.sub.add(this.poDataService.approvedToday$.subscribe(v => this.approvedToday = v));
    this.sub.add(this.poDataService.rejectedToday$.subscribe(v => this.rejectedToday = v));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private mapToApprovalRequests(orders: PurchaseOrder[]): ApprovalRequest[] {
    return (orders || [])
      .filter(po => po && po.status === 'Pending')
      .map(po => {
        const lineItemsList = po.lineItems || [];
        const totalAmount = lineItemsList.reduce((acc, curr) => acc + (curr.amount || 0), 0);

        return {
          id: po.poNo,
          type: 'Purchase',
          title: `PO ${po.poType || 'New'} Approval Request`,
          itemLabel: `${po.customer || 'Unknown Customer'} (Qty: ${po.quantity || 0})`,
          requestedBy: 'System Ingest',
          requestedOn: po.poDate || new Date().toISOString(),
          priority: (totalAmount > 100000 ? 'High' : 'Medium') as ApprovalPriority,
          dueDate: po.poDate || new Date().toISOString().split('T')[0],
          raw: po
        };
      });
  }

  // ─────────────────────────────────────────
  // KPI STRIP
  // ─────────────────────────────────────────
  get totalPending(): number {
    return this.requests.length;
  }

  get highPriorityCount(): number {
    return this.requests.filter(r => r.priority === 'High').length;
  }

  get dueTodayCount(): number {
    return this.requests.filter(r => this.isDueToday(r.dueDate)).length;
  }

  get overdueCount(): number {
    return this.requests.filter(r => this.isOverdue(r.dueDate)).length;
  }

  // ─────────────────────────────────────────
  // FILTER CHIPS
  // ─────────────────────────────────────────
  setFilter(key: FilterKey): void {
    this.activeFilter = key;
    this.applyFilterAndSort();
  }

  filterCount(key: FilterKey): number {
    switch (key) {
      case 'all':     return this.totalPending;
      case 'high':    return this.highPriorityCount;
      case 'due':     return this.dueTodayCount;
      case 'overdue': return this.overdueCount;
    }
  }

  // ─────────────────────────────────────────
  // SORT
  // ─────────────────────────────────────────
  setSort(key: SortKey): void {
    this.sortKey = key;
    this.applyFilterAndSort();
  }

  private applyFilterAndSort(): void {
    let list = [...this.requests];

    switch (this.activeFilter) {
      case 'high':    list = list.filter(r => r.priority === 'High'); break;
      case 'due':     list = list.filter(r => this.isDueToday(r.dueDate)); break;
      case 'overdue': list = list.filter(r => this.isOverdue(r.dueDate)); break;
    }

    const priorityRank: Record<ApprovalPriority, number> = { High: 0, Medium: 1, Low: 2 };
    switch (this.sortKey) {
      case 'priority':
        list.sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority]);
        break;
      case 'due':
        list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
        break;
      case 'requested':
        list.sort((a, b) => new Date(b.requestedOn).getTime() - new Date(a.requestedOn).getTime());
        break;
    }

    this.filteredRequests = list;
  }

  // ─────────────────────────────────────────
  // DUE-DATE HELPERS
  // ─────────────────────────────────────────
  private startOfDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  isDueToday(dateStr: string): boolean {
    if (!dateStr) return false;
    return this.startOfDay(new Date(dateStr)) === this.startOfDay(new Date());
  }

  isOverdue(dateStr: string): boolean {
    if (!dateStr) return false;
    return this.startOfDay(new Date(dateStr)) < this.startOfDay(new Date());
  }

  private isDueTomorrow(dateStr: string): boolean {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.startOfDay(new Date(dateStr)) === this.startOfDay(tomorrow);
  }

  dueLabel(dateStr: string): string {
    if (!dateStr) return '—';
    if (this.isOverdue(dateStr))     return 'Overdue';
    if (this.isDueToday(dateStr))    return 'Due Today';
    if (this.isDueTomorrow(dateStr)) return 'Due Tomorrow';
    return 'In Progress';
  }

  dueClass(dateStr: string): string {
    if (!dateStr) return '';
    if (this.isOverdue(dateStr))     return 'due-overdue';
    if (this.isDueToday(dateStr))    return 'due-today';
    if (this.isDueTomorrow(dateStr)) return 'due-tomorrow';
    return 'due-progress';
  }

  priorityClass(priority: ApprovalPriority): string {
    switch (priority) {
      case 'High':   return 'priority-high';
      case 'Medium': return 'priority-medium';
      case 'Low':    return 'priority-low';
      default:       return '';
    }
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  formatDateTime(dateStr: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  // ─────────────────────────────────────────
  // DECISION POPUP (Approve / Reject with remarks)
  // ─────────────────────────────────────────
  openDecision(mode: 'approve' | 'reject', req: ApprovalRequest): void {
    this.decisionMode = mode;
    this.decisionTarget = req;
    this.decisionRemarks = '';
  }

  closeDecision(): void {
    this.decisionMode = null;
    this.decisionTarget = null;
    this.decisionRemarks = '';
  }

  confirmDecision(): void {
    if (!this.decisionTarget || !this.decisionMode) return;

    const poNo = this.decisionTarget.id;
    const newStatus = this.decisionMode === 'approve' ? 'Released' : 'Closed';
    this.poDataService.updateStatus(poNo, newStatus);

    if (this.decisionMode === 'approve') {
      this.poDataService.incrementApprovedToday();
    } else {
      this.poDataService.incrementRejectedToday();
    }

    this.closeDecision();
  }

  // Jump back to the Customer PO ledger with this record already open.
  onViewRequest(req: ApprovalRequest): void {
    this.router.navigate(['/transaction/customer-po'], { queryParams: { po: req.id } });
  }

  trackByRequestId(index: number, req: ApprovalRequest): string {
    return req.id;
  }
}