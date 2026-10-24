import socket
srv = socket.socket()
srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
srv.bind(("127.0.0.1", 3306)); srv.listen(2048)
conns = []
while True:
    c, _ = srv.accept()
    conns.append(c)
