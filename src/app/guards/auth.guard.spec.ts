import { TestBed } from '@angular/core/testing';
import { authGuard } from './auth.guard';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

describe('AuthGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['parseUrl']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser']);

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });
  });

  it('debería permitir el acceso si hay usuario activo', () => {
    // Simulamos que SÍ hay usuario
    authServiceSpy.getCurrentUser.and.returnValue({
      userId: 1,
      workerId: 1,
      fullName: 'Test User',
      position: 'ADMIN',
      shift: 'Matutino',
      hasSeenSupportAnnouncement: true
    });

    const result = TestBed.runInInjectionContext(() => {
      return authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBeTrue();
  });

  it('debería bloquear el acceso y redirigir al login si no hay usuario', () => {
    // Simulamos que NO hay usuario
    authServiceSpy.getCurrentUser.and.returnValue(null);
    const mockUrlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(mockUrlTree);

    const result = TestBed.runInInjectionContext(() => {
      return authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
    });

    expect(result).toBe(mockUrlTree);
    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/');
  });
});
