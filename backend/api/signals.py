from django.db.models.signals import post_save
from django.dispatch import receiver
from api.models import Grade, XPEvent, StudentProfile
from django.db.models.signals import post_delete


@receiver(post_delete, sender=StudentProfile)
def delete_avatar_on_profile_delete(sender, instance, **kwargs):
    try:
        if instance.avatar:
            storage = instance._meta.get_field("avatar").storage
            if storage.exists(instance.avatar.name):
                storage.delete(instance.avatar.name)
    except Exception:
        pass


@receiver(post_save, sender=Grade)
def add_xp_from_grade(sender, instance, created, **kwargs):
    if not created:
        return

    xp_gain = instance.value * 2

    XPEvent.objects.create(
        student=instance.student,
        amount=xp_gain,
        reason="Выставление оценки",
    )

    student = instance.student
    student.xp += xp_gain
    student.level = (student.xp // 100) + 1
    student.save()
