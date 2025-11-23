#include "client_handler.h"

#include <sstream>
#include <iostream>
#include <string>

#include "include/base/cef_callback.h"
#include "include/cef_app.h"
#include "include/cef_parser.h"
#include "include/views/cef_browser_view.h"
#include "include/views/cef_window.h"
#include "include/wrapper/cef_closure_task.h"
#include "include/wrapper/cef_helpers.h"

#if defined(OS_WIN)
#include <windows.h>
#include <shellapi.h>
#elif defined(OS_MACOSX)
#include <cstdlib>
#elif defined(OS_LINUX)
#include <cstdlib>
#include <X11/Xlib.h>
#endif

namespace {

ClientHandler* g_instance = nullptr;

// Returns a data: URI with the specified contents
std::string GetDataURI(const std::string& data, const std::string& mime_type) {
  return "data:" + mime_type + ";base64," +
         CefURIEncode(CefBase64Encode(data.data(), data.size()), false)
             .ToString();
}

}  // namespace

ClientHandler::ClientHandler(bool use_views)
    : use_views_(use_views), is_closing_(false), parent_window_(0),
      last_meeting_x_(0), last_meeting_y_(0), last_meeting_width_(0), last_meeting_height_(0) {
  DCHECK(!g_instance);
  g_instance = this;
}

ClientHandler::~ClientHandler() {
  g_instance = nullptr;
}

// static
ClientHandler* ClientHandler::GetInstance() {
  return g_instance;
}

void ClientHandler::OnGotFocus(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

#if defined(OS_LINUX)
  // When the UI browser gets focus (e.g. switching workspaces),
  // ensure the content browser (child window) is raised and visible.
  if (ui_browser_ && browser->IsSame(ui_browser_) && content_browser_) {
    Window window = content_browser_->GetHost()->GetWindowHandle();
    Display* display = cef_get_xdisplay();
    if (window != kNullWindowHandle && display) {
      XRaiseWindow(display, window);
      XFlush(display);
    }
  }
#endif
}


void ClientHandler::OnAfterCreated(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Identify the browser type by its URL
  std::string url = browser->GetMainFrame()->GetURL();

  // UI browser loads data URI (base64 HTML)
  if (url.find("data:text/html") == 0 ||
      (url.find("file://") == 0 && url.find("ui_layout.html") != std::string::npos)) {
    ui_browser_ = browser;
    std::cout << "[Browser] UI browser created with ID: " << browser->GetIdentifier() << std::endl;

    // Add to browser list for lifecycle management
    browser_list_.push_back(browser);

    // Force a resize once both browsers are ready
    if (ui_browser_ && content_browser_) {
#if defined(OS_WIN)
      if (parent_window_) {
        RECT rect;
        GetClientRect(parent_window_, &rect);
        ResizeBrowsers(rect.right - rect.left, rect.bottom - rect.top);
      }
#endif
    }
    return;
  }

  // Check if this is a content/meeting browser
  // On Windows: It's the second browser created (after UI browser)
  // On Linux/macOS: It's any browser created after the main browser
  if (content_browser_ == nullptr) {
    // On Windows, we need the UI browser to exist first
    // On Linux/macOS, we just need at least one browser in the list (the main browser)
#if defined(OS_WIN)
    bool can_be_content = (ui_browser_ != nullptr);
#else
    // On Linux/macOS, if we already have a browser, this new one is the content browser
    bool can_be_content = !browser_list_.empty();
#endif

    if (can_be_content) {
      content_browser_ = browser;
      std::cout << "[Browser] Content browser created with ID: " << browser->GetIdentifier()
                << " URL: " << url << std::endl;

      // Add to browser list for lifecycle management
      browser_list_.push_back(browser);

#if defined(OS_LINUX)
      // For true child windows (parent_window set), we don't need transient hints.
      // However, we might need to ensure the window is mapped.
      if (ui_browser_) {
        Window content_window = content_browser_->GetHost()->GetWindowHandle();
        Display* display = cef_get_xdisplay();
        if (content_window != kNullWindowHandle && display) {
           std::cout << "[Browser] Mapping content child window on Linux" << std::endl;
           XMapWindow(display, content_window);
           XFlush(display);
        }
      }
#endif

      // Force a resize once both browsers are ready
#if defined(OS_WIN)
      if (parent_window_) {
        RECT rect;
        GetClientRect(parent_window_, &rect);
        ResizeBrowsers(rect.right - rect.left, rect.bottom - rect.top);
      }
#endif
      return;
    }
  }

  // Fallback: treat as main browser (backward compatibility)
  // If we don't have a UI browser yet, and this isn't the content browser, assume this is the UI browser
  if (!ui_browser_ && !content_browser_) {
    ui_browser_ = browser;
    std::cout << "[Browser] Identified as UI browser (fallback): " << browser->GetIdentifier() << std::endl;
  }

  browser_list_.push_back(browser);
  std::cout << "[Browser] Browser created with ID: " << browser->GetIdentifier() << std::endl;
}

