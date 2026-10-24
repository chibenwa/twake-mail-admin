package com.linagora.admin.e2e.mail.shell;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.linagora.admin.e2e.MailAdminE2ETest;
import com.linagora.admin.e2e.backend.MailFixtures;
import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;

/**
 * NAV-07: a refusal of WebAdmin shows its message, labelled as the server's (it is not
 * translated) and selectable so that it can be copied. A refused creation form keeps it in its
 * modal, with the typed values; other actions report it in a toast.
 */
class ErrorToastsTest extends MailAdminE2ETest {

    /** The WebAdmin message and details, labelled "Server message:", as plain readable and selectable text. */
    private static void assertReadableServerMessage(Locator scope, String message, String details) {
        assertThat(scope).isVisible();
        assertThat(scope.getByText("Server message:", new Locator.GetByTextOptions().setExact(true))).isVisible();
        Locator shown = scope.getByText(message, new Locator.GetByTextOptions().setExact(true));
        assertThat(shown).isVisible();
        assertThat(String.valueOf(shown.evaluate("e => getComputedStyle(e).userSelect"))).as("selectable").isIn("text", "auto");
        assertThat(scope).containsText(details);
        String text = scope.innerText();
        assertThat(text).doesNotContain("{", "\"statusCode\"", "stack", "config", "headers", "AxiosError", "[object Object]", ",,");
    }

    /** A refused creation: the dialog stays open, the server message inside it, the typed value kept. */
    private static void assertRefusedInDialog(AdminApp app, Locator field, String typed, String message, String details) {
        assertReadableServerMessage(app.dialogError(), message, details);
        assertThat(app.dialog()).isVisible();
        assertThat(field).hasValue(typed);
        app.cancel();
    }

    @Test
    @DisplayName("NAV-07 Error toasts show the WebAdmin message")
    void errorToastsShowWebAdminMessage(AdminApp app, MailFixtures fixtures, WebAdmin webAdmin) {
        String user = fixtures.newUser("toast");

        // 1. Domains: an invalid domain name, refused in the "Create a domain" modal
        app.open("/domains");
        app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Create a domain").setExact(true)).click();
        Locator domainName = app.dialog().getByLabel("Domain name", new Locator.GetByLabelOptions().setExact(true));
        domainName.fill("not a domain!");
        app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Create").setExact(true)).click();
        assertRefusedInDialog(app, domainName, "not a domain!", "Invalid request for domain creation not a domain!",
            "Domain parts ASCII chars must be a-z A-Z 0-9 - or _ in not a domain!");

        // 2. User aliases: not an address
        app.open("/users/user/" + WebAdmin.encode(user));
        app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Add alias").setExact(true)).click();
        Locator alias = app.dialog().getByLabel("Alias address", new Locator.GetByLabelOptions().setExact(true));
        alias.fill("not-an-address");
        app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Add").setExact(true)).click();
        assertRefusedInDialog(app, alias, "not-an-address", "The alias is not an email address", "Out of data at position 1 in 'not-an-address'");

        // 3. Mappings: an invalid source address
        app.navigate("Mappings");
        app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Add a mapping").setExact(true)).click();
        Locator source = app.dialog().getByLabel("Source", new Locator.GetByLabelOptions().setExact(true));
        source.fill("bad source");
        app.dialog().getByLabel("Destination", new Locator.GetByLabelOptions().setExact(true)).fill(user);
        app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Create").setExact(true)).click();
        assertRefusedInDialog(app, source, "bad source", "The address is not an email address",
            "Invalid character in local-part (user account) at position 4 in 'bad source'");

        // 4. A toast: a malformed event ID in the dead letter search
        app.navigate("Event Dead Letter");
        app.main().getByPlaceholder("Enter event ID").fill("abc");
        app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Search").setExact(true)).click();
        Locator toast = app.toast("Error searching for event");
        assertReadableServerMessage(toast, "Can not deserialize the supplied eventId: abc", "Invalid UUID string: abc");

        assertThat(webAdmin.get("/address/aliases/" + user).json()).isEmpty();
        assertThat(webAdmin.get("/domains/" + WebAdmin.encode("not a domain!")).status()).isNotEqualTo(204);
    }
}
