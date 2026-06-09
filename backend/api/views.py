from rest_framework import generics, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from typing import Any
import secrets
from django.utils import timezone

from api.models import (
    Assignment,
    Group,
    GroupInviteCode,
    StudentProfile,
    TeacherProfile,
    TeacherInviteCode,
)
from api.serializers import (
    RegisterSerializer,
    LoginSerializer,
    StudentProfileSerializer,
    TeacherProfileSerializer,
    GroupSerializer,
    AssignmentSerializer,
)

__all__ = [
    "RegisterView",
    "LoginView",
    "GroupViewSet",
    "AssignmentViewSet",
    "StudentAssignmentFeedView",
    "GroupInviteCodeView",
    "StudentJoinGroupView",
]
from api.permissions import IsTeacher, IsStudent, IsAdmin


class ChangeCrystalsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request, student_id):
        teacher = TeacherProfile.objects.filter(user=request.user).first()
        if not teacher:
            raise PermissionDenied("Только преподы могут выдавать кристалики")
        student = StudentProfile.objects.get(id=student_id)
        if student.group and student.group.teacher != teacher:
            raise PermissionDenied("Этот студент не в вашей группе")
        amount = int(request.data.get("amount", 0))
        student.crystals += amount
        if student.crystals < 0:
            student.crystals = 0
        student.save()
        return Response({
            "student_id": student.pk,
            "crystals": student.crystals
        })


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class LoginView(generics.GenericAPIView):
    serializer_class = LoginSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class MyStudentProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def get_object(self) -> Any:
        return StudentProfile.objects.get(user=self.request.user)


class MyStudentAvatarView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        student = StudentProfile.objects.get(user=request.user)
        avatar = request.FILES.get("avatar")
        if not avatar:
            return Response({"detail": "Файл не передан"}, status=400)

        student.avatar = avatar
        student.save()
        return Response({
            "avatar_url": request.build_absolute_uri(student.avatar.url)
        })


class MyStudentAvatarDeleteView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]
    parser_classes = [MultiPartParser, FormParser]

    def get(self, request):
        student = StudentProfile.objects.get(user=request.user)
        if student.avatar:
            return Response({
                "avatar_url": request.build_absolute_uri(student.avatar.url)
            })
        return Response({"avatar_url": None}, status=204)

    def post(self, request):
        student = StudentProfile.objects.get(user=request.user)
        avatar = request.FILES.get("avatar")
        if not avatar:
            return Response({"detail": "Требуется файл аватара"}, status=400)
        if student.avatar:
            student.avatar.delete(save=False)
        student.avatar = avatar
        student.save()
        return Response({
            "avatar_url": request.build_absolute_uri(student.avatar.url)
        })

    def delete(self, request):
        student = StudentProfile.objects.get(user=request.user)
        try:
            if student.avatar:
                student.avatar.delete(save=False)
                student.avatar = None
                student.save()

            return Response({"detail": "Аватар успешно удалён"})
        except Exception as e:
            return Response({"detail": "Ошибка при удалении аватара", "error": str(e)}, status=500)


class MyTeacherProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_object(self) -> Any:
        return TeacherProfile.objects.get(user=self.request.user)


class PublicStudentProfileView(generics.RetrieveAPIView):
    serializer_class = StudentProfileSerializer
    queryset = StudentProfile.objects.all()
    permission_classes = [IsAuthenticated]


class PublicTeacherProfileView(generics.RetrieveAPIView):
    serializer_class = TeacherProfileSerializer
    queryset = TeacherProfile.objects.all()
    permission_classes = [IsAuthenticated]


class StudentViewSet(viewsets.ModelViewSet):
    queryset = StudentProfile.objects.all()
    serializer_class = StudentProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacher]


