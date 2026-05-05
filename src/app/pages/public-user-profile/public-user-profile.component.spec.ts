import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PublicUserProfileComponent } from './public-user-profile.component';

describe('PublicUserProfileComponent', () => {
  let component: PublicUserProfileComponent;
  let fixture: ComponentFixture<PublicUserProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PublicUserProfileComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PublicUserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
