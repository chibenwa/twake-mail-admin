package com.linagora.admin.e2e.mail.shell;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.linagora.admin.e2e.MailAdminE2ETest;
import com.linagora.admin.e2e.backend.WebAdmin;
import com.linagora.admin.e2e.pages.AdminApp;
import com.linagora.admin.e2e.pages.mail.shell.HealthCheckPage;
import com.linagora.admin.e2e.pages.mail.shell.Shell;
import com.linagora.admin.e2e.pages.mail.shell.StatusColor;
import com.linagora.admin.e2e.pages.mail.shell.WebAdminStub;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.Mouse;
import com.microsoft.playwright.Page;
import com.microsoft.playwright.options.AriaRole;

/**
 * Cases needing a non healthy component or a dead-lettered event. The shared backend cannot produce
 * them on demand: the domain-quota-0 trick makes the OpenSearch quota listener fail, but the event
 * bus retries it with an exponential backoff and dead-letters it only minutes later, and a degraded
 * health check depends on what every other test does. The WebAdmin answers are thus rewritten for
 * the browser of the test only ({@link WebAdminStub}): nothing global is touched, no lock is needed.
 */
class DegradedStateTest extends MailAdminE2ETest {
    private static final String DEGRADED = "EventDeadLettersHealthCheck";
    private static final String DEGRADED_CAUSE = "EventDeadLetters contain events. This might indicate transient failure on event processing.";
    private static final String UNHEALTHY = "Redis";
    private static final String UNHEALTHY_CAUSE = "Can not connect to Redis: Connection refused (e2e stub)";
    private static final String GROUP = "org.apache.james.quota.search.opensearch.events.OpenSearchQuotaMailboxListener$OpenSearchQuotaMailboxListenerGroup";
    /** How the console names the group: the last segment of its class name. */
    private static final String GROUP_NAME = "OpenSearchQuotaMailboxListenerGroup";

    private static String degradeHealthCheck(String body) {
        JsonNode json = jsonOf(body);
        ((ObjectNode) json).put("status", "unhealthy");
        for (JsonNode check : json.path("checks")) {
            String name = check.path("componentName").asText();
            if (name.equals(DEGRADED)) {
                ((ObjectNode) check).put("status", "degraded").put("cause", DEGRADED_CAUSE);
            } else if (name.equals(UNHEALTHY)) {
                ((ObjectNode) check).put("status", "unhealthy").put("cause", UNHEALTHY_CAUSE);
            } else {
                ((ObjectNode) check).put("status", "healthy").putNull("cause");
            }
        }
        return json.toString();
    }

    private static JsonNode jsonOf(String body) {
        try {
            return WebAdmin.JSON.readTree(body);
        } catch (Exception e) {
            throw new IllegalStateException(body, e);
        }
    }

    /** One dead-lettered event in one group, as WebAdmin lists them. */
    private static void stubDeadLetters(Page page, String insertionId) {
        ArrayNode groups = WebAdmin.JSON.createArrayNode().add(GROUP);
        ArrayNode events = WebAdmin.JSON.createArrayNode().add(insertionId);
        WebAdminStub.answer(page, path -> path.equals("/events/deadLetter/groups"), groups.toString());
        WebAdminStub.answer(page, path -> path.startsWith("/events/deadLetter/groups/") && path.indexOf('/', "/events/deadLetter/groups/".length()) < 0,
            events.toString());
    }

    private static void openGroupPage(AdminApp app) {
        // page.navigate rather than app.open: below 768 px the sidebar is a closed sheet
        app.page().navigate("/event-dead-letter/group/" + WebAdmin.encode(GROUP) + "?page=1");
        assertThat(groupTitle(app)).isVisible();
        assertThat(app.main().getByText(GROUP, new Locator.GetByTextOptions().setExact(true))).isVisible();
    }

