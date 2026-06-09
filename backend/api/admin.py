from rest_framework.permissions import BasePermission
from django.contrib import admin
from .models import ShopItem, Purchase

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and getattr(request.user, "is_staff", False)
        )

@admin.register(ShopItem)
class ShopItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'price', 'item_type', 'is_active', 'validity_days')
    list_filter = ('item_type', 'is_active')
    search_fields = ('name', 'description')

@admin.register(Purchase)
class PurchaseAdmin(admin.ModelAdmin):
    list_display = ('code', 'student', 'item', 'status', 'created_at', 'expires_at')
    list_filter = ('status', 'created_at')
    search_fields = ('code', 'student__user__username', 'item__name')
    readonly_fields = ('code', 'created_at', 'activated_at')
    
    # Действие: Массово пометить как истекшие (если нужно вручную)
    actions = ['mark_as_expired']

    @admin.action(description="Пометить выбранные как истёкшие")
    def mark_as_expired(self, request, queryset):
        queryset.filter(status='pending').update(status='expired')
