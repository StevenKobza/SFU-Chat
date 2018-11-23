var express = require("express");
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var file = path.join(__dirname, 'frontEnd');

console.log(file);

server.listen(port, () => {
    console.log ("Server listening at port %d", port);
});

app.use(express.static(path.join(__dirname, 'frontEnd')));

var numUsers = 0;

io.on("connection", (socket) => {
    var addedUser = false;

    socket.on("new message", (data) => {
        socket.broadcast.emit("new message", {
            username: socket.username,
            message: data
        });
    });

    socket.on("add user", (username) => {
        if (addedUser) return;

        //We store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit("login", {
            numUsers: numUsers
        });
        socket.broadcast.emit("user joined", {
            username: socket.username,
            numUsers: numUsers
        });
    });

    socket.on("typing", () => {
        socket.broadcast.emit("typing", {
            username: socket.username
        });
    });

    socket.on("stop typing", () => {
        socket.broadcast.emit("stop typing", {
            username: socket.username
        });
    });

    socket.on("disconnect", () => {
        if (addedUser) {
            --numUsers;

            socket.broadcast.emit("user left", {
                username: socket.username,
                numUsers: numUsers
            });
        }
    });
});

/*app.get("/", function(req, res) {
    res.sendFile(__dirname + "/chatPage.html");
});*/



