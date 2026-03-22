export const APP_VERSION = {
  major: 1, // Features grandes / Cambios estructurales
  minor: 3, // Features pequeñas / Nuevas funcionalidades
  patch: 3, // Defectos (Bugs) / Mejoras menores
  get full() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
};