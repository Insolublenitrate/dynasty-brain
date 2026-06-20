from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON, Boolean
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class League(Base):
    __tablename__ = 'leagues'
    
    league_id = Column(String, primary_key=True)
    name = Column(String)
    season = Column(String)
    status = Column(String)
    roster_positions = Column(JSON)
    scoring_settings = Column(JSON)
    settings = Column(JSON)

    rosters = relationship("Roster", back_populates="league")
    draft_picks = relationship("DraftPick", back_populates="league")

class User(Base):
    __tablename__ = 'users'
    
    # Sleeper user_id is a string
    user_id = Column(String, primary_key=True)
    # A user can belong to multiple leagues, but in this flat structure
    # if we want a user per league, maybe we should just have users and a league_users mapping.
    # Actually, let's keep users globally unique since user_id is global in Sleeper.
    display_name = Column(String)
    avatar = Column(String)
    
    rosters = relationship("Roster", back_populates="user")
    # To support multiple leagues, we can use an association table, but for now
    # Roster bridges User and League, so we don't strictly need a User->League relation.

class Roster(Base):
    __tablename__ = 'rosters'
    
    # We will use f"{league_id}_{roster_id}" as the primary key
    id = Column(String, primary_key=True)
    
    roster_id = Column(Integer) # The internal sleeper 1-12 integer
    league_id = Column(String, ForeignKey('leagues.league_id'))
    owner_id = Column(String, ForeignKey('users.user_id'), nullable=True) # sleeper user_id
    
    wins = Column(Integer, default=0)
    losses = Column(Integer, default=0)
    ties = Column(Integer, default=0)
    fpts = Column(Float, default=0.0)
    
    players = Column(JSON)  # List of player IDs
    starters = Column(JSON) # List of starter IDs
    reserve = Column(JSON) # IR list
    taxi = Column(JSON) # Taxi squad
    
    settings = Column(JSON) # Other roster settings
    
    league = relationship("League", back_populates="rosters")
    user = relationship("User", back_populates="rosters")
    draft_picks = relationship("DraftPick", foreign_keys="[DraftPick.owner_id]", back_populates="owner_roster")

class DraftPick(Base):
    __tablename__ = 'draft_picks'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    league_id = Column(String, ForeignKey('leagues.league_id'))
    
    season = Column(String)
    round = Column(Integer)
    
    # Use the composite format f"{league_id}_{roster_id}"
    roster_id = Column(String, ForeignKey('rosters.id')) # Original owner of the pick
    owner_id = Column(String, ForeignKey('rosters.id'))  # Current owner of the pick
    
    league = relationship("League", back_populates="draft_picks")
    
    original_roster = relationship("Roster", foreign_keys=[roster_id])
    owner_roster = relationship("Roster", foreign_keys=[owner_id], back_populates="draft_picks")

class PlayerAdvancedStats(Base):
    __tablename__ = 'player_advanced_stats'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String)  # nflfastR gsis_id
    player_name = Column(String)
    position = Column(String)
    recent_team = Column(String)
    season = Column(Integer)
    data_source = Column(String, default='pfr') # Tracks where this row's data primarily came from
    
    games_played = Column(Integer, default=0)
    fantasy_points_ppr = Column(Float, default=0.0)
    offense_pct = Column(Float, default=0.0)
    offense_snaps = Column(Integer, default=0)
    
    # Passing
    pass_epa_per_play = Column(Float, default=0.0)
    cpoe = Column(Float, default=0.0)
    pass_attempts = Column(Integer, default=0)
    
    # Receiving
    targets = Column(Integer, default=0)
    redzone_targets = Column(Integer, default=0)
    receptions = Column(Integer, default=0)
    receiving_yards = Column(Integer, default=0)
    air_yards_per_target = Column(Float, default=0.0)
    yac_per_reception = Column(Float, default=0.0)
    rec_epa_per_target = Column(Float, default=0.0)
    
    # Rushing
    rush_attempts = Column(Integer, default=0)
    redzone_rush_attempts = Column(Integer, default=0)
    rushing_yards = Column(Integer, default=0)
    rush_epa_per_attempt = Column(Float, default=0.0)
    
    # Defense
    sacks = Column(Float, default=0.0)
    qb_hits = Column(Float, default=0.0)
    tackles_for_loss = Column(Float, default=0.0)
    forced_fumbles = Column(Float, default=0.0)
    pass_deflections = Column(Float, default=0.0)

