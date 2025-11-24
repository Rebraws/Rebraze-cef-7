#include "message_handler.h"
#include "include/wrapper/cef_helpers.h"
#include <iostream>

// Execute handler for V8 function calls from JavaScript
bool MessageHandler::Execute(const CefString& name,
                            CefRefPtr<CefV8Value> object,
                            const CefV8ValueList& arguments,
                            CefRefPtr<CefV8Value>& retval,
                            CefString& exception) {
  std::cout << "[Renderer] Execute called for function: " << name.ToString() << std::endl;

  if (name == "openSystemBrowser") {
    // openSystemBrowser(url)
    if (arguments.size() == 1 && arguments[0]->IsString()) {
      std::string url = arguments[0]->GetStringValue().ToString();
      std::cout << "[Renderer] Opening system browser with URL: " << url << std::endl;

      // Send message to browser process to open system browser
      CefRefPtr<CefProcessMessage> message =
          CefProcessMessage::Create("open_system_browser");

      CefRefPtr<CefListValue> args = message->GetArgumentList();
      args->SetString(0, arguments[0]->GetStringValue());

      CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
      context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

      std::cout << "[Renderer] Process message sent to browser" << std::endl;

      retval = CefV8Value::CreateBool(true);
      return true;
    }
  }

  if (name == "navigateToMeetingUrl") {
    // navigateToMeetingUrl(url)
    if (arguments.size() == 1 && arguments[0]->IsString()) {
      std::string url = arguments[0]->GetStringValue().ToString();
      std::cout << "[Renderer] Navigating to meeting URL: " << url << std::endl;

      // Send message to browser process to navigate to meeting URL
      CefRefPtr<CefProcessMessage> message =
          CefProcessMessage::Create("navigate_to_meeting");

      CefRefPtr<CefListValue> args = message->GetArgumentList();
      args->SetString(0, arguments[0]->GetStringValue());

      CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
      context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

      std::cout << "[Renderer] Meeting navigation message sent to browser" << std::endl;

      retval = CefV8Value::CreateBool(true);
      return true;
    }
  }

  if (name == "joinMeeting") {
    // joinMeeting(url, x, y, width, height)
    if (arguments.size() == 5 && arguments[0]->IsString() &&
        arguments[1]->IsInt() && arguments[2]->IsInt() &&
        arguments[3]->IsInt() && arguments[4]->IsInt()) {

      std::string url = arguments[0]->GetStringValue().ToString();
      int x = arguments[1]->GetIntValue();
      int y = arguments[2]->GetIntValue();
      int width = arguments[3]->GetIntValue();
      int height = arguments[4]->GetIntValue();

      std::cout << "[Renderer] Join meeting: " << url
                << " at (" << x << ", " << y << ") size: " << width << "x" << height << std::endl;

      // Send message to browser process to create meeting view
      CefRefPtr<CefProcessMessage> message =
          CefProcessMessage::Create("join_meeting");

      CefRefPtr<CefListValue> args = message->GetArgumentList();
      args->SetString(0, arguments[0]->GetStringValue());
      args->SetInt(1, x);
      args->SetInt(2, y);
      args->SetInt(3, width);
      args->SetInt(4, height);

      CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
      context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

      std::cout << "[Renderer] Join meeting message sent to browser" << std::endl;

      retval = CefV8Value::CreateBool(true);
      return true;
    }
  }

  if (name == "leaveMeeting") {
    // leaveMeeting()
    std::cout << "[Renderer] Leave meeting called" << std::endl;

    // Send message to browser process to destroy meeting view
    CefRefPtr<CefProcessMessage> message =
        CefProcessMessage::Create("leave_meeting");

    CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
    context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

    std::cout << "[Renderer] Leave meeting message sent to browser" << std::endl;

    retval = CefV8Value::CreateBool(true);
    return true;
  }

  if (name == "updateMeetingBounds") {
    // updateMeetingBounds(x, y, width, height)
    if (arguments.size() == 4 && arguments[0]->IsInt() && arguments[1]->IsInt() &&
        arguments[2]->IsInt() && arguments[3]->IsInt()) {

      int x = arguments[0]->GetIntValue();
      int y = arguments[1]->GetIntValue();
      int width = arguments[2]->GetIntValue();
      int height = arguments[3]->GetIntValue();

      std::cout << "[Renderer] Update meeting bounds: (" << x << ", " << y
                << ") size: " << width << "x" << height << std::endl;

      // Send message to browser process to update meeting view bounds
      CefRefPtr<CefProcessMessage> message =
          CefProcessMessage::Create("update_meeting_bounds");

      CefRefPtr<CefListValue> args = message->GetArgumentList();
      args->SetInt(0, x);
      args->SetInt(1, y);
      args->SetInt(2, width);
      args->SetInt(3, height);

      CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
      context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

      std::cout << "[Renderer] Update meeting bounds message sent to browser" << std::endl;

      retval = CefV8Value::CreateBool(true);
      return true;
    }
  }

  if (name == "getMeetingPageInfo") {
    // getMeetingPageInfo() - requests page info from content browser
    std::cout << "[Renderer] Get meeting page info called" << std::endl;

    // Send message to browser process to get meeting page info
    CefRefPtr<CefProcessMessage> message =
        CefProcessMessage::Create("get_meeting_page_info");

    CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
    context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

    std::cout << "[Renderer] Get meeting page info message sent to browser" << std::endl;

    retval = CefV8Value::CreateBool(true);
    return true;
  }

  if (name == "getMeetingParticipants") {
    // getMeetingParticipants() - requests participants from content browser
    std::cout << "[Renderer] Get meeting participants called" << std::endl;

    // Send message to browser process to extract participants
    CefRefPtr<CefProcessMessage> message =
        CefProcessMessage::Create("get_meeting_participants");

    CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
    context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

    std::cout << "[Renderer] Get meeting participants message sent to browser" << std::endl;

    retval = CefV8Value::CreateBool(true);
    return true;
  }

  if (name == "sendParticipantList") {
    // sendParticipantList(jsonArray) - called from content browser with extracted participants
    if (arguments.size() == 1 && arguments[0]->IsString()) {
      std::string json_list = arguments[0]->GetStringValue().ToString();
      std::cout << "[Renderer] Sending participant list: " << json_list << std::endl;

      // Send to browser process
      CefRefPtr<CefProcessMessage> message =
          CefProcessMessage::Create("participant_list_extracted");

      CefRefPtr<CefListValue> args = message->GetArgumentList();
      args->SetString(0, json_list);

      CefRefPtr<CefV8Context> context = CefV8Context::GetCurrentContext();
      context->GetBrowser()->GetMainFrame()->SendProcessMessage(PID_BROWSER, message);

      retval = CefV8Value::CreateBool(true);
      return true;
    }
  }

  return false;
}

