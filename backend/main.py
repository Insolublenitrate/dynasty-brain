from fastapi import FastAPI, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from database import SessionLocal, get_db
from models import Roster, User, DraftPick, League, PlayerAdvancedStats, ConsensusStat, NCAAStats, MatchupHistory, SleeperTransaction
from sqlalchemy.orm import Session
from quant.roster_lifecycle import analyze_league_rosters
from quant.draft_depreciation import DraftPick as QuantDraftPick, evaluate_pick_portfolio
from sleeper_ingest import ingest_data
import pandas as pd
import numpy as np

import os
import urllib.request

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from api.routers import league, dynasty, players, trades, rookies

app.include_router(league.router, tags=['League'])
app.include_router(dynasty.router, tags=['Dynasty'])
app.include_router(players.router, tags=['Players'])
app.include_router(trades.router, tags=['Trades'])
app.include_router(rookies.router, tags=['Rookies'])

@app.get("/api/health")
def health():
    return {"status": "ok"}

