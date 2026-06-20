"""add notification title

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-06-20 12:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b8'
down_revision = 'b2c3d4e5f6a7'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('notifications', sa.Column('title', sa.String(), nullable=True))


def downgrade():
    op.drop_column('notifications', 'title')
