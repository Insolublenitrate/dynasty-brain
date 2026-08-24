import sys
sys.path.append("d:/AntiGravity Projects/dynasty-brain/backend")
from database import SessionLocal
from models import Roster, User, League, PlayerAdvancedStats
from api.routers.league import get_sleeper_players_cache
import random

def generate_season_outlook(league_id: str = "1312567432052760576"):
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

res = generate_season_outlook()
print("State of the League:")
print(res["state_of_the_league"][:150], "...")
print(f"Generated outlook for {len(res['teams'])} teams:")
for t in res["teams"][:3]:
    print(f"  {t['tier']} | {t['team_name']} ({t['weekly_proj_avg']} pts/wk): {t['camp_breakout']}")
