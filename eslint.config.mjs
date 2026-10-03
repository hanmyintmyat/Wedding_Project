import next from "eslint-config-next";

const config = [
  ...next,
  {
    ignores: [".next/**", ".local/**", "node_modules/**", "public/**", "generated/prisma/**"]
  }
];

export default config;
