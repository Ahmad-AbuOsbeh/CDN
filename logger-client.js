(function (window, document) {
    let _loggerInitialized = false;
    let _loggerConfig = {
        tags: [], //['tag1', 'tag2']
        token: '',
        levels: [], //['info', 'event', 'warn', 'error']
        stringTags: "", //'tag1,tag2'
        context: {
            appId: "", 
            appName: "", 
            userId: "",
            email: "",
            name: "",
            pluginId: "",
            instanceId: ""
        }
    };
    const CATEGORIES = {
        error: {
            console: "ConsoleError",
            exception: "BrowserJsException",
        },
        info: {
           console: "ConsoleLog" 
        },
        warn: {
           console: "ConsoleWarn" 
        },
        event: {
        },
    }
    const _convertTagsArrayToString = (tags) => {
        if (!tags) {
            tags = [];
        }
        tags = tags.filter((t) => t.trim());
        return tags.join(",");
    };
    const _validateLevels = (levels) => {
        let isValid = true;
        if (!levels) {
            levels = [];
        }
        const predefinedLevels = ['info', 'event', 'warn', 'error'];
        levels.forEach(l => {
            if (!predefinedLevels.includes(l)) {
                console.error(`Failed to initialize logger: Invalid log level - "${l}". Allowed levels are: ${predefinedLevels}.`);
                isValid = false;
                return;
            }
        });
        return isValid;
    };
    const _validateToken = (token) => {
        if (!token) {
            token = "";
        }
        return token.trim();
    };
    const _attachError = (level) => {
        const originalConsoleError = console.error;

        // Override console.error to log errors
        console.error = (...args) => {
            const options = {
                level,
                category: CATEGORIES[level].console
            };
            window.bfLoggerTracker.log(options, ...args);
            originalConsoleError(...args);
        };
        window.addEventListener("error", (event) => {
            const options = {
                level,
                category: CATEGORIES[level].exception,
                exception: {
                    colno: event.colno,
                    lineno: event.lineno,
                    message: event.message,
                    stack: event.error && event.error.stack ? event.error && event.error.stack : "n/a",
                    url: event.filename
                }
            };
            window.bfLoggerTracker.log(options, event.message);
        });
    };
    const _attachLevels = () => {
        window._LTracker = window._LTracker || [];
        window._LTracker.push({
            'logglyKey': _loggerConfig.token,
            'sendConsoleErrors': false,
            'tag': _loggerConfig.stringTags
        });
        _loggerConfig.levels.forEach(l => {
            switch (l) {
                case "error":
                    _attachError('error');
                    break;
                case "info":
                    break;
                case "event":
                    break;
                case "warn":
                    break;
            }
        });

        _loggerInitialized = true;
    };
    window.bfLoggerTracker = {
        init: function(config) {
            if (_loggerInitialized) {
                console.error("Logger already initialized. Cannot initialize multiple times.");
                return;
            }
            _loggerConfig = config;
            if (!_loggerConfig) {
                _loggerConfig = {};
            }
            
            const stringTags = _convertTagsArrayToString(_loggerConfig.tags);
            if (!stringTags) {
                console.error("Failed to initialize logger: Invalid tags.");
                return;
            }
            _loggerConfig.stringTags = stringTags;

            if (!_validateLevels(_loggerConfig.levels)) {
                return;
            }

            if (!_validateToken(_loggerConfig.token)) {
                console.error("Failed to initialize logger: Invalid token.");
                return;
            }

            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://cloudfront.loggly.com/js/loggly.tracker-2.2.4.min.js';
        
            script.onload = () => {
                _attachLevels();
            };
        
            document.head.appendChild(script);
        },
        log: function (options, ...args) {
            if (!_loggerInitialized) {
                console.warn("Logger not initialized: Unable to log messages.");
                return;
            }
            const { level, category, exception } = options;
            const _data = {
                message: args,
                context: _loggerConfig.context,
                level,
                category,
                tags: _loggerConfig.stringTags
            };

            if (exception) {
                _data.exception = exception;
            }
            if (window._LTracker) {
                window._LTracker.push(_data);
            }
        },
        setLoggerContext: function (context) {
            _loggerConfig.context = context;
            console.log("Logger context updated successfully.", context); 
        }
    };
})(window, document);