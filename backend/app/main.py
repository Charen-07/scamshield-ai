"""Minimal ScamShield AI analysis API.

The rule-based analyzer below is intentionally kept behind ``analyze_message`` so
an LLM-backed extractor can replace it later without changing the HTTP contract.
"""

from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Dict, List, Sequence

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


class AnalyzeRequest(BaseModel):
    """Payload accepted by the frontend analysis request."""

    email_text: str = Field(default="")
    sender: str = Field(default="")
    subject: str = Field(default="")


class Recommendation(BaseModel):
    title: str
    body: str


class Tactic(BaseModel):
    key: str
    label: str
    value: str
    score: int
    color: str
    evidence: str


class Evidence(BaseModel):
    label: str
    text: str
    detail: str


class Baseline(BaseModel):
    verdict: str
    score: int
    note: str


class AnalyzeResponse(BaseModel):
    verdict: str
    riskLevel: str
    summary: str
    requestedAction: str
    target: str
    recommendation: Recommendation
    tactics: List[Tactic]
    evidence: List[Evidence]
    baseline: Baseline
    demo: bool = False


@dataclass(frozen=True)
class Rule:
    key: str
    label: str
    patterns: Sequence[str]
    high_score: int
    medium_score: int
    high_value: str
    medium_value: str
    color: str
    evidence_label: str
    detail: str


RULES: Sequence[Rule] = (
    Rule(
        key="urgency",
        label="Urgency pressure",
        patterns=(
            r"\bwithin\s+(?:the\s+next\s+)?\d+\s+(?:hours?|days?)\b",
            r"\b(?:urgent|immediately|immediate action|act now|as soon as possible|expires?|deadline|today|right away)\b",
            r"\b(?:avoid|prevent)\s+(?:a\s+)?(?:late fee|suspension|closure|lockout)\b",
        ),
        high_score=90,
        medium_score=62,
        high_value="High",
        medium_value="Medium",
        color="coral",
        evidence_label="Urgency",
        detail="A deadline or threat compresses the time available to verify the request.",
    ),
    Rule(
        key="authority",
        label="Authority claim",
        patterns=(
            r"\b(?:security|support|administrator|admin|compliance|hr|human resources|accounts? payable|ceo|cfo|director|executive)\b",
            r"\b(?:official|verified|trusted)\s+(?:team|department|portal|notice)\b",
        ),
        high_score=82,
        medium_score=58,
        high_value="High",
        medium_value="Medium",
        color="amber",
        evidence_label="Authority claim",
        detail="The message leans on a trusted role or department to make the request feel legitimate.",
    ),
    Rule(
        key="credential",
        label="Credential request",
        patterns=(
            r"\b(?:confirm|verify|reset|enter|provide|send|share)\b[^.?!\n]{0,60}\b(?:password|passcode|verification code|security code|login|credentials?|account details?)\b",
            r"\b(?:password|passcode|verification code|security code|credentials?)\b",
            r"\b(?:sign in|log in|login)\b[^.?!\n]{0,60}\b(?:link|portal|page|below)\b",
        ),
        high_score=98,
        medium_score=76,
        high_value="High",
        medium_value="High",
        color="coral",
        evidence_label="Credential request",
        detail="A request for passwords, codes, or login details can expose account access.",
    ),
    Rule(
        key="payment",
        label="Payment request",
        patterns=(
            r"\b(?:pay|payment|invoice|wire|transfer|remittance|bank(?:ing)? details?|routing number|account number|gift cards?|crypto(?:currency)?|bitcoin)\b",
            r"\b(?:purchase|buy|send)\b[^.?!\n]{0,50}\b(?:gift cards?|money|funds|payment|transfer)\b",
        ),
        high_score=94,
        medium_score=68,
        high_value="High",
        medium_value="Medium",
        color="coral",
        evidence_label="Payment request",
        detail="Money movement or changed payment instructions should be verified independently.",
    ),
    Rule(
        key="bypass",
        label="Process bypass",
        patterns=(
            r"\b(?:keep this|keep it)\s+(?:between us|confidential|secret)\b",
            r"\b(?:do not|don't)\s+(?:tell|contact|call|reply to)\b",
            r"\b(?:click|use|open|visit)\b[^.?!\n]{0,80}\b(?:link|portal|attachment|url|website)\b",
            r"https?://\S+",
        ),
        high_score=79,
        medium_score=57,
        high_value="High",
        medium_value="Medium",
        color="amber",
        evidence_label="External action",
        detail="The message steers you away from a known process or trusted channel.",
    ),
)


