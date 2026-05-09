from mangum import Mangum
from main import app

# AWS Lambda adapter for FastAPI.
handler = Mangum(app)
