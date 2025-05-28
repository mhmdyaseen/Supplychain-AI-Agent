from Backend.main1 import SessionLocal, User, bcrypt

users = [
    {"username": "manager", "password": "manager123", "role": "manager", "description": "Manages operations", "location": "NY"},
    {"username": "finance", "password": "finance123", "role": "finance", "description": "Handles finance", "location": "London"},
    {"username": "operations", "password": "operations123", "role": "operations", "description": "Runs operations", "location": "Delhi"},
    {"username": "planner", "password": "planner123", "role": "planner", "description": "Plans logistics", "location": "Berlin"},
]

db = SessionLocal()
for u in users:
    hashed = bcrypt.hashpw(u["password"].encode(), bcrypt.gensalt()).decode()
    db.add(User(
        username=u["username"],
        hashed_password=hashed,
        role=u["role"],
        description=u["description"],
        location=u["location"]
    ))
db.commit()
db.close()
print("Users added.")
