from sqlalchemy import Column, String, Integer, Float, ForeignKey, JSON
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
