(function (window, document) {
    window.bfLoggerTracker = {
        params: {
            tags:'',
            token:'',
            levels:[],
            context: {
                appId: "", 
                userId: ""
            }
        },
        logger: null,
        init: function(params) {
            this.params.tags = params;
            //load loggly script at runtime with async
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://cloudfront.loggly.com/js/loggly.tracker-2.2.4.min.js';
            script.async = true;
        
            script.onload = function() {
                this.attachLevels();
            };
        
            document.head.appendChild(script);

            // <script src='cloudfront.buildfire.com/bf-logger-js.js?onload=initlogs' async>
            // <script>
            // function initlogs(){
            // bfLoggerTracker.init({tags:'cp',token:'key',levels:['error'],context:{appId, userId}})
            // }
            // </script>

        },
        attachLevels: function() {
            const logger = new LogglyTracker();
            this.logger = logger;
            // push a loggly key to initialize
            logger.push({'logglyKey': this.params.token });
        
            // add a listener to all levels
            window.addEventListener("error", (event) => { 
                const _data = {
                    message: event
                };
                _data.context = this.params.context;
                if (this.logger) {
                    this.logger.push(_data);
                }
            });
        }
    };
})(window, document);