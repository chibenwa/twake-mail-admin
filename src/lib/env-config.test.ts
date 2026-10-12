import { afterEach, describe, expect, it } from "vitest";
import { loadAppConfig } from "./env-config";

const SSO = {
  SSO_BASE_URL: "http://sso.example.com",
  SSO_CLIENT_ID: "twake-mail-admin",
  SSO_SCOPE: "openid profile email",
  SSO_REDIRECT_URI: "http://admin.example.com/oidc-callback",
  SSO_RESPONSE_TYPE: "code",
  SSO_CODE_CHALLENGE_METHOD: "S256",
  SSO_POST_LOGOUT_REDIRECT: "http://admin.example.com",
};

function withEnv(env: Record<string, string>) {
  (globalThis as any).window = { __ENV__: env };
}

afterEach(() => {
  delete (globalThis as any).window;
});

describe("SSO_ALLOW_INSECURE_REQUESTS", () => {
  it("is off when absent", () => {
    withEnv(SSO);
    expect(loadAppConfig().sso?.allowInsecureRequests).toBe(false);
  });

  it("is on only for the literal 'true'", () => {
    withEnv({ ...SSO, SSO_ALLOW_INSECURE_REQUESTS: "true" });
    expect(loadAppConfig().sso?.allowInsecureRequests).toBe(true);

    withEnv({ ...SSO, SSO_ALLOW_INSECURE_REQUESTS: "yes" });
    expect(loadAppConfig().sso?.allowInsecureRequests).toBe(false);
  });
});
