import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminReportListComponent } from './admin-report-list.component';

describe('AdminReportListComponent', () => {
  let component: AdminReportListComponent;
  let fixture: ComponentFixture<AdminReportListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminReportListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminReportListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
