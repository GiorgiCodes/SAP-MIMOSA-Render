# Multi-stage build combining Python backend and .NET frontend

# Stage 1: Build .NET application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dotnet-build
WORKDIR /src

COPY WebApp/*.csproj ./
COPY WebApp/*.cs ./
COPY WebApp/Controllers/ ./Controllers/
COPY WebApp/Models/ ./Models/
COPY WebApp/Views/ ./Views/
COPY WebApp/wwwroot/ ./wwwroot/
COPY WebApp/Properties/ ./Properties/
COPY WebApp/appsettings*.json ./

RUN dotnet restore SAP-MIMOSAapp.csproj
RUN dotnet publish SAP-MIMOSAapp.csproj -c Release -o /app/dotnet

# Stage 2: Final image with both Python and .NET
FROM mcr.microsoft.com/dotnet/aspnet:8.0

RUN apt-get update && \
    apt-get install -y python3.11 python3-pip curl procps && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV PYTHONPATH=/app

COPY requirements.txt .
RUN pip3 install --no-cache-dir --break-system-packages -r requirements.txt

COPY main.py .
COPY __init__.py .
COPY WebApp/__init__.py ./WebApp/__init__.py
COPY WebApp/app.py ./WebApp/app.py
COPY WebApp/ai_models.py ./WebApp/ai_models.py
COPY ValidationAndMapping/ ./ValidationAndMapping/
COPY Data/ ./Data/

# Copy built .NET application
COPY --from=dotnet-build /app/dotnet ./dotnet

RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "================================="\n\
echo "Starting SAP-MIMOSA Unified Service"\n\
echo "================================="\n\
\n\
# Start Python FastAPI backend\n\
echo ""\n\
echo "[1/3] Starting Python FastAPI backend on port 8000..."\n\
python3 -m uvicorn WebApp.app:app --host 127.0.0.1 --port 8000 --log-level info &\n\
PYTHON_PID=$!\n\
echo "Python backend started with PID $PYTHON_PID"\n\
\n\
# Wait for Python backend to be ready\n\
echo ""\n\
echo "[2/3] Waiting for Python backend to be ready..."\n\
MAX_ATTEMPTS=30\n\
ATTEMPT=0\n\
while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do\n\
  if curl -sf http://127.0.0.1:8000/health > /dev/null 2>&1; then\n\
    echo "✓ Python backend is ready!"\n\
    break\n\
  fi\n\
  ATTEMPT=$((ATTEMPT + 1))\n\
  echo "Waiting... attempt $ATTEMPT/$MAX_ATTEMPTS"\n\
  sleep 2\n\
done\n\
\n\
# Check if Python process is still running\n\
if ! kill -0 $PYTHON_PID 2>/dev/null; then\n\
  echo "ERROR: Python backend process died!"\n\
  echo "Checking for Python errors..."\n\
  tail -n 50 /var/log/python.log 2>/dev/null || echo "No Python logs found"\n\
  exit 1\n\
fi\n\
\n\
if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then\n\
  echo "ERROR: Python backend did not start within 60 seconds"\n\
  echo "Last 20 lines of process list:"\n\
  ps aux | tail -n 20\n\
  exit 1\n\
fi\n\
\n\
# Start .NET frontend\n\
echo ""\n\
echo "[3/3] Starting .NET frontend on port ${PORT:-8080}..."\n\
cd /app/dotnet\n\
export ASPNETCORE_URLS="http://0.0.0.0:${PORT:-8080}"\n\
export PY_API_BASE="http://127.0.0.1:8000/"\n\
echo "Environment:"\n\
echo "  ASPNETCORE_URLS=$ASPNETCORE_URLS"\n\
echo "  PY_API_BASE=$PY_API_BASE"\n\
echo ""\n\
echo "================================="\n\
echo "Service is starting..."\n\
echo "================================="\n\
exec dotnet SAP-MIMOSAapp.dll\n\
' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 8080

CMD ["/app/start.sh"]
