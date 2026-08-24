import next from "eslint-config-next";

const config = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "public/**", "data/**"] },
  ...next,
  {
    rules: {
      // We sync from external systems (DOM-set theme, localStorage, audio
      // element) on mount - that is the intended use of an effect here, so the
      // set-state-in-effect rule is a false positive for these cases.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

export default config;
