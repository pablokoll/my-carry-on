_cache: list[str] | None = None


def get_categories() -> list[str]:
    global _cache
    if _cache is not None:
        return _cache
    from models import Category

    cats = Category.query.filter((Category.user_id == None) | Category.is_default).all()  # noqa: E711
    _cache = [c.name for c in cats]
    return _cache
