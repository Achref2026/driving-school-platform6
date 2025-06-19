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
            states_dropdown = page.query_selector('select.form-select option')
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
            
            # Try filtering by state
            if states_dropdown:
                print("Testing state filtering...")
                # Select Alger from the dropdown
                page.select_option('select.form-select', 'Alger')
                page.wait_for_load_state("networkidle")
                
                # Take a screenshot after filtering
                page.screenshot(path="filtered_schools.png")
                print("Filtered schools screenshot saved")
                
                # Check if filtered schools are displayed
                filtered_schools = page.query_selector_all('.school-card')
                print(f"Found {len(filtered_schools)} school cards after filtering by Alger")
                
                if len(filtered_schools) > 0:
                    print("✅ Filtering by state works correctly")
                else:
                    print("❌ No schools found after filtering by state")
        else:
            print("❌ Schools link not found")
        
        browser.close()

if __name__ == "__main__":
    test_frontend_backend_integration()
    sys.exit(0)