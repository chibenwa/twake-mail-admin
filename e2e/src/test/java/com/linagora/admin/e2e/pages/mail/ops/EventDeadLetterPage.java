package com.linagora.admin.e2e.pages.mail.ops;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;

/**
 * Event Dead Letter: the listener groups with failed events first (readable name, full class
 * name with a copy button, count, actions), then the search by event ID; and the page of a group.
 */
public class EventDeadLetterPage {
    public static final String REDELIVER = "Redeliver group events";
    public static final String CLEAR = "Clear group";
    public static final String DELETE_EVENT = "Delete event";
    public static final String REDELIVER_ALL = "Redeliver all events";

    private final AdminApp app;

    public EventDeadLetterPage(AdminApp app) {
        this.app = app;
    }

    public static EventDeadLetterPage open(AdminApp app) {
        app.open("/event-dead-letter");
        EventDeadLetterPage page = new EventDeadLetterPage(app);
        assertThat(page.eventIdField()).isVisible();
        return page;
    }

    public AdminApp app() {
        return app;
    }

    /**
     * The readable name of a listener group, the last segment of its class name:
     * {@code "...OpenSearchQuotaMailboxListener$OpenSearchQuotaMailboxListenerGroup"} reads
     * {@code "OpenSearchQuotaMailboxListenerGroup"}.
     */
    public static String displayName(String group) {
        String[] segments = group.split("[.$]");
        return segments[segments.length - 1];
    }

    // ---- search by event ID ----

    /** The search by event ID, below the groups. */
    public Locator searchSection() {
        return app.main().locator("section").filter(new Locator.FilterOptions().setHas(
            app.page().getByRole(AriaRole.HEADING, new com.microsoft.playwright.Page.GetByRoleOptions().setName("Search by event ID"))));
    }

    public Locator eventIdField() {
        return app.main().getByPlaceholder("Enter event ID");
    }

    /** The group &lt;select&gt; narrowing the search: "All groups", then the listed groups by readable name. */
    public Locator groupField() {
        return app.main().getByLabel("Group (optional)", new Locator.GetByLabelOptions().setExact(true));
    }

    public Locator searchButton() {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Search").setExact(true));
    }

    // ---- groups ----

    public Locator groupsTitle() {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setName("Groups with failed events").setExact(true));
    }

    /** The link of a group, named by its readable name. */
    public Locator groupLink(String group) {
        return app.main().getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName(displayName(group)).setExact(true));
    }

    /** The heading of a group: {@code "ReadableName(count)"} (no space in its accessible name), "(Loading...)" while it is counted. */
    public Locator groupHeading(String group) {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions()
            .setName(Pattern.compile("^" + Regex.quote(displayName(group)) + " ?\\((\\d+|Loading\\.\\.\\.)\\)$")));
    }

    public Locator groupHeading(String group, int count) {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions()
            .setName(Pattern.compile("^" + Regex.quote(displayName(group)) + " ?\\(" + count + "\\)$")));
    }

    /** The card of a group: its name, class name and actions. */
    public Locator groupRow(String group) {
        return groupLink(group).locator("xpath=ancestor::div[.//button[@aria-label='" + CLEAR + "' or @aria-label='" + REDELIVER + "']][1]");
    }

    /** The full class name of a group, under its readable name. */
    public Locator groupClassName(String group) {
        return app.main().getByText(group, new Locator.GetByTextOptions().setExact(true));
    }

    public Locator copyGroupName() {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Copy group name").setExact(true));
    }

    public Locator groupAction(String group, String action) {
        return groupRow(group).getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(action).setExact(true));
    }

    public Locator param(String key) {
        return Dialogs.param(app, key);
    }

    public Locator commandPreview() {
        return Dialogs.commandPreview(app);
    }

    // ---- group page ----

    /** The h1 of a group page: the readable name of the group. */
    public Locator groupTitle(String group) {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setName(displayName(group)).setExact(true).setLevel(1));
    }

    /** The breadcrumb link of a group page, back to the list. */
    public Locator breadcrumb() {
        return app.main().getByRole(AriaRole.NAVIGATION, new Locator.GetByRoleOptions().setName("Breadcrumb"))
            .getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("Event Dead Letter").setExact(true));
    }

    /** A button of the toolbar of the group page: "Redeliver all events", "Clear group". */
    public Locator toolbarButton(String name) {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    /** "Page 1 — 20 events per page / Total: 45", or "Total: 3" alone when every event fits on one page. */
    public Locator paginationLabel() {
        return app.main().getByText(Pattern.compile("^(Page \\d+ — \\d+ events per page / Total: \\d+|Total: \\d+)$"));
    }

    /** The line of an event of the group page, by insertion id. */
    public Locator event(String insertionId) {
        return app.main().getByRole(AriaRole.LISTITEM).filter(new Locator.FilterOptions().setHasText(insertionId));
    }

    public Locator deleteEvent(String insertionId) {
        return event(insertionId).getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(DELETE_EVENT).setExact(true));
    }

    public Locator viewJson(String insertionId) {
        return event(insertionId).getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("View JSON").setExact(true));
    }
}
