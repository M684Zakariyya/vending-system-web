from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os


class Command(BaseCommand):
    help = 'Creates a superuser for accounts app from environment variables'

    def handle(self, *args, **options):
        User = get_user_model()
        
        username = os.getenv('DJANGO_SUPERUSER_USERNAME', 'zakariyya')
        email = os.getenv('DJANGO_SUPERUSER_EMAIL', 'zakariyya@example.com')
        password = os.getenv('KMZ06082004')
        
        if not password:
            self.stdout.write(
                self.style.ERROR('DJANGO_SUPERUSER_PASSWORD environment variable not set')
            )
            return
        
        if not User.objects.filter(username=username).exists():
            User.objects.create_superuser(
                username=username,
                email=email,
                password=password
            )
            self.stdout.write(
                self.style.SUCCESS(f'Superuser "{username}" created successfully')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Superuser "{username}" already exists')
            )