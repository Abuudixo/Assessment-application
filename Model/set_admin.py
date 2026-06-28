from backend.db import SessionLocal
from backend.models import User

db = SessionLocal()
try:
    user = db.query(User).filter(User.email == 'abdallabile2@gmail.com').first()
    if user:
        user.is_admin = 1
        db.commit()
        print("Admin set for abdallabile2@gmail.com in Aiven MySQL")
    else:
        print("User abdallabile2@gmail.com not found")
finally:
    db.close()
