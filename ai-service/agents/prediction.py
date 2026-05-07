from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Any
from collections import defaultdict
from datetime import datetime
import os
from openai import OpenAI

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


class ExpenseData(BaseModel):
    expenses: List[Any]


@router.post("/predict")
async def predict_expenses(data: ExpenseData):
    """Prediction Agent — forecasts next month's spending by category."""
    if len(data.expenses) < 3:
        return {
            "predictedTotal": 0,
            "confidence": 0.3,
            "message": "Need more data for accurate predictions (min 3 transactions)",
            "categoryBreakdown": [],
        }

    # Group by month and category
    monthly_by_cat: dict[str, dict[str, float]] = defaultdict(lambda: defaultdict(float))
    for e in data.expenses:
        try:
            date_str = e.get("date", "")
            month_key = date_str[:7]  # YYYY-MM
            cat = e.get("category", "Other")
            amt = float(e.get("amount", 0))
            monthly_by_cat[month_key][cat] += amt
        except Exception:
            continue

    if not monthly_by_cat:
        return {"predictedTotal": 0, "confidence": 0.2, "categoryBreakdown": []}

    # Average per category across months
    all_cats: dict[str, list[float]] = defaultdict(list)
    for month_data in monthly_by_cat.values():
        for cat, amt in month_data.items():
            all_cats[cat].append(amt)

    category_avg = {cat: sum(amts) / len(amts) for cat, amts in all_cats.items()}
    predicted_total = sum(category_avg.values())

    # Apply slight growth factor (5%)
    predicted_total *= 1.05

    breakdown = []
    for cat, avg in sorted(category_avg.items(), key=lambda x: x[1], reverse=True):
        predicted_amt = avg * 1.05
        pct = (predicted_amt / predicted_total * 100) if predicted_total > 0 else 0
        breakdown.append({
            "category": cat,
            "amount": round(predicted_amt),
            "percentage": round(pct),
        })

    months_count = len(monthly_by_cat)
    confidence = min(0.9, 0.4 + months_count * 0.1)

    return {
        "predictedTotal": round(predicted_total),
        "confidence": round(confidence, 2),
        "monthsAnalyzed": months_count,
        "categoryBreakdown": breakdown,
    }
