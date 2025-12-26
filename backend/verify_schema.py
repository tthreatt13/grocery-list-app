#!/usr/bin/env python3
"""
Database Schema Verification Script

This script verifies that the production database has all required tables and columns.
Run this script in Railway to verify the database schema is up to date.

Usage:
    railway run python verify_schema.py
"""

import sys
from typing import Tuple
from sqlalchemy import inspect, text
from database import engine
from config import settings


def check_table_exists(inspector, table_name: str) -> bool:
    """Check if a table exists in the database."""
    tables = inspector.get_table_names()
    return table_name in tables


def check_column_exists(inspector, table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    if not check_table_exists(inspector, table_name):
        return False

    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def get_column_type(inspector, table_name: str, column_name: str) -> str:
    """Get the data type of a column."""
    columns = inspector.get_columns(table_name)
    for col in columns:
        if col["name"] == column_name:
            return str(col["type"])
    return None


def check_migration_version() -> Tuple[bool, str]:
    """Check the current Alembic migration version."""
    try:
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version_num FROM alembic_version"))
            version = result.scalar()
            expected_version = "d1e2f3a4b5c6"
            return version == expected_version, version or "None"
    except Exception as e:
        return False, f"Error: {str(e)}"


def main():
    """Main verification function."""
    print("=" * 70)
    print("Database Schema Verification")
    print("=" * 70)
    print(
        f"Database URL: {settings.database_url.split('@')[1] if '@' in settings.database_url else 'Local SQLite'}"
    )
    print()

    inspector = inspect(engine)
    errors = []
    warnings = []

    # Check migration version
    print("Checking Alembic migration version...")
    migration_ok, version = check_migration_version()
    if migration_ok:
        print(f"✓ Migration version: {version} (expected: d1e2f3a4b5c6)")
    else:
        errors.append(f"✗ Migration version mismatch: {version} (expected: d1e2f3a4b5c6)")
        print(f"✗ Migration version: {version} (expected: d1e2f3a4b5c6)")
    print()

    # Required tables
    required_tables = [
        "users",
        "households",
        "household_members",
        "grocery_lists",
        "grocery_items",
        "pantry_items",
        "meals",
        "household_user_preferences",
        "alembic_version",
    ]

    print("Checking required tables...")
    for table in required_tables:
        if check_table_exists(inspector, table):
            print(f"✓ Table '{table}' exists")
        else:
            errors.append(f"✗ Table '{table}' is missing")
            print(f"✗ Table '{table}' is missing")
    print()

    # Check critical columns
    print("Checking critical columns...")

    # grocery_items.meal_type (added in migration b1f2c3d4e5f6)
    if check_column_exists(inspector, "grocery_items", "meal_type"):
        print("✓ Column 'grocery_items.meal_type' exists")
    else:
        errors.append(
            "✗ Column 'grocery_items.meal_type' is missing (added in migration b1f2c3d4e5f6)"
        )
        print("✗ Column 'grocery_items.meal_type' is missing")

    # pantry_items.low_stock_threshold should be float (changed in migration c7d8e9f0a1b2)
    if check_column_exists(inspector, "pantry_items", "low_stock_threshold"):
        col_type = get_column_type(inspector, "pantry_items", "low_stock_threshold")
        if (
            "float" in col_type.lower()
            or "double" in col_type.lower()
            or "real" in col_type.lower()
        ):
            print(f"✓ Column 'pantry_items.low_stock_threshold' exists as {col_type}")
        else:
            warnings.append(
                f"⚠ Column 'pantry_items.low_stock_threshold' is {col_type}, expected float (changed in migration c7d8e9f0a1b2)"
            )
            print(f"⚠ Column 'pantry_items.low_stock_threshold' is {col_type}, expected float")
    else:
        errors.append("✗ Column 'pantry_items.low_stock_threshold' is missing")
        print("✗ Column 'pantry_items.low_stock_threshold' is missing")

    # household_user_preferences table (added in migration d1e2f3a4b5c6)
    if check_table_exists(inspector, "household_user_preferences"):
        print("✓ Table 'household_user_preferences' exists")

        # Check JSON columns
        json_columns = ["diet_types", "cooking_apparatus", "previous_meals"]
        for col in json_columns:
            if check_column_exists(inspector, "household_user_preferences", col):
                col_type = get_column_type(inspector, "household_user_preferences", col)
                if "json" in col_type.lower() or "text" in col_type.lower():
                    print(f"✓ Column 'household_user_preferences.{col}' exists as {col_type}")
                else:
                    warnings.append(
                        f"⚠ Column 'household_user_preferences.{col}' is {col_type}, expected JSON"
                    )
                    print(
                        f"⚠ Column 'household_user_preferences.{col}' is {col_type}, expected JSON"
                    )
            else:
                errors.append(f"✗ Column 'household_user_preferences.{col}' is missing")
                print(f"✗ Column 'household_user_preferences.{col}' is missing")
    else:
        errors.append(
            "✗ Table 'household_user_preferences' is missing (added in migration d1e2f3a4b5c6)"
        )
        print("✗ Table 'household_user_preferences' is missing")

    print()
    print("=" * 70)
    print("Verification Summary")
    print("=" * 70)

    if errors:
        print(f"\n❌ Found {len(errors)} error(s):")
        for error in errors:
            print(f"  {error}")
        print("\n⚠️  Database schema is incomplete. Run migrations:")
        print("   railway run alembic upgrade head")
        return 1
    else:
        print("\n✅ All required tables and columns are present!")

    if warnings:
        print(f"\n⚠️  Found {len(warnings)} warning(s):")
        for warning in warnings:
            print(f"  {warning}")
        print("\n⚠️  Some columns may have unexpected types. Verify manually if needed.")

    if not errors and not warnings:
        print("\n✅ Database schema is fully up to date!")
        return 0

    return 0


if __name__ == "__main__":
    sys.exit(main())
