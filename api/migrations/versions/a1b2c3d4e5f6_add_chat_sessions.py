"""add chat sessions

Revision ID: a1b2c3d4e5f6
Revises: 476fac6a6ee9
Create Date: 2026-06-19 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.sql import text

revision = "a1b2c3d4e5f6"
down_revision = "476fac6a6ee9"
branch_labels = None
depends_on = None


def upgrade():
    # Create chat_sessions table
    op.create_table(
        "chat_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("trip_id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=100), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["trip_id"], ["trips.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )

    # Add session_id column to chat_messages (nullable first for migration)
    op.add_column("chat_messages", sa.Column("session_id", sa.Integer(), nullable=True))

    # Migrate existing messages: create one session per (trip_id, user_id) group
    conn = op.get_bind()
    rows = conn.execute(
        text(
            "SELECT DISTINCT trip_id, user_id FROM chat_messages WHERE trip_id IS NOT NULL"
        )
    ).fetchall()
    for trip_id, user_id in rows:
        result = conn.execute(
            text(
                "INSERT INTO chat_sessions (trip_id, user_id, created_at) "
                "VALUES (:trip_id, :user_id, NOW()) RETURNING id"
            ),
            {"trip_id": trip_id, "user_id": user_id},
        )
        session_id = result.fetchone()[0]
        conn.execute(
            text(
                "UPDATE chat_messages SET session_id = :session_id "
                "WHERE trip_id = :trip_id AND user_id = :user_id"
            ),
            {"session_id": session_id, "trip_id": trip_id, "user_id": user_id},
        )

    op.create_foreign_key(
        "fk_chat_messages_session_id",
        "chat_messages",
        "chat_sessions",
        ["session_id"],
        ["id"],
    )

    # Drop trip_id from chat_messages
    op.drop_constraint(
        "chat_messages_trip_id_fkey", "chat_messages", type_="foreignkey"
    )
    op.drop_column("chat_messages", "trip_id")

    # Make session_id non-nullable
    op.alter_column("chat_messages", "session_id", nullable=False)


def downgrade():
    # Re-add trip_id
    op.add_column("chat_messages", sa.Column("trip_id", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "chat_messages_trip_id_fkey",
        "chat_messages",
        "trips",
        ["trip_id"],
        ["id"],
    )

    # Drop session_id FK and column
    op.drop_constraint(
        "fk_chat_messages_session_id", "chat_messages", type_="foreignkey"
    )
    op.drop_column("chat_messages", "session_id")

    # Drop chat_sessions table
    op.drop_table("chat_sessions")
