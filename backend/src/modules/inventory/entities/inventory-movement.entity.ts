import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { InventoryMovementType } from '../../../common/enums';
import { ItemTag } from './item-tag.entity';
import { Location } from './location.entity';

@Entity('inventory_movements')
export class InventoryMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  itemTagId: string;

  @ManyToOne(() => ItemTag, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'itemTagId' })
  itemTag: ItemTag;

  @Column({ type: 'enum', enum: InventoryMovementType })
  type: InventoryMovementType;

  @Column({ type: 'varchar', nullable: true })
  fromLocationId: string | null;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'fromLocationId' })
  fromLocation: Location | null;

  @Column({ type: 'varchar', nullable: true })
  toLocationId: string | null;

  @ManyToOne(() => Location, { nullable: true })
  @JoinColumn({ name: 'toLocationId' })
  toLocation: Location | null;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  weight: number;

  @Column({ type: 'varchar', nullable: true })
  reason: string | null;

  @Column({ type: 'varchar', nullable: true })
  performedById: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
