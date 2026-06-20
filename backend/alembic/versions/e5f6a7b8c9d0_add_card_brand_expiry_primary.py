"""add card brand expiry primary

Revision ID: e5f6a7b8c9d0
Revises: d4e5f6a7b8c9
Create Date: 2026-06-20 15:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'e5f6a7b8c9d0'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('cards', sa.Column('brand', sa.String(), nullable=True, server_default='Visa'))
    op.add_column('cards', sa.Column('expiry', sa.String(5), nullable=True))
    op.add_column('cards', sa.Column('is_primary', sa.Boolean(), nullable=True, server_default='false'))


def downgrade():
    op.drop_column('cards', 'is_primary')
    op.drop_column('cards', 'expiry')
    op.drop_column('cards', 'brand')
