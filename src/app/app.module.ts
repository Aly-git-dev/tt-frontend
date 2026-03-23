import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { LoginComponent } from './pages/login/login.component';
import { ProfileComponent } from './pages/profile/profile.component';

import { AuthInterceptor } from './core/interceptors/auth.interceptor';
import { RegisterComponent } from './pages/register/register.component';
import { AdminApprovalsComponent } from './pages/admin-approvals-component/admin-approvals-component.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ThreadDetailComponent } from './pages/thread-detail/thread-detail.component';
import { NewThreadComponent } from './pages/new-thread/new-thread.component';
import { SafeUrlPipe } from './pipe/safe-url.pipe';
import { AdminReportListComponent } from './pages/admin-report-list/admin-report-list.component';
import { AdminBannedUsersComponent } from './pages/admin-banned-users/admin-banned-users.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { CommonModule } from '@angular/common';
import { VideoMeetingRoomComponentComponent } from './pages/video-meeting-room.component/video-meeting-room.component.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    ProfileComponent,
    RegisterComponent,
    AdminApprovalsComponent,
    MainLayoutComponent,
    DashboardComponent,
    ThreadDetailComponent,
    NewThreadComponent,
    SafeUrlPipe,
    AdminReportListComponent,
    AdminBannedUsersComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    VideoMeetingRoomComponentComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,          
    AppRoutingModule,
    CommonModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: AuthInterceptor,
      multi: true
    },
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
