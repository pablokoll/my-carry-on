from typing import cast

from sqlalchemy.orm import selectinload

from models import Bag, Item, Trip, TripBag


def _bag_packing_stats(bag: Bag) -> dict[str, object]:
    total = 0
    packed = 0
    for item in bag.items:
        if item.sub_items:
            for sub in item.sub_items:
                qty = sub.quantity or 1
                total += qty
                if sub.packed:
                    packed += qty
        else:
            total += item.quantity or 1
            if item.packed:
                packed += item.quantity or 1
    return {
        "id": bag.id,
        "name": bag.name,
        "type": bag.type,
        "items_total": total,
        "items_packed": packed,
    }


def get_trips_with_stats(
    user_id: int, limit: int | None = None
) -> list[dict[str, object]]:
    query = (
        Trip.query.filter_by(user_id=user_id)
        .order_by(Trip.is_active.desc(), Trip.start_date.desc())
        .options(
            selectinload(Trip.trip_bags)
            .selectinload(TripBag.bag)
            .selectinload(Bag.items)
            .selectinload(Item.sub_items)
        )
    )
    trips = query.limit(limit).all() if limit else query.all()

    result = []
    for trip in trips:
        d = trip.to_dict()
        bags = [_bag_packing_stats(tb.bag) for tb in trip.trip_bags]
        d["bags"] = bags
        d["items_total"] = sum(cast(int, b["items_total"]) for b in bags)
        d["items_packed"] = sum(cast(int, b["items_packed"]) for b in bags)
        result.append(d)
    return result
