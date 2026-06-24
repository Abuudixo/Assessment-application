import sqlite3
conn = sqlite3.connect('backend/backend.sqlite')
conn.execute("UPDATE users SET is_admin = 1 WHERE email = 'abdallabile2@gmail.com'")
conn.commit()
print("Admin set for abdallabile2@gmail.com")
conn.close()
