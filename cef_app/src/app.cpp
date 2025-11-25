#include "app.h"
#include "client_handler.h"
#include "message_handler.h"
#include "oauth_server.h"

#include <string>
#include <memory>
#include <iostream>
#include <fstream>
#include <sstream>

#include "include/cef_browser.h"
#include "include/cef_command_line.h"
#include "include/cef_path_util.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_helpers.h"
#include "include/wrapper/cef_closure_task.h"
#include "include/base/cef_callback.h"

#if defined(OS_WIN)
#include <windows.h>
#endif

// Global OAuth server instance
static std::shared_ptr<OAuthServer> g_oauth_server;

// Global parent window handle for dual-browser architecture
#if defined(OS_WIN)
static HWND g_parent_window = NULL;

// Window procedure for the parent window
LRESULT CALLBACK ParentWindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam) {
  switch (uMsg) {
    case WM_SIZE: {
      // Resize both browsers when parent window resizes
      ClientHandler* handler = ClientHandler::GetInstance();
      if (handler) {
        RECT rect;
        GetClientRect(hwnd, &rect);
        handler->ResizeBrowsers(rect.right - rect.left, rect.bottom - rect.top);
      }
      return 0;
    }

    case WM_CLOSE: {
      ClientHandler* handler = ClientHandler::GetInstance();
      if (handler && !handler->IsClosing()) {
        handler->CloseAllBrowsers(false);
      }
      return 0;
    }

    case WM_DESTROY:
      PostQuitMessage(0);
      return 0;
  }
  return DefWindowProc(hwnd, uMsg, wParam, lParam);
}
#endif

// Helper function to read HTML file
std::string ReadFileToString(const std::string& path) {
  std::ifstream file(path);
  if (!file.is_open()) {
    return "";
  }
  std::stringstream buffer;
  buffer << file.rdbuf();
  return buffer.str();
}

// Helper function to encode to Base64
static const char base64_chars[] =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

std::string Base64Encode(const std::string& input) {
  std::string ret;
  int i = 0;
  int j = 0;
  unsigned char char_array_3[3];
  unsigned char char_array_4[4];
  size_t in_len = input.size();
  const char* bytes_to_encode = input.c_str();

  while (in_len--) {
    char_array_3[i++] = *(bytes_to_encode++);
    if (i == 3) {
      char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
      char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
      char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);
      char_array_4[3] = char_array_3[2] & 0x3f;

      for (i = 0; i < 4; i++)
        ret += base64_chars[char_array_4[i]];
      i = 0;
    }
  }

  if (i) {
    for (j = i; j < 3; j++)
      char_array_3[j] = '\0';

    char_array_4[0] = (char_array_3[0] & 0xfc) >> 2;
    char_array_4[1] = ((char_array_3[0] & 0x03) << 4) + ((char_array_3[1] & 0xf0) >> 4);
    char_array_4[2] = ((char_array_3[1] & 0x0f) << 2) + ((char_array_3[2] & 0xc0) >> 6);

    for (j = 0; j < i + 1; j++)
      ret += base64_chars[char_array_4[j]];

    while (i++ < 3)
      ret += '=';
  }

  return ret;
}

namespace {

// When using the Views framework this object provides the delegate
// implementation for the CefWindow that hosts the Views-based browser
class SimpleWindowDelegate : public CefWindowDelegate {
 public:
  explicit SimpleWindowDelegate(CefRefPtr<CefBrowserView> browser_view)
      : browser_view_(browser_view) {}

  void OnWindowCreated(CefRefPtr<CefWindow> window) override {
    // Add the browser view and show the window
    window->AddChildView(browser_view_);
    window->Show();

    // Give keyboard focus to the browser view
    browser_view_->RequestFocus();
  }

  void OnWindowDestroyed(CefRefPtr<CefWindow> window) override {
    browser_view_ = nullptr;
  }

  bool CanClose(CefRefPtr<CefWindow> window) override {
    // Allow the window to close if the browser says it's OK
    CefRefPtr<CefBrowser> browser = browser_view_->GetBrowser();
    if (browser)
      return browser->GetHost()->TryCloseBrowser();
    return true;
  }

  CefSize GetPreferredSize(CefRefPtr<CefView> view) override {
    return CefSize(1280, 800);
  }

 private:
  CefRefPtr<CefBrowserView> browser_view_;

  IMPLEMENT_REFCOUNTING(SimpleWindowDelegate);
  DISALLOW_COPY_AND_ASSIGN(SimpleWindowDelegate);
};

class SimpleBrowserViewDelegate : public CefBrowserViewDelegate {
 public:
  SimpleBrowserViewDelegate() {}

