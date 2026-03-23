import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VideoMeetingRoomComponentComponent } from './video-meeting-room.component.component';

describe('VideoMeetingRoomComponentComponent', () => {
  let component: VideoMeetingRoomComponentComponent;
  let fixture: ComponentFixture<VideoMeetingRoomComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [VideoMeetingRoomComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(VideoMeetingRoomComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
