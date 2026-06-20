"""add company settings fields

Revision ID: a1b2c3d4e5f7
Revises: f6a7b8c9d0e1
Create Date: 2026-06-21 09:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f7'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('companies', sa.Column('trading_name', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('city', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('support_email', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('support_phone', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('logo_url', sa.Text(), nullable=True))
    op.add_column('companies', sa.Column('brand_colors', sa.JSON(), nullable=True))
    op.add_column('companies', sa.Column('language', sa.String(5), nullable=True))
    op.add_column('companies', sa.Column('timezone', sa.String(), nullable=True))
    op.add_column('companies', sa.Column('week_start', sa.String(10), nullable=True))
    op.add_column('companies', sa.Column('number_format', sa.String(20), nullable=True))
    op.add_column('companies', sa.Column('policies', sa.JSON(), nullable=True))
    op.add_column('companies', sa.Column('notification_prefs', sa.JSON(), nullable=True))
    op.add_column('companies', sa.Column('security_prefs', sa.JSON(), nullable=True))


def downgrade():
    op.drop_column('companies', 'security_prefs')
    op.drop_column('companies', 'notification_prefs')
    op.drop_column('companies', 'policies')
    op.drop_column('companies', 'number_format')
    op.drop_column('companies', 'week_start')
    op.drop_column('companies', 'timezone')
    op.drop_column('companies', 'language')
    op.drop_column('companies', 'brand_colors')
    op.drop_column('companies', 'logo_url')
    op.drop_column('companies', 'support_phone')
    op.drop_column('companies', 'support_email')
    op.drop_column('companies', 'city')
    op.drop_column('companies', 'trading_name')