 private:
  IMPLEMENT_REFCOUNTING(SimpleBrowserViewDelegate);
  DISALLOW_COPY_AND_ASSIGN(SimpleBrowserViewDelegate);
};

}  // namespace

App::App() {}

CefRefPtr<CefRenderProcessHandler> App::GetRenderProcessHandler() {
  static CefRefPtr<RenderProcessHandler> handler(new RenderProcessHandler());
  return handler;
}

void App::OnContextInitialized() {
  CEF_REQUIRE_UI_THREAD();

  // Use native windowing (not Views) to support transparent rendering and layering
  CefRefPtr<ClientHandler> handler(new ClientHandler(false));

  // Start OAuth callback server on port 8765
  const int OAUTH_PORT = 8765;
  g_oauth_server = std::make_shared<OAuthServer>();

  bool server_started = g_oauth_server->Start(OAUTH_PORT, [](const std::string& token) {
    // Marshal to UI thread to safely access CefBrowser and send process message
    CefPostTask(TID_UI, base::BindOnce([](const std::string& token) {
      std::cout << "[App] OAuth token received: " << token.substr(0, 20) << "..." << std::endl;

      // Send token to browser process
      ClientHandler* handler = ClientHandler::GetInstance();
      std::cout << "[App] ClientHandler instance: " << (handler ? "OK" : "NULL") << std::endl;

      if (handler) {
        CefRefPtr<CefBrowser> browser = handler->GetBrowser();
        std::cout << "[App] Browser: " << (browser ? "OK" : "NULL") << std::endl;

        if (browser) {
          std::cout << "[App] Browser ID: " << browser->GetIdentifier() << std::endl;

          CefRefPtr<CefFrame> mainFrame = browser->GetMainFrame();
          std::cout << "[App] Main frame: " << (mainFrame ? "OK" : "NULL") << std::endl;

          if (mainFrame) {
            std::cout << "[App] Frame URL: " << mainFrame->GetURL().ToString() << std::endl;

            // Create process message
            CefRefPtr<CefProcessMessage> message =
                CefProcessMessage::Create("auth_token_received");

            CefRefPtr<CefListValue> args = message->GetArgumentList();
            args->SetString(0, token);

            // Send to renderer process
            std::cout << "[App] Sending auth_token_received message to renderer..." << std::endl;
            mainFrame->SendProcessMessage(PID_RENDERER, message);
            std::cout << "[App] ✓ Message sent to renderer!" << std::endl;
          } else {
            std::cerr << "[App] ERROR: Main frame is NULL!" << std::endl;
          }
        } else {
          std::cerr << "[App] ERROR: Browser is NULL!" << std::endl;
        }
      } else {
        std::cerr << "[App] ERROR: ClientHandler is NULL!" << std::endl;
      }
    }, token));
  });

  if (!server_started) {
    std::cerr << "Failed to start OAuth callback server on port " << OAUTH_PORT << std::endl;
  } else {
    std::cout << "OAuth callback server started on http://localhost:" << OAUTH_PORT << std::endl;
  }

  // Give server to handler
  handler->SetOAuthServer(g_oauth_server);

  // Specify CEF browser settings here
  CefBrowserSettings browser_settings;

  std::string url;

  // Check if a "--url=" value was provided via the command-line
  CefRefPtr<CefCommandLine> command_line =
      CefCommandLine::GetGlobalCommandLine();
  url = command_line->GetSwitchValue("url");
  if (url.empty()) {
    // Default URL - load the built React app
    CefString app_path;
    if (CefGetPath(PK_DIR_EXE, app_path)) {
#if defined(__APPLE__)
      // On macOS, the executable is in Contents/MacOS, but resources are in Contents/Resources
      // We need to go up one level from the executable directory
      std::string path_str = app_path.ToString();
      // Remove trailing slash if present
      if (!path_str.empty() && path_str.back() == '/') {
        path_str.pop_back();
      }
      // Remove the last component (MacOS)
      size_t last_slash = path_str.find_last_of('/');
      if (last_slash != std::string::npos) {
        path_str = path_str.substr(0, last_slash);
      }
      url = "file://" + path_str + "/Resources/frontend/index.html";
      std::cout << "[App] MacOS detected. Constructed URL: " << url << std::endl;
#else
      url = "file://" + app_path.ToString() + "/resources/frontend/index.html";
#endif
    } else {
      // Fallback to a default path if CefGetPath fails
      url = "file://resources/frontend/index.html";
    }
  }

  if (handler->use_views()) {
    // Create the BrowserView
    CefRefPtr<CefBrowserView> browser_view = CefBrowserView::CreateBrowserView(
        handler, url, browser_settings, nullptr, nullptr,
        new SimpleBrowserViewDelegate());

    // Create the Window. It will show itself after creation
    CefWindow::CreateTopLevelWindow(new SimpleWindowDelegate(browser_view));
  } else {
    // ===== DUAL-BROWSER MEETING ARCHITECTURE =====
    // Create a parent window that hosts both UI and content browsers

#if defined(OS_WIN)
    // Register window class for parent window
    HINSTANCE hInstance = GetModuleHandle(NULL);
    const wchar_t CLASS_NAME[] = L"RebrazeMeetingHost";

    WNDCLASS wc = {};
    wc.lpfnWndProc = ParentWindowProc;
    wc.hInstance = hInstance;
    wc.lpszClassName = CLASS_NAME;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);

    if (!GetClassInfo(hInstance, CLASS_NAME, &wc)) {
      RegisterClass(&wc);
    }

    // Create the main parent window
    g_parent_window = CreateWindowEx(
        0, CLASS_NAME, L"Rebraze - Meeting Interface",
        WS_OVERLAPPEDWINDOW | WS_CLIPCHILDREN,
        CW_USEDEFAULT, CW_USEDEFAULT, 1280, 800,
        NULL, NULL, hInstance, NULL
    );

    if (!g_parent_window) {
      std::cerr << "[App] Failed to create parent window" << std::endl;
      return;
    }

    ShowWindow(g_parent_window, SW_SHOW);
    UpdateWindow(g_parent_window);

    // Store the parent window handle in the handler
    handler->SetParentWindowHandle(g_parent_window);

    // Get client rect for browser sizing
    RECT rect;
    GetClientRect(g_parent_window, &rect);

    // === Browser 1: UI Shell (Top Bar + Sidebar) ===
    // This browser fills the entire window and renders the UI overlay
    CefWindowInfo window_info_ui;
    window_info_ui.SetAsChild(g_parent_window, rect);

    // Load UI shell HTML
    std::string ui_html;
    CefString app_path;
    if (CefGetPath(PK_DIR_EXE, app_path)) {
      std::string html_path = app_path.ToString() + "/resources/ui_layout.html";
      std::string html_content = ReadFileToString(html_path);

      if (!html_content.empty()) {
        ui_html = "data:text/html;base64," + Base64Encode(html_content);
      }
    }

    // Fallback: Embedded UI HTML with top bar and sidebar
    if (ui_html.empty()) {
      std::string embedded_html = R"HTML(
<!DOCTYPE html>
<html>
<head>
<style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', sans-serif; overflow: hidden; background: transparent; }
    .top-bar {
        position: absolute; top: 0; left: 0; right: 0; height: 64px;
        background: #ffffff; border-bottom: 1px solid #e0e0e0;
        display: flex; align-items: center; justify-content: space-between;
        padding: 0 20px; z-index: 10;
    }
    .sidebar {
        position: absolute; top: 64px; right: 0; bottom: 0; width: 320px;
        background: #ffffff; border-left: 1px solid #e0e0e0;
        z-index: 10; display: flex; flex-direction: column;
    }
    .content-area {
        position: absolute; top: 64px; left: 0; right: 320px; bottom: 0;
        background: #1d1d1d;
    }
    .btn-end {
        background: #da291c; color: white; border: none;
        padding: 8px 16px; border-radius: 4px; font-weight: 600; cursor: pointer;
    }
    .btn-end:hover { background: #b82318; }
    .header-title { font-weight: bold; font-size: 18px; color: #333; }
    .timer { color: #666; font-size: 12px; margin-left: 10px; }
    .sidebar-header {
        padding: 15px; border-bottom: 1px solid #eee;
        font-weight: bold; color: #333;
    }
    .participant-list { flex: 1; overflow-y: auto; padding: 10px; }
    .empty-state { text-align: center; color: #777; font-size: 12px; margin-top: 50px; }
    .controls {
        padding: 15px; border-top: 1px solid #eee;
        display: flex; justify-content: center; gap: 10px;
    }
    .control-btn {
        width: 40px; height: 40px; border-radius: 50%; border: 1px solid #ddd;
        background: #f5f5f5; cursor: pointer; display: flex;
        align-items: center; justify-content: center;
    }
    .control-btn:hover { background: #eee; }
</style>
</head>
<body>
    <div class="top-bar">
        <div>
            <span class="header-title">Meeting Room</span>
            <span class="timer" id="timer">00:00:00</span>
        </div>
        <button class="btn-end" onclick="endMeeting()">End Meeting</button>
    </div>
    <div class="content-area"></div>
    <div class="sidebar">
        <div class="sidebar-header">Participants (0)</div>
        <div class="participant-list">
            <div class="empty-state">No participants yet</div>
        </div>
        <div class="controls">
            <button class="control-btn" title="Mute">&#127908;</button>
            <button class="control-btn" title="Camera">&#127909;</button>
            <button class="control-btn" title="Share">&#128228;</button>
            <button class="control-btn" title="Chat">&#128172;</button>
        </div>
    </div>
    <script>
        let seconds = 0;
        setInterval(() => {
            seconds++;
            const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
            const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
            const s = (seconds % 60).toString().padStart(2, '0');
            document.getElementById('timer').textContent = h + ':' + m + ':' + s;
        }, 1000);

        function endMeeting() {
            if (window.rebrazeAuth && window.rebrazeAuth.leaveMeeting) {
                window.rebrazeAuth.leaveMeeting();
            }
        }
    </script>
</body>
</html>
)HTML";
      ui_html = "data:text/html;base64," + Base64Encode(embedded_html);
    }

    std::cout << "[App] Creating UI browser (shell)" << std::endl;

    // Create UI browser
    CefBrowserHost::CreateBrowser(window_info_ui, handler, ui_html, browser_settings, nullptr, nullptr);

    // === Browser 2: Content (Meeting Site) ===
    // This browser is positioned in the content area, on top of the UI browser
    CefWindowInfo window_info_content;
    RECT content_rect;
    content_rect.left = 0;
    content_rect.top = ClientHandler::kTopBarHeight;
    content_rect.right = rect.right - ClientHandler::kSidebarWidth;
    content_rect.bottom = rect.bottom;

    window_info_content.SetAsChild(g_parent_window, content_rect);

    std::cout << "[App] Creating content browser (meeting site)" << std::endl;

    // Initially load the React app in the content browser
    // When user joins a meeting, this will be navigated to the meeting URL
    CefBrowserHost::CreateBrowser(window_info_content, handler, url, browser_settings, nullptr, nullptr);

#elif defined(OS_LINUX)
    // Linux: For now, use existing single-browser approach
    // Full dual-browser support can be added later
    CefWindowInfo window_info;
    window_info.bounds.x = 0;
    window_info.bounds.y = 0;
    window_info.bounds.width = 1280;
    window_info.bounds.height = 800;

    // Enable transparent painting for the main browser
    browser_settings.background_color = 0;

    std::cout << "[App] Creating main browser (Linux)" << std::endl;

    CefBrowserHost::CreateBrowser(window_info, handler, url, browser_settings,
                                  nullptr, nullptr);
#elif defined(OS_MACOSX)
    // macOS: Use single-browser approach with native window styling
    CefWindowInfo window_info;
    window_info.bounds.x = 0;
    window_info.bounds.y = 0;
    window_info.bounds.width = 1280;
    window_info.bounds.height = 800;

    // Enable transparent painting for the main browser
    browser_settings.background_color = 0;

    std::cout << "[App] Creating main browser (macOS)" << std::endl;

    // Create the browser - window customization will happen in OnAfterCreated
    CefBrowserHost::CreateBrowser(window_info, handler, url, browser_settings,
                                  nullptr, nullptr);
#endif
  }
}

void App::OnBeforeCommandLineProcessing(
    const CefString& process_type,
    CefRefPtr<CefCommandLine> command_line) {
  // Enable features and settings
  command_line->AppendSwitch("disable-gpu");
  command_line->AppendSwitch("disable-gpu-compositing");

  // Allow file access from files (needed for local React app)
  command_line->AppendSwitch("allow-file-access-from-files");
  command_line->AppendSwitch("allow-universal-access-from-files");

  // Web security disabled switch removed - Google detects this and blocks login
  // command_line->AppendSwitch("disable-web-security");

  // Enable media stream support for meetings (camera/mic)
  command_line->AppendSwitch("enable-media-stream");
  command_line->AppendSwitch("enable-speech-input");
  command_line->AppendSwitch("enable-usermedia-screen-capturing");

  // Enable proprietary codecs for video/audio
  command_line->AppendSwitchWithValue("autoplay-policy", "no-user-gesture-required");
}
