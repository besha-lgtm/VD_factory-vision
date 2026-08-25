import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsAndDashboardsComponent } from './reports-and-dashboards.component';

describe('ReportsAndDashboardsComponent', () => {
  let component: ReportsAndDashboardsComponent;
  let fixture: ComponentFixture<ReportsAndDashboardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ReportsAndDashboardsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReportsAndDashboardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
