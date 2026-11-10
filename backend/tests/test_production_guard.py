from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.production_guard import ProductionGuard

def test_auth_throttle_is_production_only(monkeypatch):
    app=FastAPI();app.add_middleware(ProductionGuard)
    @app.post('/api/auth/login')
    def login():return {'ok':True}
    with TestClient(app) as client:
        monkeypatch.setenv('FINPILOT_ENV','production')
        for _ in range(30):assert client.post('/api/auth/login').status_code==200
        assert client.post('/api/auth/login').status_code==429
        monkeypatch.setenv('FINPILOT_ENV','development')
        assert client.post('/api/auth/login').status_code==200
