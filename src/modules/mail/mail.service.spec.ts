import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailService } from './mail.service';
import { SendVaccinationReminderOptions } from './interfaces/mail-options.interface';
import { renderVaccinationReminderTemplate } from './templates/vaccination-reminder.template';

describe('MailService & Plantilla HTML', () => {
  let mailService: MailService;
  let configService: ConfigService;

  const mockReminderOptions: SendVaccinationReminderOptions = {
    to: 'userejemplo@huellas.com',
    ownerName: 'user ejemplo',
    petName: 'Mascota ejemplo',
    petCode: 'HUV-2026-0001',
    species: 'CANINO',
    vaccinationType: 'VACUNA',
    vaccinationName: 'Vacuna Antirrábica Ejemplo',
    batchNumber: 'LOTE-9988',
    applicationDate: '2026-10-21',
    nextDueDate: '2027-10-21',
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      const config: Record<string, any> = {
        NODE_ENV: 'test',
        SMTP_HOST: 'localhost',
        SMTP_PORT: 587,
        SMTP_USER: '',
        SMTP_PASS: '',
        SMTP_FROM: '"Huellas del Valle" <notificaciones@huellasdelvalle.com>',
      };
      return config[key] !== undefined ? config[key] : defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('debe estar definido el servicio de correos', () => {
    expect(mailService).toBeDefined();
  });

  describe('renderVaccinationReminderTemplate', () => {
    it('debe renderizar el asunto y el HTML con los datos de la mascota y clínica', () => {
      const { subject, html, text } =
        renderVaccinationReminderTemplate(mockReminderOptions);

      expect(subject).toContain('Recordatorio de VACUNA');
      expect(subject).toContain('Mascota ejemplo');
      expect(subject).toContain('Huellas del Valle');

      // Verificación en contenido HTML
      expect(html).toContain('Huellas del Valle');
      expect(html).toContain('user ejemplo');
      expect(html).toContain('Mascota ejemplo');
      expect(html).toContain('CANINO');
      expect(html).toContain('HUV-2026-0001');
      expect(html).toContain('Vacuna Antirrábica Ejemplo');
      expect(html).toContain('LOTE-9988');
      expect(html).toContain('2026-10-21');
      expect(html).toContain('2027-10-21');

      // Verificación en texto plano
      expect(text).toContain('HUELLAS DEL VALLE');
      expect(text).toContain('LOTE-9988');
    });
  });

  describe('sendVaccinationReminder', () => {
    it('debe despachar un correo simulado exitoso en entorno de prueba sin fallar', async () => {
      const result = await mailService.sendVaccinationReminder(
        mockReminderOptions,
      );

      expect(result).toBeDefined();
      expect(result.simulated).toBe(true);
      expect(result.accepted).toContain(mockReminderOptions.to);
      expect(result.messageId).toBeDefined();
    });

    it('debe manejar errores si el transportador falla', async () => {
      const mockFailingTransporter = {
        sendMail: jest
          .fn()
          .mockRejectedValue(new Error('Conexión SMTP rechazada')),
      };

      mailService.setTransporter(mockFailingTransporter as any, false);

      await expect(
        mailService.sendVaccinationReminder(mockReminderOptions),
      ).rejects.toThrow('Conexión SMTP rechazada');
    });
  });
});
