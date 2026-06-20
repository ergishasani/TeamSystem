"""add team roles, broadcasts, templates, campaigns

Revision ID: b2c3d4e5f6a8
Revises: a1b2c3d4e5f7
Create Date: 2026-06-21 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a8'
down_revision = 'a1b2c3d4e5f7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('permission_role', sa.String(), nullable=True))
    op.add_column('users', sa.Column('two_factor_enabled', sa.Boolean(), nullable=True))
    op.add_column('users', sa.Column('last_active_at', sa.DateTime(timezone=True), nullable=True))

    op.create_table(
        'invites',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('role', sa.String(), nullable=False, server_default='viewer'),
        sa.Column('invited_by_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'broadcasts',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('channel', sa.String(), nullable=False, server_default='push'),
        sa.Column('audience_label', sa.String(), nullable=False, server_default='All employees'),
        sa.Column('sent_count', sa.Integer(), server_default='0'),
        sa.Column('open_rate_pct', sa.Numeric(5, 2), server_default='0'),
        sa.Column('unsubscribes', sa.Integer(), server_default='0'),
        sa.Column('status', sa.String(), nullable=False, server_default='draft'),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('sent_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'notification_templates',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('channel', sa.String(), nullable=False, server_default='push'),
        sa.Column('sends_count', sa.Integer(), server_default='0'),
        sa.Column('last_used_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        'campaigns',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('audience_label', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='draft'),
        sa.Column('reach', sa.Integer(), server_default='0'),
        sa.Column('conversion_pct', sa.Numeric(5, 2), server_default='0'),
        sa.Column('budget', sa.Numeric(12, 2), server_default='0'),
        sa.Column('spend', sa.Numeric(12, 2), server_default='0'),
        sa.Column('funnel', sa.JSON(), nullable=True),
        sa.Column('cac', sa.Numeric(10, 2), nullable=True),
        sa.Column('roas', sa.Numeric(6, 2), nullable=True),
        sa.Column('starts_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
    )


def downgrade():
    op.drop_table('campaigns')
    op.drop_table('notification_templates')
    op.drop_table('broadcasts')
    op.drop_table('invites')
    op.drop_column('users', 'last_active_at')
    op.drop_column('users', 'two_factor_enabled')
    op.drop_column('users', 'permission_role')
