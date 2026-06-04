from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken
from django.db import transaction
from api.models import TeacherProfile, StudentProfile, TeacherInviteCode

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=["student", "teacher"], write_only=True)
    teacher_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
            "password",
            "password2",
            "role",
            "teacher_code",
        )

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError("Пароли не совпадают")

        if attrs["role"] == "teacher":
            code = attrs.get("teacher_code")
            if not code:
                raise serializers.ValidationError("Требуется код преподавателя")

            invite = TeacherInviteCode.objects.filter(code=code, is_active=True).first()

            if not invite:
                raise serializers.ValidationError("Некорректный код преподавателя")

            if not invite.is_valid():
                raise serializers.ValidationError("Некорректный код преподавателя")

        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        role = validated_data.pop("role")
        teacher_code = validated_data.pop("teacher_code", None)

        with transaction.atomic():
            user = User.objects.create_user(**validated_data)

            if role == "student":
                StudentProfile.objects.create(user=user)

            elif role == "teacher":
                TeacherProfile.objects.create(user=user)
                if teacher_code:
                    TeacherInviteCode.objects.filter(code=teacher_code).update(
                        is_active=False
                    )

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()

    def validate(self, attrs):
        user = User.objects.filter(email__iexact=attrs["email"]).first()

        if not user or not user.check_password(attrs["password"]):
            raise serializers.ValidationError("Неверный логин или пароль")

        refresh = RefreshToken.for_user(user)

        return {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class StudentProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    avatar = serializers.ImageField(write_only=True, required=False, allow_null=True)
    avatar_url = serializers.SerializerMethodField(read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = StudentProfile
        fields = (
            "username",
            "first_name",
            "last_name",
            "email",
            "xp",
            "level",
            "group",
            "crystals",
            "avatar",
            "avatar_url",
        )

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None

        request = self.context.get("request")
        url = obj.avatar.url
        return request.build_absolute_uri(url) if request else url


class TeacherProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    email = serializers.CharField(source="user.email", read_only=True)

    class Meta:
        model = TeacherProfile
        fields = ("username", "first_name", "last_name", "email")
