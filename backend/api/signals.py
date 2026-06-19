from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from django.contrib.auth.signals import user_logged_in
from api.models import (
    StudentProfile, Grade, XPEvent, Assignment, Attendance,
    StudentDailyQuest, DailyQuest, StudentBadge, Badge, Purchase
)
from .utils import update_daily_quests, check_and_award_badges

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
    instance.student.add_xp(xp_gain, f"Оценка по предмету {instance.subject.name}")

# Ежедневный бонус за вход (сигнал от входа пользователя)
@receiver(user_logged_in)
def daily_login_bonus(sender, request, user, **kwargs):
    # Работает для всех пользователей, но XP и кристаллы только студентам
    try:
        student = user.studentprofile
    except StudentProfile.DoesNotExist:
        return

    today = timezone.now().date()
    # Проверяем, был ли сегодня уже начислен бонус
    if not XPEvent.objects.filter(
        student=student,
        reason="Ежедневный вход",
        created_at__date=today
    ).exists():
        student.add_xp(10, "Ежедневный вход")
        student.crystals += 1
        student.save(update_fields=['crystals'])

    # Обновляем ежедневные квесты
    update_daily_quests(student, 'login')
    check_and_award_badges(student)

# Сигнал при сдаче задания
@receiver(post_save, sender=Assignment)
def on_assignment_submitted(sender, instance, created, **kwargs):
    if created:
        return
    # Проверяем, что статус изменился на submitted (ищем студента по группе? Нет, Assignment не привязан к конкретному студенту.
    # В нашей архитектуре Assignment выдается всей группе, а сдаёт конкретный студент? Нет, модель Assignment одна на группу.
    # Уточнение: по текущей логике, Assignment имеет поле answer и статус общий на группу. Но студент сдаёт через update, где проверяется student.
    # Здесь мы не можем определить студента только по Assignment. Поэтому лучше перенести выдачу XP в момент изменения статуса во view.
    # Сигнал оставим для общей логики, но начисление XP сделаем в View (см. views.py).
    # Здесь просто оставим заглушку, а фактическую реализацию сделаем в GradeAssignmentView и в update AssignmentViewSet.
    pass

# Сигнал при изменении посещаемости (начисление XP за присутствие + квесты)
@receiver(post_save, sender=Attendance)
def on_attendance_saved(sender, instance, created, **kwargs):
    student = instance.student
    if instance.is_present and not instance.xp_granted:
        student.add_xp(5, "Посещение урока")
        instance.xp_granted = True
        instance.save(update_fields=['xp_granted'])
        update_daily_quests(student, 'attend_lesson')
        check_and_award_badges(student)

# Сигнал при покупке (для квестов и достижений)
@receiver(post_save, sender=Purchase)
def on_purchase_created(sender, instance, created, **kwargs):
    if created and instance.status == 'pending':  # покупка только создана
        student = instance.student
        # Начисление XP в BuyItemView уже сделано, но здесь добавим квесты и достижения
        update_daily_quests(student, 'buy_item')
        check_and_award_badges(student)

# Также при любом изменении XP можно вызывать проверку достижений (но это делается в add_xp или в сигналах выше)
