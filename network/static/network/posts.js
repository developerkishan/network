let pagenumber = 1
const csrftoken = document.cookie.split('; ').find(row => row.startsWith('csrftoken')).split('=')[1];
            
document.addEventListener('DOMContentLoaded', function () {
    
    document.querySelector('#new-post-form').addEventListener('submit', function (event) {
        createPostElement(event);
    });
    document.querySelector('#all-posts').addEventListener('click', function (event) {
        event.preventDefault();
        loadAllPosts();
    });
    let followingButton = document.querySelector('#following');
    if (followingButton){
        document.querySelector('#following').addEventListener('click', function (event) {
            event.preventDefault();
            loadFollowingPosts();
        });
    }
    
    let userElement = document.querySelector('a#user');
    userElement.addEventListener('click',function(event){
    let username = userElement.innerText.trim()
    loadProfile(username)    
    })

});

function createPostElement(event) {
    event.preventDefault();
    let form = document.querySelector('#new-post-form');
    let formData = new FormData(form);
    let postsContainer = document.querySelector('#posts-container')

    fetch('create_post', {
        method: 'POST',
        body: formData,
    })
        .then(function (response) {
            if (!response.ok) {
                return response.json()
                .then(function (error) {
                    throw new Error(error.error);
                });
            }
            return response.json();
        })
        .then(function (data) {
            let postElementDiv = createPostElementDiv(data.creator, data.content,null , null, null ,null);
            form.reset();
            let editButton = document.createElement('button');
            editButton.id = 'editButton';
            editButton.innerText = 'edit';
            editButton.style.width = '50px';
            editButton.style.height = '50px';
            editButton.style.fontSize = '20px';
            editButton.style.color = 'black';
            editButton.style.borderRadius = '12px';
            postElementDiv.appendChild(editButton);

            postsContainer.appendChild(postElementDiv);
            

            editButton.addEventListener('click' , function(event){
                console.log('lets do it ')
                // form
                let editForm = document.createElement('form')
                // textarea
                let textArea = document.createElement('textarea')
                textArea.id = 'textAreaId'
                textArea.textContent = data.content;
                //save button
                let saveButton = document.createElement('button');
                saveButton.id = 'saveButton';
                saveButton.innerText = 'Save';
                saveButton.style.width = '50px';
                saveButton.style.height = '50px';
                saveButton.style.fontSize = '20px';
                saveButton.style.color = 'black';
                saveButton.style.borderRadius = '12px';
                //append button
                editForm.appendChild(textArea)
                editForm.appendChild(saveButton)

                postsContainer.innerHTML = ' '
                form.innerHTML = ' '
                postsContainer.appendChild(editForm)
            })
        })
        .catch(function (error) {
            console.error('Error:', error.message);
            alert(`Error: ${error.message}`);
        });
}


function loadAllPosts() {
    let postsContainer = document.querySelector('#posts-container');
    postsContainer.innerHTML = '';
    let form = document.querySelector('#new-post-form');
    form.innerHTML = '';

    fetch('get_all_posts?page='+ pagenumber)
        .then(function (response) {
            return response.json();
        })
        .then(function (posts) {
            console.log(posts)


            let paginationButtonsDiv = createPagination(posts.has_previous,posts.has_next )
            postsContainer.appendChild(paginationButtonsDiv)
            let prevButton = document.getElementById('prevButton');
            
    if (prevButton !== null){

        prevButton.addEventListener('click', function(event){
            pagenumber = pagenumber -1 ;
            loadAllPosts();
        })
    }
    let nextButton = document.getElementById('nextButton');
    if (nextButton !== null){
        nextButton.addEventListener('click', function(event){
            pagenumber = pagenumber +1 ;
            loadAllPosts();
        })
    }

            posts.posts.forEach(function (post){
                console.log(post)
                let postElementDiv = createPostElementDiv(post.username, post.content, post.timestamp, post.likes , post.liked_user , post.id);
                let likeButton = postElementDiv.querySelector('p#like' + post.id);
                    likeButton.addEventListener('click',function(event){
                        create_like(post.id , likeButton)
                        
                    })
                postsContainer.appendChild(postElementDiv);

                let postElementUser = postElementDiv.querySelector('a');
                postElementUser.addEventListener('click', function (event) {
                    event.preventDefault();
                    loadProfile(post.username);
                });
                
                
            });
            
        })
        .catch(function (error) {
            console.error('Error:', error);
        });

        
}

