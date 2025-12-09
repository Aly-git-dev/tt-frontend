import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminBannedUsersComponent } from './admin-banned-users.component';

describe('AdminBannedUsersComponent', () => {
  let component: AdminBannedUsersComponent;
  let fixture: ComponentFixture<AdminBannedUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminBannedUsersComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminBannedUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
