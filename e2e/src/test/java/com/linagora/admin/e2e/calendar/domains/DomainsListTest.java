package com.linagora.admin.e2e.calendar.domains;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.linagora.admin.e2e.CalendarAdminE2ETest;
import com.linagora.admin.e2e.backend.CalendarFixtures;
import com.linagora.admin.e2e.backend.Ids;
import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.linagora.admin.e2e.pages.calendar.domains.DomainsPage;
import com.microsoft.playwright.FileChooser;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.FilePayload;

class DomainsListTest extends CalendarAdminE2ETest {

    @Test
    @DisplayName("DOM-01 Domain list and search")
    void domainListAndSearch(AdminApp app, Page page, CalendarFixtures fixtures) {
        // Other tests create domains (WebAdmin cannot delete them): the list is searched for ours
        String mine = fixtures.newDomain("list");
        DomainsPage domains = new DomainsPage(app);
        app.open("/health-check");
        app.navigate("Domains");

        // Other tests keep adding domains: open-paas.org may be beyond the first page, it is searched
        assertThat(domains.pagination()).isVisible();
        assertThat(domains.domainLinks().first()).isVisible();

        domains.search("paas");
        assertThat(domains.domainLink(CalendarFixtures.DOMAIN)).isVisible();
        assertThat(domains.row(CalendarFixtures.DOMAIN)).hasText(Pattern.compile("^\\d+\\.open-paas\\.org$"));
        assertThat(domains.deleteButton(CalendarFixtures.DOMAIN)).isVisible();
        assertThat(domains.domainLink(mine)).hasCount(0);

        domains.search(mine.substring(0, mine.indexOf('.')));
        assertThat(domains.domainLinks()).hasText(new String[] {mine});
        assertThat(domains.row(mine)).hasText("1." + mine);
        // Everything fits on one page: only the total, no page buttons
        assertThat(domains.pagination()).hasText("Total: 1");
        assertThat(domains.pageButton("Next")).hasCount(0);
        assertThat(domains.pageButton("Previous")).hasCount(0);

        domains.search("zzz-" + Ids.suffix(8));
        String query = domains.searchInput().inputValue();
        assertThat(app.main().getByText("No domain matches \"" + query + "\".")).isVisible();
        assertThat(domains.domainLinks()).hasCount(0);
    }

    @Test
    @DisplayName("DOM-02 Create a domain")
    void createDomain(AdminApp app, Page page, CalendarFixtures fixtures, WebAdmin webAdmin) {
        String token = Ids.suffix(8);
        String before = "a-" + token + ".e2e.test";
        String created = "b-" + token + ".e2e.test";
        webAdmin.put("/domains/" + before).expect(204);
        DomainsPage domains = new DomainsPage(app).open();

        // "Create a domain" sits on the toolbar line, the name is typed in a modal
        domains.createDomainButton().click();
        assertThat(domains.createDialog()).isVisible();
        assertThat(domains.newDomainInput()).isFocused();
        assertThat(domains.newDomainInput()).hasAttribute("placeholder", "New domain name");
        // The calendar server delivers no mail: the hint names what it keeps for the domain
        assertThat(domains.createDialog()).containsText("Make sure this is the domain you intend to create: its users, resources, team calendars and domain address books");
        assertThat(domains.createDialog()).not().containsText("mail");
        assertThat(domains.createButton()).isDisabled();
        domains.newDomainInput().fill("   ");
        assertThat(domains.createButton()).isDisabled();
        domains.newDomainInput().press("Enter");
        assertThat(domains.createDialog()).isVisible();
        domains.newDomainInput().fill(created);
        assertThat(domains.createButton()).isEnabled();

        app.cancel();
        assertThat(domains.createDialog()).isHidden();
        assertThat(domainList(webAdmin)).doesNotContain(created);

        // Enter submits the modal
        domains.createDomainButton().click();
        domains.newDomainInput().fill(created);
        domains.newDomainInput().press("Enter");

        app.expectToast("Domain \"" + created + "\" created");
        assertThat(domains.createDialog()).isHidden();
        domains.createDomainButton().click();
        assertThat(domains.newDomainInput()).hasValue("");
        app.cancel();
        domains.search(token);
        assertThat(domains.domainLinks()).hasText(new String[] {before, created});
        assertThat(domainList(webAdmin)).contains(created);
    }