bool ClientHandler::DoClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Closing the main window requires special handling
  if (browser_list_.size() == 1) {
    // Set a flag to indicate that the window close should be allowed
    is_closing_ = true;
  }

  // Allow the close. For windowed browsers this will result in the OS close
  // event being sent
  return false;
}

bool ClientHandler::OnBeforePopup(CefRefPtr<CefBrowser> browser,
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
                                   bool* no_javascript_access) {
  CEF_REQUIRE_UI_THREAD();

  std::cout << "[Browser] OnBeforePopup: " << target_url.ToString() << std::endl;

  // Redirect popup to current frame instead of opening a new window
  // This handles Google Login popups by loading them in the current browser
  frame->LoadURL(target_url);

  // Return true to cancel the popup creation (we handled it by redirecting)
  return true;
}

void ClientHandler::OnBeforeClose(CefRefPtr<CefBrowser> browser) {
  CEF_REQUIRE_UI_THREAD();

  // Check if this is the UI browser
  if (ui_browser_ && ui_browser_->IsSame(browser)) {
    std::cout << "[Browser] UI browser closed" << std::endl;
    ui_browser_ = nullptr;
  }

  // Check if this is the content browser
  if (content_browser_ && content_browser_->IsSame(browser)) {
    std::cout << "[Browser] Content browser closed" << std::endl;
    content_browser_ = nullptr;
  }

  // Remove from the list of existing browsers
  BrowserList::iterator bit = browser_list_.begin();
  for (; bit != browser_list_.end(); ++bit) {
    if ((*bit)->IsSame(browser)) {
      browser_list_.erase(bit);
      break;
    }
  }

  if (browser_list_.empty()) {
    // All browser windows have closed. Quit the application message loop
    CefQuitMessageLoop();
  }
}

void ClientHandler::OnLoadError(CefRefPtr<CefBrowser> browser,
                                CefRefPtr<CefFrame> frame,
                                ErrorCode errorCode,
                                const CefString& errorText,
                                const CefString& failedUrl) {
  CEF_REQUIRE_UI_THREAD();

  // Don't display an error for downloaded files
  if (errorCode == ERR_ABORTED)
    return;

  // Display a load error message using a data: URI
  std::stringstream ss;
  ss << "<html><body bgcolor=\"white\">"
        "<h2>Failed to load URL "
     << std::string(failedUrl) << " with error " << std::string(errorText)
     << " (" << errorCode << ").</h2></body></html>";

  frame->LoadURL(GetDataURI(ss.str(), "text/html"));
}

void ClientHandler::CloseAllBrowsers(bool force_close) {
  if (!CefCurrentlyOn(TID_UI)) {
    // Execute on the UI thread
    CefPostTask(TID_UI, base::BindOnce(&ClientHandler::CloseAllBrowsers, this,
                                       force_close));
    return;
  }

  if (browser_list_.empty())
    return;

  BrowserList::const_iterator it = browser_list_.begin();
  for (; it != browser_list_.end(); ++it)
    (*it)->GetHost()->CloseBrowser(force_close);
}

