. (Join-Path $PSScriptRoot 'Environment.ps1')
& .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8002
