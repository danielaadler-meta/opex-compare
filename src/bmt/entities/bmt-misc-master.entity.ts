import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
} from 'typeorm';

@Entity('bmt_misc_master')
export class BmtMiscMaster {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  forecastUniqueId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  billableRole: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  mappedOpexBucket: string;

  @Column({ type: 'boolean', default: false })
  hasFedCounterpart: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @UpdateDateColumn()
  updatedAt: Date;
}