void ClientHandler::OnTitleChange(CefRefPtr<CefBrowser> browser,
                                  const CefString& title) {
  CEF_REQUIRE_UI_THREAD();

  // Store title if this is the content browser
  if (content_browser_ && browser->GetIdentifier() == content_browser_->GetIdentifier()) {
    content_browser_title_ = title.ToString();
    std::cout << "[Browser] Content browser title changed: " << content_browser_title_ << std::endl;
  }

  // Only update window title for content browser
  if (content_browser_ && browser->GetIdentifier() != content_browser_->GetIdentifier()) {
    return;
  }

  if (use_views_) {
    // Set the title of the window using the Views framework
    CefRefPtr<CefBrowserView> browser_view =
        CefBrowserView::GetForBrowser(browser);
    if (browser_view) {
      CefRefPtr<CefWindow> window = browser_view->GetWindow();
      if (window)
        window->SetTitle(title);
    }
  } else {
    // Set the title of the window using platform APIs
    PlatformTitleChange(browser, title);
  }
}

bool ClientHandler::OnBeforeBrowse(CefRefPtr<CefBrowser> browser,
                                   CefRefPtr<CefFrame> frame,
                                   CefRefPtr<CefRequest> request,
                                   bool user_gesture,
                                   bool is_redirect) {
  CEF_REQUIRE_UI_THREAD();

  // Allow navigation by default
  return false;
}

CefResourceRequestHandler::ReturnValue ClientHandler::OnBeforeResourceLoad(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefRefPtr<CefRequest> request,
    CefRefPtr<CefCallback> callback) {
  CEF_REQUIRE_IO_THREAD();

  // Continue with the request without modifying headers
  // Header injection removed as it was causing 400 errors
  return RV_CONTINUE;
}