class TeacherViewSet(viewsets.ModelViewSet):
    queryset = TeacherProfile.objects.all()
    serializer_class = TeacherProfileSerializer
    permission_classes = [IsAuthenticated, IsTeacher]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        teacher = TeacherProfile.objects.filter(user=user).first()
        if teacher:
            return Group.objects.filter(teacher=teacher)

        student = StudentProfile.objects.filter(user=user).first()
        if student and student.group:
            return Group.objects.filter(pk=student.group.pk)

        return Group.objects.none()

    def perform_create(self, serializer):
        teacher = TeacherProfile.objects.filter(user=self.request.user).first()
        if not teacher:
            raise PermissionDenied("Создавать группы могут только преподаватели")
        serializer.save(teacher=teacher)

    def perform_update(self, serializer):
        group = self.get_object()
        if group.teacher.user != self.request.user:
            raise PermissionDenied("Только препод который владеет группой может её редачить")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.teacher.user != self.request.user:
            raise PermissionDenied("Только препод который владеет группой может её удалить")
        instance.delete()


class AssignmentViewSet(viewsets.ModelViewSet):
    queryset = Assignment.objects.all()
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        teacher = TeacherProfile.objects.filter(user=user).first()
        if teacher:
            return Assignment.objects.filter(teacher=teacher)

        student = StudentProfile.objects.filter(user=user).first()
        if student and student.group:
            return Assignment.objects.filter(group=student.group).exclude(
                status=Assignment.Status.REVOKED
            )

        return Assignment.objects.none()

    def perform_create(self, serializer):
        teacher = TeacherProfile.objects.filter(user=self.request.user).first()
        if not teacher:
            raise PermissionDenied("Только преподы могут выдавать задания")

        group = serializer.validated_data.get("group")
        if group.teacher != teacher:
            raise PermissionDenied(
                "Это не ваша группа!"
            )

        serializer.save(teacher=teacher)

    def update(self, request, *args, **kwargs):
        assignment = self.get_object()
        teacher = TeacherProfile.objects.filter(user=request.user).first()
        student = StudentProfile.objects.filter(user=request.user).first()
        # какой статус студент указал в запросе
        new_status = request.data.get("status")

        if student:
            if assignment.group != student.group:
                raise PermissionDenied(
                    "Вы не состоите в этой группе"
                )
            # предполагается переход issued -> submitted
            # (issued = препод выдал задание, submitted = студент отправил задание [т.е. решение, грубо говоря])
            # ниже ловим отклонения от этой логики.
            if new_status != Assignment.Status.SUBMITTED:
                raise PermissionDenied("Можно отправлять только сделанное задание (status = submitted)")

            if assignment.status != Assignment.Status.ISSUED:
                raise PermissionDenied("Отправить решение можно только в ответ на выданное задание")

            invalid_fields = set(request.data.keys()) - {"status"}
            if invalid_fields:
                raise PermissionDenied(
                    "Можно отправлять только сделанное задание (status = submitted)"
                )

            if "group" in request.data and request.data["group"] != assignment.group.id:
                raise PermissionDenied("Вы не можете изменить группу этого задания")

        elif teacher:

            if assignment.teacher != teacher:
                raise PermissionDenied(
                    "Вы можете управлять только своими заданиями"
                )

            if "group" in request.data and request.data["group"] != assignment.group.id:
                raise PermissionDenied(
                    "Нельзя изменить группу задания после создания"
                )
                # то есть группу для которой препод закинул задание. задаётся только разово когда препод выдаёт задание

            if (
                assignment.status == Assignment.Status.GRADED
                and "due_date" in request.data
            ):
                raise PermissionDenied("Нельзя изменить дедлайн после оценивания")
                # если препод поставил оценку студенту на его сделанное задание,
                # то дедлайн незя менять (логично)

            if new_status:
                if new_status == Assignment.Status.SUBMITTED:
                    raise PermissionDenied(
                        "Преподаватели не могут отмечать задания как сданные"
                    )
                    # тоже логично. сдают сделанные задания студенты, а не преподы

                if (
                    new_status == Assignment.Status.UNDER_REVIEW
                    and assignment.status != Assignment.Status.SUBMITTED
                ):
                    raise PermissionDenied(
                        "Перевести на проверку можно только после сдачи"
                    )

                if (
                    new_status == Assignment.Status.GRADED
                    and assignment.status != Assignment.Status.UNDER_REVIEW
                ):
                    raise PermissionDenied(
                        "Поставить оценку можно только после проверки"
                    )
                    # типа препод когда ему студент сдал решённое задание,
                    # он его переводит в under_review
                    # и далее после этого шага он уже может выставить оценку
                    # на всякий случай я сделал именно так но в целом можно выпилить эту логику
                    # чтобы как только студент отправил решение то препод мог сразу поставить оценку
                    # но это типо странно будет

                if (
                    new_status == Assignment.Status.REVOKED
                    and assignment.status == Assignment.Status.REVOKED
                ):
                    raise PermissionDenied("Задание уже отозвано")
                    # отозвать отозванное задание - бред. поэтому хендлим это

                if (
                    assignment.status == Assignment.Status.GRADED
                    and new_status != Assignment.Status.REVOKED
                ):
                    raise PermissionDenied(
                        "Оценённое задание можно только отозвать"
                    )
        else:
            raise PermissionDenied("Хм. Вы и не препод и не студент.. Как так..")

        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        kwargs["partial"] = True
        return self.update(request, *args, **kwargs)


