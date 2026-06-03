from rest_framework import generics, viewsets
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

    def get_object(self) -> Any:
        return StudentProfile.objects.get(user=self.request.user)


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