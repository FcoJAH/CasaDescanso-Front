import { TestBed } from '@angular/core/testing';
import { adminGuard } from './admin.guard';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

describe('AdminGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'isAdmin']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
  });

  it('debería bloquear el acceso si no hay sesión y redirigir a /', () => {
    authServiceSpy.getCurrentUser.and.returnValue(null);
    const mockUrlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() => {
      return adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
  });

  it('debería bloquear el acceso si el usuario NO es ADMIN y redirigir a /dashboard', () => {
    authServiceSpy.getCurrentUser.and.returnValue({
      userId: 2, workerId: 2, fullName: 'Enfermera', position: 'ENFERMERO', shift: 'Matutino', hasSeenSupportAnnouncement: true
    });
    authServiceSpy.isAdmin.and.returnValue(false);
    
    const mockUrlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() => {
      return adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('debería permitir el acceso si el usuario es ADMIN', () => {
    authServiceSpy.getCurrentUser.and.returnValue({
      userId: 1, workerId: 1, fullName: 'Admin User', position: 'ADMIN', shift: 'Matutino', hasSeenSupportAnnouncement: true
    });
    authServiceSpy.isAdmin.and.returnValue(true);

    const result = TestBed.runInInjectionContext(() => {
      return adminGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBeTrue();
  });
});