class MatchupHistory(Base):
    __tablename__ = 'matchup_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    league_id = Column(String, ForeignKey('leagues.league_id'))
    season = Column(String)
    week = Column(Integer)
    
    # Global roster IDs
    roster_id = Column(String, ForeignKey('rosters.id'))
    opponent_roster_id = Column(String, ForeignKey('rosters.id'), nullable=True)
    
    points = Column(Float, default=0.0)
    opponent_points = Column(Float, default=0.0)
    is_win = Column(Integer, default=0) # 1 for win, 0 for loss, -1 for tie
    
    # Detailed Matchup Data for AI / Bench Blunders
    matchup_id = Column(Integer, nullable=True)
    starters = Column(JSON, nullable=True)
    starters_points = Column(JSON, nullable=True)
    players = Column(JSON, nullable=True)
    players_points = Column(JSON, nullable=True)
    
    # Relationships
    roster = relationship("Roster", foreign_keys=[roster_id])
    opponent = relationship("Roster", foreign_keys=[opponent_roster_id])

class SleeperTransaction(Base):
    __tablename__ = 'sleeper_transactions'
    
    id = Column(String, primary_key=True) # transaction_id from sleeper
    league_id = Column(String, ForeignKey('leagues.league_id'))
    season = Column(String)
    week = Column(Integer)
    
    type = Column(String) # 'trade', 'free_agent', 'waiver'
    status = Column(String)
    
    # We can store the raw payload since trades can involve many assets
    adds = Column(JSON, nullable=True)
    drops = Column(JSON, nullable=True)
    draft_picks = Column(JSON, nullable=True)
    creator_roster_id = Column(Integer, nullable=True)
    consenter_roster_ids = Column(JSON, nullable=True)
    
    league = relationship("League")

class LeagueHistory(Base):
    __tablename__ = 'league_history'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    league_id = Column(String, ForeignKey('leagues.league_id'))
    season = Column(String)
    
    champion_roster_id = Column(String, ForeignKey('rosters.id'), nullable=True)
    second_place_roster_id = Column(String, ForeignKey('rosters.id'), nullable=True)
    third_place_roster_id = Column(String, ForeignKey('rosters.id'), nullable=True)
    last_place_roster_id = Column(String, ForeignKey('rosters.id'), nullable=True)
    
    # Relationships
    champion = relationship("Roster", foreign_keys=[champion_roster_id])
    second_place = relationship("Roster", foreign_keys=[second_place_roster_id])
    third_place = relationship("Roster", foreign_keys=[third_place_roster_id])
    last_place = relationship("Roster", foreign_keys=[last_place_roster_id])


class ConsensusStat(Base):
    __tablename__ = 'consensus_stats'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String)
    player_name = Column(String)
    season = Column(Integer)
    metric_name = Column(String)
    metric_value = Column(Float)
    sources_used = Column(String)
    confidence_score = Column(Float)
    discrepancy_flag = Column(Boolean, default=False)
    
class NCAAStats(Base):
    __tablename__ = 'ncaa_stats'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    player_id = Column(String) # usually sleeper ID or sports-ref ID
    player_name = Column(String)
    season = Column(Integer)
    college = Column(String)
    
    data_source = Column(String, default='cfbstats')
    
    games_played = Column(Integer, default=0)
    passing_yards = Column(Integer, default=0)
    passing_tds = Column(Integer, default=0)
    rushing_yards = Column(Integer, default=0)
    rushing_tds = Column(Integer, default=0)
    receptions = Column(Integer, default=0)
    receiving_yards = Column(Integer, default=0)
    receiving_tds = Column(Integer, default=0)
    
    # Advanced / Custom Metrics
    college_dominator = Column(Float, default=0.0)
    breakout_age = Column(Float, default=0.0)
    yprr = Column(Float, default=0.0)

