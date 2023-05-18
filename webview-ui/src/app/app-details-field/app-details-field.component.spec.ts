import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppDetailsFieldComponent } from './app-details-field.component';

describe('AppDetailsFieldComponent', () => {
  let component: AppDetailsFieldComponent;
  let fixture: ComponentFixture<AppDetailsFieldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ AppDetailsFieldComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppDetailsFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
