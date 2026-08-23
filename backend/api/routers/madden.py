from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import os
import random
from database import SessionLocal, get_db
from models import Roster, User, DraftPick, League, MatchupHistory, SleeperTransaction, PlayerAdvancedStats

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

router = APIRouter()

class AskMaddenRequest(BaseModel):
    prompt: str
    league_id: Optional[str] = "1312567432052760576"
    roster_id: Optional[int] = None

MADDEN_SYSTEM_PROMPT = """You are legendary Hall of Fame NFL Coach, broadcaster, and football icon JOHN MADDEN.
You are running the "ASK MADDEN" dynasty football war room for fantasy managers.

# YOUR PERSONALITY & VOICE
- You speak with unstoppable energy, booming excitement, and legendary football wisdom.
- Use your iconic catchphrases naturally: "BOOM!", "POW!", "Now here's a guy who...", "If you score more points than the other guy, you win the game!", "Turducken!", "Look at the trenches!", "Gotta protect the football!", "Sweatin' through the Gatorade bucket!", "Tough actin' Tinactin!".
- You use your TELSTRATOR to draw circles and arrows on everything (e.g., "[TELESTRATOR: Draw big yellow circle around the offensive line]").
- You love big physical running backs, dominant offensive lines, explosive wideouts, and coaches who make smart, tough decisions.
- You hate benching your studs, leaving points on the pine, and holding onto declining veterans without a fight.
- Blend your legendary broadcast enthusiasm with the LIVE QUANT STATS and LEAGUE DATA provided in the context.

# FORMATTING
- Start with a signature John Madden hook ("BOOM!", "Now here's a guy...", etc.).
- Give a decisive, punchy verdict (Who to start, whether to accept a trade, how to rebuild, or who's dominating the league).
- Use [TELESTRATOR: ...] commentary to break down the play.
- Conclude with a classic Madden one-liner or Turducken reference.
- Keep the response exciting, tactical, and entertaining!
"""

MADDEN_QUOTES = [
    "If you score more points than the other guy, you usually win the game!",
    "When you get hit, you gotta hit back harder. BOOM!",
    "Now here's a guy who when he runs, he goes forward!",
    "You don't win games in the owner's lounge, you win 'em in the trenches!",
    "Pass or run, just don't cough up the football!",
    "Turducken time! Three birds, one pan, pure dominance!",
    "If the quarterback throws the ball into the end zone and the receiver catches it, that's a touchdown!"
]

