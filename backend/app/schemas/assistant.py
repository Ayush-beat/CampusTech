from pydantic import BaseModel
from typing import Optional, List
from datetime import date
from decimal import Decimal

class AssistantQueryRequest(BaseModel):
    query: str
    year: Optional[int] = None
    month: Optional[int] = None

class AssistantFact(BaseModel):
    label: str
    value: str

class AssistantQueryResponse(BaseModel):
    query: str
    answer: str
    facts: List[AssistantFact] = []
    is_prediction: bool = False
    suggested_followups: List[str] = []

class NaturalLanguageExpenseRequest(BaseModel):
    input_text: str

class NaturalLanguageExpenseResponse(BaseModel):
    parsed_successfully: bool
    amount: Optional[Decimal] = None
    description: Optional[str] = None
    date: Optional[date] = None
    suggested_category_id: Optional[int] = None
    suggested_category_name: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    confidence: str # "high", "medium", "low"
    explanation: str
