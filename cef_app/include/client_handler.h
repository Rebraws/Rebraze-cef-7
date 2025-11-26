#ifndef CEF_APP_CLIENT_HANDLER_H_
#define CEF_APP_CLIENT_HANDLER_H_

#include "include/cef_client.h"
#include "include/cef_devtools_message_observer.h"
#include "include/cef_registration.h"
#include "oauth_server.h"

#include <list>
#include <memory>
#include <fstream>

// Client handler for browser-level callbacks
class ClientHandler : public CefClient,
                      public CefDisplayHandler,
                      public CefFocusHandler,
                      public CefLifeSpanHandler,
                      public CefLoadHandler,
                      public CefRequestHandler,
                      public CefResourceRequestHandler,
                      public CefDevToolsMessageObserver {
 public:
  // Layout constants for the dual-browser meeting interface
  static const int kTopBarHeight = 64;
  static const int kSidebarWidth = 320;

  explicit ClientHandler(bool use_views);
  ~ClientHandler();

  // Provide access to the single global instance
  static ClientHandler* GetInstance();

  // CefClient methods
  virtual CefRefPtr<CefDisplayHandler> GetDisplayHandler() override {
    return this;
  }
  virtual CefRefPtr<CefFocusHandler> GetFocusHandler() override {
    return this;
  }
  virtual CefRefPtr<CefLifeSpanHandler> GetLifeSpanHandler() override {
    return this;
  }
  virtual CefRefPtr<CefLoadHandler> GetLoadHandler() override { return this; }
  virtual CefRefPtr<CefRequestHandler> GetRequestHandler() override {
    return this;
  }
  virtual CefRefPtr<CefResourceRequestHandler> GetResourceRequestHandler(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefRefPtr<CefRequest> request,
      bool is_navigation,
      bool is_download,
      const CefString& request_initiator,
      bool& disable_default_handling) override {
    return this;
  }

  // CefDevToolsMessageObserver methods
  virtual bool OnDevToolsMessage(CefRefPtr<CefBrowser> browser,
                                 const void* message,
                                 size_t message_size) override;
  virtual void OnDevToolsMethodResult(CefRefPtr<CefBrowser> browser,
                                      int message_id,
                                      bool success,
                                      const void* result,
                                      size_t result_size) override;
  virtual void OnDevToolsEvent(CefRefPtr<CefBrowser> browser,
                               const CefString& method,
                               const void* params,
                               size_t params_size) override;
  virtual void OnDevToolsAgentAttached(CefRefPtr<CefBrowser> browser) override;
  virtual void OnDevToolsAgentDetached(CefRefPtr<CefBrowser> browser) override;

  // CefClient methods
  // Handle process messages
  virtual bool OnProcessMessageReceived(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefProcessId source_process,
      CefRefPtr<CefProcessMessage> message) override;

  // CefDisplayHandler methods
  virtual void OnTitleChange(CefRefPtr<CefBrowser> browser,
                             const CefString& title) override;

  // CefFocusHandler methods
  virtual void OnGotFocus(CefRefPtr<CefBrowser> browser) override;

  // CefLifeSpanHandler methods
  virtual void OnAfterCreated(CefRefPtr<CefBrowser> browser) override;
  virtual bool DoClose(CefRefPtr<CefBrowser> browser) override;
  virtual void OnBeforeClose(CefRefPtr<CefBrowser> browser) override;

  // Handle popup windows (Google Login may open popups)
  virtual bool OnBeforePopup(CefRefPtr<CefBrowser> browser,
                             CefRefPtr<CefFrame> frame,
                             const CefString& target_url,
                             const CefString& target_frame_name,
                             CefLifeSpanHandler::WindowOpenDisposition target_disposition,
                             bool user_gesture,
                             const CefPopupFeatures& popupFeatures,
                             CefWindowInfo& windowInfo,
                             CefRefPtr<CefClient>& client,
                             CefBrowserSettings& settings,
                             CefRefPtr<CefDictionaryValue>& extra_info,
                             bool* no_javascript_access) override;

  // CefLoadHandler methods
  virtual void OnLoadError(CefRefPtr<CefBrowser> browser,
                           CefRefPtr<CefFrame> frame,
                           ErrorCode errorCode,
                           const CefString& errorText,
                           const CefString& failedUrl) override;

  // CefRequestHandler methods
  virtual bool OnBeforeBrowse(CefRefPtr<CefBrowser> browser,
                              CefRefPtr<CefFrame> frame,
                              CefRefPtr<CefRequest> request,
                              bool user_gesture,
                              bool is_redirect) override;

  // CefResourceRequestHandler methods
  virtual CefResourceRequestHandler::ReturnValue OnBeforeResourceLoad(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefRefPtr<CefRequest> request,
      CefRefPtr<CefCallback> callback) override;

  // Request that all existing browser windows close
  void CloseAllBrowsers(bool force_close);

  bool IsClosing() const { return is_closing_; }

  bool use_views() const { return use_views_; }

  // OAuth server management
  void SetOAuthServer(std::shared_ptr<OAuthServer> server) {
    oauth_server_ = server;
  }

  // Get the first browser (for sending messages)
  CefRefPtr<CefBrowser> GetBrowser() {
    if (!browser_list_.empty()) {
      return browser_list_.front();
    }
    return nullptr;
  }

  // Meeting view browser management (dual-browser architecture)
  void CreateMeetingView(const std::string& url, int x, int y, int width, int height);
  void ShowMeetingView();
  void HideMeetingView();
  void DestroyMeetingView();
  void UpdateMeetingViewBounds(int x, int y, int width, int height);

  // Dual-browser accessors
  CefRefPtr<CefBrowser> GetUIBrowser() { return ui_browser_; }
  CefRefPtr<CefBrowser> GetContentBrowser() { return content_browser_; }

  // Set the parent window handle (for child window creation)
  void SetParentWindowHandle(CefWindowHandle handle) { parent_window_ = handle; }
  CefWindowHandle GetParentWindowHandle() { return parent_window_; }

  // Create UI shell browser (top bar + sidebar)
  void CreateUIBrowser(const std::string& url);

  // Resize all browsers to fit window dimensions
  void ResizeBrowsers(int width, int height);

  // Navigate content browser to URL
  void NavigateContentBrowser(const std::string& url);

 private:
  // Platform-specific implementation
  void PlatformTitleChange(CefRefPtr<CefBrowser> browser,
                           const CefString& title);

  // Platform-specific window customization (macOS unified titlebar)
  void PlatformCustomizeWindow(CefRefPtr<CefBrowser> browser);

  // Platform-specific URL opener
  void PlatformOpenURL(const std::string& url);

  // Platform-specific meeting bounds update
  void PlatformUpdateMeetingBounds(CefRefPtr<CefBrowser> browser, int x, int y, int width, int height);

  // Platform-specific visibility control
  void PlatformShowMeetingView(CefRefPtr<CefBrowser> browser);
  void PlatformHideMeetingView(CefRefPtr<CefBrowser> browser);
  void PlatformCloseMeetingView(CefRefPtr<CefBrowser> browser);

  // Open URL in system browser
  void OpenSystemBrowser(const std::string& url);

  // True if the application is using the Views framework
  const bool use_views_;

  // List of existing browser windows. Only accessed on the CEF UI thread
  typedef std::list<CefRefPtr<CefBrowser>> BrowserList;
  BrowserList browser_list_;

  bool is_closing_;

  // OAuth callback server
  std::shared_ptr<OAuthServer> oauth_server_;

  // Parent window handle for child browser creation
  CefWindowHandle parent_window_;

  // UI browser (full window, renders top bar + sidebar shell)
  CefRefPtr<CefBrowser> ui_browser_;

  // Content browser (renders meeting site in the content area)
  CefRefPtr<CefBrowser> content_browser_;

  // Store content browser's title for meeting info
  std::string content_browser_title_;

  // Track last meeting bounds to avoid redundant updates
  int last_meeting_x_ = 0;
  int last_meeting_y_ = 0;
  int last_meeting_width_ = 0;
  int last_meeting_height_ = 0;

  // Recording file
  std::ofstream recording_file_;
  std::string current_recording_path_;
  std::string current_meeting_id_;

  // DevTools observer registration
  CefRefPtr<CefRegistration> devtools_registration_;
  int next_devtools_id_ = 1;

  // Include the default reference counting implementation
  IMPLEMENT_REFCOUNTING(ClientHandler);
};

#endif  // CEF_APP_CLIENT_HANDLER_H_
