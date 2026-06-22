from django.utils import timezone
from api.models import StudentDailyQuest, DailyQuest, StudentBadge, Badge, StudentProfile

def generate_daily_quests(student):
    """Создаёт для студента активные квесты на сегодня, если их ещё нет."""
    today = timezone.now().date()
    existing = StudentDailyQuest.objects.filter(student=student, date=today)
    if existing.exists():
        return

    active_quests = DailyQuest.objects.filter(is_active=True)
    # Например, берём до 3 случайных
    quests = active_quests.order_by('?')[:3]
    for quest in quests:
        StudentDailyQuest.objects.create(
            student=student,
            quest=quest,
            progress=0,
            completed=False,
            date=today
        )

def update_daily_quests(student, quest_type, increment=1):
    """Обновляет прогресс всех активных квестов студента за сегодня."""
    today = timezone.now().date()
    active_quests = StudentDailyQuest.objects.filter(
        student=student,
        date=today,
        completed=False,
        quest__quest_type=quest_type
    )
    for sq in active_quests:
        sq.progress += increment
        if sq.progress >= sq.quest.target_value:
            sq.completed = True
            # Начисляем награду
            student.add_xp(sq.quest.xp_reward, f"Квест: {sq.quest.get_quest_type_display()}")
            student.crystals += sq.quest.crystal_reward
            student.save(update_fields=['crystals'])
        sq.save()

def check_and_award_badges(student):
    """Проверяет все активные значки и выдаёт ещё не полученные."""
    for badge in Badge.objects.filter(condition_type__isnull=False):
        if StudentBadge.objects.filter(student=student, badge=badge).exists():
            continue
        if meets_badge_condition(student, badge):
            StudentBadge.objects.create(student=student, badge=badge)
            if badge.xp_reward:
                student.add_xp(badge.xp_reward, f"Значок: {badge.name}")
            if badge.crystal_reward:
                student.crystals += badge.crystal_reward
                student.save(update_fields=['crystals'])

def meets_badge_condition(student, badge):
    from api.models import Attendance, Assignment, Purchase
    if badge.condition_type == 'lessons_attended':
        count = Attendance.objects.filter(
            student=student, is_present=True, xp_granted=True
        ).count()
        return count >= badge.condition_value
    elif badge.condition_type == 'assignments_submitted':
        # Считаем количество сданных заданий (по изменению статуса? Нужна связь студента с Assignment через отдельную модель,
        # но в текущей архитектуре Assignment общий на группу. Будем считать через GradeAssignmentView? Неудобно.
        # Упростим: если оценка за задание != None, считаем это сдачей.
        # Лучше завести модель StudentAssignment, но пока пропустим или реализуем позже.
        return False  # placeholder
    elif badge.condition_type == 'total_xp':
        return student.xp >= badge.condition_value
    elif badge.condition_type == 'items_bought':
        count = Purchase.objects.filter(student=student, status__in=['received', 'activated']).count()
        return count >= badge.condition_value
    return False
