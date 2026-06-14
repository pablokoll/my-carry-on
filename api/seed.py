from app import create_app
from extensions import db
from models import Category

DEFAULT_CATEGORIES = [
    "Clothing",
    "Personal Care",
    "Electronics",
    "Documents",
    "Medications",
    "Accessories",
    "Footwear",
    "Entertainment",
    "Gear & Equipment",
]


def seed_categories():
    existing = {c.name for c in Category.query.filter_by(is_default=True).all()}
    added = 0
    for name in DEFAULT_CATEGORIES:
        if name not in existing:
            db.session.add(Category(name=name, is_default=True))
            added += 1
    db.session.commit()
    print(f"Seeded {added} categories ({len(existing)} already existed).")


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        seed_categories()
