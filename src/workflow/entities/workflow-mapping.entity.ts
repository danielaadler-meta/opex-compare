import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('workflow_mappings')
@Index(['businessUnit', 'workflowName'])
export class WorkflowMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  businessUnit: string;

  @Column({ type: 'varchar', length: 255 })
  workflowName: string;

  @Column({ type: 'varchar', length: 255 })
  fedOpexBucket: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bmtProgram: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  bmtProject: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @UpdateDateColumn()
  updatedAt: Date;
}
