import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { AuthGuard } from './core/guards/auth.guard';
import { RegisterComponent } from './pages/register/register.component';
import { AdminGuard } from './core/guards/admin.guard';
import { AdminApprovalsComponent } from './pages/admin-approvals-component/admin-approvals-component.component';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ThreadDetailComponent } from './pages/thread-detail/thread-detail.component';
import { NewThreadComponent } from './pages/new-thread/new-thread.component';
import { AdminReportListComponent } from './pages/admin-report-list/admin-report-list.component';
import { AdminBannedUsersComponent } from './pages/admin-banned-users/admin-banned-users.component';
import { MessagesPageComponent } from './pages/messages-page/messages-page.component';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { VideoMeetingRoomComponent } from './pages/video-meeting-room.component/video-meeting-room.component.component';
import { AdminAnalyticsDashboardComponent } from './pages/admin-analytics-dashboard/admin-analytics-dashboard.component';
import { TeacherAnalyticsDetailComponent } from './pages/teacher-analytics-detail/teacher-analytics-detail.component';
import { TeacherEvaluationFormComponent } from './pages/teacher-evaluation-form/teacher-evaluation-form.component';
import { PublicUserProfileComponent } from './pages/public-user-profile/public-user-profile.component';
import { ResendVerificationComponent } from './pages/resend-verification/resend-verification.component';
const routes: Routes = [
    // Páginas públicas (sin layout)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'forgot-password', component: ForgotPasswordComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: 'resend-verification', component: ResendVerificationComponent },

  // Páginas con layout principal
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      { path: 'dashboard', component: DashboardComponent },

      // Foros
      { path: 'forums/new', component: NewThreadComponent },
      { path: 'forums/:id', component: ThreadDetailComponent },

      // Perfil y admin
      { path: 'profile', component: ProfileComponent },
      // Perfil y admin
      { path: 'profile', component: ProfileComponent },
      { path: 'users/:id/profile', component: PublicUserProfileComponent },
      { path: 'admin/approvals', component: AdminApprovalsComponent },
      { path: 'admin/report/list', component: AdminReportListComponent },
      { path: 'admin/banned/users', component: AdminBannedUsersComponent },
      { path: 'teacher/evaluation', component: TeacherEvaluationFormComponent },

      {
        path: 'admin/message-reports',
            loadComponent: () =>
              import('./pages/admin-message-reports/admin-message-reports.component')
                .then(m => m.AdminMessageReportsComponent)
          },
          {
  path: 'admin/users',
  loadComponent: () =>
    import('./pages/admin-users/admin-users.component')
      .then(m => m.AdminUsersComponent)
},
      { path: 'messages', component: MessagesPageComponent },
      {path: 'calendar',
        loadComponent: () => import('./pages/calendar-page.component/calendar-page.component')
        .then(m => m.CalendarPageComponent)
      },


      // Default interno → dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'video-meetings/:id',
        component: VideoMeetingRoomComponent
      },
      {
        path: 'admin/analytics',
        component: AdminAnalyticsDashboardComponent
      },
      {
        path: 'admin/analytics/teachers/:teacherId',
        component: TeacherAnalyticsDetailComponent
      }
    ]
  },

  // Cualquier otra cosa → login
  { path: '**', redirectTo: 'login' }
];


@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
