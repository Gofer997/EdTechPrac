from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from io import BytesIO
from rest_framework.response import Response
from django.utils.crypto import get_random_string
from django.core.files.base import ContentFile
from PIL import Image, ImageOps


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    group = models.CharField(max_length=64, blank=True, default="")
    crystals = models.IntegerField(default="0")
    avatar = models.ImageField(upload_to="avatars/", null=True, blank=True)

    def __str__(self):
        return self.user.username

    def save(self, *args, **kwargs):
        old_avatar_name = None
        if self.pk:
            try:
                old = StudentProfile.objects.get(pk=self.pk)
                old_avatar_name = old.avatar.name if old.avatar else None
            except StudentProfile.DoesNotExist:
                old_avatar_name = None

        if self.avatar and hasattr(self.avatar, "file"):
            try:
                self.avatar.open()
                img = Image.open(self.avatar)
                img = img.convert("RGB")

                size = (256, 256)
                img = ImageOps.fit(img, size, Image.Resampling.LANCZOS)

                buf = BytesIO()
                img.save(buf, format="AVIF", quality=85, optimize=True)
                buf.seek(0)

                filename = f"{self.user.pk}_{int(timezone.now().timestamp())}.avif"

                self.avatar.save(filename, ContentFile(buf.read()), save=False)
            except Exception:
                pass

        super().save(*args, **kwargs)

        try:
            if old_avatar_name and old_avatar_name != (
                self.avatar.name if self.avatar else None
            ):
                storage = self.avatar.storage
                if storage.exists(old_avatar_name):
                    storage.delete(old_avatar_name)
        except Exception:
            pass


class TeacherInviteCode(models.Model):
    code = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def is_valid(self):
        return self.is_active and self.created_at >= timezone.now() - timedelta(
            minutes=10
        )


class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username


class Subject(models.Model):
    name = models.CharField(max_length=128)

    def __str__(self):
        return self.name


class Grade(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    value = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)


class Badge(models.Model):
    name = models.CharField(max_length=128)
    description = models.TextField()


class StudentBadge(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    badge = models.ForeignKey(Badge, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)


class XPEvent(models.Model):
    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE)
    amount = models.IntegerField()
    reason = models.CharField(max_length=256)
    created_at = models.DateTimeField(auto_now_add=True)


class ShopItem(models.Model):
    ITEM_TYPES = (
        ('decoration', 'Украшение'),
        ('other', 'Другое'),
        ('product', 'товар'),
    )

    name = models.CharField(max_length=128, verbose_name="Название")
    description = models.TextField(blank=True, verbose_name="Описание")
    price = models.PositiveIntegerField(verbose_name="Цена в кристаллах")
    item_type = models.CharField(max_length=32, choices=ITEM_TYPES, default='other', verbose_name="Тип товара")
    image_url = models.image_url = models.URLField(max_length=500, null=True, blank=True, verbose_name="Ссылка на изображение",help_text="Вставьте URL картинки из интернета")
    validity_days = models.PositiveIntegerField(
        null=True, blank=True, 
        verbose_name="Срок действия (дней)",
        help_text="Оставьте пустым, если покупка бессрочная"
    )
    is_active = models.BooleanField(default=True, verbose_name="Доступен для покупки")

    class Meta:
        verbose_name = "Товар"
        verbose_name_plural = "Товары"

    def __str__(self):
        return f"{self.name} ({self.price} 💎)"


class Purchase(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Ожидает получения'),
        ('received', 'Получено'),
        ('expired', 'Истёк срок'),
    )

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='purchases', verbose_name="Ученик")
    item = models.ForeignKey(ShopItem, on_delete=models.SET_NULL, null=True, verbose_name="Товар")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='pending', verbose_name="Статус")
    code = models.CharField(max_length=12, unique=True, editable=False, verbose_name="Код покупки")
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата покупки")
    activated_at = models.DateTimeField(null=True, blank=True, verbose_name="Дата активации")
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name="Сгорает до")

    class Meta:
        verbose_name = "Покупка"
        verbose_name_plural = "Покупки"
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        # Генерация уникального 12-значного кода при создании
        if not self.code:
            self.code = get_random_string(12, allowed_chars='ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
        
        # Установка срока годности, если он задан в товаре
        if not self.pk and self.item and self.item.validity_days:
            self.expires_at = timezone.now() + timedelta(days=self.item.validity_days)
            
        super().save(*args, **kwargs)

    def check_expiration(self):
        """Проверяет и обновляет статус, если срок истёк"""
        if self.status == 'pending' and self.expires_at and timezone.now() > self.expires_at:
            self.status = 'expired'
            self.save(update_fields=['status'])
            return True
        return False

    def __str__(self):
        item_name = self.item.name if self.item else "Удалённый товар"
        return f"Покупка {self.code} ({item_name}) - {self.student.user.username}"
