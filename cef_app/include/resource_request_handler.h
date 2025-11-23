#ifndef CEF_RESOURCE_REQUEST_HANDLER_H_
#define CEF_RESOURCE_REQUEST_HANDLER_H_

#include "include/cef_resource_request_handler.h"
#include "include/cef_response_filter.h"
#include <iostream>

// Custom response filter that removes blocking headers
class HeaderFilterResponseFilter : public CefResponseFilter {
 public:
  HeaderFilterResponseFilter() {}

  // We don't need to filter the response body, just headers
  bool InitFilter() override { return true; }

  FilterStatus Filter(void* data_in,
                     size_t data_in_size,
                     size_t& data_in_read,
                     void* data_out,
                     size_t data_out_size,
                     size_t& data_out_written) override {
    // Pass through all data unchanged
    data_in_read = data_in_size;
    data_out_written = std::min(data_in_size, data_out_size);
    if (data_out_written > 0) {
      memcpy(data_out, data_in, data_out_written);
    }
    return RESPONSE_FILTER_DONE;
  }

 private:
  IMPLEMENT_REFCOUNTING(HeaderFilterResponseFilter);
};

// Resource request handler that intercepts and modifies headers
class CustomResourceRequestHandler : public CefResourceRequestHandler {
 public:
  CustomResourceRequestHandler() {}

  CefRefPtr<CefResourceHandler> GetResourceHandler(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefRefPtr<CefRequest> request) override {
    return nullptr;
  }

  void OnResourceRedirect(CefRefPtr<CefBrowser> browser,
                         CefRefPtr<CefFrame> frame,
                         CefRefPtr<CefRequest> request,
                         CefRefPtr<CefResponse> response,
                         CefString& new_url) override {}

  bool OnResourceResponse(CefRefPtr<CefBrowser> browser,
                         CefRefPtr<CefFrame> frame,
                         CefRefPtr<CefRequest> request,
                         CefRefPtr<CefResponse> response) override {
    CefResponse::HeaderMap headers;
    response->GetHeaderMap(headers);

    bool modified = false;
    std::string url = request->GetURL();

    // Check if this is a meeting platform URL
    bool isMeetingUrl = (url.find("meet.google.com") != std::string::npos ||
                         url.find("teams.microsoft.com") != std::string::npos ||
                         url.find("zoom.us") != std::string::npos);

    if (isMeetingUrl) {
      // Remove X-Frame-Options header that blocks iframe embedding
      auto it = headers.find("X-Frame-Options");
      if (it != headers.end()) {
        std::cout << "[ResourceHandler] Removing X-Frame-Options header from: " << url << std::endl;
        headers.erase(it);
        modified = true;
      }

      // Remove or modify Content-Security-Policy headers
      it = headers.find("Content-Security-Policy");
      if (it != headers.end()) {
        std::string csp = it->second;
        if (csp.find("frame-ancestors") != std::string::npos) {
          std::cout << "[ResourceHandler] Removing CSP frame-ancestors from: " << url << std::endl;
          headers.erase(it);
          modified = true;
        }
      }

      // Also check lowercase variants
      it = headers.find("x-frame-options");
      if (it != headers.end()) {
        headers.erase(it);
        modified = true;
      }

      it = headers.find("content-security-policy");
      if (it != headers.end()) {
        std::string csp = it->second;
        if (csp.find("frame-ancestors") != std::string::npos) {
          headers.erase(it);
          modified = true;
        }
      }

      if (modified) {
        response->SetHeaderMap(headers);
        std::cout << "[ResourceHandler] Modified headers for: " << url << std::endl;
      }
    }

    return false;
  }

  CefRefPtr<CefResponseFilter> GetResourceResponseFilter(
      CefRefPtr<CefBrowser> browser,
      CefRefPtr<CefFrame> frame,
      CefRefPtr<CefRequest> request,
      CefRefPtr<CefResponse> response) override {
    // Only return a filter for meeting URLs to avoid interfering with local files
    std::string url = request->GetURL();
    bool isMeetingUrl = (url.find("meet.google.com") != std::string::npos ||
                         url.find("teams.microsoft.com") != std::string::npos ||
                         url.find("zoom.us") != std::string::npos);

    if (isMeetingUrl) {
      return new HeaderFilterResponseFilter();
    }

    // Return nullptr for all other URLs (no filtering needed)
    return nullptr;
  }

  void OnResourceLoadComplete(CefRefPtr<CefBrowser> browser,
                             CefRefPtr<CefFrame> frame,
                             CefRefPtr<CefRequest> request,
                             CefRefPtr<CefResponse> response,
                             URLRequestStatus status,
                             int64_t received_content_length) override {
    if (status == UR_FAILED || status == UR_CANCELED) {
      std::string url = request->GetURL();
      std::cout << "[ResourceHandler] Resource load failed for: " << url
                << " Status: " << status << std::endl;
    }
  }

 private:
  IMPLEMENT_REFCOUNTING(CustomResourceRequestHandler);
};

#endif  // CEF_RESOURCE_REQUEST_HANDLER_H_
