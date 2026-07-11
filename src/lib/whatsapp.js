/**
 * Envía una notificación de WhatsApp al destinatario.
 * Si no está configurado el proveedor, registra el mensaje en consola.
 * 
 * @param {string} to - Número de teléfono (ej: +5491123456789)
 * @param {string} message - Mensaje a enviar
 */
export async function sendWhatsAppNotification(to, message) {
  console.log(`[WhatsApp Outbox] Enviando mensaje a ${to}: "${message}"`);
  
  const providerUrl = process.env.WHATSAPP_API_URL;
  const token = process.env.WHATSAPP_API_TOKEN;
  
  if (!providerUrl || !token) {
    console.warn("WhatsApp API no configurada. Mensaje simulado en consola.");
    return { success: true, simulated: true };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(providerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ to, message }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return { success: response.ok, status: response.status };
  } catch (error) {
    console.error("Error enviando notificación de WhatsApp:", error);
    return { success: false, error };
  }
}
