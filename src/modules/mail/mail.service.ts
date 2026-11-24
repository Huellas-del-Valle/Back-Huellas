import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import {
  MailSentResult,
  SendVaccinationReminderOptions,
} from './interfaces/mail-options.interface';
import { renderVaccinationReminderTemplate } from './templates/vaccination-reminder.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter;
  private isSimulatedMode = false;

  constructor(private readonly configService: ConfigService) {
    this.initializeTransporter();
  }

  private initializeTransporter(): void {
    const host = this.configService.get<string>('SMTP_HOST');
    const port = this.configService.get<number>('SMTP_PORT', 587);
    const user = this.configService.get<string>('SMTP_USER');
    const pass = this.configService.get<string>('SMTP_PASS') ||
      this.configService.get<string>('SMTP_PASSWORD');
    const secure =
      this.configService.get<string | boolean>('SMTP_SECURE') === true ||
      this.configService.get<string>('SMTP_SECURE') === 'true';
    const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

    // Si no hay credenciales SMTP explícitas o estamos en entorno test/local sin servidor SMTP dedicado,
    // activamos modo de transporte simulado (JSON / Stream) para evitar caídas o bloqueos de ejecución.
    if (!user || !pass || nodeEnv === 'test') {
      this.isSimulatedMode = true;
      this.transporter = nodemailer.createTransport({
        jsonTransport: true,
      });
      this.logger.log(
        'Modo simulado de correo activado (Nodemailer JSON Transport). Los correos se registrarán en consola y logs sin requerir servidor SMTP activo.',
      );
    } else {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
      this.logger.log(`Nodemailer configurado con host SMTP: ${host}:${port}`);
    }
  }

  /**
   * Permite sobreescribir el transportador (útil para pruebas unitarias)
   */
  setTransporter(transporter: Transporter, isSimulated = false): void {
    this.transporter = transporter;
    this.isSimulatedMode = isSimulated;
  }

  /**
   * Envía la plantilla de recordatorio de inmunización por correo electrónico
   */
  async sendVaccinationReminder(
    options: SendVaccinationReminderOptions,
  ): Promise<MailSentResult> {
    const fromAddress =
      this.configService.get<string>('SMTP_FROM') ||
      '"Huellas del Valle" <notificaciones@huellasdelvalle.com>';

    const { subject, html, text } = renderVaccinationReminderTemplate(options);

    try {
      const info = await this.transporter.sendMail({
        from: fromAddress,
        to: options.to,
        subject,
        text,
        html,
      });

      if (this.isSimulatedMode) {
        this.logger.log(
          `[SIMULATED MAIL] Correo despachado exitosamente a: ${options.to} | Mascota: ${options.petName} | Asunto: "${subject}"`,
        );
      } else {
        this.logger.log(
          `[MAIL SENT] Correo enviado a: ${options.to} con ID: ${info.messageId}`,
        );
      }

      const previewUrl = nodemailer.getTestMessageUrl(info);

      return {
        messageId: info.messageId || `simulated-${Date.now()}`,
        accepted: Array.isArray(info.accepted) ? info.accepted.map(String) : [options.to],
        rejected: Array.isArray(info.rejected) ? info.rejected.map(String) : [],
        simulated: this.isSimulatedMode,
        previewUrl,
      };
    } catch (error: any) {
      this.logger.error(
        `Error al enviar correo a ${options.to}: ${error?.message || error}`,
        error?.stack,
      );
      throw error;
    }
  }
}
