package com.linagora.admin.e2e.pages.calendar.users;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** The detail page of a user of the calendar console ({@code /users/user/<username>}). */
public class UserDetailPage {
    private final AdminApp app;

    public UserDetailPage(AdminApp app) {
        this.app = app;
    }

    public static String path(String username) {
        return "/users/user/" + WebAdmin.encode(username);
    }

    public UserDetailPage open(String username) {
        app.open(path(username));
        assertThat(heading()).hasText(username);
        return this;
    }

    public AdminApp app() {
        return app;
    }

    public Page page() {
        return app.page();
    }

    /** The page is headed by the address of the user (h1). */
    public Locator heading() {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setLevel(1));
    }

    /** Under the heading: "Firstname Lastname · Registered calendar user", or "Not registered". */
    public Locator subtitle() {
        return heading().locator("xpath=following-sibling::p[1]");
    }

    /** The breadcrumb link back to the Users list. */
    public Locator breadcrumb() {
        return app.main().getByRole(AriaRole.NAVIGATION, new Locator.GetByRoleOptions().setName("Breadcrumb"))
            .getByRole(AriaRole.LINK);
    }

    /** A chip of the summary strip ("Calendars: 1"), opening and scrolling to its section. */
    public Locator summaryChip(String text) {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(text).setExact(true));
    }

    public Locator expandAll() {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Expand all").setExact(true));
    }

    public Locator collapseAll() {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Collapse all").setExact(true));
    }

    /** The collapsible title of a section, "Calendars (1)": its name starts with {@code title}. */
    public Locator sectionToggle(String title) {
        // Page level, not under main: it also serves as a "has" filter, relative to its block
        return app.page().getByRole(AriaRole.BUTTON,
            new Page.GetByRoleOptions().setName(Pattern.compile("^" + JsRegex.quote(title) + "( ?\\(\\d+\\))?$")));
    }

    public CollectionSection calendars() {
        return new CollectionSection(app, sectionToggle("Calendars"), "Create calendar", 1);
    }

    public CollectionSection addressBooks() {
        // The "+" sits next to the title, in a row of its own
        return new CollectionSection(app, sectionToggle("Address Books"), "Create address book", 2);
    }

    // Unregistered user

    public Locator notRegisteredPanel() {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setName("This user is not registered"));
    }

    public Locator registerButton() {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Register this user"));
    }
}
