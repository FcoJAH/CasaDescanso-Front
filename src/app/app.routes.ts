import { Routes } from '@angular/router';

export const routes: Routes = [
  // LOGIN
  {
    path: '',
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent)
  },

  // LAYOUT PADRE con todas las páginas internas
  {
    path: '',
    loadComponent: () =>
      import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'checkin-out',
        loadComponent: () =>
          import('./pages/checkin-out/checkin-out.component').then(m => m.CheckInOutComponent)
      },
      // SECCIÓN EMPLEADOS
      {
        path: 'empleados',
        loadComponent: () =>
          import('./pages/empleados/empleados.component').then(m => m.EmpleadosComponent),
        children: [
          {
            path: 'registro',
            loadComponent: () => import('./pages/empleados/registro/registro-empleado.component').then(m => m.RegistrarEmpleadoComponent)
          },
          {
            path: 'ver-empleados',
            loadComponent: () => import('./pages/empleados/ver-empleados/ver-empleados.component').then(m => m.VerEmpleadosComponent)
          },
          {
            path: 'desactivar',
            loadComponent: () => import('./pages/empleados/desactivar/desactivar-empleado.component').then(m => m.DesactivarEmpleadoComponent)
          },
          {
            path: 'activar',
            loadComponent: () => import('./pages/empleados/activar/activar-empleado.component').then(m => m.ActivarEmpleadoComponent)
          },
          {
            path: 'modificar',
            loadComponent: () => import('./pages/empleados/modificar/modificar-empleado.component').then(m => m.ModificarEmpleadoComponent)
          }
        ]
      },

      // SECCIÓN RESIDENTES
      {
        path: 'residentes',
        loadComponent: () =>
          import('./pages/residentes/residentes.component').then(m => m.ResidentesComponent),
        children: [
          {
            path: 'registro',
            loadComponent: () => import('./pages/residentes/registro/registro-residente.component').then(m => m.RegistrarResidenteComponent)
          },
          {
            path: 'activar',
            loadComponent: () => import('./pages/residentes/activar/activar-residente.component').then(m => m.ActivarResidenteComponent)
          },
          {
            path: 'desactivar',
            loadComponent: () => import('./pages/residentes/desactivar/desactivar-residente.component').then(m => m.DesactivarResidenteComponent)
          },
          {
            path: 'ver-residentes',
            loadComponent: () => import('./pages/residentes/ver-residentes/ver-residentes.component').then(m => m.VerResidentesComponent)
          }, {
            path: 'modificar',
            loadComponent: () => import('./pages/residentes/modificar/modificar-residente.component').then(m => m.ModificarResidenteComponent)
          }
        ]
      },

      // Seccion de horarios
      {
        path: 'horarios',
        loadComponent: () =>
          import('./pages/shift/shift.component').then(m => m.ShiftComponent),
        children: [
          {
            path: 'crear',
            loadComponent: () => import('./pages/shift/crear-turno/crear-turno.component').then(m => m.CrearTurnoComponent)
          },
          {
            path: 'modificar',
            loadComponent: () => import('./pages/shift/modificar/modificar.component').then(m => m.ModificarComponent)
          },
          {
            path: 'eliminar',
            loadComponent: () => import('./pages/shift/eliminar/eliminar.component').then(m => m.EliminarComponent)
          },
          {
            path: 'ver-turnos',
            loadComponent: () => import('./pages/shift/ver-turnos/ver-turnos.component').then(m => m.VerTurnosComponent)
          }
        ]
      },

      // Seccion de roles
      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles.component').then(m => m.RolesComponent),
        children: [
          {
            path: 'crear-rol',
            loadComponent: () => import('./pages/roles/crear-rol/crear-rol.component').then(m => m.CrearRolComponent)
          },
          {
            path: 'modificar-rol',
            loadComponent: () => import('./pages/roles/modificar-rol/modificar-rol.component').then(m => m.ModificarRolComponent)
          },
          {
            path: 'eliminar-rol',
            loadComponent: () => import('./pages/roles/eliminar-rol/eliminar-rol.component').then(m => m.EliminarRolComponent)
          },
          {
            path: 'ver-roles',
            loadComponent: () => import('./pages/roles/ver-roles/ver-roles.component').then(m => m.VerRolesComponent)
          }
        ]
      },

      {
        path: 'signos-vitales',
        loadComponent: () =>
          import('./pages/signos-vitales/registro/registro-signos.component').then(m => m.RegistroSignosComponent),
      },

      {
        path: 'reporte-signos',
        loadComponent: () =>
          import('./pages/reporte-signos/reporte-signos.component').then(m => m.ReporteSignosComponent),
      },

      //Sección de historial de checks
      {
        path: 'check-history',
        loadComponent: () =>
          import('./pages/check-history/check-history.component').then(m => m.CheckHistoryComponent)
      },

      // Seccion de roles
      {
        path: 'incidents',
        loadComponent: () =>
          import('./pages/incidents/incidents.component').then(m => m.IncidentsComponent),
        children: [
          {
            path: 'crear-incidencia',
            loadComponent: () => import('./pages/incidents/create/create-incident.component').then(m => m.CrearIncidenciaComponent)
          },
          {
            path: 'ver-incidencias',
            loadComponent: () => import('./pages/incidents/view-incidents/view-incidents.component').then(m => m.ViewIncidentsComponent)
          }
        ]
      },
      {
        path: 'resident-history',
        loadComponent: () =>
          import('./pages/resident-history/resident-history.component').then(m => m.ResidentHistoryComponent),
      },
      {
        path: 'resident-profile/:id',
        loadComponent: () => import('./pages/resident-history/resident-profile/resident-profile.component').then(m => m.ResidentProfileComponent)
      }
    ]
  },

  // Redirección a login para cualquier ruta desconocida
  { path: '**', redirectTo: '' }
];
