import { NgModule, isDevMode } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { LoginComponent } from './pages/login/login.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { RegisterComponent } from './pages/register/register.component';
import { AdminApprovalsComponent } from './pages/admin-approvals-component/admin-approvals-component.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ThreadDetailComponent } from './pages/thread-detail/thread-detail.component';
import { NewThreadComponent } from './pages/new-thread/new-thread.component';
import { SafeUrlPipe } from './pipe/safe-url.pipe';
import { AdminReportListComponent } from './pages/admin-report-list/admin-report-list.component';
import { AdminBannedUsersComponent } from './pages/admin-banned-users/admin-banned-users.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { VideoMeetingRoomComponent } from './pages/video-meeting-room.component/video-meeting-room.component.component';
import { ResendVerificationComponent } from './pages/resend-verification/resend-verification.component';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';

import { TeacherEvaluationFormComponent } from './pages/teacher-evaluation-form/teacher-evaluation-form.component';
import { NotificationBellComponent } from './pages/shared/components/notification-bell/notification-bell.component';
import { MatIconModule } from '@angular/material/icon';
import { ServiceWorkerModule } from '@angular/service-worker';
import { PublicUserProfileComponent } from './pages/public-user-profile/public-user-profile.component';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProfileComponent,
    RegisterComponent,
    AdminApprovalsComponent,
    MainLayoutComponent,
    ThreadDetailComponent,
    NewThreadComponent,
    SafeUrlPipe,
    AdminReportListComponent,
    AdminBannedUsersComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    ResendVerificationComponent,
    VideoMeetingRoomComponent,
    NotificationBellComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    CommonModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    MatIconModule,
    
    TeacherEvaluationFormComponent,
    PublicUserProfileComponent,

    ServiceWorkerModule.register('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000'
    })
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
