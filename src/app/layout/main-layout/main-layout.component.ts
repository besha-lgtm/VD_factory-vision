import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: false,
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css'
})
export class MainLayoutComponent {
constructor(private router: Router) {}

handleAddNew() {

  const url = this.router.url;

  switch (url) {

    case '/admin/users':
      console.log('Open Add User Modal');
      // open modal OR navigate
      break;

    case '/admin/roles':
      console.log('Open Add Role Modal');
      break;

    case '/project-layout/project-list':
      console.log('Go to Add Project page');
      this.router.navigate(['/project-layout/add-project']);
      break;

    case '/master/customer':
      console.log('Open Add Customer Modal');
      break;

    default:
      console.log('No action defined');
  }
}}
