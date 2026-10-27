from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.schemas.assistant import (
    AssistantQueryRequest, AssistantQueryResponse,
    NaturalLanguageExpenseRequest, NaturalLanguageExpenseResponse
)
from app.core.deps import get_current_user
from app.services.query_assistant import answer_financial_query
from app.services.nlp_parser import parse_natural_language_expense

router = APIRouter(prefix="/assistant", tags=["Expense Assistant & NLP"])

@router.post("/ask", response_model=AssistantQueryResponse)
def ask_expenses_assistant(
    request: AssistantQueryRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Answers analytical questions using authenticated user's records.
    Never executes arbitrary SQL; relies on validated analytical procedures.
    """
    res = answer_financial_query(
        db=db,
        user_id=current_user.id,
        query_text=request.query,
        year=request.year,
        month=request.month
    )
    return AssistantQueryResponse(**res)

@router.post("/parse-nlp", response_model=NaturalLanguageExpenseResponse)
def parse_nlp_expense(
    request: NaturalLanguageExpenseRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Parses unstructured text like 'Spent 120 on lunch today' into structured expense fields.
    Returns proposal for user confirmation form.
    """
    res = parse_natural_language_expense(
        text=request.input_text,
        db=db
    )
    return NaturalLanguageExpenseResponse(**res)
