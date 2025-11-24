cmake_minimum_required(VERSION 3.19)

project(Rebraze)

# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Determine the platform
if("${CMAKE_SYSTEM_NAME}" STREQUAL "Darwin")
  set(CEF_PLATFORM "macosx64")
  set(OS_MACOSX 1)
  set(CEF_USE_SANDBOX OFF CACHE BOOL "Enable CEF sandbox" FORCE)
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
# On macOS, CEF is linked as a framework, not as a logical target
if(NOT OS_MACOSX)
  ADD_LOGICAL_TARGET("libcef_lib" "${CEF_LIB_DEBUG}" "${CEF_LIB_RELEASE}")
endif()

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
    cef_app/src/app.cpp
    cef_app/src/client_handler.cpp
    cef_app/src/message_handler.cpp
    cef_app/src/oauth_server.cpp
    cef_app/src/main_mac.mm
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
  # Output path for the main app bundle
  set(CEF_APP "${CEF_TARGET_OUT_DIR}/Rebraze.app")

  # Variables referenced from the main Info.plist file
  set(EXECUTABLE_NAME "Rebraze")
  set(PRODUCT_NAME "Rebraze")

  # macOS app bundle
  add_executable(Rebraze MACOSX_BUNDLE ${REBRAZE_SRCS} ${REBRAZE_HEADERS})
  SET_EXECUTABLE_TARGET_PROPERTIES(Rebraze)
  add_dependencies(Rebraze libcef_dll_wrapper)
  target_link_libraries(Rebraze libcef_dll_wrapper ${CEF_STANDARD_LIBS})
  set_target_properties(Rebraze PROPERTIES
    MACOSX_BUNDLE_INFO_PLIST ${CMAKE_CURRENT_SOURCE_DIR}/cef_app/resources/mac/Info.plist
  )

  # Copy the CEF framework into the Frameworks directory
  # The framework already contains the Resources directory, so no need to copy separately
  add_custom_command(
    TARGET Rebraze
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
            "${CEF_BINARY_DIR}/Chromium Embedded Framework.framework"
            "${CEF_APP}/Contents/Frameworks/Chromium Embedded Framework.framework"
    VERBATIM
  )

  # Create the multiple Helper app bundle targets
  set(CEF_HELPER_TARGET "Rebraze_Helper")
  set(CEF_HELPER_OUTPUT_NAME "Rebraze Helper")

  if(NOT CEF_HELPER_APP_SUFFIXES)
    set(CEF_HELPER_APP_SUFFIXES ":::")
  endif()

  foreach(_suffix_list ${CEF_HELPER_APP_SUFFIXES})
    # Convert to a list and extract the suffix values
    string(REPLACE ":" ";" _suffix_list ${_suffix_list})
    list(GET _suffix_list 0 _name_suffix)
    list(GET _suffix_list 1 _target_suffix)
    list(GET _suffix_list 2 _plist_suffix)

    # Define Helper target and output names
    set(_helper_target "${CEF_HELPER_TARGET}${_target_suffix}")
    set(_helper_output_name "${CEF_HELPER_OUTPUT_NAME}${_name_suffix}")

    # Create Helper-specific variants of the helper-Info.plist file
    set(_helper_info_plist "${CMAKE_CURRENT_BINARY_DIR}/helper-Info${_target_suffix}.plist")
    file(READ "${CMAKE_CURRENT_SOURCE_DIR}/cef_app/resources/mac/helper-Info.plist" _plist_contents)
    string(REPLACE "\${EXECUTABLE_NAME}" "${_helper_output_name}" _plist_contents ${_plist_contents})
    string(REPLACE "\${PRODUCT_NAME}" "${_helper_output_name}" _plist_contents ${_plist_contents})
    string(REPLACE "\${BUNDLE_ID_SUFFIX}" "${_plist_suffix}" _plist_contents ${_plist_contents})
    file(WRITE ${_helper_info_plist} ${_plist_contents})

    # Create Helper executable target
    add_executable(${_helper_target} MACOSX_BUNDLE ${REBRAZE_HELPER_SRCS})
    SET_EXECUTABLE_TARGET_PROPERTIES(${_helper_target})
    add_dependencies(${_helper_target} libcef_dll_wrapper)
    target_link_libraries(${_helper_target} libcef_dll_wrapper ${CEF_STANDARD_LIBS})
    set_target_properties(${_helper_target} PROPERTIES
      MACOSX_BUNDLE_INFO_PLIST ${_helper_info_plist}
      OUTPUT_NAME ${_helper_output_name}
    )

    # Add the Helper as a dependency of the main executable target
    add_dependencies(Rebraze "${_helper_target}")

    # Copy the Helper app bundle into the Frameworks directory
    add_custom_command(
      TARGET Rebraze
      POST_BUILD
      COMMAND ${CMAKE_COMMAND} -E copy_directory
              "${CEF_TARGET_OUT_DIR}/${_helper_output_name}.app"
              "${CEF_APP}/Contents/Frameworks/${_helper_output_name}.app"
      VERBATIM
    )
  endforeach()
elseif(OS_WINDOWS)
  # Windows executable
  add_executable(Rebraze WIN32 ${REBRAZE_SRCS} ${REBRAZE_HEADERS})
  SET_EXECUTABLE_TARGET_PROPERTIES(Rebraze)
  add_dependencies(Rebraze libcef_dll_wrapper)
  target_link_libraries(Rebraze libcef_lib libcef_dll_wrapper ${CEF_STANDARD_LIBS})
else()
  # Linux executable
  add_executable(Rebraze ${REBRAZE_SRCS} ${REBRAZE_HEADERS})
  SET_EXECUTABLE_TARGET_PROPERTIES(Rebraze)
  add_dependencies(Rebraze libcef_dll_wrapper)
  target_link_libraries(Rebraze libcef_lib libcef_dll_wrapper ${CEF_STANDARD_LIBS})
endif()

# Copy CEF binary files to target output directory (not needed for macOS, handled in custom commands)
if(NOT OS_MACOSX)
  COPY_FILES("Rebraze" "${CEF_BINARY_FILES}" "${CEF_BINARY_DIR}" "${CEF_TARGET_OUT_DIR}")
  COPY_FILES("Rebraze" "${CEF_RESOURCE_FILES}" "${CEF_RESOURCE_DIR}" "${CEF_TARGET_OUT_DIR}")
endif()

# Copy frontend dist files to resources
if(OS_MACOSX)
  # For macOS, copy to app bundle Resources directory
  add_custom_command(
    TARGET Rebraze
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E copy_directory
      "${CMAKE_SOURCE_DIR}/frontend/dist"
      "${CEF_APP}/Contents/Resources/frontend"
    COMMENT "Copying frontend files to app bundle"
    VERBATIM
  )
else()
  # For Windows/Linux, copy to executable directory
  add_custom_target(copy_frontend ALL
    COMMAND ${CMAKE_COMMAND} -E copy_directory
      "${CMAKE_SOURCE_DIR}/frontend/dist"
      "$<TARGET_FILE_DIR:Rebraze>/resources/frontend"
    COMMENT "Copying frontend files to resources"
    VERBATIM
  )
  add_dependencies(copy_frontend Rebraze)
endif()

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
