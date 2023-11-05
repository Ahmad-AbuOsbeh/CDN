(function (window, document) {
    let _loggerInitialized = false;
    let _loggerConfig = {
        tags: [], //['tag1', 'tag2']
        token: '',
        levels: [], //['info', 'log', 'warn', 'error']
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
    const predefinedLevels = ['info', 'log', 'warn', 'error'];
    const CATEGORIES = {
        info: {
           console: "ConsoleInfo" 
        },
        log: {
           console: "ConsoleLog" 
        },
        warn: {
           console: "ConsoleWarn" 
        },
        error: {
            console: "ConsoleError",
            exception: "BrowserJsException",
        }
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
    const _attachError = () => {
        const level = "error";
        const originalConsoleError = console.error;

        // Override console.error to log errors
        console.error = (...args) => {
            const options = {
                level,
                category: CATEGORIES[level].console
            };
            _log(options, ...args);
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
            _log(options, event.message);
        });
    };
    const _attachConsoleLevel = (level) => {
        const originalConsoleLevel = console[level];

        console[level] = (...args) => {
            const options = {
                level,
                category: CATEGORIES[level].console
            };
            _log(options, ...args);
            originalConsoleLevel(...args);
        };
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
                case "info":
                    _attachConsoleLevel("info");
                    break;
                case "log":
                    _attachConsoleLevel("log");
                    break;
                case "warn":
                    _attachConsoleLevel("warn");
                    break;
                case "error":
                    _attachError();
                    break;
            }
        });

        _loggerInitialized = true;
    };
    const _log = (options, ...args) => {
        if (!_loggerInitialized) {
            console.warn("Logger not initialized: Unable to log messages.");
            return;
        }
        const { level, category, exception } = options;
        const _data = {
            message: args.length > 1 ? {...args} : args[0],
            context: _loggerConfig.context,
            level,
            category
        };

        if (exception) {
            _data.exception = exception;
        }
        if (window._LTracker) {
            window._LTracker.push(_data);
        }
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
        log: function (...args) {
            if (!_loggerInitialized) {
                console.warn("Logger not initialized: Unable to log messages.");
                return;
            }
            if (!args || !args.length) {
                return;
            }
            let level = "info";
            if (args.length > 1) {
                const firstArg = args[0];
                if (typeof firstArg == 'string' && predefinedLevels.includes(firstArg)) {
                    level = firstArg;
                    args.splice(0, 1);
                }
            }

            _log({level}, ...args);
        },
        setContext: function (context) {
            try {
                _loggerConfig.context = JSON.parse(JSON.stringify(context)); 
            } catch (err) {
                console.error("Failed to set logger context: Invalid context object.", err);
            }
        }
    };
})(window, document);
