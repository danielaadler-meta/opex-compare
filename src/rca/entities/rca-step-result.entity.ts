import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { RcaRun } from './rca-run.entity';

@Entity('rca_step_results')
@Index(['rcaRunId', 'stepOrder'])
export class RcaStepResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RcaRun, (run) => run.steps)
  @JoinColumn({ name: 'rca_run_id' })
  rcaRun: RcaRun;

  @Column({ type: 'uuid', name: 'rca_run_id' })
  rcaRunId: string;

  @Column({ type: 'int' })
  stepOrder: number;

  @Column({ type: 'varchar', length: 100 })
  stepName: string;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  gapInputAmount: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  amountExplained: number;

  @Column({ type: 'decimal', precision: 18, scale: 2 })
  gapOutputAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 4 })
  percentOfTotalGap: number;

  @Column({ type: 'jsonb' })
  breakdown: Record<string, any>;

  @CreateDateColumn()
  computedAt: Date;
}
