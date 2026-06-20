"""add gamification features

Revision ID: a1b2c3d4e5f6
Revises: 07ee651a6e30
Create Date: 2026-06-20 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'a1b2c3d4e5f6'
down_revision = '07ee651a6e30'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'user_interests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('category', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_user_interests_id', 'user_interests', ['id'])

    op.create_table(
        'swipe_interactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('offer_id', sa.Integer(), sa.ForeignKey('offers.id'), nullable=False),
        sa.Column('direction', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_swipe_interactions_id', 'swipe_interactions', ['id'])

    op.create_table(
        'daily_deals',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('offer_id', sa.Integer(), sa.ForeignKey('offers.id'), nullable=False),
        sa.Column('deal_date', sa.Date(), nullable=False),
        sa.Column('deal_price', sa.Numeric(12, 2), nullable=True),
        sa.Column('quantity_limit', sa.Integer(), nullable=True),
        sa.Column('quantity_claimed', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('deal_date'),
    )
    op.create_index('ix_daily_deals_id', 'daily_deals', ['id'])
    op.create_index('ix_daily_deals_deal_date', 'daily_deals', ['deal_date'])

    op.create_table(
        'provider_collaborations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('total_price', sa.Numeric(12, 2), nullable=False),
        sa.Column('currency', sa.String(3), nullable=True),
        sa.Column('city', sa.String(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_provider_collaborations_id', 'provider_collaborations', ['id'])

    op.create_table(
        'collaboration_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('collaboration_id', sa.Integer(), sa.ForeignKey('provider_collaborations.id'), nullable=False),
        sa.Column('offer_id', sa.Integer(), sa.ForeignKey('offers.id'), nullable=False),
        sa.Column('provider_id', sa.Integer(), sa.ForeignKey('providers.id'), nullable=False),
        sa.Column('price_share', sa.Numeric(12, 2), nullable=False),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_collaboration_items_id', 'collaboration_items', ['id'])

    op.create_table(
        'shake_credits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('credits', sa.Integer(), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id'),
    )
    op.create_index('ix_shake_credits_id', 'shake_credits', ['id'])

    op.create_table(
        'shake_attempts',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('attempt_date', sa.Date(), nullable=False),
        sa.Column('won', sa.Boolean(), nullable=True),
        sa.Column('prize_type', sa.String(), nullable=True),
        sa.Column('prize_description', sa.String(), nullable=True),
        sa.Column('xp_earned', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_shake_attempts_id', 'shake_attempts', ['id'])


def downgrade() -> None:
    op.drop_table('shake_attempts')
    op.drop_table('shake_credits')
    op.drop_table('collaboration_items')
    op.drop_table('provider_collaborations')
    op.drop_table('daily_deals')
    op.drop_table('swipe_interactions')
    op.drop_table('user_interests')
