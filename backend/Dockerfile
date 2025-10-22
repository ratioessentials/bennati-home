# Backend Dockerfile per Perfect House
FROM python:3.9-slim

# Imposta directory di lavoro
WORKDIR /app

# Installa dipendenze di sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copia requirements e installa dipendenze Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia il codice dell'applicazione
COPY . .

# Espone la porta 8000
EXPOSE 8000

# Comando per avviare l'applicazione
CMD ["python", "run.py"]

