import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class LoginService {

  private _isLoggedIn = new BehaviorSubject<boolean>(this.hasToken());
  isLoggedIn$ = this._isLoggedIn.asObservable();

  constructor(private http: HttpClient) {}

  private hasToken(): boolean {
    return !!sessionStorage.getItem('token');
  }

  login(values: any): Observable<any> {
    if (values && values.email === 'admin@gmail.com' && values.password === 'admin@123') {
      sessionStorage.setItem('token', 'static-admin-token');
      this._isLoggedIn.next(true);
      return of({ token: 'static-admin-token' });
    }
    return of({ error: 'Invalid email or password' });
  }

  logout(): void {
    sessionStorage.removeItem('token');
    this._isLoggedIn.next(false);
  }

  token() {
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + sessionStorage.getItem('token'),
      }),
    };
  }

  isLoggedInSync(): boolean {
    return this._isLoggedIn.value;
  }
}