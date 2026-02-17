import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RcaStepResult } from './rca-step-result.entity';

@Entity('rca_runs')
@Index(['businessUnit', 'periodYear', 'periodMonth'])
export class RcaRun {
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
  totalGapBeforeRca: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  totalGapExplained: number;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  residualUnexplained: number;

  @Column({ type: 'varchar', length: 50, default: 'RUNNING' })
  status: string;

  @OneToMany(() => RcaStepResult, (step) => step.rcaRun, { cascade: true })
  steps: RcaStepResult[];

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'uuid', nullable: true })
  triggeredByUserId: string;
}
