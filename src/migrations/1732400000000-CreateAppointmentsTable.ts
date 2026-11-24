import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateAppointmentsTable1732400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('appointments');
    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'appointments',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'pet_id',
              type: 'varchar',
              length: '36',
              isNullable: false,
            },
            {
              name: 'client_id',
              type: 'varchar',
              length: '36',
              isNullable: false,
            },
            {
              name: 'veterinarian_id',
              type: 'varchar',
              length: '36',
              isNullable: false,
            },
            {
              name: 'start_date_time',
              type: 'datetime',
              precision: 6,
              isNullable: false,
            },
            {
              name: 'end_date_time',
              type: 'datetime',
              precision: 6,
              isNullable: false,
            },
            {
              name: 'reason',
              type: 'varchar',
              length: '255',
              isNullable: true,
            },
            {
              name: 'status',
              type: 'enum',
              enum: [
                'PENDIENTE',
                'CONFIRMADA',
                'ATENDIDA',
                'CANCELADA',
                'NO_ASISTIDA',
              ],
              default: "'PENDIENTE'",
              isNullable: false,
            },
            {
              name: 'createdAt',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
            },
            {
              name: 'updatedAt',
              type: 'datetime',
              precision: 6,
              default: 'CURRENT_TIMESTAMP(6)',
              onUpdate: 'CURRENT_TIMESTAMP(6)',
            },
          ],
        }),
        true,
      );

      // Índices
      await queryRunner.createIndex(
        'appointments',
        new TableIndex({
          name: 'idx_appointments_vet_dates',
          columnNames: [
            'veterinarian_id',
            'start_date_time',
            'end_date_time',
          ],
        }),
      );

      await queryRunner.createIndex(
        'appointments',
        new TableIndex({
          name: 'idx_appointments_pet_id',
          columnNames: ['pet_id'],
        }),
      );

      await queryRunner.createIndex(
        'appointments',
        new TableIndex({
          name: 'idx_appointments_client_id',
          columnNames: ['client_id'],
        }),
      );

      await queryRunner.createIndex(
        'appointments',
        new TableIndex({
          name: 'idx_appointments_status',
          columnNames: ['status'],
        }),
      );

      // Llaves foráneas
      await queryRunner.createForeignKey(
        'appointments',
        new TableForeignKey({
          name: 'FK_appointments_pet_id',
          columnNames: ['pet_id'],
          referencedTableName: 'pets',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'appointments',
        new TableForeignKey({
          name: 'FK_appointments_client_id',
          columnNames: ['client_id'],
          referencedTableName: 'clients',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );

      await queryRunner.createForeignKey(
        'appointments',
        new TableForeignKey({
          name: 'FK_appointments_veterinarian_id',
          columnNames: ['veterinarian_id'],
          referencedTableName: 'users',
          referencedColumnNames: ['id'],
          onDelete: 'RESTRICT',
          onUpdate: 'CASCADE',
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('appointments');
    if (table) {
      for (const fk of table.foreignKeys) {
        await queryRunner.dropForeignKey('appointments', fk);
      }
      await queryRunner.dropTable('appointments', true, true, true);
    }
  }
}
