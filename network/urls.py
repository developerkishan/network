from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("create_post", views.create_post, name="create_post"),
    path("get_all_posts", views.get_all_posts, name="get_all_posts"),
    path("profile/<str:username>",views.profile , name='profile'),
    path("following_posts", views.following_posts , name="following_posts"),
    path("followUnfollow/<str:username>/<str:action>",views.followUnfollow ,name ='followUnfollow'),
    path("delete/<int:id>",views.delete, name="delete"),
    path("create_like/<int:id>", views.create_like, name="like")
]
