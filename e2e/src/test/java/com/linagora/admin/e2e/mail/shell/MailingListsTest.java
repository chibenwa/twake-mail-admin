package com.linagora.admin.e2e.mail.shell;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.linagora.admin.e2e.MailAdminE2ETest;
import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;

class MailingListsTest extends MailAdminE2ETest {

    @Test
    @DisplayName("ML-01 Mailing lists page without LDAP")
    void mailingListsWithoutLdap(AdminApp app) {
        app.open("/");
        app.navigate("Mailing Lists");

        assertThat(app.heading()).hasText("Mailing Lists");
        assertThat(app.main().getByText(Pattern.compile("^Browse LDAP-backed mailing lists and manage their members and owners\\."))).isVisible();
        // No LDAP here: WebAdmin answers 404, the page explains the feature is not available
        // rather than showing the raw error, and drops the forms that cannot work
        Locator unavailable = app.main().getByRole(AriaRole.STATUS)
            .filter(new Locator.FilterOptions().setHasText("Mailing lists are not available on this server"));
        assertThat(unavailable).isVisible();
        assertThat(unavailable).containsText("This server does not expose the mailing list routes. "
            + "They require the LDAP mailing list extension of tmail-backend.");
        assertThat(unavailable.getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("doc").setExact(true))).isVisible();
        assertThat(app.main()).not().containsText("statusCode");
        assertThat(app.main()).not().containsText("can not be found");
        assertThat(app.main().getByText(Pattern.compile("^Error:"))).hasCount(0);
        assertThat(app.main().getByPlaceholder("Search mailing lists...")).hasCount(0);
        assertThat(app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Create a mailing list").setExact(true)))
            .hasCount(0);
    }
}