    @Test
    @DisplayName("DOM-03 Delete a domain")
    void deleteDomain(AdminApp app, CalendarFixtures fixtures, WebAdmin webAdmin) {
        String domain = fixtures.newDomain("qa-delete");
        DomainsPage domains = new DomainsPage(app).open().search(domain);

        domains.deleteButton(domain).click();
        // A domain created for the test holds no user and no alias: a plain confirmation, without typing its name.
        // The side service ignores the domain filter of GET /users: the console filters the users itself.
        Locator dialog = app.dialog();
        assertThat(dialog.getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setName("Delete domain " + domain))).isVisible();
        assertThat(dialog).containsText("Delete \"" + domain
            + "\"? It holds no user and no domain alias; it can be re-created afterwards.");
        assertThat(dialog.getByRole(AriaRole.TEXTBOX)).hasCount(0);
        dialog.getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Delete").setExact(true)).click();
        assertThat(dialog).isHidden();

        // The side service of the stack does not implement DELETE /domains/{domain} (500 "Not implemented
        // exception"): the console reports the refusal and keeps the domain
        app.expectToast("Error deleting domain");
        assertThat(app.toast("Error deleting domain")).containsText("Not implemented exception");
        assertThat(domains.domainLink(domain)).isVisible();
        assertThat(domainList(webAdmin)).contains(domain);
    }

    @Test
    @DisplayName("DOM-04 Import domains from a text file")
    void importDomains(AdminApp app, Page page, WebAdmin webAdmin) {
        String token = Ids.suffix(8);
        String first = "qa-imp1-" + token + ".e2e.test";
        String second = "qa-imp2-" + token + ".e2e.test";
        DomainsPage domains = new DomainsPage(app).open();

        // The expected format is told in the modal, before picking the file
        domains.importButton().click();
        Locator help = domains.importDialog();
        assertThat(help).containsText("one domain per line");
        assertThat(help).containsText("Comments start with # or //");
        assertThat(help).containsText("Blank lines and comment-only lines are skipped.");
        assertThat(help).containsText("Only the domains that do not exist yet are created.");

        String content = "# comment\n" + first + "\n" + second + " // trailing\n\nopen-paas.org\nnot a domain\n";
        FileChooser chooser = page.waitForFileChooser(() -> domains.chooseFileButton().click());
        assertThat(help).isHidden();
        chooser.setFiles(new FilePayload("domains.txt", "text/plain", content.getBytes(StandardCharsets.UTF_8)));

        Locator toast = app.toast("Domain import finished");
        assertThat(toast).isVisible();
        assertThat(toast).containsText("Created: 2, Already exist: 1, Errors: 1");
        toast.getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("More details")).click();
        Locator failures = page.getByRole(AriaRole.DIALOG, new Page.GetByRoleOptions().setName("Domains that could not be created (1)"));
        assertThat(failures).isVisible();
        assertThat(failures.getByRole(AriaRole.LISTITEM)).hasCount(1);
        assertThat(failures.getByRole(AriaRole.LISTITEM)).containsText(Pattern.compile("^not a domain — .+"));
        page.keyboard().press("Escape");
        assertThat(failures).isHidden();

        domains.search(token);
        assertThat(domains.domainLinks()).hasText(new String[] {first, second});
        assertThat(domainList(webAdmin)).contains(first, second).doesNotContain("not a domain");
    }

    private static List<String> domainList(WebAdmin webAdmin) {
        return WebAdmin.JSON.convertValue(webAdmin.get("/domains").expect(200).json(),
            WebAdmin.JSON.getTypeFactory().constructCollectionType(List.class, String.class));
    }
}
