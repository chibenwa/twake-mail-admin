package com.linagora.admin.e2e.pages.mail.domains;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/** The Domains list: search, "Create a domain" and "Import" on one line, paginated rows {@code N/ domain}. */
public class DomainsPage {
    private final AdminApp app;

    public DomainsPage(AdminApp app) {
        this.app = app;
    }

    public static DomainsPage open(AdminApp app) {
        app.open("/domains");
        DomainsPage domains = new DomainsPage(app);
        assertThat(domains.searchInput()).isVisible();
        return domains;
    }

    public AdminApp app() {
        return app;
    }

    public Page page() {
        return app.page();
    }

    /** "Create a domain", next to the search: opens the creation modal. */
    public Locator createButton() {
        return mainButton("Create a domain");
    }

    /** The "Domain name" field of the creation modal. */
    public Locator newDomainInput() {
        return app.dialog().getByLabel("Domain name", new Locator.GetByLabelOptions().setExact(true));
    }

    /** The "Create" button of the creation modal. */
    public Locator submitCreateButton() {
        return app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Create").setExact(true));
    }

    /** "Import", next to "Create a domain": opens a modal stating the file format. */
    public Locator importButton() {
        return mainButton("Import");
    }

    /** "Choose a file…" of the import modal: opens the file chooser. */
    public Locator chooseFileButton() {
        return app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Choose a file\u2026").setExact(true));
    }

    public Locator searchInput() {
        return app.main().getByPlaceholder("Search domains...", new Locator.GetByPlaceholderOptions().setExact(true));
    }

    public DomainsPage search(String query) {
        searchInput().fill(query);
        return this;
    }

    public Locator domainLink(String domain) {
        return app.main().getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName(domain).setExact(true));
    }

    /** The headings of the listed rows, {@code "1/domain"}. */
    public Locator rowHeadings() {
        return app.main().getByRole(AriaRole.HEADING)
            .filter(new Locator.FilterOptions().setHas(page().getByRole(AriaRole.LINK)));
    }

    /** The trash buttons of the listed rows. */
    public Locator deleteButtons() {
        return mainButton("Delete Domain");
    }

    public Locator paginationLabel() {
        return app.main().getByText(Pattern.compile("^(Page \\d+ / \\d+ — )?Total: \\d+$"));
    }

    public Locator nextPageButton() {
        return mainButton("Next");
    }

    /** Opens the creation modal, types the name and clicks Create; the modal stays open on a refusal. */
    public DomainsPage create(String domain) {
        createButton().click();
        newDomainInput().fill(domain);
        submitCreateButton().click();
        return this;
    }

    public Locator text(String text) {
        return app.main().getByText(text, new Locator.GetByTextOptions().setExact(true));
    }

    private Locator mainButton(String name) {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    public static Pattern rowHeading(int index, String domain) {
        return Pattern.compile("^" + index + "/\\s*" + Regex.quote(domain) + "$");
    }
}
