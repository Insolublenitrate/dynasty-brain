from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import os
import random
import re
import pandas as pd
from database import SessionLocal, get_db
from models import Roster, User, DraftPick, League, MatchupHistory, SleeperTransaction, PlayerAdvancedStats
from quant.draft_depreciation import DraftPick as QuantDraftPick, evaluate_pick_portfolio

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
    """Extracts live league standings, rosters, draft capital, and age metrics to feed Coach Madden using Pandas."""
    context = {"league_id": league_id, "teams": [], "records": {}, "recent_trades": [], "quant_summary": {}}
    
    if not league_id:
        return context

    try:
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        owner_map = {r.roster_id: (r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}") for r in rosters}
        
        # Load draft capital per team
        picks = session.query(DraftPick).filter(DraftPick.league_id == league_id).all()
        pick_map = {}
        for p in picks:
            owner_key = p.owner_id
            if owner_key not in pick_map:
                pick_map[owner_key] = []
            try:
                yr = int(p.season) if str(p.season).isdigit() else 2026
                pick_map[owner_key].append(QuantDraftPick(year=yr, round=p.round or 1))
            except Exception:
                pass

        for r in rosters:
            q_picks = pick_map.get(r.id, []) or pick_map.get(r.roster_id, [])
            capital_val = round(evaluate_pick_portfolio(q_picks), 1) if q_picks else 0.0

            context["teams"].append({
                "roster_id": r.roster_id,
                "name": owner_map.get(r.roster_id),
                "record": f"{r.wins}-{r.losses}",
                "fpts": round(r.fpts or 0, 1),
                "draft_capital": capital_val,
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

        # ── PANDAS QUANT ENGINE AGGREGATION ────────────────────────────
        if context["teams"]:
            df = pd.DataFrame(context["teams"])
            leader_fpts = df.sort_values(by="fpts", ascending=False).iloc[0]
            leader_capital = df.sort_values(by="draft_capital", ascending=False).iloc[0]
            mean_fpts = round(float(df["fpts"].mean()), 1)
            mean_capital = round(float(df["draft_capital"].mean()), 1)

            context["quant_summary"] = {
                "top_firepower_team": str(leader_fpts["name"]),
                "top_firepower_points": float(leader_fpts["fpts"]),
                "top_capital_team": str(leader_capital["name"]),
                "top_capital_points": float(leader_capital["draft_capital"]),
                "league_mean_fpts": mean_fpts,
                "league_mean_capital": mean_capital,
                "total_franchises": len(df)
            }
                
    except Exception as e:
        print(f"Error building league context for Madden: {e}")
        
    return context


def heuristic_madden_response(prompt: str, context: Dict[str, Any]) -> Dict[str, Any]:
    """High-depth fallback engine generating authentic John Madden commentary backed by Pandas quant metrics."""
    prompt_lower = prompt.lower()
    teams = context.get("teams", [])
    quant = context.get("quant_summary", {})
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

    # 2. Draft Capital & Rebuild Question
    elif any(w in prompt_lower for w in ["draft", "pick", "capital", "rebuild", "future", "rookie"]):
        cap_team = quant.get("top_capital_team", "The draft vault leader")
        cap_pts = quant.get("top_capital_points", "massive")
        telestrator = "[TELESTRATOR: Circle the future draft picks vault in bright cyan]"
        answer = (
            f"BOOM! Draft picks are the lifeblood of a football team! Right now in this league, "
            f"{cap_team} is hoarding future draft capital ({cap_pts} capital pts)! "
            f"\n\n{telestrator}\n\n"
            f"Now here's what people get wrong about rebuilding: YOU DON'T DRAFT TO SIT ON PICKS FOREVER! "
            f"Picks gain maximum value during rookie draft fever in May and June. When the draft clock is ticking and everyone's drooling over shiny new toys, "
            f"THAT'S when you flip those picks for established, 23-year-old alpha wideouts! "
            f"Stack draft capital, let it appreciate, and cash it in to buy yourself a championship! POW!"
        )
        actions = ["Identify future 1st round pick hoarders", "Sell picks during rookie draft hype apex", "Target elite under-24 foundation players"]
        sentiment = "ANALYTICAL"

    # 3. Age Cliff & Veteran Longevity Question
    elif any(w in prompt_lower for w in ["age", "cliff", "veteran", "old", "retire", "window", "longevity"]):
        telestrator = "[TELESTRATOR: Red warning slash across the running back depth chart]"
        answer = (
            f"POW! The age cliff is undefeated in football! Nobody beats father time, not even the toughest guys in the league! "
            f"\n\n{telestrator}\n\n"
            f"When running backs hit age 27 and wide receivers hit 29, the cliff comes fast. One day they're bouncing off tackles, "
            f"and the next day they're a step slow hitting the hole. "
            f"If your championship window is open this year, ride 'em till the wheels fall off! "
            f"But if you're 3-5 or sitting in dynasty purgatory, you sell those veterans 6 months too early rather than 2 years too late! BOOM!"
        )
        actions = ["Sell RB 27+ and WR 29+ before market devaluation", "Audit starting lineup average age", "Maximize peak production windows"]
        sentiment = "VIGILANT"

    # 4. Start / Sit Question
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

    # 5. Team Breakdown / Standings / Who is winning
    elif any(w in prompt_lower for w in ["team", "standings", "best", "win", "champion", "ranking", "tiers"]):
        leader_str = f"{quant.get('top_firepower_team', top_team['name'] if top_team else 'The frontrunner')} ({quant.get('top_firepower_points', top_team['fpts'] if top_team else 0)} Max PF)"
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

    # 6. General / Philosophy / Roasts
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
                tel_match = re.search(r"\[TELESTRATOR:\s*([^\]]+)\]", text, re.IGNORECASE)
                telestrator = f"[TELESTRATOR: {tel_match.group(1)}]" if tel_match else "[TELESTRATOR: Draw big yellow circle around the trenches]"
                
                return {
                    "answer": text,
                    "quote": quote,
                    "telestrator": telestrator,
                    "suggested_actions": ["Execute Madden Playbook", "Check Lineup Matchup", "Review Trade Ledger"],
                    "sentiment": "BOOM"
                }
            except Exception as e:
                print(f"Gemini error in Ask Madden, falling back to local Madden engine: {e}")

        # Local Open-Source Heuristic Madden Engine
        return heuristic_madden_response(req.prompt, context)

    finally:
        session.close()


@router.get("/api/ai/season-outlook/{league_id}")
def get_season_outlook(league_id: str):
    """Generates Coach Madden's 2026 Preseason State of the League & per-franchise scouting reports."""
    from api.routers.league import get_sleeper_players_cache
    session = SessionLocal()
    try:
        sp_cache = get_sleeper_players_cache()
        rosters = session.query(Roster).filter(Roster.league_id == league_id).all()
        league = session.query(League).filter(League.league_id == league_id).first()
        league_name = league.name if league else "Dynasty League"
        
        pas_rows = session.query(PlayerAdvancedStats).filter(PlayerAdvancedStats.season >= 2023).all()
        player_ppg = {}
        for p in pas_rows:
            if p.games_played and p.games_played >= 4 and p.fantasy_points_ppr:
                ppg = p.fantasy_points_ppr / p.games_played
                if p.player_name not in player_ppg or p.season == 2024:
                    player_ppg[p.player_name] = round(ppg, 2)

        def calc_starter_proj(pid, p_name, pos):
            if p_name in player_ppg:
                return player_ppg[p_name]
            baselines = {"QB": 18.5, "RB": 13.8, "WR": 13.2, "TE": 9.2, "K": 8.0, "DEF": 7.5}
            return baselines.get(pos, 10.5)

        team_reports = []
        for r in rosters:
            owner_name = r.user.display_name if r.user and r.user.display_name else f"Team {r.roster_id}"
            avatar = r.user.avatar if r.user else None
            
            # Analyze starters and key players
            starters_info = []
            for pid in (r.starters or []):
                p_info = sp_cache.get(str(pid), {})
                p_name = p_info.get("full_name") or f"Player {pid}"
                pos = p_info.get("position") or "FLEX"
                proj = calc_starter_proj(pid, p_name, pos)
                starters_info.append({"name": p_name, "pos": pos, "proj": proj})
                
            total_proj_pf = sum(s["proj"] for s in starters_info) * 18
            top_starters = sorted(starters_info, key=lambda x: x["proj"], reverse=True)
            stud_names = [s["name"] for s in top_starters[:3]]
            stud_str = ", ".join(stud_names) if stud_names else "solid starting core"

            # Determine Tier & Window
            if total_proj_pf >= 3000:
                tier = "🏆 S-TIER TITLE FAVORITE"
                badge_color = "emerald"
                madden_tone = (
                    f"BOOM! Look out everybody! {owner_name} is rolling into the 2026 season with a loaded tank! "
                    f"When you've got playmakers like {stud_str} lined up on Sunday, you don't just score points—you impose your will in the trenches! "
                    f"[TELESTRATOR: Draw big yellow circles around the starting firepower] "
                    f"This team is built to hold the trophy. Expect fireworks every single week!"
                )
                action_item = "Hold your starters through camp and buy high-upside insurance running backs."
                risk_area = "Injury vulnerability if top-end studs miss multi-week stretches."
            elif total_proj_pf >= 2700:
                tier = "🔥 A-TIER PLAYOFF CONTENDER"
                badge_color = "blue"
                madden_tone = (
                    f"POW! Now here's a squad that knows how to compete! {owner_name} has the firepower with {stud_str} "
                    f"to punch their ticket right into the postseason! "
                    f"[TELESTRATOR: Draw an arrow cutting straight through the playoff bracket] "
                    f"If they get one more breakout from their flex spot, they can go toe-to-toe with anyone in the league!"
                )
                action_item = "Package bench depth and a 2nd round pick to upgrade the WR2/FLEX slot."
                risk_area = "Starter drop-off if the flex rotation doesn't produce consistent double digits."
            elif total_proj_pf >= 2400:
                tier = "⚡ B-TIER DARK HORSE"
                badge_color = "amber"
                madden_tone = (
                    f"BOOM! Don't sleep on {owner_name}! People think they're in the middle of the pack, but when you line up with {stud_str}, "
                    f"you can play spoiler and steal wins! "
                    f"[TELESTRATOR: Yellow lightning bolt striking the underdog sideline] "
                    f"In dynasty football, anything can happen once the whistle blows!"
                )
                action_item = "Scout preseason snap counts on waivers and strike on early-season risers."
                risk_area = "Points consistency against heavy-hitting divisional powerhouses."
            else:
                tier = "🛠️ C-TIER REBUILD ENGINE"
                badge_color = "purple"
                madden_tone = (
                    f"POW! Now here's a team building for the future! {owner_name} is stacking the war chest with draft capital! "
                    f"You don't win games in the owner's lounge—you build through the draft! "
                    f"[TELESTRATOR: Draw a big yellow chalk arrow pointing to future rookie draft picks] "
                    f"Stay the course, hoard young assets, and dominate the waiver wire!"
                )
                action_item = "Sell producing veterans to title contenders at the mid-season trade peak for 2027 1sts."
                risk_area = "Immediate win ceiling in 2026 while retooling youth."

            # Find potential camp breakout from bench
            bench_pids = [pid for pid in (r.players or []) if pid not in (r.starters or [])]
            breakout_player = "High-Upside Rookie / Taxi Asset"
            for pid in bench_pids[:5]:
                b_info = sp_cache.get(str(pid), {})
                b_name = b_info.get("full_name")
                if b_name:
                    breakout_player = b_name
                    break

            team_reports.append({
                "roster_id": r.roster_id,
                "team_name": owner_name,
                "avatar": avatar,
                "tier": tier,
                "badge_color": badge_color,
                "projected_season_pf": round(total_proj_pf, 1),
                "weekly_proj_avg": round(total_proj_pf / 18, 1),
                "madden_take": madden_tone,
                "core_studs": stud_names,
                "camp_breakout": breakout_player,
                "risk_factor": risk_area,
                "preseason_directive": action_item
            })

        team_reports.sort(key=lambda x: x["projected_season_pf"], reverse=True)

        top_team = team_reports[0]["team_name"] if team_reports else "The Contenders"
        state_of_league = (
            f"BOOM! Welcome to the 2026 Dynasty Preseason Kickoff for {league_name}! "
            f"Training camps are buzzing, depth charts are shaking out, and the countdown to Week 1 is ON! "
            f"Right now, {top_team} holds the pole position on paper with unmatched starter firepower, "
            f"but remember: ON SUNDAYS, YOU STILL GOTTA STEP ONTO THE FIELD AND EXECUTE! "
            f"Protect the football, stay active on the trade block, and let's get ready for football! POW!"
        )

        return {
            "status": "success",
            "league_id": league_id,
            "league_name": league_name,
            "season": "2026",
            "state_of_the_league": state_of_league,
            "madden_quote": "If you score more points than the other guy, you win the football game!",
            "teams": team_reports
        }
    finally:
        session.close()

