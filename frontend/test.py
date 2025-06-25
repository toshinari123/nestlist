from http.server import HTTPServer, SimpleHTTPRequestHandler
import ssl

httpd = HTTPServer(('localhost', 3000), SimpleHTTPRequestHandler)
context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
context.load_cert_chain("../cert/CA/localhost/localhost.crt", "../cert/CA/localhost/localhost.decrypted.key")
with context.wrap_socket(httpd.socket, server_hostname="localhost") as httpd.socket:
    print("starting frontend...")
    httpd.serve_forever()
