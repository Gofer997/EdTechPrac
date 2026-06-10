from django.contrib import admin
from .models import ShopItem, Purchase, Subject, Lesson, Group


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0
    fields = ('subject', 'teacher', 'weekday', 'start_time', 'end_time', 'room', 'is_active')
    raw_id_fields = ('subject', 'teacher')
    show_change_link = True


@admin.register(Subject)
class SubjectAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('group', 'subject', 'teacher', 'weekday', 'start_time', 'end_time', 'room', 'is_active')
    list_filter = ('weekday', 'group', 'subject', 'teacher', 'is_active')
    search_fields = ('group__name', 'subject__name', 'teacher__user__username', 'room')
    raw_id_fields = ('group', 'subject', 'teacher')


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'teacher')
    search_fields = ('name', 'teacher__user__username')
    raw_id_fields = ('teacher',)
    inlines = [LessonInline]
    ordering = ['name']


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
    
    actions = ['mark_as_expired']

    @admin.action(description="Пометить выбранные как истёкшие")
    def mark_as_expired(self, request, queryset):
        queryset.filter(status='pending').update(status='expired')
