from django.contrib import admin
from .models import Product, MoneyInsertion, MoneyChange, Cart

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_id', 'name', 'price', 'stock', 'category', 'max_stock', 'min_stock']
    list_editable = ['price', 'stock', 'max_stock', 'min_stock']
    list_filter = ['category']
    search_fields = ['product_id', 'name']

@admin.register(MoneyInsertion)
class MoneyInsertionAdmin(admin.ModelAdmin):
    list_display = ['transaction_id', 'date', 'time', 'total_amount', 'total_expenses', 'total_change']
    readonly_fields = ['date', 'time']
    list_filter = ['date']
    search_fields = ['transaction_id']

@admin.register(MoneyChange)
class MoneyChangeAdmin(admin.ModelAdmin):
    list_display = ['money_insertion', 'products_purchased']
    search_fields = ['money_insertion__transaction_id', 'products_purchased']
    
    # Optional: Make it inline with MoneyInsertion
    class Meta:
        verbose_name = "Money Change"
        verbose_name_plural = "Money Changes"

admin.site.register(Cart)