bool ClientHandler::OnProcessMessageReceived(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefProcessId source_process,
    CefRefPtr<CefProcessMessage> message) {
  CEF_REQUIRE_UI_THREAD();

  const std::string& message_name = message->GetName();
  std::cout << "[Browser] Process message received: " << message_name << std::endl;

  if (message_name == "open_system_browser") {
    // Get URL from message
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    std::string url = args->GetString(0);

    std::cout << "[Browser] Opening system browser with URL: " << url << std::endl;
    OpenSystemBrowser(url);
    return true;
  }

  if (message_name == "navigate_to_meeting") {
    // Get meeting URL from message
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    std::string url = args->GetString(0);

    std::cout << "[Browser] Navigating to meeting URL: " << url << std::endl;

    // Navigate the current browser to the meeting URL
    if (browser && browser->GetMainFrame()) {
      browser->GetMainFrame()->LoadURL(url);
      std::cout << "[Browser] Browser navigated to meeting URL" << std::endl;
    }
    return true;
  }

  if (message_name == "join_meeting") {
    // Get meeting details from message
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    std::string url = args->GetString(0);
    int x = args->GetInt(1);
    int y = args->GetInt(2);
    int width = args->GetInt(3);
    int height = args->GetInt(4);

    std::cout << "[Browser] Join meeting request: " << url
              << " at (" << x << ", " << y << ") size: " << width << "x" << height << std::endl;

    CreateMeetingView(url, x, y, width, height);
    return true;
  }

  if (message_name == "leave_meeting") {
    std::cout << "[Browser] Leave meeting request" << std::endl;
    DestroyMeetingView();
    return true;
  }

  if (message_name == "update_meeting_bounds") {
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    int x = args->GetInt(0);
    int y = args->GetInt(1);
    int width = args->GetInt(2);
    int height = args->GetInt(3);

    std::cout << "[Browser] Update meeting bounds: (" << x << ", " << y
              << ") size: " << width << "x" << height << std::endl;

    UpdateMeetingViewBounds(x, y, width, height);
    return true;
  }

  if (message_name == "get_meeting_page_info") {
    std::cout << "[Browser] Get meeting page info request" << std::endl;

    std::string url = "";
    std::string title = content_browser_title_;

    if (content_browser_) {
      url = content_browser_->GetMainFrame()->GetURL().ToString();
    }

    std::cout << "[Browser] Meeting page info - URL: " << url << ", Title: " << title << std::endl;

    // Send response back to UI browser
    if (ui_browser_) {
      CefRefPtr<CefProcessMessage> response = CefProcessMessage::Create("meeting_page_info_response");
      CefRefPtr<CefListValue> args = response->GetArgumentList();
      args->SetString(0, url);
      args->SetString(1, title);
      ui_browser_->GetMainFrame()->SendProcessMessage(PID_RENDERER, response);
    } else if (!browser_list_.empty()) {
      // Fallback for non-Windows platforms
      CefRefPtr<CefProcessMessage> response = CefProcessMessage::Create("meeting_page_info_response");
      CefRefPtr<CefListValue> args = response->GetArgumentList();
      args->SetString(0, url);
      args->SetString(1, title);
      browser_list_.front()->GetMainFrame()->SendProcessMessage(PID_RENDERER, response);
    }

    return true;
  }

  if (message_name == "get_meeting_participants") {
    std::cout << "[Browser] Get meeting participants request" << std::endl;

    if (content_browser_) {
      // Execute JavaScript in content browser to extract participants
      // This JS opens the panel if needed, extracts names, then closes it
      std::string js_code = R"(
        (function() {
          var participants = [];

          // Function to extract participants from the DOM
          function extractParticipants() {
            var found = [];

            // Method 1: Google Meet - aria-label on listitem
            document.querySelectorAll('div[role="listitem"]').forEach(function(el) {
              var name = el.getAttribute('aria-label');
              if (name && name.trim()) {
                found.push(name.trim());
              }
            });

            // Method 2: Google Meet - span.zWGUib class (fallback)
            if (found.length === 0) {
              document.querySelectorAll('span.zWGUib').forEach(function(el) {
                var name = el.textContent;
                if (name && name.trim()) {
                  found.push(name.trim());
                }
              });
            }

            // Method 3: Zoom - participant list items
            if (found.length === 0) {
              document.querySelectorAll('.participants-item__display-name').forEach(function(el) {
                var name = el.textContent;
                if (name && name.trim()) {
                  found.push(name.trim());
                }
              });
            }

            return found;
          }

          // Function to find and click the people/participants button
          function findPeopleButton() {
            // Google Meet: Look for button with people icon
            var buttons = document.querySelectorAll('button');
            for (var i = 0; i < buttons.length; i++) {
              var btn = buttons[i];
              // Check aria-label
              var label = btn.getAttribute('aria-label') || '';
              if (label.toLowerCase().includes('people') ||
                  label.toLowerCase().includes('participant') ||
                  label.toLowerCase().includes('everyone')) {
                return btn;
              }
              // Check for people icon inside button
              var icon = btn.querySelector('i.google-symbols');
              if (icon && icon.textContent && icon.textContent.trim() === 'people') {
                return btn;
              }
            }
            return null;
          }

          // Try to extract participants directly first
          participants = extractParticipants();

          if (participants.length === 0) {
            // Panel might not be open, try to open it
            var peopleBtn = findPeopleButton();
            if (peopleBtn) {
              // Click to open panel
              peopleBtn.click();

              // Wait for panel to load, then extract and close
              setTimeout(function() {
                participants = extractParticipants();

                // Close the panel by clicking the button again
                setTimeout(function() {
                  peopleBtn.click();
                }, 100);

                // Send results
                if (window.rebrazeAuth && window.rebrazeAuth.sendParticipantList) {
                  window.rebrazeAuth.sendParticipantList(JSON.stringify(participants));
                }
              }, 500);
            } else {
              // Couldn't find button, send empty
              if (window.rebrazeAuth && window.rebrazeAuth.sendParticipantList) {
                window.rebrazeAuth.sendParticipantList(JSON.stringify(participants));
              }
            }
          } else {
            // Already have participants, send them
            if (window.rebrazeAuth && window.rebrazeAuth.sendParticipantList) {
              window.rebrazeAuth.sendParticipantList(JSON.stringify(participants));
            }
          }
        })();
      )";

      content_browser_->GetMainFrame()->ExecuteJavaScript(js_code, "", 0);
      std::cout << "[Browser] Executed participant extraction JS in content browser" << std::endl;
    } else {
      std::cout << "[Browser] No content browser to extract participants from" << std::endl;
      // Send empty list
      if (ui_browser_) {
        CefRefPtr<CefProcessMessage> response = CefProcessMessage::Create("meeting_participants_response");
        CefRefPtr<CefListValue> args = response->GetArgumentList();
        args->SetString(0, "[]");
        ui_browser_->GetMainFrame()->SendProcessMessage(PID_RENDERER, response);
      }
    }

    return true;
  }

  if (message_name == "participant_list_extracted") {
    // Received participant list from content browser, forward to UI browser
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    std::string json_list = args->GetString(0).ToString();

    std::cout << "[Browser] Participant list extracted: " << json_list << std::endl;

    // Forward to UI browser
    if (ui_browser_) {
      CefRefPtr<CefProcessMessage> response = CefProcessMessage::Create("meeting_participants_response");
      CefRefPtr<CefListValue> response_args = response->GetArgumentList();
      response_args->SetString(0, json_list);
      ui_browser_->GetMainFrame()->SendProcessMessage(PID_RENDERER, response);
    } else if (!browser_list_.empty()) {
      // Fallback for non-Windows platforms
      CefRefPtr<CefProcessMessage> response = CefProcessMessage::Create("meeting_participants_response");
      CefRefPtr<CefListValue> response_args = response->GetArgumentList();
      response_args->SetString(0, json_list);
      browser_list_.front()->GetMainFrame()->SendProcessMessage(PID_RENDERER, response);
    }

    return true;
  }

  return false;
}

