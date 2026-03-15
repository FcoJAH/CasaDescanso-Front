export default async function handler(req, res) {
  try {
    // Esto despierta a Render y, por consecuencia, a Aiven
    const response = await fetch('https://casa-descanso-back.onrender.com/api/Dashboard');
    
    return res.status(200).json({ 
      status: 'pushed', 
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    return res.status(500).json({ error: 'Falló el despertar' });
  }
}