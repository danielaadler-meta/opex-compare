import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('comparison_snapshots')
@Index(['businessUnit', 'periodYear', 'periodMonth', 'status'])
export class ComparisonSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  businessUnit: string;

  @Column({ type: 'int' })
  periodYear: number;

  @Column({ type: 'int' })
  periodMonth: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  workflowName: string;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fedTotalActualCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  fedTotalEstimatedCost: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  bmtTotalOpexUsd: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  bmtTotalOpexFinanceAllocated: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  absoluteDelta: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  percentageDelta: number;

  @Column({ type: 'varchar', length: 50, default: 'CURRENT' })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  createdByUserId: string;
}
