export const APP_VERSION = {
  major: 3, // Features grandes / Cambios estructurales
  minor: 2, // Features pequeñas / Nuevas funcionalidades
  patch: 0, // Defectos (Bugs) / Mejoras menores
  get full() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
};