FROM python:3.11-slim

WORKDIR /app

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy all necessary directories and files
COPY main.py .
COPY __init__.py .
COPY WebApp/ ./WebApp/
COPY ValidationAndMapping/ ./ValidationAndMapping/
COPY Data/ ./Data/

# Expose port
EXPOSE 8000

# Start using main.py OR directly with uvicorn
# Option 1: If main.py has the start logic
# CMD ["python", "main.py"]

# Option 2: Direct uvicorn (recommended for Render)
CMD uvicorn WebApp.app:app --host 0.0.0.0 --port ${PORT:-8000}