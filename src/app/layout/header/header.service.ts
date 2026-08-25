import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
export interface BreadcrumbItem {
  label: string;
  routerLink?: string;
}

// export interface HeaderConfig {
//   title: string;
//   breadcrumbs: BreadcrumbItem[];
//   showAddButton: boolean;
//   addButtonLabel: string;
//   showFilter: boolean;
// }
export interface HeaderConfig {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  showAddButton: boolean;
  addButtonLabel: string;
  showFilter: boolean;
}

// ─── Route → Header config map ───────────────────────────────────────────────
// Add every route your app uses here.
// Key = exact routerLink path (match what's in sidebar <a routerLink="...">)
const ROUTE_CONFIG: Record<string, HeaderConfig> = {
  '/login': {
  title: 'Login',
  breadcrumbs: [
    { label: 'Authentication' },
    { label: 'Login' }
  ],
  showAddButton: false,
  addButtonLabel: '',
  showFilter: false
},

  '/dashboard': {
    title: 'Dashboard',
    breadcrumbs: [{ label: 'Overview' }, { label: 'Dashboard' }],
    showAddButton: false,
    addButtonLabel: '+ Add New',
    showFilter: false,
  },

  // ── Transaction Modules ────────────────────────────────────────────────────
  '/transaction/customer-po': {
    title: 'Customer PO',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Customer PO' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/daily-jobs': {
    title: 'Daily Jobs',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Daily Jobs' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/stock-verification': {
    title: 'Stock Verification',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Stock Verification' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/production-planning': {
    title: 'Production Planning',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Production Planning' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/production-execution': {
    title: 'Production Execution',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Production Execution' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/qc-management': {
    title: 'QC Management',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'QC Management' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/finished-goods': {
    title: 'Finished Goods',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Finished Goods' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/dispatch': {
    title: 'Dispatch',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Dispatch' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
  '/transaction/invoice': {
    title: 'Invoice',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Transaction Modules' },
      { label: 'Invoice' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },

  // ── Master ─────────────────────────────────────────────────────────────────
  '/master/users-and-roles': {
    title: 'Users & Roles',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Master Modules' },
      { label: 'Users & Roles' },
    ],
    showAddButton: false,
    addButtonLabel: '+ Add User',
    showFilter: false
  },
  '/master/customer-master': {
    title: 'Customer Master',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Master Modules' },
      { label: 'Customer Master' },
    ],
    showAddButton: false,
    addButtonLabel: '+ Add Customer',
    showFilter: false
  },
  '/master/supplier-master': {
    title: 'Supplier Master',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Master Modules' },
      { label: 'Supplier Master' },
    ],
    showAddButton: false,
    addButtonLabel: '+ Add Supplier',
    showFilter: false
  },
  '/master/item-pms-master': {
    title: 'Item / PMS Master',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Master Modules' },
      { label: 'Item / PMS Master' },
    ],
    showAddButton: false,
    addButtonLabel: '+ Add Item',
    showFilter: false
  },
  '/master/layer-specs': {
    title: 'Layer Specs',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Master Modules' },
      { label: 'Layer Specs' },
    ],
    showAddButton: false,
    addButtonLabel: '+ Add Layer Spec',
    showFilter: false
  },
  '/master/employee-master': {
    title: 'Employee Master',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Master Modules' },
      { label: 'Employee Master' },
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },

  // ── Reports ────────────────────────────────────────────────────────────────
  '/reports/reports-and-dashboards': {
    title: 'Reports & Dashboards',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Reports' },
      { label: 'Reports & Dashboards' },
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false,
  },
  '/machine/machine-master': {
    title: 'Machine Master',
    breadcrumbs: [
      { label: 'Overview' },
      { label: 'Machine' },
      { label: 'Machine Master' }
    ],
    showAddButton: false,
    addButtonLabel: '',
    showFilter: false
  },
};

const DEFAULT_CONFIG: HeaderConfig = {
  title: 'Dashboard',
  breadcrumbs: [{ label: 'Overview' }, { label: 'Dashboard' }],
  showAddButton: false,
  addButtonLabel: '+ Add New',
  showFilter: false,
};
// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class HeaderService {

  private headerConfig = new BehaviorSubject<HeaderConfig>({ ...DEFAULT_CONFIG });
  headerConfig$ = this.headerConfig.asObservable();

  constructor(private router: Router) {
    // Listen to every completed navigation and auto-update header
    this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
     .subscribe((e: any) => {
  let url = e.urlAfterRedirects?.split('?')[0] || '';

  // ✅ Handle empty route
  if (!url || url === '/') {
    url = '/login';
  }

  const config = ROUTE_CONFIG[url] ?? DEFAULT_CONFIG;
  this.headerConfig.next({ ...config });
});
      
  }

  private selectedPlantSubject = new BehaviorSubject<string>('VISIPAK - Plant 1');
  selectedPlant$ = this.selectedPlantSubject.asObservable();

  changePlant(plant: string): void {
    this.selectedPlantSubject.next(plant);
  }

  /** Manual override — use when you need a one-off config not tied to a route */
  setPage(title: string, breadcrumbs: BreadcrumbItem[], options?: Partial<HeaderConfig>): void {
    this.headerConfig.next({ ...DEFAULT_CONFIG, title, breadcrumbs, ...(options || {}) });
  }
}