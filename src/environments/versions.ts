export const APP_VERSION = {
  major: 2, // Features grandes / Cambios estructurales
  minor: 6, // Features pequeñas / Nuevas funcionalidades
  patch: 0, // Defectos (Bugs) / Mejoras menores
  get full() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
};