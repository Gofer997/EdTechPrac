from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from io import BytesIO

from django.core.files.base import ContentFile
from PIL import Image, ImageOps


class Group(models.Model):
    name = models.CharField(max_length=128)
    teacher = models.ForeignKey("TeacherProfile", on_delete=models.CASCADE, related_name="groups")

    def __str__(self):
        return self.name


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    xp = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    group = models.ForeignKey(Group, on_delete=models.SET_NULL, null=True, blank=True, related_name="students")
    crystals = models.IntegerField(default=0)
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


class TeacherProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.user.username


class Assignment(models.Model):

    class Status(models.TextChoices):
        ISSUED = "issued", "Issued"
        SUBMITTED = "submitted", "Submitted"
        UNDER_REVIEW = "under_review", "Under Review"
        GRADED = "graded", "Graded"
        REVOKED = "revoked", "Revoked"

    title = models.CharField(max_length=256)
    description = models.TextField(blank=True)

    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name="assignments")
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="assignments")

    status = models.CharField(max_length=32, choices=Status.choices, default=Status.ISSUED)
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if not self.due_date:
            self.due_date = timezone.now() + timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def effective_status(self):
        if self.status == self.Status.ISSUED and self.due_date and timezone.now() > self.due_date:
            return "overdue"
        return self.status


class TeacherInviteCode(models.Model):
    code = models.CharField(max_length=64, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    max_uses = models.IntegerField(default=1)
    used_count = models.IntegerField(default=0)
    ttl_minutes = models.IntegerField(default=10)
    expires_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.max_uses < 1:
            raise ValidationError("max_uses должно быть >= 1 (больше или равно)")
        if self.ttl_minutes < 1:
            raise ValidationError("ttl_minutes должно быть >= 1 (больше или равно)")

    def save(self, *args, **kwargs):
        self.clean()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=self.ttl_minutes)
        super().save(*args, **kwargs)

    def is_valid(self):
        return (
            self.is_active
            and self.used_count < self.max_uses
            and timezone.now() <= self.expires_at
        )

    def use(self):
        if not self.is_valid():
            raise ValueError("Инвайткод не валидный")
        self.used_count += 1
        if self.used_count >= self.max_uses:
            self.is_active = False
        self.save()


class GroupInviteCode(models.Model):
    code = models.CharField(max_length=64, unique=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name="invite_codes")
    teacher = models.ForeignKey(TeacherProfile, on_delete=models.CASCADE, related_name="group_invite_codes")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    max_uses = models.IntegerField(default=1)
    used_count = models.IntegerField(default=0)
    ttl_minutes = models.IntegerField(default=1440)
    expires_at = models.DateTimeField(null=True, blank=True)

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.max_uses < 1:
            raise ValidationError("max_uses должно быть >= 1 (больше или равно)")
        if self.ttl_minutes < 1:
            raise ValidationError("ttl_minutes должно быть >= 1 (больше или равно)")

    def save(self, *args, **kwargs):
        self.clean()
        if not self.expires_at:
            self.expires_at = timezone.now() + timedelta(minutes=self.ttl_minutes)
        super().save(*args, **kwargs)

        if self.is_valid():
            self.is_active = True

    def is_valid(self):
        return (
            self.is_active
            and self.used_count < self.max_uses
            and timezone.now() <= self.expires_at
        )

    def use(self, student):
        if not self.is_valid():
            raise ValueError("Инвайткод группы не действителен")
        if self.group.teacher != self.teacher:
            raise ValueError("Это не ваша группа!")
        self.used_count += 1
        if self.used_count >= self.max_uses:
            self.is_active = False
        self.save()
        student.group = self.group
        student.save()


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
