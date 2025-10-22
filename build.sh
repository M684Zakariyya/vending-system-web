#!/usr/bin/env bash
# build.sh

# Install dependencies
pip install -r requirements.txt

# Apply database migrations
echo "Applying migrations..."
python manage.py migrate

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Create superuser (will only create if env vars are set and user doesn't exist)
echo "Creating superuser..."
python manage.py createsu