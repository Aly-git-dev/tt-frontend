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

const routes: Routes = [
    // Páginas públicas (sin layout)
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

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
      { path: 'admin/approvals', component: AdminApprovalsComponent },
      { path: 'admin/report/list', component: AdminReportListComponent },
      { path: 'admin/banned/users', component: AdminBannedUsersComponent },

      // Default interno → dashboard
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
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
