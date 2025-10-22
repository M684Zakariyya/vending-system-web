from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
import json
from django.http import JsonResponse
from vm_app.models import Product, MoneyInsertion
from django.db.models import Sum, Count, F
from django.utils import timezone
from datetime import datetime, timedelta

def is_admin(user):
    return user.is_authenticated and user.is_staff

def admin_login(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(request, username=username, password=password)
        
        if user is not None and user.is_staff:
            login(request, user)
            return redirect('admin_dashboard')
        else:
            messages.error(request, 'Invalid credentials or insufficient permissions')
    
    return render(request, 'accounts/admin_login.html')

@login_required
@user_passes_test(is_admin)
def admin_dashboard(request):
    # Get basic stats
    total_products = Product.objects.count()
    low_stock_products = Product.objects.filter(stock__lte=F('min_stock')).count()
    out_of_stock_products = Product.objects.filter(stock=0).count()
    
    # Transaction stats - ONLY COUNT PURCHASES
    today = timezone.now().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Only count purchase transactions for sales overview
    daily_sales = MoneyInsertion.objects.filter(date=today, transaction_type='purchase').aggregate(
        total_sales=Sum('total_expenses'),
        total_transactions=Count('transaction_id')
    )
    
    weekly_sales = MoneyInsertion.objects.filter(date__gte=week_ago, transaction_type='purchase').aggregate(
        total_sales=Sum('total_expenses'),
        total_transactions=Count('transaction_id')
    )
    
    monthly_sales = MoneyInsertion.objects.filter(date__gte=month_ago, transaction_type='purchase').aggregate(
        total_sales=Sum('total_expenses'),
        total_transactions=Count('transaction_id')
    )
    
    # Reset zero values to 0 instead of None
    daily_sales = {k: v or 0 for k, v in daily_sales.items()}
    weekly_sales = {k: v or 0 for k, v in weekly_sales.items()}
    monthly_sales = {k: v or 0 for k, v in monthly_sales.items()}
    
    # Top selling products - only from purchase transactions
    all_products = Product.objects.all()
    top_products = []
    for product in all_products:
        # Calculate total sales for this product from PURCHASE transactions only
        product_sales = MoneyInsertion.objects.filter(
            products_purchased__icontains=product.name,
            transaction_type='purchase'
        ).aggregate(total_sales=Sum('total_expenses'))['total_sales'] or 0
        
        top_products.append({
            'product': product,
            'total_sold': float(product_sales)
        })
    
    # Sort by sales and take top 5
    top_products = sorted(top_products, key=lambda x: x['total_sold'], reverse=True)[:5]
    
    # Recent transactions - show ALL transactions (purchases and withdrawals)
    recent_transactions = MoneyInsertion.objects.all().order_by('-date', '-time')[:20]
    
    # All products for management
    all_products_list = Product.objects.all().order_by('product_id')

    # Money stats - only count purchases for revenue
    money_stats = {
        'total_collected': MoneyInsertion.objects.filter(transaction_type='purchase').aggregate(total=Sum('total_amount'))['total'] or 0,
        'total_sales': MoneyInsertion.objects.filter(transaction_type='purchase').aggregate(total=Sum('total_expenses'))['total'] or 0,
        'total_change': MoneyInsertion.objects.filter(transaction_type='purchase').aggregate(total=Sum('total_change'))['total'] or 0,
    }

    context = {
        'total_products': total_products,
        'low_stock_products': low_stock_products,
        'out_of_stock_products': out_of_stock_products,
        'daily_sales': daily_sales,
        'weekly_sales': weekly_sales,
        'monthly_sales': monthly_sales,
        'top_products': top_products,
        'recent_transactions': recent_transactions,
        'all_products': all_products_list,
        'money_stats': money_stats,
    }
    
    return render(request, 'accounts/admin_dashboard.html', context)

@login_required
@user_passes_test(is_admin)
def admin_logout(request):
    if request.method == 'POST':
        logout(request)
        messages.success(request, 'You have been successfully logged out.')
        return redirect('home')
    
    return render(request, 'accounts/admin_logout.html')