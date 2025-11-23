#include "oauth_server.h"

#include <iostream>
#include <sstream>
#include <cstring>

#ifdef _WIN32
  #include <winsock2.h>
  #include <ws2tcpip.h>
  #pragma comment(lib, "Ws2_32.lib")
  typedef int socklen_t;
#else
  #include <sys/socket.h>
  #include <netinet/in.h>
  #include <unistd.h>
  #include <arpa/inet.h>
  #define INVALID_SOCKET -1
  #define SOCKET_ERROR -1
  #define closesocket close
#endif

OAuthServer::OAuthServer()
    : port_(0), server_socket_(INVALID_SOCKET), running_(false) {
#ifdef _WIN32
  WSADATA wsaData;
  WSAStartup(MAKEWORD(2, 2), &wsaData);
#endif
}

OAuthServer::~OAuthServer() {
  Stop();
#ifdef _WIN32
  WSACleanup();
#endif
}

bool OAuthServer::Start(int port, TokenCallback callback) {
  if (running_) {
    return false;
  }

  port_ = port;
  token_callback_ = callback;

  // Create socket
  server_socket_ = socket(AF_INET, SOCK_STREAM, 0);
  if (server_socket_ == INVALID_SOCKET) {
    std::cerr << "Failed to create socket" << std::endl;
    return false;
  }

  // Allow port reuse
  int opt = 1;
  setsockopt(server_socket_, SOL_SOCKET, SO_REUSEADDR,
             (const char*)&opt, sizeof(opt));

  // Bind to port
  struct sockaddr_in address;
  address.sin_family = AF_INET;
  address.sin_addr.s_addr = INADDR_ANY;
  address.sin_port = htons(port_);

  if (bind(server_socket_, (struct sockaddr*)&address, sizeof(address)) == SOCKET_ERROR) {
    std::cerr << "Failed to bind to port " << port << std::endl;
    closesocket(server_socket_);
    server_socket_ = INVALID_SOCKET;
    return false;
  }

  // Listen for connections
  if (listen(server_socket_, 1) == SOCKET_ERROR) {
    std::cerr << "Failed to listen on socket" << std::endl;
    closesocket(server_socket_);
    server_socket_ = INVALID_SOCKET;
    return false;
  }

  running_ = true;
  server_thread_ = std::thread(&OAuthServer::ServerThread, this);

  std::cout << "OAuth callback server started on port " << port << std::endl;
  return true;
}

void OAuthServer::Stop() {
  if (!running_) {
    return;
  }

  running_ = false;

  if (server_socket_ != INVALID_SOCKET) {
    closesocket(server_socket_);
    server_socket_ = INVALID_SOCKET;
  }

  if (server_thread_.joinable()) {
    server_thread_.join();
  }

  std::cout << "OAuth callback server stopped" << std::endl;
}

void OAuthServer::ServerThread() {
  while (running_) {
    struct sockaddr_in client_addr;
    socklen_t client_len = sizeof(client_addr);

    int client_socket = accept(server_socket_,
                               (struct sockaddr*)&client_addr,
                               &client_len);

    if (client_socket == INVALID_SOCKET) {
      if (running_) {
        std::cerr << "Failed to accept connection" << std::endl;
      }
      continue;
    }

    // Read request
    char buffer[4096] = {0};
    int bytes_read = recv(client_socket, buffer, sizeof(buffer) - 1, 0);

    if (bytes_read > 0) {
      std::string request(buffer, bytes_read);
      std::string response = HandleRequest(request);

      // Send response
      send(client_socket, response.c_str(), response.length(), 0);
    }

    closesocket(client_socket);
  }
}

std::string OAuthServer::HandleRequest(const std::string& request) {
  std::cout << "Received OAuth callback request" << std::endl;

  // Extract token from request
  std::string token = ExtractToken(request);

  if (!token.empty() && token_callback_) {
    // Call the callback with the token
    token_callback_(token);

    // Return success page
    std::string body =
      "<!DOCTYPE html>"
      "<html><head><title>Login Successful</title>"
      "<style>"
      "body { font-family: Arial, sans-serif; display: flex; justify-content: center; "
      "align-items: center; height: 100vh; margin: 0; "
      "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }"
      ".container { text-align: center; background: white; padding: 3rem; "
      "border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }"
      "h1 { color: #667eea; margin-bottom: 1rem; }"
      "p { color: #666; font-size: 1.1rem; }"
      ".checkmark { font-size: 4rem; color: #4CAF50; margin-bottom: 1rem; }"
      "</style>"
      "</head><body>"
      "<div class='container'>"
      "<div class='checkmark'>✓</div>"
      "<h1>Login Successful!</h1>"
      "<p>You can close this window and return to the app.</p>"
      "</div>"
      "</body></html>";

    std::ostringstream response;
    response << "HTTP/1.1 200 OK\r\n"
             << "Content-Type: text/html\r\n"
             << "Content-Length: " << body.length() << "\r\n"
             << "Connection: close\r\n"
             << "\r\n"
             << body;

    return response.str();
  } else {
    // Return error page
    std::string body =
      "<!DOCTYPE html>"
      "<html><head><title>Login Failed</title></head><body>"
      "<h1>Login Failed</h1>"
      "<p>No authentication token received. Please try again.</p>"
      "</body></html>";

    std::ostringstream response;
    response << "HTTP/1.1 400 Bad Request\r\n"
             << "Content-Type: text/html\r\n"
             << "Content-Length: " << body.length() << "\r\n"
             << "Connection: close\r\n"
             << "\r\n"
             << body;

    return response.str();
  }
}

std::string OAuthServer::ExtractToken(const std::string& request) {
  // Look for "GET /callback?token=..." in the request
  size_t token_pos = request.find("token=");
  if (token_pos == std::string::npos) {
    return "";
  }

  size_t start = token_pos + 6;  // length of "token="
  size_t end = request.find_first_of(" &\r\n", start);

  if (end == std::string::npos) {
    return request.substr(start);
  }

  return request.substr(start, end - start);
}
