import { SendVaccinationReminderOptions } from '../interfaces/mail-options.interface';

export function renderVaccinationReminderTemplate(
  data: SendVaccinationReminderOptions,
): { subject: string; html: string; text: string } {
  const subject = `🐾 Recordatorio de ${data.vaccinationType}: ${data.vaccinationName} para ${data.petName} - Huellas del Valle`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f4f6f8;
      color: #333333;
    }
    .container {
      max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    }
    .header {
      background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%);
      color: #ffffff;
      padding: 30px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 8px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .badge {
      display: inline-block;
      margin-top: 14px;
      background-color: rgba(255, 255, 255, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.4);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .content {
      padding: 30px 24px;
    }
    .greeting {
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 20px;
    }
    .card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 18px 20px;
      margin-bottom: 24px;
    }
    .card-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f766e;
      text-transform: uppercase;
      margin-top: 0;
      margin-bottom: 12px;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
    }
    .table-details {
      width: 100%;
      border-collapse: collapse;
      font-size: 14px;
    }
    .table-details td {
      padding: 8px 0;
      vertical-align: top;
    }
    .table-details td.label {
      color: #64748b;
      width: 45%;
      font-weight: 500;
    }
    .table-details td.value {
      color: #1e293b;
      font-weight: 600;
    }
    .alert-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 13px;
      line-height: 1.5;
      color: #92400e;
      margin-bottom: 24px;
    }
    .btn-container {
      text-align: center;
      margin: 28px 0 10px 0;
    }
    .btn {
      display: inline-block;
      background-color: #0d9488;
      color: #ffffff !important;
      text-decoration: none;
      padding: 12px 28px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(13, 148, 136, 0.3);
    }
    .footer {
      background-color: #f1f5f9;
      color: #64748b;
      font-size: 12px;
      line-height: 1.6;
      text-align: center;
      padding: 20px 24px;
      border-top: 1px solid #e2e8f0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Huellas del Valle</h1>
      <p>Centro Médico Veterinario & Gestión Clínica</p>
      <div class="badge">Aviso de Refuerzo Preventivo</div>
    </div>
    <div class="content">
      <div class="greeting">
        <p>Estimado(a) <strong>${data.ownerName}</strong>,</p>
        <p>En <strong>Huellas del Valle</strong> nos preocupamos por la salud y bienestar de su mascota. Le informamos que se aproxima la fecha límite para el refuerzo del esquema de inmunización de <strong>${data.petName}</strong>.</p>
      </div>

      <div class="card">
        <div class="card-title">Detalles del Plan de Inmunización</div>
        <table class="table-details">
          <tr>
            <td class="label">Mascota:</td>
            <td class="value">${data.petName} (${data.species})</td>
          </tr>
          <tr>
            <td class="label">Código de Paciente:</td>
            <td class="value">${data.petCode}</td>
          </tr>
          <tr>
            <td class="label">Tipo de Tratamiento:</td>
            <td class="value">${data.vaccinationType}</td>
          </tr>
          <tr>
            <td class="label">Biológico / Producto:</td>
            <td class="value">${data.vaccinationName}</td>
          </tr>
          <tr>
            <td class="label">Número de Lote:</td>
            <td class="value">${data.batchNumber}</td>
          </tr>
          <tr>
            <td class="label">Última Aplicación:</td>
            <td class="value">${data.applicationDate}</td>
          </tr>
          <tr>
            <td class="label" style="color: #b91c1c;">Próximo Refuerzo (Límite):</td>
            <td class="value" style="color: #b91c1c; font-size: 15px;">${data.nextDueDate}</td>
          </tr>
        </table>
      </div>

      <div class="alert-box">
        <strong>⚠️ Importancia del Refuerzo:</strong> La administración puntual de vacunas y desparasitaciones garantiza la protección inmunológica continua de su mascota y previene el contagio de patógenos de alto riesgo.
      </div>

      <p style="font-size: 14px; line-height: 1.5; color: #475569;">
        Por favor agende una cita con nuestro equipo médico veterinario para realizar la aplicación y mantener el carnet de salud al día.
      </p>

      <div class="btn-container">
        <a href="mailto:citas@huellasdelvalle.com?subject=Cita%20Refuerzo%20${encodeURIComponent(data.petName)}" class="btn">Solicitar Cita de Inmunización</a>
      </div>
    </div>
    <div class="footer">
      <p><strong>Clínica Veterinaria Huellas del Valle</strong><br>
      Comprometidos con el cuidado ético y profesional de tus compañeros de vida.<br>
      <em>Este correo es un mensaje automático generado por el sistema de control veterinario.</em></p>
    </div>
  </div>
</body>
</html>`;

  const text = `HUELLAS DEL VALLE - RECORDATORIO DE INMUNIZACIÓN
--------------------------------------------------
Estimado(a) ${data.ownerName},

Le recordamos que se aproxima la fecha límite para el refuerzo del esquema preventivo de su mascota ${data.petName}.

Detalles:
- Mascota: ${data.petName} (${data.species} - Código: ${data.petCode})
- Tipo: ${data.vaccinationType}
- Biológico: ${data.vaccinationName}
- Lote: ${data.batchNumber}
- Última Aplicación: ${data.applicationDate}
- Fecha Límite de Próximo Refuerzo: ${data.nextDueDate}

Por favor comuníquese con Huellas del Valle para agendar su cita médica.

Atentamente,
Clínica Veterinaria Huellas del Valle`;

  return { subject, html, text };
}
