from django.db.models.signals import post_save
from django.dispatch import receiver
from core.models import Grade, XPEvent, StudentProfile


@receiver(post_save, sender=Grade)
def add_xp_from_grade(sender, instance, created, **kwargs):
    if not created:
        return

    xp_gain = instance.value * 2

    XPEvent.objects.create(
        student=instance.student,
        amount=xp_gain,
        reason="grade awarded"
    )

    student = instance.student
    student.xp += xp_gain
    student.level = (student.xp // 100) + 1
    student.save()