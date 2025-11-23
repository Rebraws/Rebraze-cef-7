#ifndef CEF_APP_OAUTH_SERVER_H_
#define CEF_APP_OAUTH_SERVER_H_

#include <string>
#include <functional>
#include <thread>
#include <atomic>

// Simple HTTP server for OAuth callback
class OAuthServer {
 public:
  using TokenCallback = std::function<void(const std::string& token)>;

  OAuthServer();
  ~OAuthServer();

  // Start the server on the specified port
  bool Start(int port, TokenCallback callback);

  // Stop the server
  void Stop();

  // Get the port the server is running on
  int GetPort() const { return port_; }

  // Check if server is running
  bool IsRunning() const { return running_; }

 private:
  void ServerThread();
  std::string HandleRequest(const std::string& request);
  std::string ExtractToken(const std::string& request);

  int port_;
  int server_socket_;
  std::atomic<bool> running_;
  std::thread server_thread_;
  TokenCallback token_callback_;
};

#endif  // CEF_APP_OAUTH_SERVER_H_
