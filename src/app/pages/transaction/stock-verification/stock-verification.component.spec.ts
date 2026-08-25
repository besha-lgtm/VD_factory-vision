import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StockVerificationComponent } from './stock-verification.component';

describe('StockVerificationComponent', () => {
  let component: StockVerificationComponent;
  let fixture: ComponentFixture<StockVerificationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [StockVerificationComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StockVerificationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
