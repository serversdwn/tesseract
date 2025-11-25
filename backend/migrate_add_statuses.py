"""
Migration script to add statuses column to projects table
Run this script once to update existing database
"""
import sqlite3
import json

# Default statuses for existing projects
DEFAULT_STATUSES = ["backlog", "in_progress", "on_hold", "done"]

def migrate():
    # Connect to the database
    conn = sqlite3.connect('tesseract.db')
    cursor = conn.cursor()

    try:
        # Check if statuses column already exists
        cursor.execute("PRAGMA table_info(projects)")
        columns = [column[1] for column in cursor.fetchall()]

        if 'statuses' in columns:
            print("✓ Column 'statuses' already exists in projects table")
            return

        # Add statuses column with default value
        print("Adding 'statuses' column to projects table...")
        cursor.execute("""
            ALTER TABLE projects
            ADD COLUMN statuses TEXT NOT NULL DEFAULT ?
        """, (json.dumps(DEFAULT_STATUSES),))

        # Update all existing projects with default statuses
        cursor.execute("""
            UPDATE projects
            SET statuses = ?
            WHERE statuses IS NULL OR statuses = ''
        """, (json.dumps(DEFAULT_STATUSES),))

        conn.commit()
        print("✓ Successfully added 'statuses' column to projects table")
        print(f"✓ Set default statuses for all existing projects: {DEFAULT_STATUSES}")

        # Show count of updated projects
        cursor.execute("SELECT COUNT(*) FROM projects")
        count = cursor.fetchone()[0]
        print(f"✓ Updated {count} project(s)")

    except sqlite3.Error as e:
        print(f"✗ Error during migration: {e}")
        conn.rollback()
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("=" * 60)
    print("Database Migration: Add statuses column to projects")
    print("=" * 60)
    migrate()
    print("=" * 60)
    print("Migration completed!")
    print("=" * 60)
