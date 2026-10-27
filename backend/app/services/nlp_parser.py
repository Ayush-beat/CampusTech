import re
from datetime import date, timedelta
from decimal import Decimal
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.category import Category

CATEGORY_KEYWORDS = {
    "Food and Groceries": [
        "food", "lunch", "dinner", "breakfast", "canteen", "mess", "coffee", "chai",
        "tea", "snack", "snacks", "pizza", "burger", "maggi", "swiggy", "zomato",
        "groceries", "milk", "vegetables", "fruit", "fruits", "juice", "restaurant", "cafe"
    ],
    "Travel and Transportation": [
        "travel", "metro", "bus", "auto", "rickshaw", "rapido", "uber", "ola",
        "train", "ticket", "petrol", "fuel", "cab", "pass", "flight", "fare"
    ],
    "Education and Stationery": [
        "book", "books", "stationery", "notebook", "pen", "print", "printout",
        "photocopy", "xerox", "course", "udemy", "exam", "tuition", "lab", "notes", "assignment"
    ],
    "Accommodation and Rent": [
        "rent", "hostel", "room", "pg", "flat", "maintenance", "electricity", "water", "landlord"
    ],
    "Entertainment": [
        "movie", "cinema", "gaming", "game", "party", "outing", "concert", "club", "bowling"
    ],
    "Shopping": [
        "shopping", "clothes", "shirt", "pants", "shoes", "amazon", "flipkart", "myntra", "electronics"
    ],
    "Subscriptions": [
        "subscription", "spotify", "netflix", "prime", "youtube", "chatgpt", "github", "icloud", "recharge"
    ],
    "Health and Personal Care": [
        "medicine", "doctor", "pharmacy", "medical", "haircut", "gym", "salon", "clinic", "hospital"
    ],
    "College Events and Projects": [
        "event", "fest", "workshop", "hackathon", "project", "hardware", "arduino", "seminar", "club fee"
    ]
}

def parse_natural_language_expense(
    text: str,
    db: Session
) -> Dict[str, Any]:
    """
    Parses unstructured natural language text to extract expense amount, date, description,
    payment method, and suggested category.
    """
    text_clean = text.strip()
    lowered = text_clean.lower()
    
    # 1. Extract Amount
    # Matches ₹500, 500rs, 500 rupees, 500.50, paid 250, spent 120
    amount = None
    amount_match = re.search(r'(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr|rupees)?', lowered)
    if amount_match:
        try:
            val = Decimal(amount_match.group(1))
            if val > 0:
                amount = val
        except Exception:
            pass

    # 2. Extract Date
    target_date = date.today()
    if "yesterday" in lowered:
        target_date = date.today() - timedelta(days=1)
    elif "day before yesterday" in lowered:
        target_date = date.today() - timedelta(days=2)
    else:
        # Check explicit YYYY-MM-DD or DD-MM-YYYY
        date_match = re.search(r'\b(\d{4}-\d{2}-\d{2})\b', lowered)
        if date_match:
            try:
                target_date = date.fromisoformat(date_match.group(1))
            except Exception:
                pass

    # 3. Extract Payment Method
    payment_method = "UPI"
    if "cash" in lowered:
        payment_method = "Cash"
    elif "card" in lowered or "debit" in lowered:
        payment_method = "Debit Card"
    elif "credit" in lowered:
        payment_method = "Credit Card"
    elif "net banking" in lowered or "netbanking" in lowered:
        payment_method = "Net Banking"
    elif any(k in lowered for k in ["gpay", "google pay", "phonepe", "paytm", "upi"]):
        payment_method = "UPI"

    # 4. Detect Category
    detected_cat_name = "Miscellaneous"
    matched_score = 0
    
    for cat_name, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if re.search(r'\b' + re.escape(kw) + r'\b', lowered))
        if score > matched_score:
            matched_score = score
            detected_cat_name = cat_name

    # Fetch corresponding category model
    cat_model = db.query(Category).filter(Category.name == detected_cat_name).first()
    if not cat_model:
        cat_model = db.query(Category).first()

    # 5. Extract cleaned description
    # Remove phrases like "spent", "paid", "rs", "₹", "today", "yesterday", numbers
    cleaned_desc = text_clean
    noise_patterns = [
        r'\b(?:spent|paid|bought|purchase|for|on|via|through|using)\b',
        r'(?:₹|rs\.?|inr|rupees)\s*\d+(?:\.\d{1,2})?',
        r'\b\d+(?:\.\d{1,2})?\s*(?:₹|rs\.?|inr|rupees)?\b',
        r'\b(?:today|yesterday|upi|cash|card|gpay|paytm)\b'
    ]
    for p in noise_patterns:
        cleaned_desc = re.sub(p, ' ', cleaned_desc, flags=re.IGNORECASE)
    
    cleaned_desc = re.sub(r'\s+', ' ', cleaned_desc).strip(" ,.-")
    if not cleaned_desc or len(cleaned_desc) < 2:
        cleaned_desc = f"{detected_cat_name} expense"

    success = amount is not None and amount > Decimal("0.00")
    confidence = "high" if (success and matched_score > 0) else ("medium" if success else "low")
    
    explanation = (
        f"Detected amount ₹{amount} for '{cleaned_desc}' mapped to '{detected_cat_name}' on {target_date}."
        if success else "Could not identify a clear monetary amount in the phrase. Please specify an amount (e.g. ₹150 for lunch)."
    )

    return {
        "parsed_successfully": success,
        "amount": amount,
        "description": cleaned_desc.capitalize() if cleaned_desc else "Expense",
        "date": target_date,
        "suggested_category_id": cat_model.id if cat_model else None,
        "suggested_category_name": cat_model.name if cat_model else detected_cat_name,
        "payment_method": payment_method,
        "confidence": confidence,
        "explanation": explanation
    }
