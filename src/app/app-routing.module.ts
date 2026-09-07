import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { FactoryMonitoringComponent } from './pages/factory-monitoring/factory-monitoring.component';


import { LoginComponent } from './login/login.component';
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

      { path: 'factory-monitoring', component: FactoryMonitoringComponent }
        
    ]
  },


  
];
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}