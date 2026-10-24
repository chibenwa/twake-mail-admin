package com.linagora.admin.e2e.pages.mail.ops;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import java.util.regex.Pattern;

import com.linagora.admin.e2e.pages.AdminApp;
import com.microsoft.playwright.Locator;
import com.microsoft.playwright.options.AriaRole;

/**
 * The confirmation dialogs of the operations pages. Their confirm button names the action
 * ("Start task", "Clear", "Delete", "Remove"...) rather than saying "Confirm", and the
 * irreversible ones are only enabled once "DELETE" is typed.
 */
public final class Dialogs {
    public static final String START_TASK = "Start task";
    public static final String DELETE_WORD = "DELETE";

    private Dialogs() {
    }

    /** A button of the open dialog, by its exact name. */
    public static Locator button(AdminApp app, String name) {
        return app.dialog().getByRole(AriaRole.BUTTON, new Locator.GetByRoleOptions().setName(name).setExact(true));
    }

    /** Clicks the confirm button named {@code label} and waits for the dialog to close. */
    public static void confirmWith(AdminApp app, String label) {
        button(app, label).click();
        assertThat(app.dialog()).isHidden();
    }

    /** Clicks the confirm button named {@code label} without expecting the dialog to close. */
    public static void clickWith(AdminApp app, String label) {
        button(app, label).click();
    }

    /** "Start task" of a task dialog, which then closes. */
    public static void startTask(AdminApp app) {
        confirmWith(app, START_TASK);
    }

    /** The "Type DELETE to confirm" field of an irreversible action. */
    public static Locator typeToConfirmField(AdminApp app, String word) {
        return app.dialog().getByLabel("Type " + word + " to confirm", new Locator.GetByLabelOptions().setExact(true));
    }

    /** The field of a task parameter, by its raw query key ({@code "queue"}, {@code "limit"}...) shown under its label. */
    public static Locator param(AdminApp app, String key) {
        return app.dialog().locator("xpath=.//*[@id = //label[following-sibling::div[1][normalize-space(.)='"
            + key + "']]/@for]");
    }

    /** The label of a task parameter, by its raw query key: {@code "Target queue (optional)"}. */
    public static Locator paramLabel(AdminApp app, String key) {
        return app.dialog().locator("xpath=.//label[following-sibling::div[1][normalize-space(.)='" + key + "']]");
    }

    /** The {@code Command: curl ...} preview of the open dialog. */
    public static Locator commandPreview(AdminApp app) {
        return app.dialog().getByText(Pattern.compile("^Command: "));
    }
}