function loadFollowingPosts() {
    let postsContainer = document.querySelector('#posts-container');
    postsContainer.innerHTML = '';
    let form = document.querySelector('#new-post-form');
    form.innerHTML = '';
    fetch('/following_posts')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log('loading following posts')
            console.log(data)
            data.posts.forEach(function (post) {
                let postElementDiv = createPostElementDiv(post.username,post.content, post.timestamp, post.likes , post.liked_user , post.id);
                
                postsContainer.appendChild(postElementDiv);
                let likeButton = postElementDiv.querySelector('p#like' + post.id);
                    likeButton.addEventListener('click',function(event){
                        create_like(post.id , likeButton)
                        
                    })

                let postElementUser = postElementDiv.querySelector('a');
                postElementUser.addEventListener('click', function (event) {
                    event.preventDefault();
                    loadProfile(post.username);
                });
            });

        })
        .catch(function (error) {
            console.error('Error:', error);
            console.log('Error:' , error.message)
        });
}



function loadProfile(username) {
    let postsContainer = document.querySelector('#posts-container');
    postsContainer.innerHTML = '';
    document.querySelector('h1').innerHTML = '';
    document.querySelector('#new-post-form').innerHTML = '';
    fetch(`/profile/${username}`)
        .then(function (response) {
            if(!response.ok){
                if(response.status == 401){
                    console.log("Please login to view the profile ")
                    alert("Please login to view the profile")
                    window.location.href = '/login'
                }
            }
            return response.json();
        })
        .then(function (profileData) {
            console.log(profileData)
            console.log("The above is the profileData")
            let followElements = createFollowElements(profileData);
            postsContainer.appendChild(followElements);
            followUnfollowButton = document.querySelector('#followButton')
            if (followUnfollowButton !== null ){
                followUnfollowButton.addEventListener('click', function(event){
                    event.preventDefault()
                    console.log('button clicked')
                    console.log(profileData.posts[0].username)
                    console.log(followUnfollowButton.innerText)
                    fetch(`/followUnfollow/${profileData.posts[0].username}/${followUnfollowButton.innerText}`)
                    .then(function(response){
                        if (!response.ok){
                            
                        }
                        if(followUnfollowButton.innerText == 'Follow'){
                            followUnfollowButton.innerText = 'Unfollow'        
                        }
                        else{
                            followUnfollowButton.innerText = 'Follow'
                        }
                        
                        console.log(response)
                        return response.json()
                    })
                    .then(function(response){
                        console.log(response)
                        const followersElement = document.querySelector('p#Followers');
                        followersElement.textContent = response.followers_count
                    })
                })
            }            
                    profileData.posts.forEach(function (profilePost) {
                    let postElementDiv = createPostElementProfileDiv( profilePost.id , profilePost.content, profilePost.timestamp, profilePost.likes, profilePost.liked_user , profilePost.username );
                    let deleteButton = createDeleteButton()
                    postElementDiv.append(deleteButton)
                    deleteButton.addEventListener('click',function(event){
                        delete_post(profilePost.id)
                        console.log("deleted")
                        
                    })
                    let likeButton = postElementDiv.querySelector('p#like' + profilePost.id);
                    likeButton.addEventListener('click',function(event){
                        create_like(profilePost.id , likeButton)
                        
                    })

                    postsContainer.appendChild(postElementDiv);

                    
            });
            
        })
        .catch(function (error) {
            console.log('Error:', error);
        });
}

function createPostElementDiv(username , content, timestamp, likes , liked_user, id) {
    console.log(username)
    console.log("is printed")
    let postElementDiv = document.createElement('div');
    let postElementUser = document.createElement('a');
    let postElementContent = document.createElement('p');
    let postElementDate = document.createElement('p');
    let postElementLikes = document.createElement('p');
    postElementLikes.id = 'like' + id;

    
    


    if (username) {
        postElementUser.href = `/profile/${username}`;
        postElementUser.innerHTML = `<strong>${username}</strong>`;
        postElementDiv.appendChild(postElementUser);
    }

    postElementContent.innerHTML = `${content}`;
    if (timestamp) postElementDate.innerHTML = `Posted on: ${timestamp}`;
    if (likes !== null){
        if(liked_user.includes(username)){
            
            postElementLikes.innerHTML = `❤️${likes}`;

        }
        else{
            postElementLikes.innerHTML = `♡${likes}`;
        }
    }

    postElementDiv.appendChild(postElementContent);
    if (timestamp) postElementDiv.appendChild(postElementDate);
    if (likes !== null) postElementDiv.appendChild(postElementLikes);


    // Styling
    postElementDiv.style.margin = "30px";
    postElementDiv.style.padding = "10px";
    postElementDiv.style.fontFamily = "Arial";
    postElementDiv.style.fontSize = "14px";
    postElementDiv.style.color = "black";
    postElementDiv.style.border = "1px solid black";
    postElementDiv.style.backgroundColor = "#f8f8f8";

    return postElementDiv;
}