class StudentAssignmentFeedView(generics.ListAPIView):
    serializer_class = AssignmentSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        student = StudentProfile.objects.get(user=self.request.user)
        if not student.group:
            return Assignment.objects.none()
        return Assignment.objects.filter(group=student.group).exclude(
            status=Assignment.Status.REVOKED
        )


class GroupInviteCodeView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]

    def post(self, request):
        teacher = TeacherProfile.objects.filter(user=request.user).first()
        if not teacher:
            raise PermissionDenied("Только преподы могут получать коды")

        group_id = request.data.get("group_id")
        if not group_id:
            return Response({"detail": "Необходим group_id"}, status=400)

        try:
            group = Group.objects.get(pk=group_id)
        except Group.DoesNotExist:
            return Response({"detail": "Такая группа не существует"}, status=404)

        if group.teacher != teacher:
            raise PermissionDenied("Вы не владеете этой группой")

        max_uses = int(request.data.get("max_uses", 1))
        ttl_minutes = int(request.data.get("ttl_minutes", 1440))

        if max_uses < 1:
            return Response({"detail": "max_uses должен быть >= 1 (больше или равно)"}, status=400)
        if ttl_minutes < 1:
            return Response({"detail": "ttl_minutes должен быть >= 1 (больше или равно)"}, status=400)

        import secrets
        code = secrets.token_hex(4).upper()
        obj = GroupInviteCode.objects.create(
            code=code,
            group=group,
            teacher=teacher,
            max_uses=max_uses,
            ttl_minutes=ttl_minutes,
        )

        return Response({
            "code": obj.code,
            "group_id": group.pk,
            "group_name": group.name,
            "max_uses": obj.max_uses,
            "ttl_minutes": obj.ttl_minutes,
            "expires_at": obj.expires_at.isoformat(),
        })


class StudentJoinGroupView(APIView):
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request):
        student = StudentProfile.objects.get(user=request.user)
        code = request.data.get("code")
        if not code:
            return Response({"detail": "Необходим код"}, status=400)

        try:
            invite = GroupInviteCode.objects.get(code=code)
        except GroupInviteCode.DoesNotExist:
            return Response({"detail": "Некорректный инвайткод"}, status=404)

        if not invite.is_valid():
            return Response({"detail": "Инвайткод устарел"}, status=400)

        invite.use(student)
        return Response({
            "student_id": student.pk,
            "group_id": invite.group.pk,
            "group_name": invite.group.name,
        })


class GenerateTeacherInviteCodeView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        code = secrets.token_hex(4).upper()
        obj = TeacherInviteCode.objects.create(code=code, is_active=True)
        return Response({
            "code": obj.code,
            "expires_in_minutes": obj.ttl_minutes,
        })