def _first_match(text: str, patterns: Sequence[str]) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.IGNORECASE)
        if match:
            return match.group(0).strip()
    return None


def _tactic_for_rule(rule: Rule, text: str) -> tuple[Tactic, Evidence | None]:
    match = _first_match(text, rule.patterns)
    if not match:
        tactic = Tactic(
            key=rule.key,
            label=rule.label,
            value="None",
            score=0,
            color="slate",
            evidence=f"No {rule.label.lower()} detected",
        )
        return tactic, None

    score = rule.high_score if rule.key in {"credential", "payment"} or len(match) > 20 else rule.medium_score
    value = rule.high_value if score >= 75 else rule.medium_value
    tactic = Tactic(
        key=rule.key,
        label=rule.label,
        value=value,
        score=score,
        color=rule.color,
        evidence=f'“{match[:110]}”',
    )
    evidence = Evidence(
        label=rule.evidence_label,
        text=f'“{match[:110]}”',
        detail=rule.detail,
    )
    return tactic, evidence


def _requested_action(text: str, tactics: Sequence[Tactic]) -> tuple[str, str]:
    lowered = text.lower()
    if tactics and any(t.key == "credential" and t.score for t in tactics):
        if "password" in lowered:
            return "Confirm account credentials", "Login password and account access"
        return "Provide account or verification details", "Account access and authentication data"
    if tactics and any(t.key == "payment" and t.score for t in tactics):
        if "gift card" in lowered:
            return "Purchase or send gift cards", "Money and gift card codes"
        return "Send or change a payment", "Funds, banking details, or invoice payment"
    if tactics and any(t.key == "bypass" and t.score for t in tactics):
        return "Follow an external link or unusual process", "Account, payment, or message contents"
    return "No sensitive action detected", "Not identified"


def analyze_message(request: AnalyzeRequest) -> AnalyzeResponse:
    """Run the replaceable analysis strategy used by the API endpoint."""

    text = "\n".join(part for part in (request.sender, request.subject, request.email_text) if part).strip()
    tactics: List[Tactic] = []
    evidence: List[Evidence] = []
    for rule in RULES:
        tactic, item = _tactic_for_rule(rule, text)
        tactics.append(tactic)
        if item:
            evidence.append(item)

    active = [tactic for tactic in tactics if tactic.score > 0]
    total_score = min(100, round(sum(tactic.score for tactic in active) / 2.5))
    if not text:
        total_score = 0
    elif not active:
        total_score = 12

    if total_score >= 65:
        verdict, risk_level = "High-risk", "high"
        summary = "This message uses pressure or sensitive requests that should be independently verified before you act."
        recommendation = Recommendation(
            title="Pause and verify through a known channel",
            body="Do not click links, share credentials, or move money until you confirm the request using a trusted contact method.",
        )
    elif total_score >= 30:
        verdict, risk_level = "Needs review", "medium"
        summary = "This message contains signals worth checking carefully before you respond or follow its instructions."
        recommendation = Recommendation(
            title="Verify the sender and request",
            body="Open the official website manually or contact the person through a known channel before taking action.",
        )
    else:
        verdict, risk_level = "Likely safe", "low"
        summary = "No strong scam pattern was detected, but unexpected requests should still be verified."
        recommendation = Recommendation(
            title="Use normal caution",
            body="Avoid sharing sensitive information and verify unexpected requests through a trusted channel.",
        )

    requested_action, target = _requested_action(text, tactics)
    baseline_score = min(100, round(total_score * 0.55))
    baseline_verdict = "Likely safe" if baseline_score < 35 else "Needs review" if baseline_score < 65 else "High-risk"
    return AnalyzeResponse(
        verdict=verdict,
        riskLevel=risk_level,
        summary=summary,
        requestedAction=requested_action,
        target=target,
        recommendation=recommendation,
        tactics=tactics,
        evidence=evidence,
        baseline=Baseline(
            verdict=baseline_verdict,
            score=baseline_score,
            note="A simple keyword baseline is included for comparison with the tactic-aware rule engine.",
        ),
        demo=False,
    )


app = FastAPI(title="ScamShield AI API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    return analyze_message(request)
