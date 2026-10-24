package com.linagora.admin.e2e.pages.mail.domains;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;

/** A team mailbox: Members (open by default), Folders, Quota, Extra Senders, Deleted Message Vault. */
public class TeamMailboxPage extends DetailPage {
    private final String domain;
    private final String name;

    private TeamMailboxPage(AdminApp app, String domain, String name) {
        super(app);
        this.domain = domain;
        this.name = name;
    }

    public static String path(String domain, String name) {
        return "/domains/domain/" + WebAdmin.encode(domain) + "/team-mailbox/" + WebAdmin.encode(name);
    }

    public static TeamMailboxPage open(AdminApp app, String domain, String name) {
        app.open(path(domain, name));
        return expect(app, domain, name);
    }

    /** The page reached by a link, once it shows. */
    public static TeamMailboxPage expect(AdminApp app, String domain, String name) {
        TeamMailboxPage page = new TeamMailboxPage(app, domain, name);
        assertThat(page.title()).hasText(name + "@" + domain);
        return page;
    }

    public String address() {
        return name + "@" + domain;
    }

    /** The "+" of the Members section: opens the "Add member" modal. */
    public Locator addMemberButton() {
        return button("Add member");
    }

    /** The "+" of the Extra Senders section: opens the "Add extra sender" modal. */
    public Locator addExtraSenderButton() {
        return button("Add extra sender");
    }

    /** The user field of the open "Add member" / "Add extra sender" modal. */
    public Locator usernameInput() {
        return dialogField("User");
    }

    /** The role of the open "Add member" modal. */
    public Locator roleSelect() {
        return dialogField("Role");
    }

    /** "Add" of the open modal. */
    public Locator addButton() {
        return dialogButton("Add");
    }
}
