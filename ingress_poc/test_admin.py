from http.server import BaseHTTPRequestHandler, HTTPServer

class AuthHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/auth':
            if 'avep_session=admin_token' in self.headers.get('Cookie', ''):
                self.send_response(200) # Кука есть, пускаем!
                self.end_headers()
            else:
                self.send_response(401) # Куки нет, Nginx кинет редирект
                self.end_headers()
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            html = """
            <body style="font-family: Arial; display: flex; justify-content: center; align-items: center; height: 100vh; background: #1a1a1a; color: white;">
                <div style="text-align: center; background: #333; padding: 40px; border-radius: 10px;">
                    <h2>AVEP Central Auth</h2>
                    <form method='POST' action='/login'>
                        <button style="padding: 10px 20px; font-size: 16px; cursor: pointer;">Login as Admin</button>
                    </form>
                </div>
            </body>
            """
            self.wfile.write(html.encode())

    def do_POST(self):
        # Юзер нажал кнопку Login
        if self.path == '/login':
            self.send_response(302)
            # Ставим куку на ВЕСЬ домен avep.com (включая поддомены)
            self.send_header('Set-Cookie', 'avep_session=admin_token; Domain=.avep.com; Path=/; HttpOnly')
            self.send_header('Location', 'http://grafana.avep.com') # Кидаем сразу в Графану
            self.end_headers()

if __name__ == '__main__':
    print("Starting Dummy Auth Server on port 8080...")
    HTTPServer(('0.0.0.0', 8080), AuthHandler).serve_forever()
