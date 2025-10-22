from django.db import models

class Product(models.Model):
    CATEGORY_CHOICES = [
        ('snacks', 'Snacks'),
        ('drinks', 'Drinks'),
    ]
    
    product_id = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=6, decimal_places=2)
    stock = models.IntegerField(default=0)
    max_stock = models.IntegerField(default=50)
    min_stock = models.IntegerField(default=5)
    category = models.CharField(max_length=10, choices=CATEGORY_CHOICES)
    
    def __str__(self):
        return f"{self.product_id} - {self.name}"

class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('purchase', 'Purchase'),
        ('withdrawal', 'Withdrawal'),
        ('refund', 'Refund'),
    ]

    transaction_id = models.AutoField(primary_key=True)
    date = models.DateField(auto_now_add=True)
    time = models.TimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=8, decimal_places=2)
    total_expenses = models.DecimalField(max_digits=8, decimal_places=2)
    total_change = models.DecimalField(max_digits=8, decimal_places=2)
    transaction_type = models.CharField(max_length=20, choices=TRANSACTION_TYPES, default='purchase')
    
    # Money inserted details
    rs1 = models.IntegerField(default=0)
    rs5 = models.IntegerField(default=0)
    rs10 = models.IntegerField(default=0)
    rs20 = models.IntegerField(default=0)
    rs25 = models.IntegerField(default=0)
    rs50 = models.IntegerField(default=0)
    rs100 = models.IntegerField(default=0)
    rs200 = models.IntegerField(default=0)
    
    # Change returned details
    change_rs1 = models.IntegerField(default=0)
    change_rs5 = models.IntegerField(default=0)
    change_rs10 = models.IntegerField(default=0)
    change_rs20 = models.IntegerField(default=0)
    change_rs25 = models.IntegerField(default=0)
    change_rs50 = models.IntegerField(default=0)
    change_rs100 = models.IntegerField(default=0)
    change_rs200 = models.IntegerField(default=0)
    
    products_purchased = models.TextField()
    
    def __str__(self):
        return f"Transaction {self.transaction_id} - {self.date} {self.time}"

class Cart(models.Model):
    session_key = models.CharField(max_length=40)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.IntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['session_key', 'product']