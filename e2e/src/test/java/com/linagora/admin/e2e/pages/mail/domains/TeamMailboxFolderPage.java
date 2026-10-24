package com.linagora.admin.e2e.pages.mail.domains;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;

/** A folder of a team mailbox: the sub-addressing switch and the Extra ACL section. */
public class TeamMailboxFolderPage extends DetailPage {

    private TeamMailboxFolderPage(AdminApp app) {
        super(app);
    }

    public static TeamMailboxFolderPage open(AdminApp app, String domain, String mailbox, String folder) {
        app.open(TeamMailboxPage.path(domain, mailbox) + "/folder/" + WebAdmin.encode(folder));
        return expect(app, folder);
    }

    /** The page of {@code folder}, headed with its name, a "Team mailbox folder" subtitle. */
    public static TeamMailboxFolderPage expect(AdminApp app, String folder) {
        TeamMailboxFolderPage page = new TeamMailboxFolderPage(app);
        assertThat(page.title()).hasText(folder);
        assertThat(page.text("Team mailbox folder")).isVisible();
        return page;
    }

    public Locator subaddressingSwitch() {
        return main().getByRole(AriaRole.SWITCH, new Locator.GetByRoleOptions().setName("Sub-addressing").setExact(true));
    }

    /** The user field of the open "Add ACL entry" modal. */
    public Locator usernameInput() {
        return dialogField("User");
    }

    /** A right chip of the "Add ACL entry" modal, a checkbox named {@code "<letter> <label>"}. */
    public Locator right(String letter, String label) {
        return dialog().getByRole(AriaRole.CHECKBOX, new Locator.GetByRoleOptions()
            .setName(Pattern.compile("^" + Regex.quote(letter) + "\\s*" + Regex.quote(label) + "$")));
    }

    /** "Add" of the open "Add ACL entry" modal. */
    public Locator applyButton() {
        return dialogButton("Add");
    }
}
