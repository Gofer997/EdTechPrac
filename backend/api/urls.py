from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    MyStudentProfileView,
    MyTeacherProfileView,
    PublicStudentProfileView,
    PublicTeacherProfileView,
    StudentViewSet,
    TeacherViewSet,
    GenerateTeacherInviteCodeView,
    ChangeCrystalsView,
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r"students", StudentViewSet, basename="students")
router.register(r"teachers", TeacherViewSet, basename="teachers")

urlpatterns = [
    path("admin-api/", include("api.urls_admin")),
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("me/student/", MyStudentProfileView.as_view()),
    path("me/teacher/", MyTeacherProfileView.as_view()),
    path("student/<int:pk>/", PublicStudentProfileView.as_view()),
    path("teacher/<int:pk>/", PublicTeacherProfileView.as_view()),
    path("invite-code/", GenerateTeacherInviteCodeView.as_view()),
    path("", include(router.urls)),
    path("students/<int:student_id>/crystals/",ChangeCrystalsView.as_view()),
]
