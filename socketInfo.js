var express = require("express")();
var app = express();
var path = require("path");
var server = require("http").createServer(app);
var io = require("../..")(server);
var port = process.env.PORT || 3000;

server.listen(port, () => {
    console.log ("Server listening at port %d", port);
});

app.use(express.static(path.join(__dirname, 'public')));

var numUsers = 0;

io.on("connection", (socket) => {
    var addedUser = false;

    socket.on("new message", (data) => {
        socket.broadcast.emit("new message", {
            username: socket.username,
            message: data
        })
    })
    socket.on("chat message", function(msg) {
        io.emit("chat message", msg);
    });
});

/*app.get("/", function(req, res) {
    res.sendFile(__dirname + "/chatPage.html");
});*/



