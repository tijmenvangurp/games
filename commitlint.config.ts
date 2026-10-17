export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "scope-empty": [2, "never"],
    "scope-enum": [
      2,
      "always",
      [
        "app",
        "pages",
        "widgets",
        "features",
        "entities",
        "shared",
        "tests",
        "quality",
        "ci",
        "tooling",
        "docs",
        "deps",
        "infra",
      ],
    ],
  },
};