def build_league_context(league_id: str, session: Session) -> Dict[str, Any]:
    """Extracts live league standings, rosters, and top scorers to feed Coach Madden."""
    context = {"league_id": league_id, "teams": [], "records": {}, "recent_trades": []}
    
    if not league_id:
        return context

    try:
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        owner_map = {r.roster_id: (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}") for r in rosters}
        
        for r in rosters:
            context["teams"].append({
                "roster_id": r.roster_id,
                "name": owner_map.get(r.roster_id),
                "record": f"{r.wins}-{r.losses}",
                "fpts": round(r.fpts or 0, 1),
                "starters_count": len(r.starters or []),
                "players_count": len(r.players or [])
            })
            
        # Recent trades
        trades = session.query(SleeperTransaction).filter(
            SleeperTransaction.league_id == league_id,
            SleeperTransaction.type == 'trade',
            SleeperTransaction.status == 'complete'
        ).order_by(SleeperTransaction.season.desc(), SleeperTransaction.week.desc()).limit(3).all()
        
        for t in trades:
            if t.adds:
                r_ids = list(set(t.adds.values()))
                teams = [owner_map.get(r_id, f"Team {r_id}") for r_id in r_ids]
                context["recent_trades"].append(f"{', '.join(teams)} (Week {t.week}, {t.season})")
                
    except Exception as e:
        print(f"Error building league context for Madden: {e}")
        
    return context


def heuristic_madden_response(prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """High-depth fallback engine generating authentic John Madden commentary when offline."""
    prompt_lower = prompt.lower()
    teams = context.get("teams", [])
    top_team = max(teams, key=lambda x: x["fpts"]) if teams else None
    quote = random.choice(MADDEN_QUOTES)
    
    # 1. Trade Question
    if any(w in prompt_lower for w in ["trade", "deal", "swap", "package", "offer"]):
        telestrator = "[TELESTRATOR: Draw big yellow arrows circling both sides of the deal]"
        answer = (
            f"BOOM! Now here's a blockbuster trade question! When you make a trade in dynasty football, "
            f"you can't just look at the names on the jersey—you gotta look at the production in the trenches! "
            f"\n\n{telestrator}\n\n"
            f"If you're giving up a proven, high-motor stud, you better be getting back championship-caliber starter firepower "
            f"or multiple early first-round draft picks that give you fresh legs. "
            f"If the guy you're trading for puts the ball in the end zone on 3rd-and-goal, YOU PULL THE TRIGGER! "
            f"Never hold onto declining veteran assets when you can cash out for future dynasty leverage. POW!"
        )
        actions = ["Audit replacement level VORP", "Check future draft pick depreciation", "Pull the trigger if getting peak firepower"]
        sentiment = "TACTICAL"

    # 2. Start / Sit Question
    elif any(w in prompt_lower for w in ["start", "sit", "flex", "lineup", "bench"]):
        telestrator = "[TELESTRATOR: Draw a dotted yellow line straight down the sideline]"
        answer = (
            f"POW! Lineup time! You know what I always say: NEVER OUTSMART YOURSELF ON SUNDAY MORNING! "
            f"\n\n{telestrator}\n\n"
            f"You start the guy who touches the football when the game is on the line. Look at the volume! "
            f"If a running back is getting 18 carries between the tackles and catching passes on 3rd down, you start him. "
            f"Don't get cute putting a gadget WR in your Flex hoping for a 70-yard trick play. "
            f"Give me the guy who runs through contact, puts his helmet down, and scores six! BOOM!"
        )
        actions = ["Start the high-touch volume player", "Lock in red zone target shares", "Leave gadget plays on the pine"]
        sentiment = "BULLISH"

    # 3. Team Breakdown / Standings / Who is winning
    elif any(w in prompt_lower for w in ["team", "standings", "best", "win", "champion", "ranking", "tiers"]):
        leader_str = f"{top_team['name']} ({top_team['fpts']} Max PF)" if top_team else "The league leader"
        telestrator = "[TELESTRATOR: Circle the top of the standings board in glowing chalk]"
        answer = (
            f"BOOM! Let's talk about the power dynamics in this league! Right now, {leader_str} is setting the pace! "
            f"Why? Because when they step onto the field, they score more points than the other guy, and that's how you win football games! "
            f"\n\n{telestrator}\n\n"
            f"If you're sitting in the middle of the pack, you can't just sit there twiddling your thumbs. You gotta decide: "
            f"are you loading up for a title run with proven veterans, or are you tearing it down to draft the next franchise quarterback? "
            f"There's no room for timid football in dynasty!"
        )
        actions = ["Inspect Power Matrix quadrants", "Check championship longevity index", "Consolidate depth into elite starters"]
        sentiment = "CHAMPIONSHIP"

    # 4. General / Philosophy / Roasts
    else:
        telestrator = "[TELESTRATOR: Draw two giant X's colliding at the line of scrimmage]"
        answer = (
            f"BOOM! Now here's a guy asking the big questions! You wanna know what championship fantasy football is all about? "
            f"It's about having guys who can line up, look the opponent in the eye, and shove the ball right down their throat! "
            f"\n\n{telestrator}\n\n"
            f"Whether you're working the waiver wire at 3 AM or wheeling and dealing before the deadline, "
            f"you gotta stay aggressive. Protect the football, value your draft capital, and when in doubt—GET THE BALL TO YOUR PLAYMAKERS!"
        )
        actions = ["Attack the waiver wire", "Analyze target share efficiency", "Dominate the trenches"]
        sentiment = "LEGENDARY"

    return {
        "answer": answer,
        "quote": quote,
        "telestrator": telestrator,
        "suggested_actions": actions,
        "sentiment": sentiment
    }


@router.post("/api/ai/ask-madden")
def ask_madden(req: AskMaddenRequest):
    session = SessionLocal()
    try:
        context = build_league_context(req.league_id, session)
        
        # Check Gemini API Key
        try:
            from dotenv import load_dotenv
            env_path = os.path.join(os.path.dirname(__file__), '.env')
            load_dotenv(dotenv_path=env_path, override=True)
        except ImportError:
            pass

        gemini_key = os.environ.get("GEMINI_API_KEY")
        if gemini_key and genai:
            try:
                client = genai.Client(api_key=gemini_key)
                user_prompt = f"USER QUESTION:\n{req.prompt}\n\nLIVE LEAGUE CONTEXT:\n{json.dumps(context, indent=2)}\n\nRespond as John Madden."
                
                response = client.models.generate_content(
                    model='gemini-2.5-flash',
                    contents=user_prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=MADDEN_SYSTEM_PROMPT,
                        temperature=0.8,
                    )
                )
                
                text = response.text
                quote = random.choice(MADDEN_QUOTES)
                
                return {
                    "answer": text,
                    "quote": quote,
                    "telestrator": "[TELESTRATOR: Big yellow circle on the play]",
                    "suggested_actions": ["Execute Madden Playbook", "Check Lineup Matchup", "Review Trade Ledger"],
                    "sentiment": "BOOM"
                }
            except Exception as e:
                print(f"Gemini error in Ask Madden, falling back to local Madden engine: {e}")

        # Local Open-Source Heuristic Madden Engine
        return heuristic_madden_response(req.prompt, context)

    finally:
        session.close()
