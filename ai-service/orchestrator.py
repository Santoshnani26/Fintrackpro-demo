"""
Orchestrator — LangChain-based AgentExecutor that routes requests to the correct agent.
Each agent is registered as a LangChain Tool. The orchestrator decides which agent(s)
to call based on the user query.
"""
import os
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_openai import ChatOpenAI
from langchain.tools import tool
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from agents.alert import check_budget_alert
from agents.explanation import explain, explain_prediction


def build_orchestrator():
    """Build and return a LangChain AgentExecutor with all finance tools."""

    @tool
    def budget_alert_tool(spent: float, budget: float, category: str = None) -> str:
        """Check if a budget threshold has been exceeded and return an alert message."""
        result = check_budget_alert(spent, budget, category=category)
        return result["message"]

    @tool
    def explain_insight_tool(raw_text: str) -> str:
        """Rewrite a technical financial insight in plain English."""
        return explain(raw_text)

    @tool
    def explain_prediction_tool(predicted: float, previous: float) -> str:
        """Explain a spending prediction in simple, friendly language."""
        return explain_prediction(predicted, previous)

    llm = ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.3,
        api_key=os.getenv("OPENAI_API_KEY", ""),
    )

    tools = [budget_alert_tool, explain_insight_tool, explain_prediction_tool]

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are FinTrack Pro's AI financial assistant.
You help users understand their finances through clear, actionable insights.
Use the available tools to check budgets, explain insights, and predict spending.
Always be encouraging and constructive in your responses."""),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_openai_tools_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=False, max_iterations=3)


# Singleton — only build once
_orchestrator = None


def get_orchestrator() -> AgentExecutor:
    global _orchestrator
    if _orchestrator is None:
        _orchestrator = build_orchestrator()
    return _orchestrator
