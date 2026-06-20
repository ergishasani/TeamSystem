"""add cards table

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-06-20 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'b2c3d4e5f6a7'
down_revision = 'a1b2c3d4e5f6'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'cards',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('card_type', sa.String(), nullable=False, server_default='debit'),
        sa.Column('last_four', sa.String(4), nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true'),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_cards_id', 'cards', ['id'])
    op.create_index('ix_cards_user_id', 'cards', ['user_id'])


def downgrade():
    op.drop_index('ix_cards_user_id', table_name='cards')
    op.drop_index('ix_cards_id', table_name='cards')
    op.drop_table('cards')
