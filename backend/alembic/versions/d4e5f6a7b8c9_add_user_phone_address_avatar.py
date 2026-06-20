"""add user phone address avatar

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-06-20 14:00:00.000000
"""
from alembic import op
import sqlalchemy as sa

revision = 'd4e5f6a7b8c9'
down_revision = 'c3d4e5f6a7b8'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('users', sa.Column('phone', sa.String(), nullable=True))
    op.add_column('users', sa.Column('address', sa.String(), nullable=True))
    op.add_column('users', sa.Column('avatar_url', sa.String(), nullable=True))


def downgrade():
    op.drop_column('users', 'avatar_url')
    op.drop_column('users', 'address')
    op.drop_column('users', 'phone')
