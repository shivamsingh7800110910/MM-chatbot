"""Initial schema for conversations, messages, documents, and document_chunks

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-28 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.engine.reflection import Inspector

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    conn = op.get_bind()
    inspector = Inspector.from_engine(conn)
    existing_tables = inspector.get_table_names()

    # 1. Conversations
    if 'conversations' not in existing_tables:
        op.create_table(
            'conversations',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('mode', sa.String(length=50), nullable=False, server_default='standard'),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.PrimaryKeyConstraint('id')
        )

    # 2. Messages
    if 'messages' not in existing_tables:
        op.create_table(
            'messages',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('conversation_id', sa.String(length=36), nullable=False),
            sa.Column('role', sa.String(length=20), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('attachments', sa.JSON(), nullable=True),
            sa.Column('citations', sa.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['conversation_id'], ['conversations.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

    # 3. Documents
    if 'documents' not in existing_tables:
        op.create_table(
            'documents',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('title', sa.String(length=255), nullable=False),
            sa.Column('filename', sa.String(length=255), nullable=False),
            sa.Column('file_type', sa.String(length=50), nullable=False),
            sa.Column('file_path', sa.String(length=500), nullable=False),
            sa.Column('file_size', sa.Integer(), nullable=True, server_default='0'),
            sa.Column('version', sa.Integer(), nullable=True, server_default='1'),
            sa.Column('parent_id', sa.String(length=36), nullable=True),
            sa.Column('content_text', sa.Text(), nullable=True),
            sa.Column('is_generated', sa.Boolean(), nullable=True, server_default='0'),
            sa.Column('created_at', sa.DateTime(), nullable=True),
            sa.Column('updated_at', sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(['parent_id'], ['documents.id'], ondelete='SET NULL'),
            sa.PrimaryKeyConstraint('id')
        )

    # 4. Document Chunks
    if 'document_chunks' not in existing_tables:
        op.create_table(
            'document_chunks',
            sa.Column('id', sa.String(length=36), nullable=False),
            sa.Column('document_id', sa.String(length=36), nullable=False),
            sa.Column('chunk_index', sa.Integer(), nullable=False),
            sa.Column('content', sa.Text(), nullable=False),
            sa.Column('page_or_section', sa.String(length=100), nullable=True),
            sa.Column('embedding', sa.JSON(), nullable=True),
            sa.ForeignKeyConstraint(['document_id'], ['documents.id'], ondelete='CASCADE'),
            sa.PrimaryKeyConstraint('id')
        )

def downgrade() -> None:
    op.drop_table('document_chunks')
    op.drop_table('documents')
    op.drop_table('messages')
    op.drop_table('conversations')
