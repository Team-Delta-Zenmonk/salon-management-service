const fs = require("fs");
const esbuild = require("esbuild");

if (!require.extensions[".jsx"]) {
  require.extensions[".jsx"] = function (module, filename) {
    const content = fs.readFileSync(filename, "utf8");
    const { code } = esbuild.transformSync(content, { loader: "jsx", format: "cjs" });
    module._compile(code, filename);
  };
}
