import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LayerSpecsComponent } from './layer-specs.component';

describe('LayerSpecsComponent', () => {
  let component: LayerSpecsComponent;
  let fixture: ComponentFixture<LayerSpecsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LayerSpecsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LayerSpecsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
