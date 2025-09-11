from django.db import models


class Juhe(models.Model):
    index = models.BigAutoField(db_column='INDEX', primary_key=True, verbose_name='主键')
    title = models.CharField(db_column='TITLE', max_length=200, null=True, blank=True)
    age = models.CharField(db_column='AGE', max_length=100, null=True, blank=True)
    beauty = models.CharField(db_column='BEAUTY', max_length=100, null=True, blank=True)
    price = models.CharField(db_column='PRICE', max_length=600, null=True, blank=True)
    miaoshu = models.TextField(db_column='MIAOSHU', null=True, blank=True)
    address = models.CharField(db_column='ADDRESS', max_length=500, null=True, blank=True)
    patime = models.DateTimeField(db_column='PATIME', null=True, blank=True)
    createtime = models.DateTimeField(db_column='CREATETIME', null=True, blank=True)
    qq = models.CharField(db_column='QQ', max_length=200, null=True, blank=True)
    wechat = models.CharField(db_column='WECHAT', max_length=200, null=True, blank=True)
    phone = models.CharField(db_column='PHONE', max_length=200, null=True, blank=True)
    ext_id = models.CharField(db_column='ID', max_length=20)
    serverlist = models.CharField(db_column='SERVERLIST', max_length=200, null=True, blank=True)
    photourl = models.CharField(db_column='PHOTOURL', max_length=200, null=True, blank=True)
    photo = models.CharField(db_column='PHOTO', max_length=300, null=True, blank=True)
    city = models.IntegerField(db_column='CITY', null=True, blank=True)
    place = models.CharField(db_column='PLACE', max_length=400, null=True, blank=True)
    sourced = models.CharField(db_column='SOURCED', max_length=100)
    vaild = models.SmallIntegerField(db_column='VAILD')
    detail = models.TextField(db_column='DETAIL', null=True, blank=True)
    pic_info = models.TextField(db_column='PIC_INFO', null=True, blank=True)

    class Meta:
        db_table = 'JUHE'
        constraints = [
            models.UniqueConstraint(fields=['sourced', 'ext_id'], name='juhe_pk_2')
        ]

    def __str__(self):
        return f"{self.title or ''} [{self.sourced}:{self.ext_id}]"


class DistrictCodes(models.Model):
    code = models.CharField(db_column='code', max_length=6, primary_key=True)
    city = models.CharField(db_column='city', max_length=20)
    district = models.CharField(db_column='district', max_length=50)
    full_name = models.CharField(db_column='full_name', max_length=100)

    class Meta:
        db_table = 'DISTRICT_CODES'

    def __str__(self):
        return f"{self.full_name}({self.code})"


class Photo(models.Model):
    sourced = models.CharField(db_column='SOURCED', max_length=100, null=True, blank=True)
    ext_id = models.CharField(db_column='ID', max_length=20, null=True, blank=True)
    photo_url = models.CharField(db_column='PHOTO_URL', max_length=1000, primary_key=True)
    photo = models.CharField(db_column='PHOTO', max_length=200, null=True, blank=True)
    save_name = models.CharField(db_column='SAVE_NAME', max_length=200, null=True, blank=True)
    valid = models.IntegerField(db_column='VALID', null=True, blank=True)

    class Meta:
        db_table = 'PHOTO'

    def __str__(self):
        return self.photo_url


class DataView(models.Model):
    index = models.BigIntegerField(db_column='INDEX', primary_key=True)
    title = models.CharField(db_column='TITLE', max_length=200, null=True, blank=True)
    age = models.CharField(db_column='AGE', max_length=100, null=True, blank=True)
    beauty = models.CharField(db_column='BEAUTY', max_length=100, null=True, blank=True)
    price = models.CharField(db_column='PRICE', max_length=600, null=True, blank=True)
    miaoshu = models.TextField(db_column='MIAOSHU', null=True, blank=True)
    address = models.CharField(db_column='ADDRESS', max_length=500, null=True, blank=True)
    patime = models.DateTimeField(db_column='PATIME', null=True, blank=True)
    createtime = models.DateTimeField(db_column='CREATETIME', null=True, blank=True)
    qq = models.CharField(db_column='QQ', max_length=200, null=True, blank=True)
    wechat = models.CharField(db_column='WECHAT', max_length=200, null=True, blank=True)
    phone = models.CharField(db_column='PHONE', max_length=200, null=True, blank=True)
    ext_id = models.CharField(db_column='ID', max_length=20)
    serverlist = models.CharField(db_column='SERVERLIST', max_length=200, null=True, blank=True)
    photourl = models.CharField(db_column='PHOTOURL', max_length=200, null=True, blank=True)
    photo = models.CharField(db_column='PHOTO', max_length=300, null=True, blank=True)
    sourced = models.CharField(db_column='SOURCED', max_length=100)
    vaild = models.SmallIntegerField(db_column='VAILD')
    detail = models.TextField(db_column='DETAIL', null=True, blank=True)
    city_code = models.IntegerField(db_column='CITY_CODE', null=True, blank=True)
    city = models.CharField(db_column='CITY', max_length=20)
    district = models.CharField(db_column='DISTRICT', max_length=50)
    place = models.CharField(db_column='PLACE', max_length=100)
    pic_info = models.TextField(db_column='PIC_INFO', null=True, blank=True)

    class Meta:
        db_table = 'data'
        managed = False

    def __str__(self):
        return f"{self.title or ''} [{self.city}/{self.district}]"
