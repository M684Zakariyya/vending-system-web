from django.shortcuts import render, get_object_or_404
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.decorators import login_required, user_passes_test
from django.db import transaction as db_transaction
import json
from .models import Product, Cart, Transaction

def is_admin(user):
    return user.is_authenticated and user.is_staff

# Main page views
def home(request):
    snacks = Product.objects.filter(category='snacks')
    drinks = Product.objects.filter(category='drinks')
    context = {'snacks': snacks, 'drinks': drinks}
    return render(request, 'vm_app/home.html', context)

def about(request):
    return render(request, 'vm_app/about.html')

def ideas(request):
    return render(request, 'vm_app/ideas.html')

# Money functions
@csrf_exempt
def add_funds(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        denomination = data.get('denomination')
        
        if 'money_inserted' not in request.session:
            request.session['money_inserted'] = {
                'rs1': 0, 'rs5': 0, 'rs10': 0, 'rs20': 0,
                'rs25': 0, 'rs50': 0, 'rs100': 0, 'rs200': 0
            }
        
        request.session['money_inserted'][denomination] += 1
        request.session.modified = True
        
        total = calculate_total(request.session['money_inserted'])
        return JsonResponse({'success': True, 'total_money': total})

def calculate_total(money_inserted):
    denominations = {'rs1': 1, 'rs5': 5, 'rs10': 10, 'rs20': 20, 'rs25': 25, 'rs50': 50, 'rs100': 100, 'rs200': 200}
    return sum(denominations[denom] * count for denom, count in money_inserted.items())

@csrf_exempt
def withdraw_money(request):
    if request.method == 'POST':
        money_inserted = request.session.get('money_inserted', {})
        total_money = calculate_total(money_inserted)
        
        if total_money <= 0:
            return JsonResponse({'success': False, 'message': 'No money to withdraw'})
        
        try:
            transaction_obj = Transaction.objects.create(
                total_amount=total_money,
                total_expenses=0,
                total_change=total_money,
                transaction_type='withdrawal',
                rs1=money_inserted.get('rs1', 0),
                rs5=money_inserted.get('rs5', 0),
                rs10=money_inserted.get('rs10', 0),
                rs20=money_inserted.get('rs20', 0),
                rs25=money_inserted.get('rs25', 0),
                rs50=money_inserted.get('rs50', 0),
                rs100=money_inserted.get('rs100', 0),
                rs200=money_inserted.get('rs200', 0),
                change_rs1=money_inserted.get('rs1', 0),
                change_rs5=money_inserted.get('rs5', 0),
                change_rs10=money_inserted.get('rs10', 0),
                change_rs20=money_inserted.get('rs20', 0),
                change_rs25=money_inserted.get('rs25', 0),
                change_rs50=money_inserted.get('rs50', 0),
                change_rs100=money_inserted.get('rs100', 0),
                change_rs200=money_inserted.get('rs200', 0),
                products_purchased='MONEY_WITHDRAWAL'
            )
            
            if 'money_inserted' in request.session:
                del request.session['money_inserted']
            request.session.modified = True
            
            return JsonResponse({
                'success': True,
                'withdrawn_amount': float(total_money),
                'money_breakdown': money_inserted,
                'transaction_id': transaction_obj.transaction_id
            })
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request'})

# Cart functions
@csrf_exempt
def add_to_cart(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        product_id = data.get('product_id')
        quantity = int(data.get('quantity', 1))
        
        product = get_object_or_404(Product, product_id=product_id)
        total_money = calculate_total(request.session.get('money_inserted', {}))
        
        if total_money <= 0:
            return JsonResponse({'success': False, 'message': 'Please insert money before adding to cart'})
        
        if quantity < 1 or quantity > product.stock:
            return JsonResponse({'success': False, 'message': f'Quantity must be between 1 and {product.stock}'})
        
        if not request.session.session_key:
            request.session.create()
        
        cart_item, created = Cart.objects.get_or_create(
            session_key=request.session.session_key,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            if cart_item.quantity > product.stock:
                return JsonResponse({'success': False, 'message': f'Cannot add more than {product.stock} items'})
            cart_item.save()
        
        return JsonResponse({'success': True})

def get_cart(request):
    if not request.session.session_key:
        return JsonResponse({'cart_items': [], 'cart_total': 0})
    
    cart_items = Cart.objects.filter(session_key=request.session.session_key)
    cart_data = []
    total = 0
    
    for item in cart_items:
        item_total = item.product.price * item.quantity
        cart_data.append({
            'product_id': item.product.product_id,
            'name': item.product.name,
            'price': float(item.product.price),
            'quantity': item.quantity,
            'total': float(item_total),
        })
        total += item_total
    
    return JsonResponse({'cart_items': cart_data, 'cart_total': float(total)})

@csrf_exempt
def remove_from_cart(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        product_id = data.get('product_id')
        
        if not request.session.session_key:
            return JsonResponse({'success': False, 'message': 'No cart found'})
        
        try:
            cart_item = Cart.objects.get(
                session_key=request.session.session_key,
                product__product_id=product_id
            )
            cart_item.delete()
            return JsonResponse({'success': True})
        except Cart.DoesNotExist:
            return JsonResponse({'success': False, 'message': 'Item not in cart'})

@csrf_exempt
def clear_cart(request):
    if request.method == 'POST':
        if not request.session.session_key:
            return JsonResponse({'success': False, 'message': 'No cart found'})
        
        Cart.objects.filter(session_key=request.session.session_key).delete()
        return JsonResponse({'success': True})

@csrf_exempt
def process_payment(request):
    if request.method == 'POST':
        try:
            with db_transaction.atomic():
                if not request.session.session_key:
                    return JsonResponse({'success': False, 'message': 'Cart is empty'})
                
                cart_items = Cart.objects.filter(session_key=request.session.session_key)
                if not cart_items:
                    return JsonResponse({'success': False, 'message': 'Cart is empty'})
                
                total_cost = sum(item.product.price * item.quantity for item in cart_items)
                money_inserted = calculate_total(request.session.get('money_inserted', {}))
                
                if money_inserted < total_cost:
                    return JsonResponse({
                        'success': False,
                        'message': 'Insufficient funds',
                        'required': float(total_cost - money_inserted)
                    })
                
                purchased_products = []
                for item in cart_items:
                    product = item.product
                    if product.stock < item.quantity:
                        return JsonResponse({
                            'success': False,
                            'message': f'Insufficient stock for {product.name}'
                        })
                    product.stock -= item.quantity
                    product.save()
                    purchased_products.append(f"{product.name} x{item.quantity}")

                # Create PURCHASE transaction
                transaction_obj = Transaction.objects.create(
                    total_amount=money_inserted,
                    total_expenses=total_cost,
                    total_change=money_inserted - total_cost,
                    transaction_type='purchase',
                    products_purchased=', '.join(purchased_products)
                )

                # Clear cart and session
                cart_items.delete()
                if 'money_inserted' in request.session:
                    del request.session['money_inserted']
                
                return JsonResponse({
                    'success': True,
                    'change': float(money_inserted - total_cost),
                    'transaction_id': transaction_obj.transaction_id
                })
                
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False})

# Admin product management functions (you already have these)
@login_required
@user_passes_test(is_admin)
@csrf_exempt
def add_product(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            name = data.get('name')
            price = data.get('price')
            stock = data.get('stock')
            max_stock = data.get('max_stock')
            min_stock = data.get('min_stock')
            category = data.get('category', 'snacks')
            
            # Validate required fields
            if not all([product_id, name, price, stock, max_stock, min_stock]):
                return JsonResponse({'success': False, 'message': 'All fields are required'})
            
            # Check if product ID already exists
            if Product.objects.filter(product_id=product_id).exists():
                return JsonResponse({'success': False, 'message': 'Product ID already exists'})
            
            # Create new product
            product = Product.objects.create(
                product_id=product_id,
                name=name,
                price=price,
                stock=stock,
                max_stock=max_stock,
                min_stock=min_stock,
                category=category
            )
            
            return JsonResponse({'success': True, 'message': 'Product added successfully'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
@user_passes_test(is_admin)
@csrf_exempt
def update_product(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            
            if not product_id:
                return JsonResponse({'success': False, 'message': 'Product ID is required'})
            
            # Get existing product
            product = get_object_or_404(Product, product_id=product_id)
            
            # Update fields
            product.name = data.get('name', product.name)
            product.price = data.get('price', product.price)
            product.stock = data.get('stock', product.stock)
            product.max_stock = data.get('max_stock', product.max_stock)
            product.min_stock = data.get('min_stock', product.min_stock)
            product.category = data.get('category', product.category)
            
            product.save()
            
            return JsonResponse({'success': True, 'message': 'Product updated successfully'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})

@login_required
@user_passes_test(is_admin)
@csrf_exempt
def delete_product(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            product_id = data.get('product_id')
            
            if not product_id:
                return JsonResponse({'success': False, 'message': 'Product ID is required'})
            
            # Get and delete product
            product = get_object_or_404(Product, product_id=product_id)
            product.delete()
            
            return JsonResponse({'success': True, 'message': 'Product deleted successfully'})
            
        except Exception as e:
            return JsonResponse({'success': False, 'message': str(e)})
    
    return JsonResponse({'success': False, 'message': 'Invalid request method'})