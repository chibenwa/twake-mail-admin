package com.linagora.admin.e2e.pages.calendar.resources;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** The detail page of a domain in the Calendar flavour: {@code /domains/domain/<domain>}. */
public class CalendarDomainPage {
    private final AdminApp app;
    private final String domain;

    private CalendarDomainPage(AdminApp app, String domain) {
        this.app = app;
        this.domain = domain;
    }

    public static CalendarDomainPage open(AdminApp app, String domain) {
        app.open("/domains/domain/" + WebAdmin.encode(domain));
        CalendarDomainPage page = new CalendarDomainPage(app, domain);
        assertThat(page.heading()).isVisible();
        return page;
    }

    public AdminApp app() {
        return app;
    }

    /** The page is headed by the domain it is about (h1), under a breadcrumb back to the Domains list. */
    public Locator heading() {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions()
            .setLevel(1).setName(domain).setExact(true));
    }

    /** Opens a section if it is collapsed: the open state of the sections is remembered. */
    static void open(Locator toggle) {
        if (!"true".equals(toggle.getAttribute("aria-expanded"))) {
            toggle.click();
        }
        assertThat(toggle).hasAttribute("aria-expanded", "true");
    }

    /** Confirms the destructive confirmation dialog open, by its verb ("Delete", "Remove"), and waits for it to close. */
    public static void confirmWith(AdminApp app, String verb) {
        app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(verb).setExact(true)).click();
        assertThat(app.dialog()).isHidden();
    }

    /** The toggle of a collapsible section, its title (no regex metacharacter) followed by an optional "(count)". Playwright turns the Java pattern into a JS one: no Pattern.quote. */
    static Locator sectionToggle(Page page, String title) {
        return page.locator("main").getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions()
            .setName(Pattern.compile("^" + title + "\\s*(\\(\\d+\\))?$")));
    }

    /** The section holding the toggle: the toggle sits in the header row of the section. */
    static Locator sectionOf(Locator toggle) {
        return toggle.locator("xpath=ancestor::div[2]");
    }

    /** Expands "Calendar Resources". */
    public ResourcesSection resources() {
        ResourcesSection section = new ResourcesSection(app);
        section.expand();
        return section;
    }

    /** Expands "Team Calendars". */
    public TeamCalendarsSection teamCalendars() {
        TeamCalendarsSection section = new TeamCalendarsSection(app);
        section.expand();
        return section;
    }
}
