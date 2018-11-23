$(() => {
    var FADE_TIME = 150; //ms
    var TYPING_TIMER_LENGTH = 400; //ms
    var COLOURS = [];

    //initialize variables
    var $window = $(window);
    var $usernameInput = $(".usernameInput");
    var $messages = $(".messages");
    var $inputMessage = $(".inputMessage");

    var $loginPage = $(".login.page");
    var $chatPage = $(".chat.page");

    //Prompt for setting a username
    var username = "";
    var connected = false;
    var typing = false;
    var lastTypingTime;
    var $currentInput = $usernameInput.focus();

    var socket = io();

    const addParticipantsMessage = (data) => {
        var message = "There are " + data.numUsers + " participant(s)";
        log(message);
    }

    const setUserName = function() {
        username = cleanInput($usernameInput.val().trim());

        //If the username is valid
        if (username) {
            $loginPage.fadeOut();
            $chatPage.show();
            $loginPage.off("click");
            $currentInput = $inputMessage.focus();

            //The the server your username
            socket.emit("add user", username);
        }
    }

    //Sends a chat message
    const sendMessage = function() {
        var message = $inputMessage.val();
        //Prevent markup from being injected into the message
        message = cleanInput(message);
        // if there is a non-empty message and a socket connection
        if (message && connected) {
            $inputMessage.val("");
            addChatMessage ({
                username: username,
                message: message
            });
            //Tell the server to execute 'new message'
            socket.emit ("new message", message);
        }
    }

    //Log a message
    const log = (message, options) => {
        var $el = $("<li>").addClass("log").text(message);
        addMessageElement($el, options);
    }

    //Adds the visual chat message to the message list
    const addChatMessage = (data, options) => {
        //Don't fade the message in if there's an "X was typing"
        var $typingMessages = getTypingMessages(data);
        options = options || {};
        if ($typingMessages.length !== 0) {
            options.fade = false;
            $typingMessages.remove();
        }

        var $usernameDiv = $("<span class = 'username'/>")
            .text(data.username)
            .css("color", getUsernameColor(data.username));
        var $messageBodyDiv = $("<spam class = 'message body'>")
            .text(data.message);

        var typingClass = data.typing ? "typing" : "";
        var $messageDiv = $("<li class = 'message'/>")
            .data ('username', data.username)
            .addClass(typingClass)
            .append($usernameDiv, $messageBodyDiv);

        addMessageElement($messageDiv, options);
    }

    //Adds the visual "is typing" message
    const addChatTyping = (data) => {
        data.typing = true;
        data.message = "is typing";
        addChatMessage(data);
    }

    //Removes it
    const removeChatTyping = (data) => {
        getTypingMessages(data).fadeOut(function () {
            $(this).remove();
        });
    }

    const addMessageElement = (el, options) => {
        var $el = $(el);

        //Set up default options
        if (!options) {
            options = {}
        }
        if (typeof options.fade === 'undefined') {
            options.fade = true;
        }
        if (typeof options.prepend === 'undefind') {
            options.prepend = false;
        }

        //Apply options
        if (options.fade) {
            $el.hide().fadeIn(FADE_TIME);
        }
        if (options.prepend) {
            $messages.prepend($el);
        } else {
            $messages.append($el);
        }
        $messages[0].scrollTop = $messages[0].scrollHeight;
    }

    //Prevents input from having injected markup
    const cleanInput = (input) => {
        return $("<div/>").text(input).html();
    }

    //Updates the typing event
    const updateTyping = function() {
        if (connected) {
            if (!typing) {
                typing = true;
                socket.emit("typing");
            }
            lastTypingTime = (new Date()).getTime();

            setTimeout( function() {
                var typingTimer = (new Date()).getTime();
                var timeDiff = typingTimer - lastTypingTime;
                if (timeDiff >= TYPING_TIMER_LENGTH && typing) {
                    socket.emit("stop typing");
                    typing = false;
                }
            }, TYPING_TIMER_LENGTH);
        }
    }

    //gets the "X is typing" messages of a user
    const getTypingMessages = (data) => {
        return $(".typing.message").filter(function (i) {
            return $(this).data("username") === data.username;
        });
    }

    const getUsernameColor = (username) => {
        //Compute hash code
        let hash = 7;
        for (let i = 0; i < username.length; i++) {
            hash = username.charAt(i) + (hash << 5) - hash;
        }
        //Calculate Color
        let index = Math.abs(hash % COLOURS.length);
        return COLOURS[index];
    }

    $window.keydown(event => {
        //Auto-focus the current input when a key is typed
        if (!(event.ctrlKey || event.metaKey || event.altKey)) {
            $currentInput.focus();
        }
        //When the client hits ENTER on their keyboard
        if (event.which === 13) {
            if (username) {
                sendMessage();
                socket.emit("stop typing");
                typing = false;
            } else {
                setUserName();
            }
        }
    });

    $inputMessage.on("input", () => {
        updateTyping();
    });

    //Click events

    //Focus input when clicking anywhere on the login page
    $loginPage.click(() => {
        $currentInput.focus();
    });

    $inputMessage.click(() => {
        $inputMessage.focus();
    });

    //Socket events

    //Whenever the socket emits 'login', log the login message
    socket.on("login", (data) => {
        connected = true;
        //Display the welcome message
        let message = "Welcome to SFU Code Club's Chat - ";
        log (message, {
            prepend: true
        });
        addParticipantsMessage(data);
    });

    socket.on("new message", (data) => {
        addChatMessage(data);
    }); 

    socket.on("user left", (data) => {
        log(data.username + " left");
        addParticipantsMessage(data);
    });

    socket.on("user joined", (data) => {
        log(data.username + " joined");
        addParticipantsMessage(data);
        removeChatTyping(data);
    });
    
    socket.on("typing", (data) => {
        addChatTyping(data);
    });
    
    socket.on("stop typing", (data) => {
        removeChatTyping(data);
    });
    
    socket.on("disconnect", () => {
        log("You have been disconnected");
    });
    
    socket.on("reconnect", () => {
        log("You have been reconnected");
        if (username) {
            socket.emit('add user', username);
        }
    });
    
    socket.on("reconnect error", () => {
        log("Attempt to reconnect failed");
    }); 
});