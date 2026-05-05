import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminMessageReportsComponent } from './admin-message-reports.component';

describe('AdminMessageReportsComponent', () => {
  let component: AdminMessageReportsComponent;
  let fixture: ComponentFixture<AdminMessageReportsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminMessageReportsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminMessageReportsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
