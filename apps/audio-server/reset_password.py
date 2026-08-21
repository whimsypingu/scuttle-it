"""
Standalone admin script to reset the Scuttle password

Usage: python reset_password.py
"""

import getpass
import sqlite3
import hashlib
import sys
import os

from config import settings

def hash_password(password: str) -> tuple[str, str]:
    salt_bytes = os.urandom(32) #https://docs.python.org/3/library/hashlib.html
    salt = salt_bytes.hex()

    computed_hash = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt_bytes,
        n=16384,
        r=8,
        p=1
    ).hex()

    return computed_hash, salt

def main():
    db_path = settings.DATA_DIR / "scuttle.db"

    print(f"=== Scuttle Admin Reset Password ===")
    print(f"Database located at: {db_path}")

    #prompt without echo
    pw1 = getpass.getpass("Enter new password: ")
    if len(pw1) >= 512:
        print("Error: Password is too long.")
        sys.exit(1)

    pw2 = getpass.getpass("Confirm new password: ")
    if pw1 != pw2:
        print("Error: Passwords do not match.")
        sys.exit(1)

    hashed_pw, salt = hash_password(pw1)

    with sqlite3.connect(db_path) as conn:
        cursor = conn.cursor()

        #update password
        cursor.execute("UPDATE settings SET password_hash = ?, password_salt = ? WHERE id = 1;", (hashed_pw, salt))

        #clear current existing sessions for security
        cursor.execute("DELETE FROM auth;")

        conn.commit()

    print("+ Password successfully updated.")
    print("+ All active sessions have been invalidated.")


if __name__ == "__main__":
    main()