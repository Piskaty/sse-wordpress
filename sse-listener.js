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
                lastUpdateTime = data.timestamp;
            }
        });

        eventSource.addEventListener('ping', function(event) {
            console.log('Received ping:', JSON.parse(event.data));
        });
    }


    connectSSE();
})();