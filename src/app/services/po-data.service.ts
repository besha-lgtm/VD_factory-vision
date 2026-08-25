import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PurchaseOrder } from '../models/po.models';

/**
 * po-data.service
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for purchase orders, shared between
 * CustomerPoComponent (/transaction/customer-po) and
 * PoApprovalsComponent (/transaction/po-approval).
 *
 * Since the two screens are now separate ROUTES rather than
 * parent/child, they can't pass data through @Input/@Output
 * anymore — both inject this service instead and subscribe
 * to the same observable.
 */
@Injectable({ providedIn: 'root' })
export class PoDataService {

  private purchaseOrdersSubject = new BehaviorSubject<PurchaseOrder[]>([]);
  purchaseOrders$ = this.purchaseOrdersSubject.asObservable();

  private approvedTodaySubject = new BehaviorSubject<number>(0);
  approvedToday$ = this.approvedTodaySubject.asObservable();

  private rejectedTodaySubject = new BehaviorSubject<number>(0);
  rejectedToday$ = this.rejectedTodaySubject.asObservable();

  get purchaseOrders(): PurchaseOrder[] {
    return this.purchaseOrdersSubject.value;
  }

  /** Used once on app start / mock data load. */
  setPurchaseOrders(list: PurchaseOrder[]): void {
    this.purchaseOrdersSubject.next(list);
  }

  addPurchaseOrder(po: PurchaseOrder): void {
    this.purchaseOrdersSubject.next([...this.purchaseOrders, po]);
  }

  updatePurchaseOrder(po: PurchaseOrder): void {
    const idx = this.purchaseOrders.findIndex(p => p.poNo === po.poNo);
    if (idx === -1) return;
    const updated = [...this.purchaseOrders];
    updated[idx] = po;
    this.purchaseOrdersSubject.next(updated);
  }

  updateStatus(poNo: string, status: string): void {
    const idx = this.purchaseOrders.findIndex(p => p.poNo === poNo);
    if (idx === -1) return;
    const updated = [...this.purchaseOrders];
    updated[idx] = { ...updated[idx], status };
    this.purchaseOrdersSubject.next(updated);
  }

  removePurchaseOrder(poNo: string): void {
    this.purchaseOrdersSubject.next(this.purchaseOrders.filter(p => p.poNo !== poNo));
  }

  incrementApprovedToday(): void {
    this.approvedTodaySubject.next(this.approvedTodaySubject.value + 1);
  }

  incrementRejectedToday(): void {
    this.rejectedTodaySubject.next(this.rejectedTodaySubject.value + 1);
  }
}