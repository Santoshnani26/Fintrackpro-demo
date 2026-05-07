from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Any
from collections import defaultdict
import os
from openai import OpenAI

router = APIRouter()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


class ExpenseData(BaseModel):
    expenses: List[Any]


@router.post("/recommend")
async def recommend(data: ExpenseData):
    """Recommendation Agent — personalized savings tips."""
    if not data.expenses:
        return {"recommendations": [
            {"title": "Start Tracking", "description": "Add your first expense to get personalized recommendations."}
        ]}

    # Build category summary
    cat_totals: dict[str, float] = defaultdict(float)
    for e in data.expenses:
        cat_totals[e.get("category", "Other")] += float(e.get("amount", 0))

    top3 = sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)[:3]
    summary = ", ".join([f"{c}: ₹{a:.0f}" for c, a in top3])

    prompt = f"""As a financial advisor, give 3 specific saving recommendations for someone spending: {summary}.
Return JSON: {{"recommendations": [{{"title": "...", "description": "..."}}]}}
Be specific and actionable. Return ONLY valid JSON."""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=300,
            response_format={"type": "json_object"},
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception:
        recs = []
        for cat, amt in top3:
            tips = {
                "Food": "Consider meal prepping at home to cut food costs by up to 40%.",
                "Travel": "Use public transport or carpool to reduce travel expenses significantly.",
                "Shopping": "Apply the 24-hour rule before purchases to avoid impulse buying.",
                "Bills": "Review and cancel unused subscriptions — many people waste money here.",
                "Entertainment": "Look for free or discounted alternatives for entertainment activities.",
            }
            recs.append({"title": f"Reduce {cat} spending", "description": tips.get(cat, f"Review your {cat} spending for potential savings.")})
        return {"recommendations": recs}