// Called when the browser context is created in the renderer process
void RenderProcessHandler::OnContextCreated(CefRefPtr<CefBrowser> browser,
                                           CefRefPtr<CefFrame> frame,
                                           CefRefPtr<CefV8Context> context) {
  // Hide the 'webdriver' property to prevent detection as an automated browser
  // Google checks navigator.webdriver and blocks login if it's true
  std::string anti_detection_js =
      "Object.defineProperty(navigator, 'webdriver', {"
      "  get: () => undefined"
      "});";

  frame->ExecuteJavaScript(anti_detection_js, frame->GetURL(), 0);

  std::cout << "[Renderer] OnContextCreated called for URL: "
            << frame->GetURL().ToString() << std::endl;

  // Register the rebrazeAuth object with JavaScript
  CefRefPtr<CefV8Value> global = context->GetGlobal();

  // Create the rebrazeAuth object
  CefRefPtr<CefV8Value> rebraze_auth = CefV8Value::CreateObject(nullptr, nullptr);

  // Create the handler
  CefRefPtr<CefV8Handler> handler = new MessageHandler();

  // Create the openSystemBrowser function
  CefRefPtr<CefV8Value> open_browser_func =
      CefV8Value::CreateFunction("openSystemBrowser", handler);

  rebraze_auth->SetValue("openSystemBrowser", open_browser_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Create the navigateToMeetingUrl function
  CefRefPtr<CefV8Value> navigate_meeting_func =
      CefV8Value::CreateFunction("navigateToMeetingUrl", handler);

  rebraze_auth->SetValue("navigateToMeetingUrl", navigate_meeting_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Create the joinMeeting function
  CefRefPtr<CefV8Value> join_meeting_func =
      CefV8Value::CreateFunction("joinMeeting", handler);

  rebraze_auth->SetValue("joinMeeting", join_meeting_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Create the leaveMeeting function
  CefRefPtr<CefV8Value> leave_meeting_func =
      CefV8Value::CreateFunction("leaveMeeting", handler);

  rebraze_auth->SetValue("leaveMeeting", leave_meeting_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Create the updateMeetingBounds function
  CefRefPtr<CefV8Value> update_meeting_bounds_func =
      CefV8Value::CreateFunction("updateMeetingBounds", handler);

  rebraze_auth->SetValue("updateMeetingBounds", update_meeting_bounds_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Create the getMeetingPageInfo function
  CefRefPtr<CefV8Value> get_meeting_page_info_func =
      CefV8Value::CreateFunction("getMeetingPageInfo", handler);

  rebraze_auth->SetValue("getMeetingPageInfo", get_meeting_page_info_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Create the getMeetingParticipants function
  CefRefPtr<CefV8Value> get_meeting_participants_func =
      CefV8Value::CreateFunction("getMeetingParticipants", handler);

  rebraze_auth->SetValue("getMeetingParticipants", get_meeting_participants_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Create the sendParticipantList function (used by content browser to send back results)
  CefRefPtr<CefV8Value> send_participant_list_func =
      CefV8Value::CreateFunction("sendParticipantList", handler);

  rebraze_auth->SetValue("sendParticipantList", send_participant_list_func,
                        V8_PROPERTY_ATTRIBUTE_NONE);

  // Attach to global object
  global->SetValue("rebrazeAuth", rebraze_auth, V8_PROPERTY_ATTRIBUTE_NONE);

  std::cout << "[Renderer] window.rebrazeAuth created successfully with multi-browser meeting support" << std::endl;
}

// Handle process messages from the browser process
bool RenderProcessHandler::OnProcessMessageReceived(
    CefRefPtr<CefBrowser> browser,
    CefRefPtr<CefFrame> frame,
    CefProcessId source_process,
    CefRefPtr<CefProcessMessage> message) {

  const std::string& message_name = message->GetName();

  if (message_name == "auth_token_received") {
    // Token received from OAuth callback
    std::cout << "[Renderer] ✓ Received auth_token_received message!" << std::endl;

    // Execute JavaScript callback
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    std::string token = args->GetString(0);

    std::cout << "[Renderer] Token: " << token.substr(0, 20) << "..." << std::endl;
    std::cout << "[Renderer] Frame URL: " << frame->GetURL().ToString() << std::endl;

    // Call JavaScript function if it exists - with console logging
    std::string js_code =
        "console.log('[CEF] Received auth token:', '" + token.substr(0, 20) + "...');"
        "if (window.onAuthTokenReceived) {"
        "  console.log('[CEF] Calling window.onAuthTokenReceived');"
        "  window.onAuthTokenReceived('" + token + "');"
        "  console.log('[CEF] window.onAuthTokenReceived called successfully');"
        "} else {"
        "  console.error('[CEF] window.onAuthTokenReceived is not defined!');"
        "}";

    std::cout << "[Renderer] Executing JavaScript to call window.onAuthTokenReceived" << std::endl;

    frame->ExecuteJavaScript(js_code, frame->GetURL(), 0);

    std::cout << "[Renderer] JavaScript executed" << std::endl;

    return true;
  }

  if (message_name == "meeting_page_info_response") {
    // Meeting page info response from browser process
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    std::string url = args->GetString(0);
    std::string title = args->GetString(1);

    std::cout << "[Renderer] Meeting page info response - URL: " << url << ", Title: " << title << std::endl;

    // Escape strings for JavaScript
    auto escapeJS = [](const std::string& str) {
      std::string result;
      for (char c : str) {
        if (c == '\\') result += "\\\\";
        else if (c == '\'') result += "\\'";
        else if (c == '\n') result += "\\n";
        else if (c == '\r') result += "\\r";
        else result += c;
      }
      return result;
    };

    // Call JavaScript callback if it exists
    std::string js_code = "if (window.onMeetingPageInfo) { window.onMeetingPageInfo({ url: '" +
                         escapeJS(url) + "', title: '" + escapeJS(title) + "' }); }";

    frame->ExecuteJavaScript(js_code, frame->GetURL(), 0);
    return true;
  }

  if (message_name == "meeting_participants_response") {
    // Meeting participants response from browser process
    CefRefPtr<CefListValue> args = message->GetArgumentList();
    std::string json_list = args->GetString(0);

    std::cout << "[Renderer] Meeting participants response: " << json_list << std::endl;

    // Call JavaScript callback if it exists - pass the JSON array directly
    std::string js_code = "if (window.onMeetingParticipants) { window.onMeetingParticipants(" +
                         json_list + "); }";

    frame->ExecuteJavaScript(js_code, frame->GetURL(), 0);
    return true;
  }

  return false;
}
