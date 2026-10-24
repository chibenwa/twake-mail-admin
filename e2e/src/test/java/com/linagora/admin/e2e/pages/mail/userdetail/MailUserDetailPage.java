package com.linagora.admin.e2e.pages.mail.userdetail;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/**
 * The detail page of a user of the mail console ({@code /users/user/<username>}): headed by the
 * username (h1) and the kind of object ("User", or "Address without account"), then a stack of
 * collapsible sections, each opened by clicking its title. The browser remembers which sections
 * are open, for every user page.
 */
public class MailUserDetailPage {
    private static final Pattern TASK_LINK = Pattern.compile("Task ([0-9a-f-]{36})");

    private final AdminApp app;

    public MailUserDetailPage(AdminApp app) {
        this.app = app;
    }

    public static String path(String username) {
        return "/users/user/" + WebAdmin.encode(username);
    }

    public MailUserDetailPage open(String username) {
        app.open(path(username));
        assertThat(title()).hasText(username);
        return this;
    }

    public AdminApp app() {
        return app;
    }

    public Page page() {
        return app.page();
    }

    public Locator main() {
        return app.main();
    }

    /** The h1 of the page: the username. */
    public Locator title() {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setLevel(1));
    }

    /** What the page is about, under the title: "User", or "Address without account". */
    public Locator kind(String kind) {
        return app.main().getByText(kind, new Locator.GetByTextOptions().setExact(true));
    }

    /** The title of a section, "Aliases (2)": its accessible name starts with {@code title}. */
    public Locator sectionToggle(String title) {
        return app.main().getByRole(AriaRole.BUTTON,
            new Locator.GetByRoleOptions().setName(Pattern.compile("^" + Regex.escape(title) + "( ?\\(\\d+\\))?$")));
    }

    /** The section title once its count is loaded, e.g. "Aliases (2)". */
    public Locator sectionToggle(String title, int count) {
        return app.main().getByRole(AriaRole.BUTTON,
            new Locator.GetByRoleOptions().setName(Pattern.compile("^" + Regex.escape(title) + " ?\\(" + count + "\\)$")));
    }

    /** Opens a section, unless it is already open (the browser remembers it from another user page). */
    public MailUserDetailPage toggle(String title) {
        Locator toggle = sectionToggle(title);
        assertThat(toggle).isVisible();
        if ("false".equals(toggle.getAttribute("aria-expanded"))) {
            toggle.click();
        }
        assertThat(toggle).hasAttribute("aria-expanded", "true");
        return this;
    }

    /** Closes a section, unless it is already closed. */
    public MailUserDetailPage collapse(String title) {
        Locator toggle = sectionToggle(title);
        assertThat(toggle).isVisible();
        if ("true".equals(toggle.getAttribute("aria-expanded"))) {
            toggle.click();
        }
        assertThat(toggle).hasAttribute("aria-expanded", "false");
        return this;
    }

    /** The open modal, e.g. the one opened by the "+" of a section. */
    public Locator dialog() {
        return app.dialog();
    }

    /** Confirms the open confirmation with its button, named after the action ("Remove", "Delete"...), and waits for it to close. */
    public void confirm(String label) {
        app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(label).setExact(true)).click();
        assertThat(app.dialog()).isHidden();
    }

    /** An icon button of the page, named by its tooltip ("Add alias", "Search messages"...). */
    public Locator iconButton(String name) {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    public Locator button(String name) {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    public Locator searchMessagesLink() {
        return app.main().getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("Search messages").setExact(true));
    }

    public UserTasksSection tasks() {
        return new UserTasksSection(this);
    }

    public DeletedVaultSection deletedVault() {
        return new DeletedVaultSection(this);
    }

    /** Reads the id of the task out of the "Task created" toast, which vanishes after a few seconds. */
    public String taskIdFromToast(String title) {
        Locator link = app.toast(title).getByRole(AriaRole.LINK);
        assertThat(link).isVisible();
        String text = link.textContent().trim();
        Matcher matcher = TASK_LINK.matcher(text);
        if (!matcher.find()) {
            throw new IllegalStateException("No task id in " + text);
        }
        return matcher.group(1);
    }

    /** A button of the open dialog: "Start task", "Cancel"... */
    public Locator dialogButton(String name) {
        return app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    /** Clicks "Start task" in the open task dialog, without expecting it to close (validation, refusal). */
    public void clickStartTask() {
        dialogButton("Start task").click();
    }

    /** Clicks "Start task" in the open task dialog and waits for it to close. */
    public void startTask() {
        clickStartTask();
        assertThat(app.dialog()).isHidden();
    }

    /** Opens a closed "Advanced options" part of the open dialog, by its summary text. */
    public void openAdvanced(String summary) {
        app.dialog().getByText(summary, new Locator.GetByTextOptions().setExact(true)).click();
    }

    /** The "Command: curl ..." preview of the open task dialog. */
    public Locator commandPreview() {
        return app.dialog().getByText(Pattern.compile("^Command: "));
    }
}
