cmake_minimum_required(VERSION 3.19)

project(Rebraze)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Determine the platform
if("${CMAKE_SYSTEM_NAME}" STREQUAL "Darwin")
  set(CEF_PLATFORM "macosx64")
elseif("${CMAKE_SYSTEM_NAME}" STREQUAL "Linux")
  if(CMAKE_SIZEOF_VOID_P MATCHES 8)
    set(CEF_PLATFORM "linux64")
  else()
    set(CEF_PLATFORM "linux32")
  endif()
elseif("${CMAKE_SYSTEM_NAME}" STREQUAL "Windows")
  if(CMAKE_SIZEOF_VOID_P MATCHES 8)
    set(CEF_PLATFORM "windows64")
  else()
    set(CEF_PLATFORM "windows32")
  endif()
endif()

# Download directory for CEF binary distribution
set(CEF_ROOT "${CMAKE_SOURCE_DIR}/third_party/cef_binary" CACHE PATH "Path to CEF binary distribution")

# Set the CEF distribution directory
if(NOT EXISTS "${CEF_ROOT}")
  message(WARNING "CEF_ROOT not found at ${CEF_ROOT}")
  message(WARNING "Please download CEF binary distribution from https://cef-builds.spotifycdn.com/index.html")
  message(WARNING "Extract it to ${CEF_ROOT}")
  message(FATAL_ERROR "CEF binary distribution not found")
endif()

# Add CEF cmake directory to module path
set(CMAKE_MODULE_PATH ${CMAKE_MODULE_PATH} "${CEF_ROOT}/cmake")

# Load CEF configuration
find_package(CEF REQUIRED)

# Include CEF cmake macros
include(${CEF_ROOT}/cmake/cef_macros.cmake)

# Add CEF library
add_subdirectory(${CEF_ROOT} cef_binary)

# Configure CEF global settings
ADD_LOGICAL_TARGET("libcef_lib" "${CEF_LIB_DEBUG}" "${CEF_LIB_RELEASE}")

# Determine the target output directory
SET_CEF_TARGET_OUT_DIR()

# Source files
set(REBRAZE_SRCS
  cef_app/src/main.cpp
  cef_app/src/app.cpp
  cef_app/src/client_handler.cpp
  cef_app/src/message_handler.cpp
  cef_app/src/oauth_server.cpp
)

# Header files
set(REBRAZE_HEADERS
  cef_app/include/app.h
  cef_app/include/client_handler.h
  cef_app/include/message_handler.h
  cef_app/include/oauth_server.h
)

# Platform-specific sources
if(OS_LINUX)
  list(APPEND REBRAZE_SRCS
    cef_app/src/main_linux.cpp
  )
elseif(OS_MACOSX)
  list(APPEND REBRAZE_SRCS
    cef_app/src/main_mac.mm
  )
  # macOS helper app sources
  set(REBRAZE_HELPER_SRCS
    cef_app/src/process_helper_mac.cpp
  )
elseif(OS_WINDOWS)
  list(APPEND REBRAZE_SRCS
    cef_app/src/main_win.cpp
  )
  list(APPEND REBRAZE_SRCS
    cef_app/resources/win/rebraze.rc
  )
endif()

# Include directories
include_directories(
  ${CMAKE_CURRENT_SOURCE_DIR}/cef_app/include
  ${CEF_ROOT}
)

# Executable target
if(OS_MACOSX)
  # macOS app bundle
  add_executable(Rebraze MACOSX_BUNDLE ${REBRAZE_SRCS} ${REBRAZE_HEADERS})
  SET_EXECUTABLE_TARGET_PROPERTIES(Rebraze)

  # Helper executable for separate processes
  add_executable(Rebraze_Helper MACOSX_BUNDLE ${REBRAZE_HELPER_SRCS})
  SET_EXECUTABLE_TARGET_PROPERTIES(Rebraze_Helper)
  add_dependencies(Rebraze Rebraze_Helper)

  # Copy helper app into main app bundle
  COPY_MACOSX_HELPER_APP("Rebraze" "Rebraze_Helper")
elseif(OS_WINDOWS)
  # Windows executable
  add_executable(Rebraze WIN32 ${REBRAZE_SRCS} ${REBRAZE_HEADERS})
  SET_EXECUTABLE_TARGET_PROPERTIES(Rebraze)
  add_dependencies(Rebraze libcef_dll_wrapper)
else()
  # Linux executable
  add_executable(Rebraze ${REBRAZE_SRCS} ${REBRAZE_HEADERS})
  SET_EXECUTABLE_TARGET_PROPERTIES(Rebraze)
  add_dependencies(Rebraze libcef_dll_wrapper)
endif()

# Link libraries
target_link_libraries(Rebraze libcef_lib libcef_dll_wrapper ${CEF_STANDARD_LIBS})

# Copy CEF binary files to target output directory
COPY_FILES("Rebraze" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
COPY_FILES("Rebraze" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")

# Copy frontend dist files to resources
# Create a custom target that always runs to copy frontend files
add_custom_target(copy_frontend ALL
  COMMAND ${CMAKE_COMMAND} -E copy_directory
    "${CMAKE_SOURCE_DIR}/frontend/dist"
    "$<TARGET_FILE_DIR:Rebraze>/resources/frontend"
  COMMENT "Copying frontend files to resources"
  VERBATIM
)

# Make sure Rebraze is built before copying frontend
add_dependencies(copy_frontend Rebraze)

# Set startup project for Visual Studio
if(OS_WINDOWS)
  set_property(DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR} PROPERTY VS_STARTUP_PROJECT Rebraze)
endif()

# Install target
if(OS_LINUX)
  install(TARGETS Rebraze RUNTIME DESTINATION bin)
  install(DIRECTORY "${CEF_BINARY_DIR}/" DESTINATION lib)
  install(DIRECTORY "${CEF_RESOURCE_DIR}/" DESTINATION share/rebraze)
endif()
