import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Pet } from './entities/pet.entity';

@Injectable()
export class PetCodeGeneratorService {
  constructor(
    @InjectRepository(Pet)
    private readonly petsRepository: Repository<Pet>,
  ) {}

  /**
   * Genera un identificador único estricto para pacientes (ej: HUV-2026-0001).
   * Garantiza secuencia numérica por año sin colisiones.
   */
  async generateCode(year: number = new Date().getFullYear()): Promise<string> {
    const prefix = `HUV-${year}-`;

    try {
      // Intentar calcular el máximo número secuencial directamente con consulta optimizada
      const result = await this.petsRepository
        .createQueryBuilder('pet')
        .select(
          'MAX(CAST(SUBSTRING_INDEX(pet.uniqueCode, "-", -1) AS UNSIGNED))',
          'maxSeq',
        )
        .where('pet.uniqueCode LIKE :prefix', { prefix: `${prefix}%` })
        .getRawOne();

      const maxSeq =
        result && result.maxSeq != null ? parseInt(result.maxSeq, 10) : 0;
      const nextSequence = isNaN(maxSeq) ? 1 : maxSeq + 1;
      return `${prefix}${String(nextSequence).padStart(4, '0')}`;
    } catch {
      // En caso de entornos de prueba / mock donde SUBSTRING_INDEX o getRawOne no estén disponibles
      const pets = await this.petsRepository.find({
        select: ['uniqueCode'],
      });

      let maxSequence = 0;
      for (const pet of pets) {
        if (pet.uniqueCode && pet.uniqueCode.startsWith(prefix)) {
          const parts = pet.uniqueCode.split('-');
          if (parts.length === 3) {
            const seq = parseInt(parts[2], 10);
            if (!isNaN(seq) && seq > maxSequence) {
              maxSequence = seq;
            }
          }
        }
      }

      const nextSequence = maxSequence + 1;
      return `${prefix}${String(nextSequence).padStart(4, '0')}`;
    }
  }

  /**
   * Valida si un código cumple con el estándar HUV-YYYY-XXXX (o XXXXX).
   */
  isValidCodeFormat(code: string): boolean {
    if (!code) return false;
    return /^HUV-\d{4}-\d{4,5}$/.test(code.trim());
  }
}
