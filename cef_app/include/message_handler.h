#ifndef CEF_APP_MESSAGE_HANDLER_H_
#define CEF_APP_MESSAGE_HANDLER_H_

#include "include/cef_app.h"
#include "include/cef_v8.h"

// Handler for process messages between browser and renderer
class MessageHandler : public CefV8Handler {
 public:
  MessageHandler() {}

  // Execute handler for V8 function calls
  virtual bool Execute(const CefString& name,
                      CefRefPtr<CefV8Value> object,
                      const CefV8ValueList& arguments,
                      CefRefPtr<CefV8Value>& retval,
                      CefString& exception) override;

 private:
  IMPLEMENT_REFCOUNTING(MessageHandler);
};

// Renderer-side app handler
class RenderProcessHandler : public CefRenderProcessHandler {
 public:
  RenderProcessHandler() {}

  // Called when the browser context is created
  virtual void OnContextCreated(CefRefPtr<CefBrowser> browser,
                               CefRefPtr<CefFrame> frame,
                               CefRefPtr<CefV8Context> context) override;

  // Called to handle process messages
  virtual bool OnProcessMessageReceived(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefProcessId source_process,
      CefRefPtr<CefProcessMessage> message) override;

 private:
  IMPLEMENT_REFCOUNTING(RenderProcessHandler);
};

#endif  // CEF_APP_MESSAGE_HANDLER_H_
