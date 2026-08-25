import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { LoginService } from './login.service';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  loginForm: FormGroup;
  loading = false;
  errorMsg = '';
  showPassword = false;

  // View Navigation State
  currentView: 'login' | 'forgot-password' | 'verify-otp' | 'reset-password' | 'reset-success' = 'login';
  
  // Forgot Password Data Bindings
  forgotEmail = '';
  otpCode = '';
  newPassword = '';
  confirmPassword = '';
  
  showNewPassword = false;
  showConfirmPassword = false;
  
  successMsg = '';
  generatedOtp = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private loginService: LoginService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  switchView(view: 'login' | 'forgot-password' | 'verify-otp' | 'reset-password' | 'reset-success') {
    this.currentView = view;
    this.errorMsg = '';
    this.successMsg = '';
    this.loading = false;
    
    // Reset temporary states
    if (view === 'login') {
      this.forgotEmail = '';
      this.otpCode = '';
      this.newPassword = '';
      this.confirmPassword = '';
      this.generatedOtp = '';
    }
  }

  sendOtp() {
    if (!this.forgotEmail || !this.forgotEmail.includes('@')) {
      this.errorMsg = 'Please enter a valid email address';
      return;
    }

    if (this.forgotEmail !== 'admin@gmail.com' && this.forgotEmail !== 'user@gmail.com') {
      this.errorMsg = 'Email address not registered in the system';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    setTimeout(() => {
      // Generate a dynamic demo OTP
      this.generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      this.loading = false;
      this.successMsg = `OTP sent successfully! Enter the code: ${this.generatedOtp}`;
      this.currentView = 'verify-otp';
    }, 1200);
  }

  verifyOtp() {
    if (!this.otpCode || this.otpCode.length !== 6) {
      this.errorMsg = 'Please enter a 6-digit OTP code';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    setTimeout(() => {
      if (this.otpCode === this.generatedOtp || this.otpCode === '123456') {
        this.loading = false;
        this.currentView = 'reset-password';
      } else {
        this.loading = false;
        this.errorMsg = 'Invalid OTP code. Please try again.';
      }
    }, 1000);
  }

  resetPassword() {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.errorMsg = 'New password must be at least 6 characters long';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMsg = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    setTimeout(() => {
      if (this.forgotEmail === 'admin@gmail.com') {
        sessionStorage.setItem('adminPassword', this.newPassword);
      } else if (this.forgotEmail === 'user@gmail.com') {
        sessionStorage.setItem('userPassword', this.newPassword);
      }

      this.loading = false;
      this.currentView = 'reset-success';
    }, 1200);
  }

  onLogin() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    const { email, password } = this.loginForm.value;
    const adminPassword = sessionStorage.getItem('adminPassword') || 'admin@123';
    const userPassword = sessionStorage.getItem('userPassword') || 'user@123';

    // Simulate login delay for a premium feel
    setTimeout(() => {
      if (email === 'admin@gmail.com' && password === adminPassword) {
        sessionStorage.setItem('token', 'static-admin-token');
        sessionStorage.setItem('userRole', 'Admin');
        // Update auth state in service by bypassing private property constraints
        (this.loginService as any)._isLoggedIn.next(true);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      } else if (email === 'user@gmail.com' && password === userPassword) {
        sessionStorage.setItem('token', 'static-user-token');
        sessionStorage.setItem('userRole', 'User');
        // Update auth state in service by bypassing private property constraints
        (this.loginService as any)._isLoggedIn.next(true);
        this.loading = false;
        this.router.navigate(['/dashboard']);
      } else {
        this.loading = false;
        this.errorMsg = 'Invalid email or password';
      }
    }, 1000);
  }
}