from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView,
    LoginView,
    MyStudentProfileView,
    MyStudentAvatarView,
    MyTeacherProfileView,
    PublicStudentProfileView,
    PublicTeacherProfileView,
    StudentViewSet,
    TeacherViewSet,
    GenerateTeacherInviteCodeView,
    ChangeCrystalsView,
    ShopItemListView,
    BuyItemView,
    MyPurchasesView,
    ActivatePurchaseView,
    TeacherStudentPurchasesView,
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
    path("me/student/avatar/", MyStudentAvatarView.as_view()),
    path("teacher/<int:pk>/", PublicTeacherProfileView.as_view()),
    path("invite-code/", GenerateTeacherInviteCodeView.as_view()),
    path("", include(router.urls)),
    path("students/<int:student_id>/crystals/", ChangeCrystalsView.as_view()),
    path("shop/items/", ShopItemListView.as_view(), name="shop-items"),
    path("shop/buy/<int:item_id>/", BuyItemView.as_view(), name="shop-buy"),
    path("shop/my-purchases/", MyPurchasesView.as_view(), name="shop-my-purchases"),
    path("shop/my-purchases/<int:purchase_id>/activate/", ActivatePurchaseView.as_view(), name="shop-activate"),
    path("teachers/student/<int:student_id>/purchases/", TeacherStudentPurchasesView.as_view(), name="teacher-student-purchases"),

]
