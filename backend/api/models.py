from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from io import BytesIO

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
