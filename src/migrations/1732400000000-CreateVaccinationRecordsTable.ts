import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateVaccinationRecordsTable1732400000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'vaccination_records',
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
            name: 'type',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '150',
            isNullable: false,
          },
          {
            name: 'batch_number',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'application_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'next_due_date',
            type: 'date',
            isNullable: false,
          },
          {
            name: 'notified',
            type: 'boolean',
            default: false,
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

    // Índices para optimizar consultas de recordatorios y relación con mascotas
    await queryRunner.createIndex(
      'vaccination_records',
      new TableIndex({
        name: 'idx_vaccination_records_pet_id',
        columnNames: ['pet_id'],
      }),
    );

    await queryRunner.createIndex(
      'vaccination_records',
      new TableIndex({
        name: 'idx_vaccination_records_due_notified',
        columnNames: ['notified', 'next_due_date'],
      }),
    );

    // Llave foránea hacia pets con eliminación en cascada
    await queryRunner.createForeignKey(
      'vaccination_records',
      new TableForeignKey({
        name: 'FK_vaccination_records_pet_id',
        columnNames: ['pet_id'],
        referencedTableName: 'pets',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('vaccination_records');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('pet_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('vaccination_records', foreignKey);
      }
    }
    await queryRunner.dropTable('vaccination_records', true, true, true);
  }
}
