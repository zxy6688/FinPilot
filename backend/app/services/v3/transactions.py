"""Serialize SQLite read-then-write transitions across tabs/process requests."""

from sqlalchemy import text


def begin_write(db):
    if db.get_bind().dialect.name != "sqlite":
        return
    connection = db.connection()
    # Authentication has read the user, but sqlite's legacy SELECT mode has not
    # begun a DBAPI transaction. Acquire the writer lock before reading cursors.
    if not connection.connection.driver_connection.in_transaction:
        db.execute(text("BEGIN IMMEDIATE"))
