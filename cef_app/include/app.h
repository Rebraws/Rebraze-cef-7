#ifndef CEF_APP_APP_H_
#define CEF_APP_APP_H_

#include "include/cef_app.h"

// Forward declaration
class RenderProcessHandler;

// Implement application-level callbacks for CEF
class App : public CefApp, public CefBrowserProcessHandler {
 public:
  App();

  // CefApp methods
  CefRefPtr<CefBrowserProcessHandler> GetBrowserProcessHandler() override {
    return this;
  }

  CefRefPtr<CefRenderProcessHandler> GetRenderProcessHandler() override;

  // CefBrowserProcessHandler methods
  void OnContextInitialized() override;

  void OnBeforeCommandLineProcessing(
      const CefString& process_type,
      CefRefPtr<CefCommandLine> command_line) override;

 private:
  // Include the default reference counting implementation
  IMPLEMENT_REFCOUNTING(App);
};

#endif  // CEF_APP_APP_H_
