package com.linagora.admin.e2e.mail.shell;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.linagora.admin.e2e.MailAdminE2ETest;
import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.docker.BrowserLog;
import com.linagora.admin.e2e.pages.AdminApp;
import com.linagora.admin.e2e.pages.mail.shell.Shell;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

class LiveMetricsTest extends MailAdminE2ETest {

    @Test
    @DisplayName("LM-01 Live metrics page")
    void liveMetricsPage(AdminApp app, Page page, WebAdmin webAdmin, BrowserLog log) {
        // No Prometheus route on this WebAdmin
        assertThat(webAdmin.get("/metrics").status()).isEqualTo(404);

        app.open("/");
        app.navigate("Live Metrics");
        assertThat(app.heading()).hasText("Live Metrics");

        // The page says the feature is not available here, instead of showing the raw 404
        Locator unavailable = app.main().getByRole(AriaRole.STATUS)
            .filter(new Locator.FilterOptions().setHasText("Metrics are not available on this server"));
        assertThat(unavailable).isVisible();
        assertThat(unavailable).containsText("This server does not expose the Prometheus /metrics route.");
        assertThat(unavailable.getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("doc").setExact(true))).isVisible();
        assertThat(app.main()).not().containsText("statusCode");
        assertThat(app.main()).not().containsText("can not be found");
        assertThat(app.main().getByText(Pattern.compile("^Error:"))).hasCount(0);
        // Nothing to refresh nor to filter
        assertThat(app.button("Refresh metrics")).hasCount(0);
        assertThat(app.main().getByPlaceholder("Filter metrics...")).hasCount(0);

        page.setViewportSize(390, 800);
        assertThat(unavailable).isVisible();
        assertThat(Shell.scrollWidth(page)).isLessThanOrEqualTo(390);
        assertThat(log.pageErrors()).isEmpty();
    }
}
