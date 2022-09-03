setInterval(() => {
    // Make a http request to /shut/realtime
    fetch('/shut/realtime')
        .then(response => response.json())
        .then(data => {
            if (data.ready){
                new Audio('/shut/ready.mp3').play();
                setTimeout(() => {
                    window.location.reload();
                }, 10000);
            }
        });
}, 15000);