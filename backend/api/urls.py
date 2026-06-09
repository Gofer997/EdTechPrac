from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    RegisterView,
    LoginView,
    GroupViewSet,
    AssignmentViewSet,
    StudentAssignmentFeedView,
    ChangeCrystalsView,
    MyStudentProfileView,
    MyStudentAvatarView,
    MyTeacherProfileView,
    PublicStudentProfileView,
    PublicTeacherProfileView,
    GenerateTeacherInviteCodeView,
    ShopItemListView,
    BuyItemView,
    MyPurchasesView,
    ActivatePurchaseView,
    TeacherStudentPurchasesView,
    GroupInviteCodeView,
    StudentJoinGroupView,
)
from rest_framework_simplejwt.views import TokenRefreshView

router = DefaultRouter()
router.register(r"groups", GroupViewSet, basename="groups")
router.register(r"assignments", AssignmentViewSet, basename="assignments")

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("login/", LoginView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("assignments/feed/", StudentAssignmentFeedView.as_view()),
    path("student/profile/", MyStudentProfileView.as_view()),
    path("student/avatar/", MyStudentAvatarView.as_view()),
    path("teacher/profile/", MyTeacherProfileView.as_view()),
    path("public/students/<int:pk>/", PublicStudentProfileView.as_view()),
    path("public/teachers/<int:pk>/", PublicTeacherProfileView.as_view()),
    path("invite-code/", GenerateTeacherInviteCodeView.as_view()),
    path("change-crystals/<int:student_id>/", ChangeCrystalsView.as_view()),
    path("groups/invite-code/", GroupInviteCodeView.as_view()),
    path("student/join-group/", StudentJoinGroupView.as_view()),
    path("", include(router.urls)),
    path("shop/items/", ShopItemListView.as_view(), name="shop-items"),
    path("shop/buy/<int:item_id>/", BuyItemView.as_view(), name="shop-buy"),
    path("shop/my-purchases/", MyPurchasesView.as_view(), name="shop-my-purchases"),
    path("shop/my-purchases/<int:purchase_id>/activate/", ActivatePurchaseView.as_view(), name="shop-activate"),
    path("teachers/student/<int:student_id>/purchases/", TeacherStudentPurchasesView.as_view(), name="teacher-student-purchases"),

]
