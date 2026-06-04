from rest_framework import generics, viewsets
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView

from typing import Any
import secrets
from django.utils import timezone

from api.models import StudentProfile, TeacherProfile, TeacherInviteCode
from api.serializers import (
    RegisterSerializer,
    LoginSerializer,
    StudentProfileSerializer,
    TeacherProfileSerializer,
)
from api.permissions import IsTeacher, IsStudent, IsAdmin


class ChangeCrystalsView(APIView):
    permission_classes = [IsAuthenticated, IsTeacher]
    

    def post(self, request, student_id):
        amount = int(request.data.get("amount", 0))
        student = StudentProfile.objects.get(id=student_id)
        student.crystals += amount
        if student.crystals < 0:
            student.crystals = 0
        student.save()
        return Response({
            "student_id": student.id,
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


class GenerateTeacherInviteCodeView(APIView):
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request):
        code = secrets.token_hex(4).upper()

        obj = TeacherInviteCode.objects.create(
            code=code,
            is_active=True
        )

        return Response({
            "code": obj.code,
            "expires_in_minutes": 10
        })
