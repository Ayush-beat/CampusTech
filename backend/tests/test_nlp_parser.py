from app.services.nlp_parser import parse_natural_language_expense

def test_nlp_parser_lunch(db_session):
    res = parse_natural_language_expense("Spent ₹120 on lunch today", db_session)
    assert res["parsed_successfully"] is True
    assert res["amount"] == 120
    assert "lunch" in res["description"].lower()
    assert res["suggested_category_name"] == "Food and Groceries"

def test_nlp_parser_books(db_session):
    res = parse_natural_language_expense("Paid 450 rs for books yesterday", db_session)
    assert res["parsed_successfully"] is True
    assert res["amount"] == 450
    assert "book" in res["description"].lower()
    assert res["suggested_category_name"] == "Education and Stationery"

def test_nlp_parser_invalid(db_session):
    res = parse_natural_language_expense("Just a random conversation with friends", db_session)
    assert res["parsed_successfully"] is False
