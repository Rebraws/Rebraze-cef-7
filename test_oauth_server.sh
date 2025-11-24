#!/bin/bash

# Test script to verify OAuth server is working
echo "OAuth Server Test Script"
echo "======================="
echo ""

# Wait for user to start the app
echo "1. Start the Rebraze app: open build/Rebraze.app"
echo "2. Wait for the OAuth server to start (look for '[OAuth] ✓ OAuth callback server started successfully!' in the console)"
echo "3. Press Enter when ready to test the server..."
read -r

echo ""
echo "Testing OAuth server at http://localhost:8765/callback?token=test_token_12345"
echo ""

# Test the OAuth server with a sample token
curl -v "http://localhost:8765/callback?token=test_token_12345" 2>&1

echo ""
echo ""
echo "If you see:"
echo "  - 'Connection received from client!' in the app console"
echo "  - 'Login Successful!' HTML page in the curl output"
echo "Then the OAuth server is working correctly!"
echo ""
echo "If the connection is refused, check:"
echo "  - Is the app running?"
echo "  - Did the OAuth server start successfully?"
echo "  - Is port 8765 blocked by a firewall?"
