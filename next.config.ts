import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Evita que o Next/Turbopack tente empacotar o "pg" — ele tem require()
  // condicionais (driver nativo opcional) que quebram quando bundlados.
  // Isso resolve o erro "pgTypes.getTypeParser is not a function".
  serverExternalPackages: ["pg"],
  turbopack: {
    // Fixa a raiz do projeto explicitamente pra não confundir com outro
    // lockfile que porventura exista em uma pasta acima (ex: C:\Users\<user>).
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
