import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { UsersAndRolesComponent } from './pages/master/users-and-roles/users-and-roles.component';
import { CustomerMasterComponent } from './pages/master/customer-master/customer-master.component';
import { SupplierMasterComponent } from './pages/master/supplier-master/supplier-master.component';
import { ItemPmsMasterComponent } from './pages/master/item-pms-master/item-pms-master.component';
import { LayerSpecsComponent } from './pages/master/layer-specs/layer-specs.component';

import { CustomerPoComponent } from './pages/transaction/customer-po/customer-po.component';
import { DailyJobsComponent } from './pages/transaction/daily-jobs/daily-jobs.component';
import { StockVerificationComponent } from './pages/transaction/stock-verification/stock-verification.component';
import { ProductionPlanningComponent } from './pages/transaction/production-planning/production-planning.component';
import { ProductionExecutionComponent } from './pages/transaction/production-execution/production-execution.component';
import { QcManagementComponent } from './pages/transaction/qc-management/qc-management.component';
import { FinishedGoodsComponent } from './pages/transaction/finished-goods/finished-goods.component';
import { DispatchComponent } from './pages/transaction/dispatch/dispatch.component';
import { MachineMasterComponent } from './pages/machine/machine-master/machine-master.component';

import { ReportsAndDashboardsComponent } from './pages/reports/reports-and-dashboards/reports-and-dashboards.component';
import { LoginComponent } from './login/login.component';
import { EmployeeMasterComponent } from './pages/master/employee-master/employee-master.component';
import { InvoiceComponent } from './pages/transaction/invoice/invoice.component';
import { PoApprovalsComponent } from './pages/transaction/po-approvals/po-approvals.component';
import { StagewiseQcManagementComponent } from './pages/transaction/stagewise-qc-management/stagewise-qc-management.component';
const routes: Routes = [

 
  // ✅ Redirect FIRST
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ✅ Login (public)
  { path: 'login', component: LoginComponent },

  // ✅ Protected layout
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: 'dashboard', component: DashboardComponent },

      {
        path: 'transaction/customer-po',
        component: CustomerPoComponent
      },
       {
        path: 'transaction/po-approval',
        component: PoApprovalsComponent
      },
      
      {
        path: 'transaction/daily-jobs',
        component: DailyJobsComponent
      },

      {
        path: 'transaction/stock-verification',
        component: StockVerificationComponent
      },

      {
        path: 'transaction/production-planning',
        component: ProductionPlanningComponent
      },

      {
        path: 'transaction/production-execution',
        component: ProductionExecutionComponent
      },
       
      {
        path: 'transaction/stagewise-qc-management',
        component: StagewiseQcManagementComponent
      },
      
      {
        path: 'transaction/qc-management',
        component: QcManagementComponent
      },

      {
        path: 'transaction/finished-goods',
        component: FinishedGoodsComponent
      },

      {
        path: 'transaction/dispatch',
        component: DispatchComponent
      },

       {
        path: 'transaction/invoice',
        component: InvoiceComponent
      },

       {
        path: 'master/employee-master',
        component: EmployeeMasterComponent
      },

      {
        path: 'master/users-and-roles',
        component: UsersAndRolesComponent
      },

      {
        path: 'master/customer-master',
        component: CustomerMasterComponent
      },

      {
        path: 'master/supplier-master',
        component: SupplierMasterComponent
      },

      {
        path: 'master/item-pms-master',
        component: ItemPmsMasterComponent
      },

      {
        path: 'master/layer-specs',
        component: LayerSpecsComponent
      },

      {
        path: 'reports/reports-and-dashboards',
        component: ReportsAndDashboardsComponent
      },

      {
        path: 'machine/machine-master',
        component: MachineMasterComponent
      }
    ]
  },


  
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}