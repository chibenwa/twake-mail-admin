package com.linagora.admin.e2e.pages.mail.userdetail;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;

/** The Global Quota page ({@code /global-quota}). */
public class GlobalQuotaPage {
    private final AdminApp app;

    public GlobalQuotaPage(AdminApp app) {
        this.app = app;
    }

    public GlobalQuotaPage open() {
        app.open("/global-quota");
        assertThat(currentQuota()).isVisible();
        return this;
    }

    private Locator heading(String name) {
        return app.main().getByRole(AriaRole.HEADING, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    /** The "Current global quota" block. */
    public Locator currentQuota() {
        return heading("Current global quota").locator("xpath=..");
    }

    /** The value of a row of a block ("Count", "Size"...): the text next to its label. */
    public static Locator value(Locator block, String label) {
        return block.getByText(label, new Locator.GetByTextOptions().setExact(true)).locator("xpath=following-sibling::*[1]");
    }

    public Locator size() {
        return value(currentQuota(), "Size");
    }

    public Locator count() {
        return value(currentQuota(), "Count");
    }

    /** The "Aggregated extra quotas" block, once its section is opened. */
    public Locator aggregatedExtra() {
        return toggle("Aggregated extra quotas").locator("xpath=..");
    }

    public Locator button(String name) {
        return app.main().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    /** The "Edit limits" dialog: both limits, prefilled with the current ones. */
    public Locator limitsDialog() {
        return app.dialog();
    }

    /** A limit of the "Edit limits" dialog: "Message count" or "Size". */
    public Locator limit(String name) {
        return limitsDialog().getByRole(AriaRole.SPINBUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    /** The "Unlimited" box of a limit of the "Edit limits" dialog. */
    public Locator unlimited(String name) {
        return limitsDialog().getByRole(AriaRole.GROUP, new Locator.GetByRoleOptions().setName(name).setExact(true))
            .getByRole(AriaRole.CHECKBOX, new Locator.GetByRoleOptions().setName("Unlimited").setExact(true));
    }

    public Locator unit() {
        return limitsDialog().getByLabel("Unit", new Locator.GetByLabelOptions().setExact(true));
    }

    /** "Edit limits", the size and its unit, Save. */
    public GlobalQuotaPage updateSize(String value, String unit) {
        button("Edit limits").click();
        limit("Size").fill(value);
        unit().selectOption(unit);
        limitsDialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName("Save").setExact(true)).click();
        return this;
    }

    /** A collapsible section title of the page, whose name starts with {@code title}. */
    public Locator toggle(String title) {
        return app.main().getByRole(AriaRole.BUTTON,
            new Locator.GetByRoleOptions().setName(java.util.regex.Pattern.compile("^" + Regex.escape(title))));
    }

    public Locator minOccupation() {
        return app.main().getByLabel("Min occupation (%)");
    }

    public Locator maxOccupation() {
        return app.main().getByLabel("Max occupation (%)");
    }

    public Locator searchButton() {
        return button("Search");
    }
}
