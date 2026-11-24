import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { VaccinationsService } from './vaccinations.service';

@Injectable()
export class VaccinationsCronService {
  private readonly logger = new Logger(VaccinationsCronService.name);

  constructor(private readonly vaccinationsService: VaccinationsService) {}

  /**
   * Cron Job diario ejecutado a las 7:00 AM para consultar refuerzos próximos a 3 días o menos
   * y despachar recordatorios por correo electrónico a los propietarios.
   */
  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleDailyVaccinationReminders(): Promise<{
    totalEvaluated: number;
    sent: number;
    failed: number;
  }> {
    this.logger.log(
      'Iniciando ejecución programada diaria de recordatorios de vacunación (@Cron EVERY_DAY_AT_7AM)...',
    );

    const result = await this.vaccinationsService.processUpcomingReminders();

    this.logger.log(
      `Ejecución de Cron Job completada: ${result.totalEvaluated} evaluados, ${result.sent} enviados, ${result.failed} fallidos`,
    );

    return result;
  }
}
