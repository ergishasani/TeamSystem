"""add charity donations: charities, charity_suggestions, company + request fields

Revision ID: c3d4e5f6a7b9
Revises: b2c3d4e5f6a8
Create Date: 2026-06-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = 'c3d4e5f6a7b9'
down_revision = 'b2c3d4e5f6a8'
branch_labels = None
depends_on = None


def upgrade():
    # ── companies: donation policy fields ─────────────────────────────────────
    op.add_column('companies', sa.Column('allow_charity_donations', sa.Boolean(), server_default=sa.false(), nullable=True))
    op.add_column('companies', sa.Column('donation_match_percent', sa.Integer(), server_default='0', nullable=True))
    op.add_column('companies', sa.Column('donation_approval_required_above', sa.Numeric(12, 2), nullable=True))
    op.add_column('companies', sa.Column('allow_employee_charity_suggestions', sa.Boolean(), server_default=sa.true(), nullable=True))

    # ── charities ─────────────────────────────────────────────────────────────
    op.create_table(
        'charities',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('logo_url', sa.Text(), nullable=True),
        sa.Column('category', sa.String(), nullable=False, server_default='other'),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=True, index=True),
        sa.Column('is_platform_wide', sa.Boolean(), server_default=sa.false()),
        sa.Column('is_active', sa.Boolean(), server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
    )

    # ── charity_suggestions ───────────────────────────────────────────────────
    op.create_table(
        'charity_suggestions',
        sa.Column('id', sa.Integer(), primary_key=True, index=True),
        sa.Column('suggested_by_user_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('company_id', sa.Integer(), sa.ForeignKey('companies.id'), nullable=False, index=True),
        sa.Column('charity_name', sa.String(), nullable=False),
        sa.Column('charity_website', sa.String(), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False, server_default='pending'),
        sa.Column('reviewed_by_admin_id', sa.Integer(), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
    )

    # ── benefit_requests: donation fields ─────────────────────────────────────
    op.add_column('benefit_requests', sa.Column('charity_id', sa.Integer(), sa.ForeignKey('charities.id'), nullable=True))
    op.add_column('benefit_requests', sa.Column('donation_amount', sa.Numeric(12, 2), nullable=True))
    op.add_column('benefit_requests', sa.Column('donation_match_amount', sa.Numeric(12, 2), nullable=True))


def downgrade():
    op.drop_column('benefit_requests', 'donation_match_amount')
    op.drop_column('benefit_requests', 'donation_amount')
    op.drop_column('benefit_requests', 'charity_id')
    op.drop_table('charity_suggestions')
    op.drop_table('charities')
    op.drop_column('companies', 'allow_employee_charity_suggestions')
    op.drop_column('companies', 'donation_approval_required_above')
    op.drop_column('companies', 'donation_match_percent')
    op.drop_column('companies', 'allow_charity_donations')
