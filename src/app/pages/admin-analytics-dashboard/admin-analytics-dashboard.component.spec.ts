import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAnalyticsDashboardComponent } from './admin-analytics-dashboard.component';

describe('AdminAnalyticsDashboardComponent', () => {
  let component: AdminAnalyticsDashboardComponent;
  let fixture: ComponentFixture<AdminAnalyticsDashboardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminAnalyticsDashboardComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AdminAnalyticsDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