    /** The h1 of the group page: the readable name of the group. */
    private static Locator groupTitle(AdminApp app) {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setName(GROUP_NAME).setExact(true).setLevel(1));
    }

    private static Locator eventRow(AdminApp app, String insertionId) {
        return app.main().getByRole(AriaRole.LISTITEM).filter(new Locator.FilterOptions().setHasText(insertionId));
    }

    /** Moves the pointer away in several steps: Radix keeps a tooltip open while the pointer may head for it. */
    private static void moveAway(Page page) {
        page.mouse().move(5, 5, new Mouse.MoveOptions().setSteps(5));
        page.mouse().move(10, 10);
    }

    @Test
    @DisplayName("HC-02 Unhealthy component: status and cause on its card, in the summary")
    void unhealthyComponentTooltip(AdminApp app, Page page, WebAdmin webAdmin) {
        // WebAdmin answers 503 as soon as one component is unhealthy, with the usual body: a 503 here is an answer, not a failure
        WebAdminStub.rewrite(page, webAdmin, path -> path.equals("/healthcheck"), 503, DegradedStateTest::degradeHealthCheck);
        HealthCheckPage healthCheck = HealthCheckPage.open(app);

        assertThat(healthCheck.sectionTitles()).contains(HealthCheckPage.STORAGE, HealthCheckPage.CORE);
        assertThat(healthCheck.componentsOf(HealthCheckPage.STORAGE)).contains(UNHEALTHY, "Cassandra backend", "OpenSearch Backend");
        assertThat(healthCheck.error()).hasCount(0);
        assertThat(healthCheck.checking()).hasCount(0);

        assertThat(StatusColor.of(healthCheck.borderColor(DEGRADED))).isEqualTo(StatusColor.ORANGE);
        assertThat(StatusColor.of(healthCheck.backgroundColor(DEGRADED))).isEqualTo(StatusColor.ORANGE);
        assertThat(StatusColor.of(healthCheck.borderColor(UNHEALTHY))).isEqualTo(StatusColor.RED);
        assertThat(StatusColor.of(healthCheck.backgroundColor(UNHEALTHY))).isEqualTo(StatusColor.RED);
        assertThat(StatusColor.of(healthCheck.borderColor("Cassandra backend"))).isEqualTo(StatusColor.GREEN);
        assertThat(healthCheck.status(DEGRADED)).hasText("Degraded");
        assertThat(healthCheck.status(UNHEALTHY)).hasText("Unhealthy");
        assertThat(healthCheck.status("Cassandra backend")).hasText("Healthy");

        // The cause is written on the card, no hover needed; a healthy card has none
        assertThat(healthCheck.cause(DEGRADED)).hasText(DEGRADED_CAUSE);
        assertThat(healthCheck.cause(UNHEALTHY)).hasText(UNHEALTHY_CAUSE);
        assertThat(healthCheck.cause(UNHEALTHY)).hasAttribute("title", UNHEALTHY_CAUSE);
        assertThat(healthCheck.cause("Cassandra backend")).hasCount(0);
        healthCheck.hoverTarget("Cassandra backend").hover();
        assertThat(healthCheck.tooltip()).hasCount(0);
        moveAway(page);

        // The summary tells what needs attention, worst first, and where to look
        int components = healthCheck.allComponents().size();
        Locator summary = healthCheck.summary();
        assertThat(summary).containsText("1 unhealthy, 1 degraded out of " + components + " components.");
        assertThat(summary.getByRole(AriaRole.LISTITEM)).hasText(new String[] {
            UNHEALTHY + " — Unhealthy — " + UNHEALTHY_CAUSE,
            DEGRADED + " — Degraded — " + DEGRADED_CAUSE + " Open →"});
        // The dead letters component leads to their screen, from its card and from the summary
        assertThat(healthCheck.hoverTarget(DEGRADED)).hasAttribute("href", "/event-dead-letter");
        summary.getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("Open →")).click();
        assertThat(page).hasURL(Pattern.compile("/event-dead-letter$"));
    }

    @Test
    @DisplayName("HC-03 Health check request failure is reported")
    void healthCheckFailure(AdminApp app, Page page) {
        WebAdminStub.answer(page, "GET", path -> path.equals("/healthcheck"), 500,
            "{\"statusCode\":500,\"type\":\"ServerError\",\"message\":\"boom\"}");
        app.open("/health-check");
        HealthCheckPage healthCheck = new HealthCheckPage(app);

        assertThat(healthCheck.title()).isVisible();
        assertThat(healthCheck.error()).hasText(Pattern.compile("^Error: .*boom"));
        assertThat(healthCheck.checking()).hasCount(0);
        assertThat(healthCheck.sectionHeadings()).hasCount(0);

        // WebAdmin unreachable: the route added last is tried first
        WebAdminStub.abort(page, path -> path.equals("/healthcheck"));
        page.reload();

        assertThat(healthCheck.title()).isVisible();
        assertThat(healthCheck.error()).hasText(Pattern.compile("^Error: \\S"));
        assertThat(healthCheck.error()).not().containsText("boom");
        assertThat(healthCheck.checking()).hasCount(0);
        assertThat(healthCheck.sectionHeadings()).hasCount(0);
    }

    @Test
    @DisplayName("NAV-05 Icon-only buttons have a name and a tooltip (event dead letters)")
    void deadLetterIconButtons(AdminApp app, Page page) {
        String insertionId = UUID.randomUUID().toString();
        stubDeadLetters(page, insertionId);

        app.open("/event-dead-letter");
        Locator link = app.main().getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName(GROUP_NAME).setExact(true));
        assertThat(link).isVisible();
        assertThat(app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions()
            .setName(Pattern.compile("^" + GROUP_NAME + " ?\\(1\\)$")))).isVisible();
        Shell.assertNamedWithTooltip(app.button("Redeliver group events"), "Redeliver group events");
        Shell.assertNamedWithTooltip(app.button("Clear group"), "Clear group");
        Shell.assertNamedWithTooltip(app.button("Copy group name"), "Copy group name");
        assertThat(Shell.unnamedButtons(app.main())).isEmpty();

        link.click();
        assertThat(groupTitle(app)).isVisible();
        // Back to the list through the breadcrumb; the icon buttons are named and have a tooltip
        assertThat(app.main().getByRole(AriaRole.NAVIGATION, new Locator.GetByRoleOptions().setName("Breadcrumb"))
            .getByRole(AriaRole.LINK, new Locator.GetByRoleOptions().setName("Event Dead Letter").setExact(true))).isVisible();
        Shell.assertNamedWithTooltip(app.button("Copy group name"), "Copy group name");
        Shell.assertNamedWithTooltip(eventRow(app, insertionId).getByRole(AriaRole.BUTTON,
            new Locator.GetByRoleOptions().setName("Delete event").setExact(true)), "Delete event");
        Shell.assertNamedWithTooltip(eventRow(app, insertionId).getByRole(AriaRole.BUTTON,
            new Locator.GetByRoleOptions().setName("Copy event ID").setExact(true)), "Copy event ID");
        assertThat(Shell.unnamedButtons(app.main())).isEmpty();
    }

    @Test
    @DisplayName("NAV-08 Confirmation dialogs wrap long words (delete a dead-lettered event)")
    void deleteEventDialogWrapsLongWords(AdminApp app, Page page) {
        String insertionId = UUID.randomUUID().toString();
        stubDeadLetters(page, insertionId);
        boolean[] deleted = new boolean[1];
        page.onRequest(request -> deleted[0] |= request.method().equals("DELETE"));

        for (int width : new int[] {1280, 390}) {
            page.setViewportSize(width, 800);
            openGroupPage(app);
            eventRow(app, insertionId).getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Delete event")).click();

            assertThat(app.dialog()).containsText("Delete event " + insertionId + " in group " + GROUP + "?");
            Shell.assertDialogFits(page, app.dialog(), "Cancel", "Delete");
            app.cancel();
            assertThat(eventRow(app, insertionId)).isVisible();
        }
        assertThat(deleted[0]).as("Cancel sends no DELETE").isFalse();
    }

    @Test
    @DisplayName("EDL-02 View JSON of a dead-lettered event, its HTML shown as text")
    void deadLetterEventJson(AdminApp app, Page page) throws Exception {
        String insertionId = UUID.randomUUID().toString();
        stubDeadLetters(page, insertionId);
        // A mailbox name is chosen by the user: the JSON dialog must show it as text, never parse it
        String hostile = "<img src=x onerror=\"window.__xss=1\">INBOX<b>bold</b>";
        ObjectNode mailboxPath = WebAdmin.JSON.createObjectNode()
            .put("namespace", "#private").put("user", "alice@example.com").put("name", hostile);
        ObjectNode added = WebAdmin.JSON.createObjectNode().put("eventId", UUID.randomUUID().toString());
        added.set("mailboxPath", mailboxPath);
        added.put("mailboxId", UUID.randomUUID().toString()).put("user", "alice@example.com").put("sessionId", 42);
        ObjectNode event = WebAdmin.JSON.createObjectNode();
        event.set("MailboxAdded", added);
        String[] requested = new String[1];
        page.onRequest(request -> {
            if (request.url().endsWith("/" + insertionId)) {
                requested[0] = java.net.URI.create(request.url()).getRawPath();
            }
        });
        // Registered last, thus tried first: the event itself, not the insertion ids of the group
        WebAdminStub.answer(page, path -> path.endsWith("/" + insertionId), event.toString());

        openGroupPage(app);
        // The row describes the event: its type and its user (a plain text: example.com is not a domain of the server)
        assertThat(eventRow(app, insertionId)).containsText("MailboxAdded");
        assertThat(eventRow(app, insertionId)).containsText("alice@example.com");
        assertThat(eventRow(app, insertionId).getByRole(AriaRole.LINK)).hasCount(0);
        int pagesBefore = page.context().pages().size();
        eventRow(app, insertionId).getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("View JSON").setExact(true)).click();

        // A dialog of the console, titled after the event type: no new window or tab
        assertThat(app.dialog().getByRole(AriaRole.HEADING)).hasText("MailboxAdded");
        assertThat(page.context().pages()).hasSize(pagesBefore);
        Locator pre = app.dialog().locator("pre");
        // JSON escapes the quotes only
        assertThat(pre).containsText("<img src=x onerror=");
        assertThat(pre).containsText("INBOX<b>bold</b>");
        String shown = pre.textContent();
        assertThat(WebAdmin.JSON.readTree(shown)).isEqualTo(event);
        assertThat(shown).as("pretty printed").contains("\n  \"");
        assertThat(app.dialog().locator("img, b")).hasCount(0);
        assertThat(page.evaluate("() => window.__xss")).isNull();
        assertThat(java.net.URLDecoder.decode(requested[0], java.nio.charset.StandardCharsets.UTF_8))
            .isEqualTo("/events/deadLetter/groups/" + GROUP + "/" + insertionId);
    }
}
