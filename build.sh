#!/usr/bin/env bash
# build.sh

# Exit on error
set -o errexit

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Apply database migrations
echo "Applying migrations..."
python manage.py migrate

# Create superuser if doesn't exist (optional)
echo "Creating superuser if needed..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'password')
    print('Superuser created')
else:
    print('Superuser already exists')
"

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput --clear

echo "Build completed successfully!"