import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminApprovalsComponentComponent } from './admin-approvals-component.component';

describe('AdminApprovalsComponentComponent', () => {
  let component: AdminApprovalsComponentComponent;
  let fixture: ComponentFixture<AdminApprovalsComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminApprovalsComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminApprovalsComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
