"""add collaboration_id to benefit_requests

Revision ID: f6a7b8c9d0e1
Revises: e5f6a7b8c9d0
Create Date: 2026-06-20 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'f6a7b8c9d0e1'
down_revision = 'e5f6a7b8c9d0'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        'benefit_requests',
        sa.Column('collaboration_id', sa.Integer(), sa.ForeignKey('provider_collaborations.id'), nullable=True),
    )


def downgrade():
    op.drop_column('benefit_requests', 'collaboration_id')
