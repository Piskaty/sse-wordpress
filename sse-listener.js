(function() {
    const sseUrl = sseData.sseUrl;
    let eventSource;
    let lastUpdateTime = 0;

    function connectSSE() {
        eventSource = new EventSource(sseUrl);

        eventSource.onopen = function() {
            console.log('SSE connection opened.');
        };

        eventSource.onerror = function(error) {
            console.error('SSE connection error:', error);
            eventSource.close();
            setTimeout(connectSSE, 5000);
        };

        eventSource.addEventListener('update', function(event) {
            const data = JSON.parse(event.data);
            if (data.timestamp > lastUpdateTime) {
                console.log('Received update:', data);
                updatePostUI(data.id, data.title, data.content);
                lastUpdateTime = data.timestamp;
            }
        });

        eventSource.addEventListener('new', function(event) {
            const data = JSON.parse(event.data);
            if (data.timestamp > lastUpdateTime) {
                console.log('Received new post:', data);
                addNewPostUI(data.id, data.title, data.content);
                lastUpdateTime = data.timestamp;
            }
        });

        eventSource.addEventListener('ping', function(event) {
            console.log('Received ping:', JSON.parse(event.data));
        });
    }
   
    function updatePostUI(postId, postTitle, postContent) {
        const postElement = document.querySelector(`#sse-updates-container [class*="post-${postId}"]`);
        if (postElement) {
            const titleElement = postElement.querySelector('.title');
            const contentElement = postElement.querySelector('.content');
            if (titleElement) {
                titleElement.textContent = postTitle;
            }
            if (contentElement) {
                contentElement.textContent = postContent;
            }

            postElement.style.transition = 'background-color 1s';
            postElement.style.backgroundColor = '#ffff99';
            setTimeout(() => {
                postElement.style.backgroundColor = '';
            }, 2000);
        }
    }
    
    function addNewPostUI(postId, postTitle, postContent) {
        const container = document.getElementById('sse-updates-container');
        if (container) {

            const existingPost = container.querySelector(`[class*="post-${postId}"]`);
            if (existingPost) {
                updatePostUI(postId, postTitle, postContent);
                return;
            }

            const newPostElement = document.createElement('div');
            newPostElement.className = `brxe-tgwopp brxe-div post-${postId}`;
            newPostElement.innerHTML = `
                <div class="brxe-xktxqw brxe-text-basic title">${postTitle}</div>
                <div class="brxe-wbtryf brxe-text-basic content">${postContent}</div>
            `;
            

            container.appendChild(newPostElement);


            newPostElement.style.transition = 'background-color 1s';
            newPostElement.style.backgroundColor = '#99ff99';
            setTimeout(() => {
                newPostElement.style.backgroundColor = '';
            }, 2000);
        }
    }

    connectSSE();
})();