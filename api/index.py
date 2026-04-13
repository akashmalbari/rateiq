import sys
import os

# Make sure backend module is importable from the repo root
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.server import app
from mangum import Mangum

# Wrap FastAPI with Mangum for Vercel serverless (ASGI adapter)
handler = Mangum(app, lifespan="auto")
