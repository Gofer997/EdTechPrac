from rest_framework import generics, viewsets, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.utils import timezone
from django.db import transaction

from typing import Any
import secrets
from django.utils import timezone

from api.models import StudentProfile, TeacherProfile, TeacherInviteCode, ShopItem, Purchase
from api.serializers import (
    RegisterSerializer,
    LoginSerializer,
    ShopItemSerializer,
    PurchaseSerializer,
    StudentProfileSerializer,
    TeacherProfileSerializer,
)
from api.permissions import IsTeacher, IsStudent, IsAdmin

class ShopItemListView(generics.ListAPIView):
    """Витрина товаров для учеников"""
    queryset = ShopItem.objects.filter(is_active=True)
    serializer_class = ShopItemSerializer
    permission_classes = [IsAuthenticated]


class BuyItemView(APIView):
    """Покупка товара учеником"""
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request, item_id):
        try:
            item = ShopItem.objects.get(id=item_id, is_active=True)
        except ShopItem.DoesNotExist:
            return Response({"error": "Товар не найден или недоступен"}, status=status.HTTP_404_NOT_FOUND)

        # Открываем атомарную транзакцию
        with transaction.atomic():
            # Блокируем строку профиля студента до завершения транзакции (защита от race conditions)
            student = StudentProfile.objects.select_for_update().get(user=request.user)

            if student.crystals < item.price:
                return Response({"error": "Недостаточно кристаллов"}, status=status.HTTP_400_BAD_REQUEST)

            # Списываем кристаллы
            student.crystals -= item.price
            student.save(update_fields=['crystals'])

            # Создаем запись о покупке (код сгенерируется в методе save)
            purchase = Purchase.objects.create(student=student, item=item)

        return Response({
            "message": "Успешная покупка",
            "purchase": PurchaseSerializer(purchase, context={'request': request}).data,
            "balance": student.crystals
        }, status=status.HTTP_201_CREATED)


class MyPurchasesView(generics.ListAPIView):
    """Список покупок ученика"""
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated, IsStudent]

    def get_queryset(self):
        student = self.request.user.studentprofile
        purchases = Purchase.objects.filter(student=student)
        
        # Актуализируем статусы просроченных покупок при запросе
        for p in purchases.filter(status='pending', expires_at__lt=timezone.now()):
            p.check_expiration()
            
        return purchases


class ActivatePurchaseView(APIView):
    """Активация покупки учеником"""
    permission_classes = [IsAuthenticated, IsStudent]

    def post(self, request, purchase_id):
        student = request.user.studentprofile
        try:
            purchase = Purchase.objects.get(id=purchase_id, student=student)
        except Purchase.DoesNotExist:
            return Response({"error": "Покупка не найдена"}, status=status.HTTP_404_NOT_FOUND)

        # Проверяем не истек ли срок перед активацией
        purchase.check_expiration()

        if purchase.status != 'pending':
            return Response({"error": f"Невозможно активировать. Текущий статус: {purchase.get_status_display()}"}, 
                            status=status.HTTP_400_BAD_REQUEST)

        # Активируем
        purchase.status = 'activated'
        purchase.activated_at = timezone.now()
        purchase.save(update_fields=['status', 'activated_at'])

        return Response({"message": "Товар успешно активирован!"}, status=status.HTTP_200_OK)


class TeacherStudentPurchasesView(generics.ListAPIView):
    """Просмотр покупок конкретного ученика учителем"""
    serializer_class = PurchaseSerializer
    permission_classes = [IsAuthenticated, IsTeacher]

    def get_queryset(self):
        student_id = self.kwargs.get('student_id')
        return Purchase.objects.filter(student_id=student_id)




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