void ClientHandler::OpenSystemBrowser(const std::string& url) {
  std::cout << "[Browser] OpenSystemBrowser called" << std::endl;

#if defined(OS_WIN)
  std::cout << "[Browser] Using ShellExecuteA (Windows)" << std::endl;
  ShellExecuteA(NULL, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
#elif defined(OS_MACOSX)
  std::cout << "[Browser] Using 'open' command (macOS)" << std::endl;
  std::string command = "open \"" + url + "\"";
  system(command.c_str());
#elif defined(OS_LINUX)
  std::cout << "[Browser] Using 'xdg-open' command (Linux)" << std::endl;
  std::string command = "xdg-open \"" + url + "\" &";
  int result = system(command.c_str());
  std::cout << "[Browser] xdg-open result: " << result << std::endl;
#endif

  std::cout << "[Browser] System browser command executed" << std::endl;
}

void ClientHandler::CreateMeetingView(const std::string& url, int x, int y, int width, int height) {
  CEF_REQUIRE_UI_THREAD();

  std::cout << "[Browser] CreateMeetingView called" << std::endl;

  // If content browser already exists, just navigate to the new URL
  if (content_browser_) {
    std::cout << "[Browser] Navigating existing content browser to: " << url << std::endl;
    NavigateContentBrowser(url);
    return;
  }

  // Create window info for the content browser
  CefWindowInfo window_info;

#if defined(OS_WIN)
  // On Windows, create as a child window of the parent
  HWND parent_hwnd = parent_window_;
  if (!parent_hwnd && !browser_list_.empty()) {
    parent_hwnd = GetParent(browser_list_.front()->GetHost()->GetWindowHandle());
  }

  // Create in the content area (below top bar, left of sidebar)
  window_info.SetAsChild(parent_hwnd, {x, y, x + width, y + height});
#elif defined(OS_LINUX)
  // On Linux, create as a child window of the main browser window.
  // This ensures the meeting window moves with the main window and is managed as a single unit by the window manager (e.g. dwm).
  CefWindowHandle parent_handle = kNullWindowHandle;
  
  if (!browser_list_.empty()) {
    // Use the first browser (UI browser) as the parent
    parent_handle = browser_list_.front()->GetHost()->GetWindowHandle();
  }

  if (parent_handle != kNullWindowHandle) {
    window_info.parent_window = parent_handle;
    std::cout << "[Browser] Setting parent window for content browser: " << parent_handle << std::endl;
  }
  
  window_info.bounds.x = x;
  window_info.bounds.y = y;
  window_info.bounds.width = width;
  window_info.bounds.height = height;
#elif defined(OS_MACOSX)
  // On macOS, set bounds
  window_info.bounds.x = x;
  window_info.bounds.y = y;
  window_info.bounds.width = width;
  window_info.bounds.height = height;
#endif

  // Browser settings for content view
  CefBrowserSettings browser_settings;

  std::cout << "[Browser] Creating content browser with URL: " << url << std::endl;

  // Create the content browser
  CefBrowserHost::CreateBrowser(window_info, this, url, browser_settings, nullptr, nullptr);

  std::cout << "[Browser] Content browser creation initiated" << std::endl;
}

void ClientHandler::CreateUIBrowser(const std::string& url) {
  CEF_REQUIRE_UI_THREAD();

  std::cout << "[Browser] CreateUIBrowser called" << std::endl;

  CefWindowInfo window_info;
  CefBrowserSettings browser_settings;

#if defined(OS_WIN)
  if (parent_window_) {
    RECT rect;
    GetClientRect(parent_window_, &rect);
    window_info.SetAsChild(parent_window_, rect);
  }
#elif defined(OS_LINUX)
  window_info.bounds.x = 0;
  window_info.bounds.y = 0;
  window_info.bounds.width = 1280;
  window_info.bounds.height = 800;
#elif defined(OS_MACOSX)
  window_info.bounds.x = 0;
  window_info.bounds.y = 0;
  window_info.bounds.width = 1280;
  window_info.bounds.height = 800;
#endif

  std::cout << "[Browser] Creating UI browser with URL: " << url << std::endl;

  CefBrowserHost::CreateBrowser(window_info, this, url, browser_settings, nullptr, nullptr);
}

void ClientHandler::ResizeBrowsers(int width, int height) {
  CEF_REQUIRE_UI_THREAD();

  std::cout << "[Browser] ResizeBrowsers: " << width << "x" << height << std::endl;

#if defined(OS_WIN)
  // Resize UI browser (fills entire window)
  if (ui_browser_) {
    HWND ui_hwnd = ui_browser_->GetHost()->GetWindowHandle();
    if (ui_hwnd) {
      SetWindowPos(ui_hwnd, NULL, 0, 0, width, height, SWP_NOZORDER);
    }
  }

  // Resize content browser (content area only)
  if (content_browser_) {
    HWND content_hwnd = content_browser_->GetHost()->GetWindowHandle();
    if (content_hwnd) {
      int x = 0;
      int y = kTopBarHeight;
      int w = width - kSidebarWidth;
      int h = height - kTopBarHeight;

      // Safety check
      if (w < 0) w = 0;
      if (h < 0) h = 0;

      // Set content browser on TOP (above UI browser) so it's visible
      SetWindowPos(content_hwnd, HWND_TOP, x, y, w, h, 0);
    }
  }
#elif defined(OS_LINUX)
  // Linux implementation will be in platform-specific file
#elif defined(OS_MACOSX)
  // macOS implementation will be in platform-specific file
#endif
}

void ClientHandler::NavigateContentBrowser(const std::string& url) {
  CEF_REQUIRE_UI_THREAD();

  if (content_browser_ && content_browser_->GetMainFrame()) {
    std::cout << "[Browser] Navigating content browser to: " << url << std::endl;
    content_browser_->GetMainFrame()->LoadURL(url);
  } else {
    std::cout << "[Browser] No content browser available to navigate" << std::endl;
  }
}

void ClientHandler::ShowMeetingView() {
  CEF_REQUIRE_UI_THREAD();

  if (!content_browser_) {
    std::cout << "[Browser] ShowMeetingView: No content browser exists" << std::endl;
    return;
  }

  std::cout << "[Browser] Showing content browser" << std::endl;

#if defined(OS_WIN)
  HWND hwnd = content_browser_->GetHost()->GetWindowHandle();
  if (hwnd) {
    ShowWindow(hwnd, SW_SHOW);
    // Ensure it's on top
    SetWindowPos(hwnd, HWND_TOP, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
  }
#elif defined(OS_LINUX)
  Window window = content_browser_->GetHost()->GetWindowHandle();
  Display* display = cef_get_xdisplay();
  if (window != kNullWindowHandle && display) {
    XMapWindow(display, window);
    XRaiseWindow(display, window);
    XFlush(display);
  }
#endif
  // Linux and macOS: Browser is visible by default
}

void ClientHandler::HideMeetingView() {
  CEF_REQUIRE_UI_THREAD();

  if (!content_browser_) {
    std::cout << "[Browser] HideMeetingView: No content browser exists" << std::endl;
    return;
  }

  std::cout << "[Browser] Hiding content browser" << std::endl;

#if defined(OS_WIN)
  HWND hwnd = content_browser_->GetHost()->GetWindowHandle();
  if (hwnd) {
    ShowWindow(hwnd, SW_HIDE);
  }
#elif defined(OS_LINUX)
  Window window = content_browser_->GetHost()->GetWindowHandle();
  Display* display = cef_get_xdisplay();
  if (window != kNullWindowHandle && display) {
    XUnmapWindow(display, window);
    XFlush(display);
  }
#endif
  // Linux and macOS: Implement as needed
}

void ClientHandler::DestroyMeetingView() {
  CEF_REQUIRE_UI_THREAD();

  if (!content_browser_) {
    std::cout << "[Browser] DestroyMeetingView: No content browser exists" << std::endl;
    return;
  }

  std::cout << "[Browser] Destroying content browser" << std::endl;

  // Close the browser
  content_browser_->GetHost()->CloseBrowser(true);
  // Note: content_browser_ will be set to nullptr in OnBeforeClose
}

void ClientHandler::UpdateMeetingViewBounds(int x, int y, int width, int height) {
  CEF_REQUIRE_UI_THREAD();

  if (!content_browser_) {
    std::cout << "[Browser] UpdateMeetingViewBounds: No content browser exists" << std::endl;
    return;
  }

  std::cout << "[Browser] Updating content browser bounds" << std::endl;

#if defined(OS_WIN)
  HWND hwnd = content_browser_->GetHost()->GetWindowHandle();
  if (hwnd) {
    // Content browser stays on TOP (above UI browser)
    SetWindowPos(hwnd, HWND_TOP, x, y, width, height, SWP_NOACTIVATE);
  }
#elif defined(OS_LINUX)
  // Update bounds on Linux
  Window window = content_browser_->GetHost()->GetWindowHandle();
  Display* display = cef_get_xdisplay();
  if (window != kNullWindowHandle && display) {
    // Only move/resize if bounds changed to reduce flickering
    if (x != last_meeting_x_ || y != last_meeting_y_ || 
        width != last_meeting_width_ || height != last_meeting_height_) {
      
      XMoveResizeWindow(display, window, x, y, width, height);
      
      last_meeting_x_ = x;
      last_meeting_y_ = y;
      last_meeting_width_ = width;
      last_meeting_height_ = height;

      // Only raise when we actually move/resize
      XRaiseWindow(display, window);
      XFlush(display);
    }
  }
#endif
  // Linux and macOS: Implement as needed
}

// Note: PlatformTitleChange is implemented in platform-specific files:
// - main_linux.cpp for Linux
// - main_win.cpp for Windows
// - main_mac.mm for macOS
