export const environment = {
  production: true,
  // Esta línea le dice a Angular: "Usa la variable que pusiste en Vercel"
  apiUrl: (window as any)["env"]?.["NG_APP_API_URL"] || "https://casa-descanso-back.onrender.com/api"
};