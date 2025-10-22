from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('about/', views.about, name='about'),
    path('ideas/', views.ideas, name='ideas'),
    path('add-funds/', views.add_funds, name='add_funds'),
    path('withdraw-money/', views.withdraw_money, name='withdraw_money'),  # This should be here
    path('add-to-cart/', views.add_to_cart, name='add_to_cart'),
    path('get-cart/', views.get_cart, name='get_cart'),
    path('remove-from-cart/', views.remove_from_cart, name='remove_from_cart'),
    path('clear-cart/', views.clear_cart, name='clear_cart'),
    path('process-payment/', views.process_payment, name='process_payment'),
]