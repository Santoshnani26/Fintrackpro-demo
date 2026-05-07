"""
Explanation Agent — rewrites any AI agent output in simple, user-friendly language.
Wraps the output of other agents to ensure non-technical users can understand insights.
"""
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", ""))


def explain(raw_output: str, context: str = "financial insight") -> str:
    """
    Takes raw agent output and returns a plain-English explanation.

    Args:
        raw_output: The technical or structured output from another agent
        context: Description of what the output represents

    Returns:
        Plain English explanation string
    """
    prompt = f"""Rewrite this {context} in simple, friendly language for someone who is not a finance expert.
Keep it under 2 sentences. Be encouraging and positive.

Input: {raw_output}

Output (plain English only, no JSON, no bullet points):"""

    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=100,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        # Fallback: return raw output as-is
        return raw_output


def explain_prediction(predicted_total: float, last_total: float) -> str:
    """Explain a spending prediction in plain English."""
    change = predicted_total - last_total
    direction = "increase" if change > 0 else "decrease"
    pct = abs(change / last_total * 100) if last_total > 0 else 0
    return (
        f"Based on your recent spending patterns, you're likely to spend around "
        f"₹{predicted_total:.0f} next month — a {pct:.0f}% {direction} from this month. "
        f"{'Consider reviewing your top categories to stay within budget.' if change > 0 else 'Great job keeping expenses down!'}"
    )
