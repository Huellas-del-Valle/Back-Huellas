import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreatePetsTable1732390000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'pets',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
          },
          {
            name: 'unique_code',
            type: 'varchar',
            length: '50',
            isUnique: true,
            isNullable: false,
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'species',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'breed',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'birth_date',
            type: 'date',
            isNullable: true,
          },
          {
            name: 'gender',
            type: 'varchar',
            length: '20',
            isNullable: true,
          },
          {
            name: 'client_id',
            type: 'varchar',
            length: '36',
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
      'pets',
      new TableIndex({
        name: 'idx_pets_unique_code',
        columnNames: ['unique_code'],
        isUnique: true,
      }),
    );

    await queryRunner.createIndex(
      'pets',
      new TableIndex({
        name: 'idx_pets_client_id',
        columnNames: ['client_id'],
      }),
    );

    // Llave foránea hacia clients para integridad referencial
    await queryRunner.createForeignKey(
      'pets',
      new TableForeignKey({
        name: 'FK_pets_client_id',
        columnNames: ['client_id'],
        referencedTableName: 'clients',
        referencedColumnNames: ['id'],
        onDelete: 'RESTRICT',
        onUpdate: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('pets');
    if (table) {
      const foreignKey = table.foreignKeys.find(
        (fk) => fk.columnNames.indexOf('client_id') !== -1,
      );
      if (foreignKey) {
        await queryRunner.dropForeignKey('pets', foreignKey);
      }
    }
    await queryRunner.dropTable('pets', true, true, true);
  }
}
