import XCTest

final class TandemAppUITests: XCTestCase {
    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    func testAppLaunchesToPlaceholderWindow() throws {
        let app = XCUIApplication()
        app.launch()

        XCTAssertTrue(app.staticTexts["Tandem"].waitForExistence(timeout: 5))
    }
}
