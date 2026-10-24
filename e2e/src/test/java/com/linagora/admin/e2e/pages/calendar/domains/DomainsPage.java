package com.linagora.admin.e2e.pages.calendar.domains;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/**
 * The domain list of the Calendar flavour ({@code /domains}): one toolbar line (search,
 * "Create a domain", "Import"), each action opening its modal.
 */
public class DomainsPage {
    private final AdminApp app;
    private final Page page;

    public DomainsPage(AdminApp app) {
        this.app = app;
        this.page = app.page();
    }

    public DomainsPage open() {
        app.open("/domains");
        assertThat(searchInput()).isVisible();
        return this;
    }

    /** "Create a domain", next to the search: opens the "Create Domain" modal. */
    public Locator createDomainButton() {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Create a domain").setExact(true));
    }

    /** The "Create Domain" modal. */
    public Locator createDialog() {
        return dialog("Create Domain");
    }

    /** The "Domain name" field of the "Create Domain" modal. */
    public Locator newDomainInput() {
        return createDialog().getByLabel("Domain name", new Locator.GetByLabelOptions().setExact(true));
    }

    /** The submit button of the "Create Domain" modal. */
    public Locator createButton() {
        return createDialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Create").setExact(true));
    }

    /** "Import", next to the search: opens the "Import domains" modal, which tells the expected format. */
    public Locator importButton() {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Import").setExact(true));
    }

    public Locator importDialog() {
        return dialog("Import domains");
    }

    /** "Choose a file…" of the "Import domains" modal. */
    public Locator chooseFileButton() {
        return importDialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Choose a file…").setExact(true));
    }

    private Locator dialog(String title) {
        return page.getByRole(AriaRole.DIALOG, new Page.GetByRoleOptions().setName(title).setExact(true));
    }

    public Locator searchInput() {
        return page.getByPlaceholder("Search domains...");
    }

    public DomainsPage search(String query) {
        searchInput().fill(query);
        return this;
    }

    /** The links of the listed domains, in display order. */
    public Locator domainLinks() {
        return app.main().getByRole(AriaRole.LINK).filter(new Locator.FilterOptions()
            .setHasNotText(Pattern.compile("^doc$")));
    }

    public Locator domainLink(String domain) {
        return app.main().getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName(domain).setExact(true));
    }

    /** The row of a domain: its "n/" index, its link and its delete button. */
    public Locator row(String domain) {
        return domainLink(domain).locator("xpath=ancestor::div[2]");
    }

    public Locator deleteButton(String domain) {
        return row(domain).getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Delete Domain"));
    }

    /**
     * The pagination line: "Page 1 / 3 — Total: 120" with its buttons, or only "Total: 12" when
     * everything fits on one page.
     */
    public Locator pagination() {
        return app.main().getByText(Pattern.compile("^(Page \\d+ / \\d+ — )?Total: \\d+$"));
    }

    public Locator pageButton(String name) {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }
}
