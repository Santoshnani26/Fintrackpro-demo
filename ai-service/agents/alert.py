"""
Alert Agent — monitors budget thresholds and generates alert messages.
Called by the backend whenever an expense is added or budget is saved.
"""
from typing import Optional


def check_budget_alert(
    spent: float,
    budget: float,
    threshold_pct: int = 80,
    category: Optional[str] = None
) -> dict:
    """
    Returns alert info if spending has crossed the threshold.
    
    Args:
        spent: amount spent so far
        budget: total budget limit
        threshold_pct: alert when spent >= this % of budget (default 80)
        category: optional category name for category-level alerts
    
    Returns:
        dict with { triggered: bool, level: str, message: str, percentage: float }
    """
    if budget <= 0:
        return {"triggered": False, "level": "none", "percentage": 0, "message": ""}

    percentage = (spent / budget) * 100
    label = f"{category} budget" if category else "monthly budget"

    if percentage >= 100:
        return {
            "triggered": True,
            "level": "critical",
            "percentage": round(percentage, 1),
            "message": f"⚠️ You have exceeded your {label}! Spent ₹{spent:.0f} of ₹{budget:.0f}.",
        }
    elif percentage >= threshold_pct:
        remaining = budget - spent
        return {
            "triggered": True,
            "level": "warning",
            "percentage": round(percentage, 1),
            "message": f"🔔 You have used {percentage:.0f}% of your {label}. Only ₹{remaining:.0f} remaining.",
        }
    else:
        return {
            "triggered": False,
            "level": "ok",
            "percentage": round(percentage, 1),
            "message": f"✅ {label.capitalize()} is on track ({percentage:.0f}% used).",
        }
