"""Quick MongoDB inspection — lists collections and their document counts."""
import os
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv(".env.migration")

MONGO_URI    = os.environ["MONGO_URI"]
MONGO_DB     = os.environ["MONGO_DB_NAME"]

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=10000)
db = client[MONGO_DB]

collections = sorted(db.list_collection_names())
print(f"\nDatabase: {MONGO_DB}")
print(f"Total collections: {len(collections)}\n")
print(f"{'Collection':<50} {'Count':>8}")
print("-" * 60)
for col in collections:
    count = db[col].estimated_document_count()
    print(f"{col:<50} {count:>8}")
print()
