from playwright.sync_api import sync_playwright
import time
import sys

def test_frontend_backend_integration():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Navigate to the frontend
        print("Navigating to frontend...")
        page.goto("http://localhost:3000")
        page.wait_for_load_state("networkidle")
        
        # Take a screenshot of the homepage
        page.screenshot(path="homepage.png")
        print("Homepage screenshot saved")
        
        # Check if the navbar is visible
        navbar = page.query_selector(".navbar")
        if navbar:
            print("✅ Navbar found - page loaded successfully")
        else:
            print("❌ Navbar not found - page might not have loaded correctly")
            # Try to get the page content to see what's there
            content = page.content()
            print(f"Page content preview: {content[:200]}...")
            browser.close()
            return
        
        # Try to navigate to the Schools page
        schools_link = page.query_selector('a.nav-link:text("Schools")')
        if schools_link:
            print("Clicking on Schools link...")
            schools_link.click()
            page.wait_for_load_state("networkidle")
            
            # Take a screenshot of the schools page
            page.screenshot(path="schools_page.png")
            print("Schools page screenshot saved")
            
            # Check if states dropdown is populated
            states_dropdown = page.query_selector('select.form-select')
            if states_dropdown:
                # Count the number of options in the states dropdown
                states_count = page.evaluate("""() => {
                    return document.querySelectorAll('select.form-select option').length - 1; // Subtract 1 for the "All States" option
                }""")
                print(f"✅ States dropdown found with {states_count} states")
                
                if states_count == 58:
                    print("✅ All 58 Algerian states are loaded correctly")
                else:
                    print(f"❌ Expected 58 states, got {states_count}")
            else:
                print("❌ States dropdown not found or empty")
            
            # Check if schools are displayed
            schools = page.query_selector_all('.school-card')
            print(f"Found {len(schools)} school cards on the page")
            
            if len(schools) > 0:
                print("✅ Driving schools are loaded correctly")
            else:
                print("❌ No driving schools found on the page")
                
                # Check for any error messages
                error_text = page.evaluate("""() => {
                    const errorElements = Array.from(document.querySelectorAll('.error, [class*="error"], [id*="error"], .alert-danger'));
                    return errorElements.map(el => el.textContent).join(", ");
                }""")
                
                if error_text:
                    print(f"Found error message: {error_text}")
                
                # Check if there's a loading indicator
                loading = page.query_selector('.loading-section, .spinner-border')
                if loading:
                    print("Loading indicator is still visible")
            
            # Try to check network requests
            print("Checking network requests for API calls...")
            page.evaluate("""() => {
                // Create a global variable to store API errors
                window.apiErrors = [];
                
                // Override fetch to monitor API calls
                const originalFetch = window.fetch;
                window.fetch = async function(url, options) {
                    try {
                        const response = await originalFetch(url, options);
                        if (!response.ok && url.includes('/api/')) {
                            window.apiErrors.push({
                                url,
                                status: response.status,
                                statusText: response.statusText
                            });
                        }
                        return response;
                    } catch (error) {
                        window.apiErrors.push({
                            url,
                            error: error.message
                        });
                        throw error;
                    }
                };
                
                // Also monitor XHR requests
                const originalOpen = XMLHttpRequest.prototype.open;
                XMLHttpRequest.prototype.open = function(method, url) {
                    this.addEventListener('load', function() {
                        if (this.status >= 400 && url.includes('/api/')) {
                            window.apiErrors.push({
                                url,
                                status: this.status,
                                statusText: this.statusText
                            });
                        }
                    });
                    this.addEventListener('error', function() {
                        if (url.includes('/api/')) {
                            window.apiErrors.push({
                                url,
                                error: 'Network error'
                            });
                        }
                    });
                    return originalOpen.apply(this, arguments);
                };
            }""")
            
            # Refresh the page to trigger the API calls with our monitoring
            page.reload()
            page.wait_for_load_state("networkidle")
            
            # Check for API errors
            api_errors = page.evaluate("() => window.apiErrors || []")
            if api_errors:
                print(f"❌ API errors detected: {api_errors}")
            else:
                print("✅ No API errors detected")
        else:
            print("❌ Schools link not found")
        
        browser.close()

if __name__ == "__main__":
    test_frontend_backend_integration()
    sys.exit(0)