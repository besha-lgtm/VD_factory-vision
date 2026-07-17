import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { MainMenuComponent } from './pages/main-menu/main-menu.component';
import { HeaderComponent } from './layout/header/header.component';
import { HomeComponent } from './pages/home/home.component';
import { ProductsComponent } from './pages/products/products.component';


const routes: Routes = [
  // ✅ Redirect FIRST
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // ✅ Login (public)
  { path: 'login', component: LoginComponent },

  // ✅ Main Menu (standalone)
  { path: 'main-menu', component: MainMenuComponent },

  // ✅ Home
  { path: 'home', component: HomeComponent },

  // ✅ Product
  { path: 'products', component: ProductsComponent },

  // ✅ Header
  { path: 'header', component: HeaderComponent }

  
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}