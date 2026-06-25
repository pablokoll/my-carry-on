from datetime import date, datetime

from extensions import db


class BaseModel(db.Model):
    __abstract__ = True

    def to_dict(self):
        result = {}
        for c in self.__table__.columns:  # type: ignore[attr-defined]
            val = getattr(self, c.name)
            if isinstance(val, (datetime, date)):
                val = val.isoformat()
            result[c.name] = val
        return result
