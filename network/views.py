from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect ,HttpResponseNotAllowed ,JsonResponse
from django.shortcuts import render
from django.urls import reverse
from .models import User,Post , Follow
from network.forms import PostForm
from django.utils import timezone
from django.core.paginator import Paginator


MIN_LENGTH = 10
MAX_LENGTH = 500

def index(request):
    postForm = PostForm()
    return render(request, "network/index.html",{'postform':postForm})


def create_post(request):
    if request.method == 'POST':
        if request.user.is_authenticated:
            content = request.POST.get('content')
            if not content:
                return JsonResponse({
                    'error' : 'content is required'
                } , status = 400)
            elif len(content) < MIN_LENGTH or len(content) > MAX_LENGTH:
                return JsonResponse({
                    'error': 'Content length is not valid'
                } , status = 400)
            else:
                post = Post()
                post.content = content
                post.creator = request.user
                post.save()
                return JsonResponse({
                    'success': True,
                    'content': post.content,
                    'creator': post.creator.username,
                    'created_at': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
                    'likes_count': post.likes.count()} , status = 200)
        else:
            return JsonResponse({
                'error': 'User is not logged in '
            }, status = 401)
    else:
        return JsonResponse({
            'error': 'Method not Allowed'
        }, status = 405)
    

def get_all_posts(request):
    posts = Post.objects.all().order_by('-created_at')
    pagenumber = request.GET.get('page',1)
    paginator = Paginator(posts, 10)
    page = paginator.get_page(pagenumber)
    print( f"{page.has_previous()} is printed" )
    print(f"{page.has_next()} is printed")
    posts_data = []
    for post in page:
        post_data = {
            'username' : post.creator.username,
            'content': post.content,
            'timestamp': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),
            'likes': post.likes.count()
        }
        posts_data.append(post_data)
    return JsonResponse({
        'posts': posts_data,
        'has_previous': page.has_previous(),
        'has_next': page.has_next()
    }, safe=False)
    

def profile(request, username):
    try:
        print("regarding the authentication")
        if(request.user.is_authenticated == False):
            return JsonResponse(
                {
                'error': 'User is not logged in '
                }, status = 401
            )
        user = User.objects.get(username=username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=400)
        
    # Fetch all posts by the user
    posts = Post.objects.filter(creator=user).order_by('-created_at')
    print(f"Printing the user who is signed in : {request.user}")
    # Serialize posts data
    posts_data = []
    for post in posts:
        post_data = {
            'username': post.creator.username,
            'content': post.content,
            'timestamp': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),  # Format the timestamp
            'likes': post.likes.count()
        }
        posts_data.append(post_data)
    following = user.followings.all()
    followers = user.followers.all()
    following_list = []
    followers_list = []
    for follow in following:
        name = follow.followed.username
        following_list.append(name)
    print(f"printing following list : {following_list}")
    for follow in followers:
        name = follow.follower.username
        followers_list.append(name)
    following_count = len(following_list)
    followers_count = len(followers_list)
    # creating follow button in the UI 
    followButton = True
    follow_button_text = 'Follow'
    if(request.user.username == username or not request.user.is_authenticated):
        followButton = False
        follow_button_text = ''
    elif(request.user.username in followers_list):
        follow_button_text = 'Unfollow'
        
    return JsonResponse({
        'posts' : posts_data,
        'following_count': following_count,
        'followers_count': followers_count,
        'follow_button': followButton,
        'follow_button_text': follow_button_text,
        }, safe=False)      




def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        print(request.POST["username"])
        print(request.POST["password"])
        user = authenticate(request, username=username, password=password)
        print(user)
        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))

def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")


def following_posts(request):
    if request.user.is_authenticated:
        following = request.user.followings.all()
        following_list = []
        for follow in following:
            name = follow.followed.username
            following_list.append(name)
        posts_data=[]
        for user in following_list:
            userObject = User.objects.get(username = user)
            posts = Post.objects.filter(creator=userObject)
            # Serialize posts data
            for post in posts:
                post_data = {
                    'username': post.creator.username,
                    'content': post.content,
                    'timestamp': post.created_at.strftime('%Y-%m-%d %H:%M:%S'),  # Format the timestamp
                    'likes': post.likes.count()
                }
                posts_data.append(post_data)
        return JsonResponse({
        'posts' : posts_data
    }, safe=False)


def followUnfollow(request, username,action):
    try:
        followed = User.objects.get(username = username)
    except User.DoesNotExist:
        return JsonResponse({'error': 'User does not exist'}, status=400)
    if request.user.is_authenticated:
        if (action == 'Unfollow'):
            follower = User.objects.get(username = request.user)
            follow_instance = Follow.objects.get(follower = follower , followed = followed)
            if (follow_instance):
                follow_instance.delete()
                return JsonResponse({
                    'status':'unfollowed ' , 
                    'followers_count': followed.followers.count()
                },status= 200) 
            else:
                return JsonResponse({
                    'status': 'Follow relationship does not exist'
                }, status = 400)
        elif (action == 'Follow'):
            follower = User.objects.get(username=request.user)
            follow_instance = Follow.objects.create(follower= follower , followed = followed)
            follow_instance.save()
            if follow_instance:
                return JsonResponse({
                    'status' : 'followed',
                    'followers_count': followed.followers.count()
                },status =200)
            else:
                return JsonResponse({
                    'error': 'error creating the relationship'
                }, status=400)
    return JsonResponse({
                'error': 'User is not logged in '
            }, status = 401)