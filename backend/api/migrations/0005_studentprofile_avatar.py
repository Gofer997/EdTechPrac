from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("api", "0004_studentprofile_crystals"),
    ]

    operations = [
        migrations.AddField(
            model_name="studentprofile",
            name="avatar",
            field=models.ImageField(blank=True, null=True, upload_to="avatars/"),
        ),
    ]
