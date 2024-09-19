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
            setTimeout(connectSSE, 5000); // Try to reconnect after 5 seconds
        };

        eventSource.addEventListener('update', function(event) {
            const data = JSON.parse(event.data);
            console.log('Received update:', data);
            if (data.timestamp > lastUpdateTime) {
                updatePostUI(data.id, data.title);
                lastUpdateTime = data.timestamp;
            }
        });

        eventSource.addEventListener('ping', function(event) {
            console.log('Received ping:', JSON.parse(event.data));
        });
    }

    function updatePostUI(postId, postTitle) {
        const postElement = document.querySelector(`[data-post-id="${postId}"]`);
        if (postElement) {
            const titleElement = postElement.querySelector('.post-title');
            if (titleElement) {
                titleElement.textContent = postTitle;
            }
            // Add a visual indicator of the update
            postElement.style.transition = 'background-color 1s';
            postElement.style.backgroundColor = '#ffff99';
            setTimeout(() => {
                postElement.style.backgroundColor = '';
            }, 2000);
        }
    }

    // Start the SSE connection
    connectSSE();
})();