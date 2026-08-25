import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ItemPmsMasterComponent } from './item-pms-master.component';

describe('ItemPmsMasterComponent', () => {
  let component: ItemPmsMasterComponent;
  let fixture: ComponentFixture<ItemPmsMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ItemPmsMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemPmsMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
