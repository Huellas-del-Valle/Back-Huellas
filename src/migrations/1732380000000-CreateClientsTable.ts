import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateClientsTable1732380000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('clients');
    if (!hasTable) {
      await queryRunner.createTable(
        new Table({
          name: 'clients',
          columns: [
            {
              name: 'id',
              type: 'varchar',
              length: '36',
              isPrimary: true,
            },
            {
              name: 'identification',
              type: 'varchar',
              length: '50',
              isUnique: true,
              isNullable: false,
            },
            {
              name: 'fullName',
              type: 'varchar',
              length: '150',
              isNullable: false,
            },
            {
              name: 'phone',
              type: 'varchar',
              length: '20',
              isNullable: false,
            },
            {
              name: 'email',
              type: 'varchar',
              length: '255',
              isNullable: false,
            },
            {
              name: 'address',
              type: 'varchar',
              length: '255',
              isNullable: true,
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

      await queryRunner.createIndex(
        'clients',
        new TableIndex({
          name: 'idx_clients_identification',
          columnNames: ['identification'],
          isUnique: true,
        }),
      );

      await queryRunner.createIndex(
        'clients',
        new TableIndex({
          name: 'idx_clients_phone',
          columnNames: ['phone'],
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasTable = await queryRunner.hasTable('clients');
    if (hasTable) {
      await queryRunner.dropTable('clients', true, true, true);
    }
  }
}
