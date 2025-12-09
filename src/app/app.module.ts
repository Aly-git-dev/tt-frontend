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
    AdminBannedUsersComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,          
    AppRoutingModule
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
