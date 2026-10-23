#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/037164dec59bbe9a3a877ad888436c1dfd07c4581bee67c3cc5b06e7762c90cd/contract';
import endContract from '../../snapshots/037164dec59bbe9a3a877ad888436c1dfd07c4581bee67c3cc5b06e7762c90cd/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/8bf8745dc632cc0ce30cf1a7df42d98518aa2e67c305ab05606167cef55e7d34/contract';
import startContract from '../../snapshots/8bf8745dc632cc0ce30cf1a7df42d98518aa2e67c305ab05606167cef55e7d34/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  lit,
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
        table: 'conversations',
        columns: [
          col('closed_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-date@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('handoff_reason', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('last_message_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('last_visitor_message_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('member_read_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-date@1' } }),
          col('state', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('visitor_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'conversations_handoff_reason_check_ae20b9e1',
            sql`"handoff_reason" IN ('low_confidence', 'no_relevant_knowledge', 'visitor_requested', 'agent_off')`,
          ),
          checkExpression(
            'conversations_state_check_c0b30865',
            sql`"state" IN ('ai', 'waiting', 'human', 'closed')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'messages',
        columns: [
          col('attachments', 'jsonb', {
            notNull: true,
            default: lit([]),
            codecRef: { codecId: 'pg/jsonb@1' },
          }),
          col('author', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('body', 'text', {
            notNull: true,
            default: lit(''),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('classification', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('conversation_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('declined', 'bool', {
            notNull: true,
            default: lit(false),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('member_id', 'uuid', { codecRef: { codecId: 'pg/uuid@1' } }),
          col('system_event', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'messages_author_check_8d9bb6ef',
            sql`"author" IN ('visitor', 'agent', 'member', 'system')`,
          ),
          checkExpression(
            'messages_classification_check_2c7798de',
            sql`"classification" IN ('support_question', 'small_talk', 'off_topic', 'human_request')`,
          ),
          checkExpression(
            'messages_system_event_check_16c5a7f5',
            sql`"system_event" IN ('greeting', 'handoff', 'taken_over', 'handed_back', 'closed')`,
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'visitors',
        columns: [
          col('browser', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('city', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('country', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('device', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('first_seen_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
          col('language', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('last_seen_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-date@1' },
          }),
          col('os', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('page', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('referrer', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('timezone', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('token_secret_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('visit_count', 'int4', {
            notNull: true,
            default: lit(1),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('workspace_id', 'uuid', { notNull: true, codecRef: { codecId: 'pg/uuid@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'visitors_device_check_4521c5ca',
            sql`"device" IN ('desktop', 'mobile', 'tablet')`,
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_one_open_per_visitor_a2ec6ddc',
        columns: ['visitor_id'],
        extras: { where: sql`(state <> 'closed')`, unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_visitor_id_created_at_idx_0ece9d83',
        columns: ['visitor_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_visitor_id_idx_f711bdfd',
        columns: ['visitor_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'conversations',
        index: 'conversations_workspace_id_last_message_at_idx_a80869f0',
        columns: ['workspace_id', 'last_message_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversation_id_created_at_idx_13048a6f',
        columns: ['conversation_id', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_conversation_id_idx_0c3639df',
        columns: ['conversation_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_member_id_idx_10d5a0e2',
        columns: ['member_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'messages',
        index: 'messages_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'visitors',
        index: 'visitors_workspace_id_idx_90a9f461',
        columns: ['workspace_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversations',
        foreignKey: {
          name: 'conversations_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'conversations',
        foreignKey: {
          name: 'conversations_visitor_id_fkey',
          columns: ['visitor_id'],
          references: { schema: 'public', table: 'visitors', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_conversation_id_fkey',
          columns: ['conversation_id'],
          references: { schema: 'public', table: 'conversations', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'messages',
        foreignKey: {
          name: 'messages_member_id_fkey',
          columns: ['member_id'],
          references: { schema: 'public', table: 'members', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'visitors',
        foreignKey: {
          name: 'visitors_workspace_id_fkey',
          columns: ['workspace_id'],
          references: { schema: 'public', table: 'workspaces', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
