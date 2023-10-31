(function (window, document) {
    window.bfLoggerTracker = {
        params: {
            tags:'',
            token:'',
            levels:[],
            context: {
                appId: "", 
                appName: "", 
                userId: "",
                email: "",
                name: ""
            }
        },
        init: function(params) {
            this.params = params;
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://cloudfront.loggly.com/js/loggly.tracker-2.2.4.min.js';
            script.async = true;
        
            script.onload = () => {
                this.attachLevels();
            };
        
            document.head.appendChild(script);
        },
        attachLevels: function() {
            window._LTracker = window._LTracker || [];
            window._LTracker.push({
                'logglyKey': this.params.token,
                'sendConsoleErrors': true,
                'tag': this.params.tags
            });

            const originalConsoleError = console.error;

            // Override console.error to log errors
            console.error = (message) => {
                this.logError(message);
                originalConsoleError(message);
            };
            // add a listener to all levels
            window.addEventListener("error", (event) => { 
                this.logError(event.message);
            });
        },
        logError: function (message) {
            const _data = {
                message: message
            };
            _data.context = this.params;
            if (window._LTracker) {
                window._LTracker.push(_data);
            }
        }
    };
})(window, document);