import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('fed_opex_records')
@Index(['primaryBusinessUnit', 'invoiceYear', 'invoiceMonth'])
@Index(['opexBucket', 'invoiceYear', 'invoiceMonth'])
@Index(['primaryBusinessUnit', 'invoiceYear', 'invoiceMonth', 'opexBucket'])
export class FedOpexRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  primaryBusinessUnit: string;

  @Column({ type: 'varchar', length: 255 })
  opexBucket: string;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  actualCostPerJob: number;

  @Column({ type: 'decimal', precision: 18, scale: 6, nullable: true })
  cappedEstimatedCostPerJob: number;

  @Column({ type: 'int' })
  jobCount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalActualCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalEstimatedCost: number;

  @Column({ type: 'int' })
  invoiceYear: number;

  @Column({ type: 'int' })
  invoiceMonth: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  jobId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workflowName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workCity: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  productPillar: string;

  @Column({ type: 'varchar', length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'decimal', precision: 12, scale: 6, nullable: true })
  exchangeRateToUsd: number;

  @CreateDateColumn()
  ingestedAt: Date;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sourceSnapshotId: string;
}
