import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherAnalyticsDetailComponent } from './teacher-analytics-detail.component';

describe('TeacherAnalyticsDetailComponent', () => {
  let component: TeacherAnalyticsDetailComponent;
  let fixture: ComponentFixture<TeacherAnalyticsDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TeacherAnalyticsDetailComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TeacherAnalyticsDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
