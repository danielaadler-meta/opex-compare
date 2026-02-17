import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('bmt_forecast_records')
@Index(['primaryBusinessUnit', 'forecastYear', 'forecastMonth'])
@Index(['billableRole', 'forecastYear', 'forecastMonth'])
@Index(['source', 'primaryBusinessUnit', 'forecastYear', 'forecastMonth'])
export class BmtForecastRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  primaryBusinessUnit: string;

  @Column({ type: 'varchar', length: 255 })
  billableRole: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  opexUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  opexUsdFinanceActualsAllocated: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  financeAdjustment: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  productionHours: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  billableHours: number;

  @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
  fte: number;

  @Column({ type: 'int' })
  forecastYear: number;

  @Column({ type: 'int' })
  forecastMonth: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  program: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  project: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  employeeType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  forecastUniqueIdGroup: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  forecastUniqueId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  vendor: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  expenseType: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  productPillar: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workCity: string;

  @CreateDateColumn()
  ingestedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceSnapshotId: string;
}
