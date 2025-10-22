from django.contrib import admin
from django.urls import path, include
from accounts import views as accounts_views
from vm_app import views as vm_views
from django.conf import settings
from django.conf.urls.static import static
from accounts.views import admin_login, admin_dashboard, admin_logout
from vm_app.views import add_product, update_product, delete_product, withdraw_money


urlpatterns = [
    # ✅ Custom product management endpoints (must be before Django admin)
    path('admin/add-product/', vm_views.add_product, name='add_product'),
    path('admin/update-product/', vm_views.update_product, name='update_product'),
    path('admin/delete-product/', vm_views.delete_product, name='delete_product'),

    # ✅ Admin dashboard & authentication
    path('admin-login/', accounts_views.admin_login, name='admin_login'),
    path('admin-dashboard/', accounts_views.admin_dashboard, name='admin_dashboard'),
    path('admin-logout/', accounts_views.admin_logout, name='admin_logout'),

    # ✅ Other custom endpoints
    path('withdraw-money/', withdraw_money, name='withdraw_money'),

    # ⚠️ Leave Django’s default admin LAST so it doesn’t override yours
    path('admin/', admin.site.urls),

    # ✅ Include all URLs from your app (like home, vending, etc.)
    path('', include('vm_app.urls')),
]

# ✅ Serve static and media files during development
if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
