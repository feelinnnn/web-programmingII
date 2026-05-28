import fs from "fs";
import path from "path";
import yaml from "js-yaml";

import SwaggerClient from "./SwaggerClient";

export default function ApiDocsPage() {

  const filePath = path.join(
    process.cwd(),
    "swagger.yaml"
  );

  const fileContents =
    fs.readFileSync(
      filePath,
      "utf8"
    );

  const spec =
    yaml.load(fileContents);

  return (
    <SwaggerClient
      spec={spec as object}
    />
  );
}