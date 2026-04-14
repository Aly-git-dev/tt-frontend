import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TeacherEvaluationFormComponent } from './teacher-evaluation-form.component';

describe('TeacherEvaluationFormComponent', () => {
  let component: TeacherEvaluationFormComponent;
  let fixture: ComponentFixture<TeacherEvaluationFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TeacherEvaluationFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TeacherEvaluationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
