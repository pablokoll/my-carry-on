from extensions import db
from models import Bag, Item, SubItem


def duplicate_bag(bag: Bag, user_id: int) -> Bag:
    new_bag = Bag(user_id=user_id, name=f"{bag.name} (copy)", type=bag.type)
    db.session.add(new_bag)
    db.session.flush()

    for item in bag.items:
        new_item = Item(bag_id=new_bag.id, name=item.name, category_id=item.category_id, packed=False)
        db.session.add(new_item)
        db.session.flush()
        for sub in item.sub_items:
            db.session.add(SubItem(item_id=new_item.id, name=sub.name, quantity=sub.quantity, packed=False))

    db.session.commit()
    return new_bag
