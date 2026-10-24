package com.linagora.admin.e2e.mail.domains;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.linagora.admin.e2e.MailAdminE2ETest;
import com.linagora.admin.e2e.backend.Ids;
import com.linagora.admin.e2e.backend.MailFixtures;
import com.linagora.admin.e2e.pages.AdminApp;
import com.linagora.admin.e2e.pages.mail.domains.DomainsPage;
import com.microsoft.playwright.FileChooser;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;
import com.microsoft.playwright.options.FilePayload;

class DomainImportTest extends MailAdminE2ETest {

    @Test
    @DisplayName("DOM-05 Import domains from a text file")
    void importDomains(AdminApp app, MailFixtures fixtures, Page page) {
        String existing = fixtures.domain();
        String prefix = Ids.unique("qa-imp");
        String imp1 = prefix + "1.e2e.test";
        String imp2 = prefix + "2.e2e.test";
        String content = String.join("\r\n",
            "# header comment",
            imp1,
            imp2 + " // trailing comment",
            "",
            existing,
            imp1,
            "bad domain!") + "\n";

        DomainsPage domains = DomainsPage.open(app);
        // "Import" states the expected format in a modal, before any file is picked
        domains.importButton().click();
        Locator dialog = app.dialog();
        assertThat(dialog).containsText("Import domains");
        assertThat(dialog).containsText("Text file, one domain per line (LF or CRLF line endings).");
        assertThat(dialog).containsText("Comments start with # or //");
        assertThat(dialog).containsText("Blank lines and comment-only lines are skipped.");
        assertThat(dialog).containsText("Only the domains that do not exist yet are created.");
        app.cancel();

        domains.importButton().click();
        FileChooser chooser = page.waitForFileChooser(() -> domains.chooseFileButton().click());
        assertThat(dialog).isHidden();
        chooser.setFiles(new FilePayload("domains.txt", "text/plain", content.getBytes(StandardCharsets.UTF_8)));

        Locator result = app.toast("Domain import finished");
        assertThat(result).isVisible();
        assertThat(result).containsText("Created: 2, Already exist: 1, Errors: 1");
        result.getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("More details").setExact(true)).click();
        assertThat(app.dialog()).containsText("Domains that could not be created (1)");
        assertThat(app.dialog().getByRole(AriaRole.LISTITEM)).hasText(new Pattern[] {
            Pattern.compile("^bad domain! — .+")});

        page.keyboard().press("Escape");
        domains.search(prefix);
        assertThat(domains.domainLink(imp1)).isVisible();
        assertThat(domains.domainLink(imp2)).isVisible();
        assertThat(DomainsListTest.domainList(fixtures.webAdmin())).contains(imp1, imp2).doesNotContain("bad domain!");
    }
}
