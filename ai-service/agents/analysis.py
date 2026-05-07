from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Any
import os
from openai import OpenAI

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


class ExpenseData(BaseModel):
    expenses: List[Any]


@router.post("/analyze")
async def analyze_expenses(data: ExpenseData):
    """Expense Analysis Agent — identifies spending patterns and provides insights."""
    if not data.expenses:
        return {
            "insights": [
                {"emoji": "💡", "title": "No Data Yet", "description": "Add your first expense to start tracking!"}
            ]
        }

    # Summarize expenses for prompt
    category_totals: dict[str, float] = {}
    total = 0.0
    for e in data.expenses:
        cat = e.get("category", "Other")
        amt = float(e.get("amount", 0))
        category_totals[cat] = category_totals.get(cat, 0) + amt
        total += amt

    summary = "\n".join([f"- {cat}: ₹{amt:.0f}" for cat, amt in category_totals.items()])

    prompt = f"""You are a personal finance advisor AI. Analyze these expense categories:
{summary}
Total: ₹{total:.0f}

Provide 3 concise, personalized financial insights in JSON format:
{{
  "insights": [
    {{"emoji": "...", "title": "short title", "description": "1-2 sentence insight"}},
    ...
  ]
}}
Keep descriptions actionable and specific. Return ONLY valid JSON."""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=400,
            response_format={"type": "json_object"},
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        # Fallback insights without OpenAI
        top_cat = max(category_totals, key=category_totals.get) if category_totals else "Unknown"
        return {
            "insights": [
                {"emoji": "📊", "title": f"Top Spending: {top_cat}",
                 "description": f"You spend the most on {top_cat} (₹{category_totals.get(top_cat, 0):.0f}). Consider setting a budget for this category."},
                {"emoji": "💰", "title": "Monthly Overview",
                 "description": f"Total tracked expenses: ₹{total:.0f}. Track daily to stay within budget."},
                {"emoji": "🎯", "title": "Set Budgets",
                 "description": "Go to Settings to configure category budgets and get alerts before overspending."},
            ]
        }
