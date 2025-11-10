# Multi-stage build combining Python backend and .NET frontend

# Stage 1: Build .NET application
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS dotnet-build
WORKDIR /src
COPY WebApp/ .
RUN dotnet restore SAP-MIMOSAapp.csproj
RUN dotnet publish SAP-MIMOSAapp.csproj -c Release -o /app/dotnet

# Stage 2: Final image with both Python and .NET
FROM mcr.microsoft.com/dotnet/aspnet:8.0

# Install Python 3.11 in the .NET image
RUN apt-get update && \
    apt-get install -y python3.11 python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Python application and dependencies
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy Python source code
COPY main.py .
COPY __init__.py .
COPY WebApp/app.py ./WebApp/
COPY ValidationAndMapping/ ./ValidationAndMapping/
COPY Data/ ./Data/

# Copy built .NET application
COPY --from=dotnet-build /app/dotnet ./dotnet

# Create startup script to run both services
RUN echo '#!/bin/bash\n\
echo "Starting Python FastAPI backend on port 8000..."\n\
python3 -m uvicorn WebApp.app:app --host 127.0.0.1 --port 8000 &\n\
PYTHON_PID=$!\n\
echo "Python backend started with PID $PYTHON_PID"\n\
\n\
echo "Waiting for Python backend to be ready..."\n\
for i in {1..30}; do\n\
  if curl -s http://127.0.0.1:8000/health > /dev/null 2>&1; then\n\
    echo "Python backend is ready!"\n\
    break\n\
  fi\n\
  echo "Waiting for backend... ($i/30)"\n\
  sleep 2\n\
done\n\
\n\
echo "Starting .NET frontend on port $PORT..."\n\
cd /app/dotnet\n\
export ASPNETCORE_URLS="http://0.0.0.0:${PORT}"\n\
export PY_API_BASE="http://127.0.0.1:8000/"\n\
dotnet SAP-MIMOSAapp.dll\n\
' > /app/start.sh && chmod +x /app/start.sh

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

EXPOSE 8080

CMD ["/app/start.sh"]