function createFollowElements(profileData) {
    let follow = document.createElement('div');
    follow.style.display = 'flex';
    follow.style.gap = '50px';

    if (profileData.follow_button === true) {
        let followButton = document.createElement('button');
        followButton.innerText = profileData.follow_button_text;
        followButton.id= 'followButton'
        followButton.style.width = '100px';
        followButton.style.height = '50px';
        followButton.style.fontSize = '20px';
        followButton.style.color = 'black';
        followButton.style.borderRadius = '12px';
        follow.appendChild(followButton);
    }

    let followersDiv = createFollowCountElement('Followers', profileData.followers_count);
    let followingsDiv = createFollowCountElement('Following', profileData.following_count);

    follow.appendChild(followersDiv);
    follow.appendChild(followingsDiv);

    return follow;
}

function createFollowCountElement(title, count) {
    let countDiv = document.createElement('div');
    let countHeader = document.createElement('h2');
    countHeader.textContent = title;
    countHeader.id = title;
    let countParagraph = document.createElement('p');
    countParagraph.textContent = count;
    countParagraph.id = title

    countDiv.appendChild(countHeader);
    countDiv.appendChild(countParagraph);

    return countDiv;
}


function createPostElementProfileDiv(id , content, timestamp, likes , liked_user, username) {
    
    let postElementDiv = document.createElement('div');
    postElementDiv.id = id;
    let postElementContent = document.createElement('p');
    let postElementDate = document.createElement('p');
    let postElementLikes = document.createElement('p');
    postElementLikes.id = 'like' + id;
    

    postElementContent.innerHTML = `${content}`;
    if (timestamp) postElementDate.innerHTML = `Posted on: ${timestamp}`;
    if (likes !== null){
        if(liked_user.includes(username)){
            
            postElementLikes.innerHTML = `❤️${likes}`;

        }
        else{
            postElementLikes.innerHTML = `♡${likes}`;
        }
    }
    
        
    
    postElementDiv.appendChild(postElementContent);
    if (timestamp) postElementDiv.appendChild(postElementDate);
    if (likes !== null) postElementDiv.appendChild(postElementLikes);
    

    // Styling
    postElementDiv.style.margin = "30px";
    postElementDiv.style.padding = "10px";
    postElementDiv.style.fontFamily = "Arial";
    postElementDiv.style.fontSize = "14px";
    postElementDiv.style.color = "black";
    postElementDiv.style.border = "1px solid black";
    postElementDiv.style.backgroundColor = "#f8f8f8";

    return postElementDiv;
}












// loading the next and previous button 

function createPagination(has_previous,has_next) {

    let paginationButtonDiv = document.createElement('div');
    paginationButtonDiv.style.display = 'flex';
    paginationButtonDiv.style.gap = '50px';
    if(has_previous === true){
        let previousButton = document.createElement('button');
        previousButton.id = 'prevButton';
        previousButton.innerText = 'Previous';
        previousButton.style.width = '100px';
        previousButton.style.height = '50px';
        previousButton.style.fontSize = '20px';
        previousButton.style.color = 'black';
        previousButton.style.borderRadius = '12px';
        paginationButtonDiv.appendChild(previousButton);

    }

    if(has_next === true){
        let nextButton = document.createElement('button');
        nextButton.id = 'nextButton';
        nextButton.innerText = 'Next';
        nextButton.style.width = '100px';
        nextButton.style.height = '50px';
        nextButton.style.fontSize = '20px';
        nextButton.style.color = 'black';
        nextButton.style.borderRadius = '12px';
        paginationButtonDiv.appendChild(nextButton);

    }


    return paginationButtonDiv;
}


function createDeleteButton(){
    
        let deleteButton = document.createElement('button');
        deleteButton.id = 'delete';
        deleteButton.innerText = 'Delete';
        deleteButton.style.width = '60px';
        deleteButton.style.height = '30px';
        deleteButton.style.fontSize = '15px';
        deleteButton.style.color = 'black';
        deleteButton.style.borderRadius = '12px';
        
        return deleteButton
    
}

function delete_post(id){
    fetch(`/delete/${id}`,
        {
            method: 'DELETE',
            headers:{
                'X-CSRFToken': csrftoken    
            }
        })
        .then(function(response){
            if(!response.ok){
                throw Error(response.status)
            }
            return response.json()   
        })
        .then(function(data){
            document.getElementById(id).remove()
        })
        .catch(function (error) {
            console.error('Error:', error.message);
            alert(`Error: ${error.message}`);
        });
}


function create_like(id,likeButton){

        fetch(`/create_like/${id}`)
        .then(function(response){
        if(!response.ok ){
            throw new Error(error.error);
            }
        return response.json()    
            })
            .then(function(data){
                console.log(data)
                if(data.status === 'liked'){
                    likeButton.innerHTML = `❤️${data.like_count}`;
                    }
                else{
                    likeButton.innerHTML = `♡${data.like_count}`;
                    }
                    })
            .catch(function(error){
                console.log('Error:', error);
                })
}