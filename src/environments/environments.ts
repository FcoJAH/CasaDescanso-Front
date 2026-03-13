export const environment = {
  production: false,
  // Detecta automáticamente la IP de tu PC actual
  apiUrl: (window as any)["env"]?.["NG_APP_API_URL"] || "https://casa-descanso-back.onrender.com/api"
  //apiUrl: `http://localhost:5195/api`
};