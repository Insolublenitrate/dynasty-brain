import os
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import imageio

OUTPUT_DIR = r"d:\AntiGravity Projects\dynasty-brain\showcase-site\marketing"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Helper function to get default or truetype font
def get_font(size=14, bold=False):
    try:
        # Windows system fonts
        if bold:
            return ImageFont.truetype("arialbd.ttf", size)
        else:
            return ImageFont.truetype("arial.ttf", size)
    except:
        return ImageFont.load_default()

# -------------------------------------------------------------
# 1. GENERATE PROMO-MADDEN-AI.GIF (800x480)
# -------------------------------------------------------------
def make_madden_gif():
    w, h = 800, 480
    frames = []
    fps = 12
    total_frames = 36  # 3 second loop

    quotes = [
        ("BOOM! GRADE: A+", "#22c55e", "BOOM! You've got an absolute Goliath WR corps in CeeDee Lamb & Puka Nacua! Package that late 2027 1st for an elite TE upgrade and lock down the trophy!"),
        ("SCOUT GRADE: A-", "#38bdf8", "WIN-NOW ALERT: Christian McCaffrey & Derrick Henry are carrying your backfield. Sell your aging RB3 before the cliff and target young draft capital!"),
        ("REBUILD GRADE: B+", "#f97316", "PRODUCTIVE STRUGGLE: You hold Four 1st Round Picks in 2026. Stay disciplined, don't buy veterans, and corner the upcoming rookie WR class!")
    ]

    for f in range(total_frames):
        img = Image.new("RGB", (w, h), "#060907")
        draw = ImageDraw.Draw(img)

        # Field lines background
        for x in (160, 320, 480, 640):
            draw.line([(x, 0), (x, h)], fill="#111a13", width=1)
        draw.line([(400, 0), (400, h)], fill="#223b26", width=2) # 50-yard

        # Playbook Route
        route_progress = (f % 18) / 18.0
        start_pt = (200, 320)
        ctrl_pt = (360, 180)
        end_pt = (620, 140)
        
        # Draw dotted route
        for t in np.linspace(0, 1, 20):
            bx = (1-t)**2 * start_pt[0] + 2*(1-t)*t * ctrl_pt[0] + t**2 * end_pt[0]
            by = (1-t)**2 * start_pt[1] + 2*(1-t)*t * ctrl_pt[1] + t**2 * end_pt[1]
            draw.ellipse([bx-2, by-2, bx+2, by+2], fill="#f97316")

        # Moving ball
        bx = (1-route_progress)**2 * start_pt[0] + 2*(1-route_progress)*route_progress * ctrl_pt[0] + route_progress**2 * end_pt[0]
        by = (1-route_progress)**2 * start_pt[1] + 2*(1-route_progress)*route_progress * ctrl_pt[1] + route_progress**2 * end_pt[1]
        draw.ellipse([bx-6, by-6, bx+6, by+6], fill="#22c55e", outline="#ffffff", width=2)

        # Main Chalkboard Card Box
        margin = 24
        card_rect = [margin, margin, w - margin, h - margin]
        draw.rectangle(card_rect, fill="#0a100c", outline="#f97316", width=2)

        # Top Bar
        draw.text((margin + 20, margin + 18), "ROBOT COACH MADDEN AI", fill="#ffffff", font=get_font(20, True))
        
        # Active quote selection
        q_idx = (f // 12) % len(quotes)
        grade_text, grade_col, quote_str = quotes[q_idx]

        # Equalizer audio waves
        wave_cx = margin + 350
        for b in range(8):
            wave_h = 6 + int(14 * math.sin(f * 0.5 + b * 0.8)**2)
            draw.line([(wave_cx + b * 6, margin + 28 - wave_h // 2), (wave_cx + b * 6, margin + 28 + wave_h // 2)], fill="#f97316", width=3)

        # Grade Badge
        draw.rectangle([w - margin - 180, margin + 14, w - margin - 20, margin + 42], fill=grade_col)
        draw.text((w - margin - 170, margin + 19), grade_text, fill="#041207", font=get_font(12, True))

        # Divider
        draw.line([(margin + 20, margin + 56), (w - margin - 20, margin + 56)], fill="#223326", width=1)

        # Quote Dialog Bubble
        dialog_rect = [margin + 20, margin + 74, w - margin - 20, margin + 240]
        draw.rectangle(dialog_rect, fill="#0d1710", outline="#203325", width=1)
        draw.line([(margin + 20, margin + 74), (margin + 20, margin + 240)], fill="#f97316", width=4)

        # Wrap text manually
        words = quote_str.split(" ")
        lines = []
        cur = ""
        for word in words:
            if len(cur + " " + word) < 58:
                cur += (" " if cur else "") + word
            else:
                lines.append(cur)
                cur = word
        if cur:
            lines.append(cur)

        y_text = margin + 92
        for line in lines:
            draw.text((margin + 38, y_text), line, fill="#F4F4F5", font=get_font(16, False))
            y_text += 26

        # Two Action Cards
        action1_rect = [margin + 20, margin + 256, margin + 360, margin + 340]
        draw.rectangle(action1_rect, fill="#0d1710", outline="#203325", width=1)
        draw.text((margin + 34, margin + 268), "TARGET BUY-LOW", fill="#a1a1aa", font=get_font(11, True))
        draw.text((margin + 34, margin + 292), "Trey McBride (24.1 YPRR Surge)", fill="#22c55e", font=get_font(14, True))

        action2_rect = [margin + 380, margin + 256, w - margin - 20, margin + 340]
        draw.rectangle(action2_rect, fill="#0d1710", outline="#203325", width=1)
        draw.text((margin + 394, margin + 268), "SELL-HIGH WINDOW", fill="#a1a1aa", font=get_font(11, True))
        draw.text((margin + 394, margin + 292), "Aging RB2 at 100% Peak Value", fill="#38bdf8", font=get_font(14, True))

        # Bottom Bar
        draw.line([(margin + 20, margin + 360), (w - margin - 20, margin + 360)], fill="#223326", width=1)
        draw.text((margin + 20, margin + 382), "QUANT DYNASTY WAR ROOM", fill="#22c55e", font=get_font(12, True))
        draw.text((w - margin - 250, margin + 382), "ffdashboard.kindofabigdill.world", fill="#f97316", font=get_font(12, True))

        frames.append(img)

    out_path = os.path.join(OUTPUT_DIR, "promo-madden-ai.gif")
    imageio.mimsave(out_path, frames, fps=fps, loop=0)
    print("Created:", out_path)

# -------------------------------------------------------------
# 2. GENERATE PROMO-POSITIONAL-RADAR.GIF (800x480)
# -------------------------------------------------------------
def make_radar_gif():
    w, h = 800, 480
    frames = []
    fps = 12
    total_frames = 36

    teams = [
        {
            "name": "CeeDeez Nutz (WR Bully)",
            "color": "#22c55e",
            "scores": (112, 153, 74, 108), # QB, WR, TE, RB
            "badge": "WR: 153 (Apex)"
        },
        {
            "name": "Run CMC & Hamstrings",
            "color": "#06b6d4",
            "scores": (104, 115, 98, 148),
            "badge": "RB: 148 (Apex)"
        },
        {
            "name": "1st Round Pick Addicts",
            "color": "#a855f7",
            "scores": (88, 92, 82, 76),
            "badge": "Picks: 168 (4x 1sts)"
        }
    ]

    cx, cy, r_max = 200, 240, 110

    for f in range(total_frames):
        img = Image.new("RGB", (w, h), "#060907")
        draw = ImageDraw.Draw(img)

        # Main Panel
        margin = 24
        draw.rectangle([margin, margin, w - margin, h - margin], fill="#0a100c", outline="#06b6d4", width=2)

        # Header
        draw.text((margin + 20, margin + 18), "100-INDEX POSITIONAL STRENGTH RADAR", fill="#ffffff", font=get_font(18, True))
        
        # Active team transition
        seg = (f / float(total_frames)) * len(teams)
        cur_t_idx = int(seg) % len(teams)
        next_t_idx = (cur_t_idx + 1) % len(teams)
        interp = seg - int(seg)
        interp_smooth = 0.5 - 0.5 * math.cos(interp * math.pi)

        t1 = teams[cur_t_idx]
        t2 = teams[next_t_idx]

        cur_scores = [
            t1["scores"][i] * (1 - interp_smooth) + t2["scores"][i] * interp_smooth
            for i in range(4)
        ]

        # Badge
        draw.rectangle([w - margin - 240, margin + 14, w - margin - 20, margin + 42], fill="#0e2321", outline="#06b6d4", width=1)
        draw.text((w - margin - 225, margin + 20), t1["name"][:24], fill="#22d3ee", font=get_font(12, True))

        # Divider
        draw.line([(margin + 20, margin + 56), (w - margin - 20, margin + 56)], fill="#1a2f26", width=1)

        # Radar Grid Circles
        for r_ratio in (0.33, 0.66, 1.0):
            rad = int(r_max * r_ratio)
            draw.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], outline="#233b2e", width=1)
        draw.line([(cx, cy - r_max), (cx, cy + r_max)], fill="#233b2e", width=1)
        draw.line([(cx - r_max, cy), (cx + r_max, cy)], fill="#233b2e", width=1)

        # Radar Polygon Vertices: Top=QB, Right=WR, Bottom=TE, Left=RB
        # Map score 100 -> 0.66 * r_max, max 160 -> 1.0 * r_max
        def score_to_rad(s):
            return min(r_max, max(20, int(r_max * (s / 160.0))))

        p_qb = (cx, cy - score_to_rad(cur_scores[0]))
        p_wr = (cx + score_to_rad(cur_scores[1]), cy)
        p_te = (cx, cy + score_to_rad(cur_scores[2]))
        p_rb = (cx - score_to_rad(cur_scores[3]), cy)

        poly_pts = [p_qb, p_wr, p_te, p_rb]
        draw.polygon(poly_pts, fill="#0d3527", outline="#22c55e")
        draw.line(poly_pts + [poly_pts[0]], fill="#22c55e", width=3)

        # Node labels on radar
        draw.text((cx - 10, cy - r_max - 18), "QB", fill="#f97316", font=get_font(12, True))
        draw.text((cx + r_max + 8, cy - 8), "WR", fill="#22c55e", font=get_font(12, True))
        draw.text((cx - 8, cy + r_max + 6), "TE", fill="#ef4444", font=get_font(12, True))
        draw.text((cx - r_max - 28, cy - 8), "RB", fill="#38bdf8", font=get_font(12, True))

        # Right Column Stats Cards
        stat_items = [
            ("Quarterback (QB)", f"{cur_scores[0]:.1f}", "#f97316"),
            ("Wide Receiver (WR)", f"{cur_scores[1]:.1f}", "#22c55e"),
            ("Tight End (TE)", f"{cur_scores[2]:.1f}", "#ef4444" if cur_scores[2] < 90 else "#22c55e"),
            ("Running Back (RB)", f"{cur_scores[3]:.1f}", "#38bdf8"),
        ]

        y_s = margin + 80
        for label, val, col in stat_items:
            s_rect = [margin + 380, y_s, w - margin - 20, y_s + 48]
            draw.rectangle(s_rect, fill="#0d1710", outline="#203325", width=1)
            draw.text((margin + 400, y_s + 14), label, fill="#FFFFFF", font=get_font(14, True))
            draw.text((w - margin - 90, y_s + 12), val, fill=col, font=get_font(16, True))
            y_s += 60

        # Footer
        draw.line([(margin + 20, margin + 360), (w - margin - 20, margin + 360)], fill="#1a2f26", width=1)
        draw.text((margin + 20, margin + 382), "BENCHMARK: 100 = EXACT LEAGUE AVERAGE", fill="#22d3ee", font=get_font(12, True))
        draw.text((w - margin - 250, margin + 382), "ffdashboard.kindofabigdill.world", fill="#f97316", font=get_font(12, True))

        frames.append(img)

    out_path = os.path.join(OUTPUT_DIR, "promo-positional-radar.gif")
    imageio.mimsave(out_path, frames, fps=fps, loop=0)
    print("Created:", out_path)

# -------------------------------------------------------------
# 3. GENERATE PROMO-POWER-MATRIX.GIF (800x480)
# -------------------------------------------------------------
def make_matrix_gif():
    w, h = 800, 480
    frames = []
    fps = 12
    total_frames = 36

    nodes = [
        {"name": "Puka Nacua Matata", "score": "57.3", "x": 180, "y": 140, "col": "#a855f7"},
        {"name": "CeeDeez Nutz", "score": "63.4", "x": 520, "y": 110, "col": "#22c55e"},
        {"name": "Run CMC", "score": "59.6", "x": 540, "y": 200, "col": "#22c55e"},
        {"name": "1st Rd Addicts", "score": "37.2", "x": 190, "y": 280, "col": "#38bdf8"},
        {"name": "Waffle House", "score": "24.8", "x": 530, "y": 300, "col": "#ef4444"}
    ]

    for f in range(total_frames):
        img = Image.new("RGB", (w, h), "#060907")
        draw = ImageDraw.Draw(img)

        margin = 24
        draw.rectangle([margin, margin, w - margin, h - margin], fill="#0a100c", outline="#a855f7", width=2)

        # Top Bar
        draw.text((margin + 20, margin + 18), "12-TEAM DYNAMIC LIFECYCLE MATRIX", fill="#ffffff", font=get_font(18, True))
        draw.rectangle([w - margin - 200, margin + 14, w - margin - 20, margin + 42], fill="#1c0f2a", outline="#a855f7", width=1)
        draw.text((w - margin - 185, margin + 20), "REAL-TIME QUANT", fill="#c084fc", font=get_font(12, True))

        # Divider
        draw.line([(margin + 20, margin + 56), (w - margin - 20, margin + 56)], fill="#251b33", width=1)

        # Matrix Canvas Box
        c_rect = [margin + 20, margin + 70, w - margin - 20, margin + 350]
        draw.rectangle(c_rect, fill="#06080b", outline="#1a1c24", width=1)

        # Axes
        mid_x = (c_rect[0] + c_rect[2]) // 2
        mid_y = (c_rect[1] + c_rect[3]) // 2
        draw.line([(c_rect[0], mid_y), (c_rect[2], mid_y)], fill="#2a2238", width=1)
        draw.line([(mid_x, c_rect[1]), (mid_x, c_rect[3])], fill="#2a2238", width=1)

        # Quadrant Labels
        draw.text((c_rect[0] + 16, c_rect[1] + 12), "DYNASTY APEX", fill="#c084fc", font=get_font(11, True))
        draw.text((c_rect[2] - 130, c_rect[1] + 12), "WIN-NOW GOLIATH", fill="#22c55e", font=get_font(11, True))
        draw.text((c_rect[0] + 16, c_rect[3] - 24), "PRODUCTIVE STRUGGLE", fill="#38bdf8", font=get_font(11, True))
        draw.text((c_rect[2] - 140, c_rect[3] - 24), "REBUILDING VALLEY", fill="#ef4444", font=get_font(11, True))

        # Laser Scan Sweep
        scan_progress = (f % 36) / 36.0
        laser_x = c_rect[0] + int((c_rect[2] - c_rect[0]) * scan_progress)
        draw.line([(laser_x, c_rect[1]), (laser_x, c_rect[3])], fill="#a855f7", width=2)

        # Team Nodes
        for n in nodes:
            pulse = math.sin(f * 0.4 + hash(n["name"]) % 5) * 3
            nx = n["x"] + pulse
            ny = n["y"]
            
            # Node pill
            draw.rectangle([nx - 8, ny - 12, nx + 160, ny + 14], fill="#0c100e", outline=n["col"], width=1)
            draw.ellipse([nx, ny - 4, nx + 8, ny + 4], fill=n["col"])
            draw.text((nx + 14, ny - 8), n["name"][:14], fill="#ffffff", font=get_font(11, True))
            draw.text((nx + 115, ny - 8), n["score"], fill="#f97316", font=get_font(11, True))

        # Footer
        draw.line([(margin + 20, margin + 360), (w - margin - 20, margin + 360)], fill="#251b33", width=1)
        draw.text((margin + 20, margin + 382), "70% MAX PF · 30% DRAFT CAPITAL WEIGHT", fill="#c084fc", font=get_font(12, True))
        draw.text((w - margin - 250, margin + 382), "ffdashboard.kindofabigdill.world", fill="#f97316", font=get_font(12, True))

        frames.append(img)

    out_path = os.path.join(OUTPUT_DIR, "promo-power-matrix.gif")
    imageio.mimsave(out_path, frames, fps=fps, loop=0)
    print("Created:", out_path)

# -------------------------------------------------------------
# 4. GENERATE PROMO-MATCHUP-SIMULATOR.GIF (800x480)
# -------------------------------------------------------------
def make_sim_gif():
    w, h = 800, 480
    frames = []
    fps = 12
    total_frames = 36

    sim_states = [
        {"s1": "138.4", "s2": "124.6", "p1": 68.4, "p2": 31.6},
        {"s1": "144.2", "s2": "119.8", "p1": 74.2, "p2": 25.8},
        {"s1": "131.0", "s2": "136.5", "p1": 48.1, "p2": 51.9},
        {"s1": "152.6", "s2": "128.0", "p1": 79.5, "p2": 20.5}
    ]

    for f in range(total_frames):
        img = Image.new("RGB", (w, h), "#060907")
        draw = ImageDraw.Draw(img)

        margin = 24
        draw.rectangle([margin, margin, w - margin, h - margin], fill="#0a100c", outline="#22c55e", width=2)

        # Header
        draw.text((margin + 20, margin + 18), "10,000-GAME MONTE CARLO MATCHUP SIMULATOR", fill="#ffffff", font=get_font(17, True))
        draw.rectangle([w - margin - 190, margin + 14, w - margin - 20, margin + 42], fill="#0f2615", outline="#22c55e", width=1)
        sim_num = 10000 + (f * 250) % 5000
        draw.text((w - margin - 175, margin + 20), f"{sim_num:,} SIMS", fill="#22c55e", font=get_font(12, True))

        # Divider
        draw.line([(margin + 20, margin + 56), (w - margin - 20, margin + 56)], fill="#1a2f22", width=1)

        # Current sim state with interpolation
        seg = (f / float(total_frames)) * len(sim_states)
        c_idx = int(seg) % len(sim_states)
        n_idx = (c_idx + 1) % len(sim_states)
        interp = seg - int(seg)
        interp_s = 0.5 - 0.5 * math.cos(interp * math.pi)

        st1 = sim_states[c_idx]
        st2 = sim_states[n_idx]

        cur_p1 = st1["p1"] * (1 - interp_s) + st2["p1"] * interp_s
        cur_p2 = 100.0 - cur_p1

        # Matchup Columns
        box_w = 280
        # Team 1
        t1_rect = [margin + 30, margin + 74, margin + 30 + box_w, margin + 210]
        draw.rectangle(t1_rect, fill="#0d1710", outline="#22c55e", width=1)
        draw.text((margin + 50, margin + 90), "CeeDeez Nutz", fill="#22c55e", font=get_font(18, True))
        draw.text((margin + 50, margin + 120), st1["s1"], fill="#f97316", font=get_font(36, True))
        draw.text((margin + 50, margin + 172), "Ceiling: 174.5 · Floor: 112.0", fill="#a1a1aa", font=get_font(11, False))

        # VS
        draw.text((w // 2 - 14, margin + 130), "VS", fill="#f97316", font=get_font(22, True))

        # Team 2
        t2_rect = [w - margin - 30 - box_w, margin + 74, w - margin - 30, margin + 210]
        draw.rectangle(t2_rect, fill="#0d1710", outline="#38bdf8", width=1)
        draw.text((w - margin - 30 - box_w + 20, margin + 90), "Run CMC", fill="#38bdf8", font=get_font(18, True))
        draw.text((w - margin - 30 - box_w + 20, margin + 120), st1["s2"], fill="#38bdf8", font=get_font(36, True))
        draw.text((w - margin - 30 - box_w + 20, margin + 172), "Ceiling: 161.2 · Floor: 98.4", fill="#a1a1aa", font=get_font(11, False))

        # Win Probability Bar Box
        bar_box = [margin + 30, margin + 230, w - margin - 30, margin + 330]
        draw.rectangle(bar_box, fill="#06090c", outline="#1a251e", width=1)

        draw.text((margin + 50, margin + 248), f"{cur_p1:.1f}% WIN PROBABILITY", fill="#22c55e", font=get_font(14, True))
        draw.text((w - margin - 260, margin + 248), f"{cur_p2:.1f}% WIN PROBABILITY", fill="#38bdf8", font=get_font(14, True))

        # Track
        track_rect = [margin + 50, margin + 280, w - margin - 50, margin + 300]
        draw.rectangle(track_rect, fill="#0284c7")
        p1_w = int((track_rect[2] - track_rect[0]) * (cur_p1 / 100.0))
        draw.rectangle([track_rect[0], track_rect[1], track_rect[0] + p1_w, track_rect[3]], fill="#22c55e")

        # Footer
        draw.line([(margin + 20, margin + 360), (w - margin - 20, margin + 360)], fill="#1a2f22", width=1)
        draw.text((margin + 20, margin + 382), "SIMULATES WEATHER, INJURY & TD VARIANCE", fill="#22c55e", font=get_font(12, True))
        draw.text((w - margin - 250, margin + 382), "ffdashboard.kindofabigdill.world", fill="#f97316", font=get_font(12, True))

        frames.append(img)

    out_path = os.path.join(OUTPUT_DIR, "promo-matchup-simulator.gif")
    imageio.mimsave(out_path, frames, fps=fps, loop=0)
    print("Created:", out_path)

if __name__ == "__main__":
    make_madden_gif()
    make_radar_gif()
    make_matrix_gif()
    make_sim_gif()
    print("All 4 animated promo GIFs generated successfully!")
