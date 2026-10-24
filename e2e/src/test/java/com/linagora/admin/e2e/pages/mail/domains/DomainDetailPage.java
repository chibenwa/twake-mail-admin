package com.linagora.admin.e2e.pages.mail.domains;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;

/** Domains > a domain: Quota, Domain Aliases, Team Mailboxes, Domain Contacts, Signature Templates, Rate Limiting... */
public class DomainDetailPage extends DetailPage {
    private final String domain;

    private DomainDetailPage(AdminApp app, String domain) {
        super(app);
        this.domain = domain;
    }

    public static DomainDetailPage open(AdminApp app, String domain) {
        app.open("/domains/domain/" + WebAdmin.encode(domain));
        DomainDetailPage detail = new DomainDetailPage(app, domain);
        assertThat(detail.title()).hasText(domain);
        return detail;
    }

    public String domain() {
        return domain;
    }

    /** Opens a section, unless it is already open (sections remember their state), and returns the page. */
    public DomainDetailPage openSection(String title) {
        expandSection(title);
        return this;
    }

}
