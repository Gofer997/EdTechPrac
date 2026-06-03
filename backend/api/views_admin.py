from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
import secrets

from api.models import StudentProfile, TeacherProfile, TeacherInviteCode
from api.permissions import IsAdmin

User = get_user_model()


class AdminDashboardView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        return Response(
            {
                "users": User.objects.count(),
                "students": StudentProfile.objects.count(),
                "teachers": TeacherProfile.objects.count(),
                "invite_codes": TeacherInviteCode.objects.count(),
            }
        )


class AdminInviteCodeView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        code = secrets.token_hex(4).upper()
        obj = TeacherInviteCode.objects.create(code=code, is_active=True)

        return Response({"code": obj.code, "expires_in_minutes": 10})
