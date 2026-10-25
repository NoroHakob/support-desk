#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/45f708051ae323fa5886e23b7504fbb4e7324125bd31db6325f672761046b8ec/contract';
import endContract from '../../snapshots/45f708051ae323fa5886e23b7504fbb4e7324125bd31db6325f672761046b8ec/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/97e9074f60bb84fbc33b85db810c79de6af4b75095e90422fef83dfe8af52a87/contract';
import startContract from '../../snapshots/97e9074f60bb84fbc33b85db810c79de6af4b75095e90422fef83dfe8af52a87/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  primaryKey,
  sql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'agent_turns',
        columns: [
          col('chunks', 'jsonb', { notNull: true, codecRef: { codecId: 'pg/jsonb@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('error', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('latency_ms', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('message_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('model', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('outcome', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('reply_message_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('tokens_in', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tokens_out', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'agent_turns_outcome_check_b5ef7ad5',
            sql`"outcome" IN ('answered', 'replied', 'declined', 'handed_off', 'discarded')`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agent_turns',
        index: 'agent_turns_message_id_idx_8a7ff1ba',
        columns: ['message_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'agent_turns',
        index: 'agent_turns_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'agent_turns',
        foreignKey: {
          name: 'agent_turns_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'agent_turns',
        foreignKey: {
          name: 'agent_turns_message_id_fkey',
          columns: ['message_id'],
          references: { schema: 'public', table: 'messages', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
