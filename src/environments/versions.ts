export const APP_VERSION = {
  major: 1, // Features grandes / Cambios estructurales
  minor: 1, // Features pequeñas / Nuevas funcionalidades
  patch: 0, // Defectos (Bugs) / Mejoras menores
  get full() {
    return `${this.major}.${this.minor}.${this.patch}`;
  }
};