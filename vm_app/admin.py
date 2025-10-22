from django.contrib import admin
from .models import Product, Transaction, Cart

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_id', 'name', 'price', 'stock', 'category', 'max_stock', 'min_stock']
    list_editable = ['price', 'stock', 'max_stock', 'min_stock']
    list_filter = ['category']
    search_fields = ['product_id', 'name']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'date', 'time', 'total_amount', 'total_expenses', 'total_change']
    readonly_fields = ['date', 'time']
    list_filter = ['date']

admin.site.register(Cart)