FROM python:3.12-slim
WORKDIR /app
COPY ../requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt
COPY .. /app
ENV PYTHONUNBUFFERED=1
ENV MH_ENV=production
ENV MH_SECRET_KEY=replace_this_with_secure_value
EXPOSE 8000
CMD ["uvicorn", "Model.backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
