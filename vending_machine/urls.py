from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import admin_login, admin_dashboard, admin_logout
from vm_app.views import add_product, update_product, delete_product, withdraw_money

urlpatterns = [
    path('admin/', admin.site.urls),
    path('admin-login/', admin_login, name='admin_login'),
    path('admin-dashboard/', admin_dashboard, name='admin_dashboard'),
    path('admin-logout/', admin_logout, name='admin_logout'),
    
    # Product management URLs - FIXED: Remove trailing slashes for consistency
    path('admin/add-product', add_product, name='add_product'),
    path('admin/update-product', update_product, name='update_product'),
    path('admin/delete-product', delete_product, name='delete_product'),
    
    path('withdraw-money/', withdraw_money, name='withdraw_money'),
    path('', include('vm_app.urls')),
]

# Serve static files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)